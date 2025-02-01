import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '/src/utils/api'; // Import the API utility to make requests
import ReactQR from 'react-qr-code'; // Import ReactQR from react-qr-code

const BookingSuccess = () => {
  const [searchParams] = useSearchParams();
  const pidx = searchParams.get('pidx');
  const transactionId = searchParams.get('transaction_id');
  
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch booking details using the payment ID (pidx)
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const response = await api.get(`/bookings/${pidx}`); // API to fetch booking info by pidx
        setBookingDetails(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch booking details');
        setLoading(false);
      }
    };

    if (pidx) {
      fetchBookingDetails();
    }
  }, [pidx]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-purple-600 mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">No Booking Found</h1>
          <p className="text-gray-700 mb-2">We couldn't find your booking details.</p>
        </div>
      </div>
    );
  }

  const { eventName, totalSeats, totalAmount, userName } = bookingDetails;

  // Create a string with booking details to encode into the QR code
  const bookingInfo = `
    Event: ${eventName}
    Number of Seats: ${totalSeats}
    Total Amount: NPR ${totalAmount}
    Booked by: ${userName}
    Transaction ID: ${transactionId}
    Payment ID: ${pidx}
  `;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h1>
        <p className="text-gray-700 mb-2">Your payment has been processed successfully.</p>
        <p className="text-gray-700">Transaction ID: {transactionId}</p>
        <p className="text-gray-700">Payment ID: {pidx}</p>
        
        <div className="mt-4">
          <p className="text-lg font-semibold">Booking Details:</p>
          <p className="text-gray-700">Event: {eventName}</p>
          <p className="text-gray-700">Number of Seats: {totalSeats}</p>
          <p className="text-gray-700">Total Amount: NPR {totalAmount}</p>
          <p className="text-gray-700">Booked by: {userName}</p>
        </div>

        {/* Display QR code with booking info */}
        <div className="mt-6">
          <p className="text-lg font-semibold mb-2">Scan the QR Code for your booking details:</p>
          <ReactQR value={bookingInfo} size={256} />
        </div>

        <a
          href="/"
          className="mt-6 inline-block px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          Go to Home
        </a>
      </div>
    </div>
  );
};

export default BookingSuccess;
