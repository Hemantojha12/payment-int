import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import {
  initiateBooking,
  handlePaymentSuccess,
  handlePaymentFailure,
  getBookingDetails,  // Add this import
} from '../controller/Booking.Controller.js'; // Ensure correct file path

const bookingRouter = express.Router();

// Debugging middleware for POST requests
bookingRouter.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log('Booking request received:', {
      method: req.method,
      path: req.path,
      body: req.body,
      headers: req.headers['authorization'], // Only log essential headers
    });
  }
  next();
});

// Routes
bookingRouter.post('/', authenticateUser, initiateBooking); // Protected Route
bookingRouter.get('/payment/success', handlePaymentSuccess);
bookingRouter.get('/payment/failure', handlePaymentFailure);
bookingRouter.get('/booking-details/:pidx', getBookingDetails); // Fixed the route to match the correct path

export default bookingRouter;
