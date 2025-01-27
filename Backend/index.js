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

// Handle /bookings route and eSewa payment integration
const generateEsewaParams = (bookingDetails) => {
  const { totalAmount, bookingId, userId } = bookingDetails;
  const params = {
    amt: totalAmount,
    psc: 1,  // Payment service code (example, adjust as needed)
    pdc: 1,  // Payment description code (example, adjust as needed)
    txAmt: totalAmount,
    tAmt: totalAmount,
    pid: `BOOKING-${bookingId}`,
    userName: `USER-${userId}`,
    sid: process.env.MERCHANT_ID,  // Corrected to match .env
    scd: process.env.SECRET,  // Corrected to match .env
    ts: Date.now(),
  };

  // Generate the signature by hashing the parameters with your merchant key
  const signature = crypto.createHash('sha256').update(Object.values(params).join('|')).digest('hex');
  params.signature = signature;

  return params;
};

app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/roles', roleRoute);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/bookings', bookingRoutes);

// eSewa API handler to generate payment URL
app.post('/api/v1/payment/generate', (req, res) => {
  const { eventId, numberOfSeats } = req.body;

  // You will typically fetch the event details from the database using eventId
  const eventDetails = {
    totalAmount: 500,  // Example: you would calculate this from the numberOfSeats
    bookingId: 12345,  // Example: generated booking ID
    userId: 6789,  // Example: user ID of the person booking
  };

  const params = generateEsewaParams(eventDetails);
  
  // Get the payment URL from the .env file
  const paymentUrl = process.env.ESEWA_PAYMENT_URL;

  // Check if the payment URL is properly loaded
  if (!paymentUrl) {
    console.error("ERROR: ESEWA_PAYMENT_URL is not defined in the .env file.");
    return res.status(500).json({
      success: false,
      message: 'Payment URL not defined in .env file.'
    });
  }

  res.json({
    paymentUrl,
    params
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
