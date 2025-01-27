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
    // Payment details section
    paymentDetails: {
      orderId: {
        type: String, // Unique identifier for payment transaction
        required: true,
      },
      params: {
        type: Object, // Store eSewa parameters (amt, pid, etc.)
        required: true,
      },
      signature: {
        type: String, // HMAC signature for validation
        required: true,
      },
      paymentUrl: {
        type: String,
        default: process.env.ESEWA_PAYMENT_URL, // Default eSewa URL
        required: false,  // No need for 'required' if there's a default value
      },
    },
    // Optional: Store the QR code if needed (for other payment systems)
    qrCode: {
      type: String,
      default: null,
    },
    // Optional: If you plan to support other payment systems in the future
    paymentGateway: {
      type: String,
      enum: ['eSewa', 'Other'],
      default: 'eSewa',
    },
  },
  { timestamps: true } // Ensure createdAt and updatedAt are added
);

export default mongoose.model('Booking', bookingSchema);
