import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import {
  initiateBooking,
  handlePaymentSuccess,
  handlePaymentFailure,
} from '../controller/Booking.Controller.js';

const bookingRouter = express.Router();

// Initiate Booking Route
bookingRouter.post('/', authenticateUser, initiateBooking);

// Handle Payment Success Callback
bookingRouter.get('/payment/success', handlePaymentSuccess);

// Handle Payment Failure Callback
bookingRouter.get('/payment/failure', handlePaymentFailure);

export default bookingRouter;
