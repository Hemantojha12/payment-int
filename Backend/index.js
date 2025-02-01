import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import { wsManager } from './webSocket.js';
import cors from 'cors';
import seedRoles from './seeders/roleSeeder.js';
import seedPermissions from './seeders/PermissionSeeder.js';
import seedUsers from './seeders/userSeeder.js';
import seedEvents from './seeders/eventSeeder.js';
import seedCategories from './seeders/categorieSeeder.js';
import seedRolePermissions from './seeders/rolePermissionSeeder.js';
import seedNotifications from './seeders/notificationSeeder.js';
import eventRoutes from './routes/Event.routes.js';
import userRoute from './routes/user.route.js';
import roleRoute from './routes/role.route.js';
import adminRoutes from './routes/admin.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import bookingRoutes from './routes/Booking.routes.js';
import axios from 'axios';
import crypto from 'crypto';

dotenv.config();

const app = express();
const server = http.createServer(app);
wsManager.initialize(server);

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

if (!process.env.MongoDB_URI) {
  console.error("ERROR: MongoDB URI is not defined. Please check your .env file.");
  process.exit(1);
}

const PORT = process.env.PORT || 5000;
const URI = process.env.MongoDB_URI;

app.use(express.json());
app.use(cors(corsOptions));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (corsOptions.origin.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Connect to the MongoDB database and seed initial data
const connectDB = async () => {
  try {
    await mongoose.connect(URI);
    console.log("Connected to MongoDB");
    await seedRoles();
    await seedPermissions();
    await seedUsers();
    await seedCategories();
    await seedEvents();
    await seedRolePermissions();
    await seedNotifications();
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

connectDB();

// Khalti API handler to initialize payment
const initializeKhaltiPayment = async (params) => {
  const response = await axios.post('https://khalti.com/api/v2/payment/initiate/', params, {
    headers: {
      Authorization: `Bearer ${process.env.KHALTI_SECRET_KEY}`
    }
  });
  return response.data;
};

app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/roles', roleRoute);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/bookings', bookingRoutes);

// Khalti payment initialization route
app.post('/api/v1/payment/generate', async (req, res) => {
  const { eventId, numberOfSeats } = req.body;

  // Fetch event details from DB
  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  const totalAmount = event.price * numberOfSeats;
  const orderId = new mongoose.Types.ObjectId().toString();

  // Create booking record
  const booking = await Booking.create({
    userId: req.user._id,
    eventId: event._id,
    numberOfSeats,
    totalAmount,
    paymentGateway: 'Khalti',
    paymentStatus: 'pending',
    paymentDetails: { orderId, params: { amount: totalAmount * 100, purchase_order_id: orderId } },
  });

  // Initialize Khalti payment
  const paymentInitate = await initializeKhaltiPayment({
    amount: totalAmount * 100,
    purchase_order_id: orderId,
    purchase_order_name: event.name,
    return_url: `${process.env.BACKEND_URL}/complete-khalti-payment`,
  });

  res.json({
    success: true,
    bookingId: booking._id,
    paymentUrl: paymentInitate.payment_url,
    params: paymentInitate.params,
  });
});

// Handle Payment Success for Khalti
app.post('/api/v1/payment/success', async (req, res) => {
  const { token, amount, purchase_order_id } = req.body;

  try {
    // Find booking by order ID
    const booking = await Booking.findOne({ _id: purchase_order_id });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify Khalti payment
    const response = await axios.post('https://khalti.com/api/v2/payment/verify/', {
      token,
      amount,
      purchase_order_id,
    }, {
      headers: {
        Authorization: `Bearer ${process.env.KHALTI_SECRET_KEY}`
      }
    });

    if (response.data.status === 'success') {
      // Payment successful
      booking.paymentStatus = 'completed';
      booking.transactionId = response.data.transaction_id;
      await booking.save();

      // Update event attendees
      const event = await Event.findById(booking.eventId);
      if (event && !event.attendees.includes(booking.userId)) {
        event.attendees.push(booking.userId);
        await event.save();
      }

      res.status(200).json({
        message: 'Payment successful',
        bookingId: booking._id,
        transactionId: response.data.transaction_id,
      });
    } else {
      // Payment failed
      booking.paymentStatus = 'failed';
      await booking.save();
      res.status(400).json({ message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Payment Success Error:', error);
    res.status(500).json({ message: 'An error occurred during payment processing' });
  }
});

// Handle Payment Failure
app.post('/api/v1/payment/failure', (req, res) => {
  res.status(400).json({ message: 'Payment Failed' });
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
