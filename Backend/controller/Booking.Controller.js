import Event from '../model/event.schema.js';
import Booking from '../model/Booking.schema.js';
import QRCode from 'qrcode';
import mongoose from 'mongoose';
import axios from 'axios';
import crypto from 'crypto';

// Function to generate signature for eSewa
// Function to generate signature for eSewa
const generateSignature = (params) => {
  // Ensure the params are sorted alphabetically to maintain consistency
  const stringToSign = Object.entries(params)
    .sort() // Sort the parameters alphabetically by key
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  return crypto.createHmac('sha256', process.env.SECRET_KEY) // Your eSewa secret key
    .update(stringToSign)
    .digest('hex');
};

// Initiate Booking
export const initiateBooking = async (req, res) => {
  try {
    const { eventId, numberOfSeats } = req.body;
    const userId = req.user?._id;

    console.log('Booking Request Details:', { body: req.body, userId: req.user?._id, headers: req.headers });

    // Validate input
    if (!userId || !eventId || !numberOfSeats || numberOfSeats <= 0) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Calculate total amount
    const totalAmount = event.price * numberOfSeats;

    // Generate a unique orderId
    const orderId = new mongoose.Types.ObjectId().toString();

    // Prepare eSewa parameters
    const esewaParams = {
      amt: totalAmount,
      pid: orderId, // Use the generated orderId
      scd: process.env.MERCHANT_ID,
      su: `${process.env.APP_URL}/api/payment/success`,
      fu: `${process.env.APP_URL}/api/payment/failure`,
    };

    // Generate the signature
    const signature = generateSignature(esewaParams);

    // Create the booking document
    const booking = await Booking.create({
      userId,
      eventId,
      numberOfSeats,
      totalAmount,
      paymentStatus: 'pending',
      paymentDetails: {
        orderId, // Store the orderId in the booking
        paymentUrl: process.env.ESEWA_PAYMENT_URL, // Include the payment URL here
        params: esewaParams,
        signature,
      },
    });

    console.log('Booking Created:', { bookingId: booking._id, eventId, numberOfSeats, totalAmount });

    // Send payment URL response
    res.json({
      bookingId: booking._id,
      paymentUrl: process.env.ESEWA_PAYMENT_URL, // URL for eSewa payment
      params: esewaParams,
      signature,
    });
  } catch (error) {
    console.error('Booking Creation Error:', error);
    res.status(500).json({ message: 'Booking failed', error: error.message });
  }
};

// Handle Payment Success
export const handlePaymentSuccess = async (req, res) => {
  try {
    const { oid, refId, signature } = req.query;

    if (!oid || !refId || !signature) {
      return res.status(400).json({ message: 'Missing payment details' });
    }

    // Find the booking by the orderId (oid)
    const booking = await Booking.findOne({ _id: new mongoose.Types.ObjectId(oid) });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Re-generate the expected signature to compare with the received one
    const expectedSignature = generateSignature(booking.paymentDetails.params);

    console.log("Generated Signature: ", expectedSignature);
    console.log("Received Signature: ", signature);


    if (signature !== expectedSignature) {
      console.error(`Signature mismatch for booking ID: ${oid}. Expected: ${expectedSignature}, Received: ${signature}`);
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Check payment status with eSewa (or any other payment gateway)
    const statusCheckResponse = await axios.post(process.env.ESEWAPAYMENT_STATUS_CHECK_URL, {
      refId,
      pid: oid,
      
    });

    if (statusCheckResponse.data.status !== 'success') {
      booking.paymentStatus = 'failed';
      await booking.save();
      return res.status(400).json({ message: 'Payment failed' });
    }

    // Payment was successful
    booking.paymentStatus = 'completed';
    booking.transactionId = refId;

    // Generate the QR code
    const qrData = {
      bookingId: booking._id,
      eventId: booking.eventId,
      seats: booking.numberOfSeats,
      transactionId: refId,
    };

    booking.qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    // Save the booking
    await booking.save();

    // Update event attendees
    const event = await Event.findById(booking.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.attendees.includes(booking.userId)) {
      event.attendees.push(booking.userId);
      await event.save();
    }

    // Respond with the payment success message
    res.status(200).json({
      message: 'Payment successful',
      bookingId: booking._id,
      transactionId: refId,
      qrCode: booking.qrCode,
      redirectUrl: `${process.env.FRONTEND_URL}/booking/success/${booking._id}`,
    });
  } catch (error) {
    console.error('Payment Success Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Handle Payment Failure
export const handlePaymentFailure = (req, res) => {
  res.status(400).json({ message: 'Payment Failed' });
};

export default { 
  initiateBooking, 
  handlePaymentSuccess, 
  handlePaymentFailure 
};
