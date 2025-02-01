import React from 'react';
import { useSearchParams } from 'react-router-dom';

const BookingFailed = () => {
  const [searchParams] = useSearchParams();
  const pidx = searchParams.get('pidx');
  const status = searchParams.get('status');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Failed</h1>
        <p className="text-gray-700 mb-2">Your payment could not be processed.</p>
        <p className="text-gray-700">Status: {status}</p>
        <p className="text-gray-700">Payment ID: {pidx}</p>
        <a
          href="/"
          className="mt-4 inline-block px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          Go to Home
        </a>
      </div>
    </div>
  );
};

export default BookingFailed;