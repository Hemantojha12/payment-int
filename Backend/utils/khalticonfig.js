export const KHALTI_CONFIG = {
  secretKey: process.env.KHALTI_SECRET_KEY,
  returnUrl: '${process.env.FRONTEND_URL}/Booking-success', // Ensure this is correct
  website: process.env.FRONTEND_URL // e.g., http://localhost:5173
};