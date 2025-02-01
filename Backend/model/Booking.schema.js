import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    numberOfSeats: {
      type: Number,
      required: true,
      min: [1, 'Must book at least one seat'],
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      default: null,
    },
    paymentGateway: {
      type: String,
      enum: ['Khalti'],
      required: true,
    },
    paymentDetails: {
      type: Object,
      default: null, // To store payment-specific data
    },
    khaltiToken: {
      type: String,
      default: null, // Khalti-specific token (pidx)
    },
    khaltiTransactionId: {
      type: String,
      default: null, // Khalti-specific transaction id
    },
    khaltiPaymentStatus: {
      type: String,
      enum: ['Completed', 'Pending', 'Failed', 'User canceled'],
      default: 'Pending', // Payment status from Khalti callback
    },
  },
  { timestamps: true }
);

export default mongoose.model('Booking', bookingSchema);
