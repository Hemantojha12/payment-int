import crypto from 'crypto';

export const generateEsewaParams = ({ totalAmount, orderId }) => {
  // Validate input parameters
  if (!totalAmount || !orderId) {
    throw new Error('Missing required parameters: totalAmount or bookingId');
  }

  // eSewa parameters
  const params = {
    amt: totalAmount,                  // Total amount (excluding charges)
    psc: 1,                            // eSewa service charge
    pdc: 1,                            // eSewa delivery charge
    txAmt: 0,                          // Tax (set to 0 if not applicable)
    tAmt: totalAmount + 1 + 1,         // Total payable amount (incl. charges)
    pid: `BOOKING-${orderId}`,       // Unique booking ID
    scd: process.env.ESEWA_MERCHANT_ID, // Merchant ID from eSewa
    su: `${process.env.CLIENT_URL}/payment/success`, // Success callback URL
    fu: `${process.env.CLIENT_URL}/payment/failure`, // Failure callback URL
  };

  // Generate a secure hash signature
  const stringToHash = `${params.amt}|${params.psc}|${params.pdc}|${params.txAmt}|${params.tAmt}|${params.pid}|${params.scd}`;
  const signature = crypto.createHash('sha256').update(stringToHash).digest('hex');

  return {
    ...params,
    signature, // Attach signature to the params
  };
};
