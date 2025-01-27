import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);  // Use environment variable for security

// Function to create a payment intent (for Stripe)
export const createPaymentIntent = async (amount, currency = 'usd') => {
  try {
    // Create a PaymentIntent object for the given amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,  // Amount in cents (e.g., $10 = 1000)
      currency: currency,
      metadata: { integration_check: 'accept_a_payment' },
    });

    return { clientSecret: paymentIntent.client_secret };
  } catch (error) {
    throw new Error('Error creating payment intent: ' + error.message);
  }
};

// Function to handle successful payment and update booking/payment status
export const handlePaymentSuccess = async (paymentIntentId, bookingId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // You can update the payment status and other related info here
      // Example: Update booking status to 'completed'
      // const booking = await Booking.findById(bookingId);
      // booking.paymentStatus = 'completed';
      // booking.transactionId = paymentIntent.id;
      // await booking.save();

      return { success: true, message: 'Payment successful', paymentIntent };
    } else {
      throw new Error('Payment failed: ' + paymentIntent.status);
    }
  } catch (error) {
    throw new Error('Error processing payment success: ' + error.message);
  }
};

// Function to handle payment failure
export const handlePaymentFailure = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'requires_payment_method') {
      return { success: false, message: 'Payment failed. Please try again.' };
    } else {
      throw new Error('Unexpected error during payment failure');
    }
  } catch (error) {
    throw new Error('Error processing payment failure: ' + error.message);
  }
};

