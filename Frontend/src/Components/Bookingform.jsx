import React, { useState } from 'react';
import PropTypes from 'prop-types';
import api from '/src/utils/api';

const BookingForm = ({ event, onClose }) => {
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  const availableSeats = event.totalSlots - (event.attendees?.length || 0);
  const totalAmount = seats * event.price;

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token is missing.');
      }

      const payload = {
        eventId: event._id,
        numberOfSeats: seats,
      };

      // Send booking details to server
      const response = await api.post('/bookings', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Ensure payment details are returned correctly
      if (!response.data?.paymentUrl || !response.data?.params || !response.data?.signature) {
        throw new Error('Invalid response format from the server.');
      }

      // Create and submit the payment form to eSewa
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = response.data.paymentUrl;

      // Loop through `params` and add hidden fields to the form
      Object.entries(response.data.params).forEach(([key, value]) => {
        const hiddenField = document.createElement('input');
        hiddenField.type = 'hidden';
        hiddenField.name = key;
        hiddenField.value = value;
        form.appendChild(hiddenField);
      });

      // Add the signature
      const signatureField = document.createElement('input');
      signatureField.type = 'hidden';
      signatureField.name = 'signature';
      signatureField.value = response.data.signature;
      form.appendChild(signatureField);

      // Append form to the document body and submit
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred.';
      setError(errorMessage);
      setDebugInfo({
        error: err.response?.data || err.message,
        status: err.response?.status,
        endpoint: '/bookings',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold">Book Event: {event.event_name}</h2>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-md" role="alert">
            <p className="font-medium">Error: {error}</p>
            {debugInfo && process.env.REACT_APP_DEBUG === 'true' && (
              <div className="mt-2 text-sm">
                <p>Status: {debugInfo.status}</p>
                <p>Details: {JSON.stringify(debugInfo.error || debugInfo.data, null, 2)}</p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Number of Seats</label>
          <input
            type="number"
            min="1"
            max={availableSeats}
            value={seats}
            onChange={(e) =>
              setSeats(Math.min(Math.max(parseInt(e.target.value) || 1, 1), availableSeats))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500">Available seats: {availableSeats}</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Total Amount</label>
          <p className="text-xl font-bold text-purple-600">NPR {totalAmount}</p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handlePayment}
            disabled={loading || seats < 1 || seats > availableSeats}
            className={`flex-1 px-4 py-2 text-white rounded-md ${
              loading || seats < 1 || seats > availableSeats
                ? 'bg-purple-300 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {loading ? 'Processing...' : 'Pay with eSewa'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

BookingForm.propTypes = {
  event: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    event_name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    totalSlots: PropTypes.number.isRequired,
    attendees: PropTypes.array,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default BookingForm;
