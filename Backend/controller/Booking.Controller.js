import Event from '../model/event.schema.js';
import Booking from '../model/Booking.schema.js';
import { KHALTI_CONFIG } from '../utils/khalticonfig.js';
import axios from 'axios';

/**
 * Initiate a booking and generate a Khalti payment link.
 */


export const initiateBooking = async (req, res) => {
  try {
    console.log(" Booking API called by:", req.user);
    console.log(" Booking Request Body:", req.body);

    if (!req.user) {
      console.error(" Unauthorized: No user found in request");
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized. Please log in again.' 
      });
    }

    const { eventId, numberOfSeats } = req.body;
    const userId = req.user._id;

    if (!eventId || !numberOfSeats || numberOfSeats <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid input' 
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      console.error(" Event not found:", eventId);
      return res.status(404).json({ 
        success: false,
        message: 'Event not found' 
      });
    }

    if (numberOfSeats > (event.totalSlots - (event.attendees?.length || 0))) {
      return res.status(400).json({ 
        success: false,
        message: 'Not enough seats available' 
      });
    }

    if (!event.price || event.price <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid event price' 
      });
    }

    const totalAmount = event.price * numberOfSeats; // Total amount in NPR
    const amountInPaisa = totalAmount * 100; // Convert to paisa

    // Create a booking with "pending" status
    const booking = await Booking.create({
      userId,
      eventId,
      numberOfSeats,
      totalAmount,
      paymentGateway: 'Khalti',
      paymentStatus: 'pending',
      paymentDetails: { amount: amountInPaisa }
    });

    // Prepare Khalti payload
    const payload = {
      return_url:`${KHALTI_CONFIG.website}/Booking-success`,
      website_url: KHALTI_CONFIG.website,
      amount: amountInPaisa, // Send amount in paisa
      purchase_order_id: booking._id.toString(),
      purchase_order_name: `Booking for ${event.event_name}`,
      customer_info: {
        name: req.user.fullname || 'User',
        email: req.user.email || '',
        phone: req.user.phone || ''
      }
    };

    console.log(" Khalti Payment Payload:", JSON.stringify(payload, null, 2));

    // Make request to Khalti for payment initiation
    const response = await axios.post(
      'https://a.khalti.com/api/v2/epayment/initiate/',
      payload,
      {
        headers: {
          'Authorization': `Key ${KHALTI_CONFIG.secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(" Khalti Payment Response:", JSON.stringify(response.data, null, 2));

    // Validate Khalti API response
    if (!response.data || !response.data.payment_url) {
      console.error(" Error: Khalti did not return a payment URL", response.data);
      return res.status(500).json({ 
        success: false,
        message: 'Failed to generate payment link', 
        error: response.data || 'No payment URL received' 
      });
    }

    console.log("Sending Payment URL:", response.data.payment_url);

    return res.json({
      success: true,
      bookingId: booking._id,
      paymentUrl: response.data.payment_url
    });
  } catch (error) {
    console.error("Booking Creation Error:", error.response?.data || error.message);
    return res.status(500).json({ 
      success: false,
      message: 'Payment initiation failed', 
      error: error.response?.data?.message || error.message 
    });
  }
};



//  Handle successful payment from Khalti.
 
export const handlePaymentSuccess = async (req, res) => {
  try {
    const { pidx, transaction_id, purchase_order_id, status } = req.query;

    // Validate required parameters
    if (!pidx || !purchase_order_id) {
      return res.status(400).json({ message: 'Invalid payment data' });
    }

    // Find the booking
    const booking = await Booking.findById(purchase_order_id.trim());
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify payment with Khalti
    const verifyResponse = await axios.post(
      'https://a.khalti.com/api/v2/epayment/lookup/',
      { pidx },
      {
        headers: {
          'Authorization': `Key ${KHALTI_CONFIG.secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // If payment is successful
    if (verifyResponse.data.status === 'Completed' && verifyResponse.data.transaction_id) {
      booking.paymentStatus = 'completed';
      booking.khaltiToken = pidx;
      booking.khaltiTransactionId = transaction_id;
      booking.khaltiPaymentStatus = status;
      await booking.save();

      // Update the event attendees list
      const event = await Event.findById(booking.eventId);
      if (event && !event.attendees.includes(booking.userId)) {
        event.attendees.push(booking.userId);
        await event.save();
      }

      // Redirect to the frontend success page
      return res.redirect(
        `${KHALTI_CONFIG.website}/Booking-success?pidx=${pidx}&transaction_id=${transaction_id}`
      );
    } else {
      // Mark the payment as failed
      booking.paymentStatus = 'failed';
      booking.khaltiPaymentStatus = status;
      await booking.save();

      // Redirect to the frontend failure page
      return res.redirect(
        `${KHALTI_CONFIG.website}/Booking-failure?pidx=${pidx}&status=${status}`
      );
    }
  } catch (error) {
    console.error('Payment Verification Error:', error);
    return res.redirect(`${KHALTI_CONFIG.website}/Booking-failure?error=true`);
  }
};
/**
 * Handle failed payment scenarios.
 */
export const handlePaymentFailure = async (req, res) => {
  try {
    const { pidx, transaction_id, purchase_order_id, status } = req.query;

    if (!purchase_order_id) {
      return res.status(400).json({ message: 'Invalid payment data' });
    }

    // Find the booking
    const booking = await Booking.findById(purchase_order_id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Mark the booking as failed
    booking.paymentStatus = 'failed';
    booking.khaltiPaymentStatus = status;
    await booking.save();

    // Redirect to the frontend failure page
    return res.redirect(`${KHALTI_CONFIG.website}/Booking-failure/${booking._id}`);
  } catch (error) {
    console.error('Payment Failure Error:', error);
    return res.redirect(`${KHALTI_CONFIG.website}/Booking-failure`);
  }
};

export const getBookingDetails = async (req, res) => {
  try {
    const { pidx } = req.params;

    // Fetch the booking based on pidx (which is stored in the khaltiToken field)
    const booking = await Booking.findOne({ khaltiToken: pidx })
      .populate('userId', 'fullname email') // Populate user details
      .populate('eventId', 'event_name'); // Populate event details

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Respond with the populated data
    res.json({
      success: true,
      eventName: booking.eventId.event_name,
      seatsBooked: booking.numberOfSeats,
      totalAmount: booking.totalAmount,
      userName: booking.userId.fullname,
      userId: booking.userId._id, // Include user ID
      email: booking.userId.email, // Include user email (if needed)
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking details' });
  }
};