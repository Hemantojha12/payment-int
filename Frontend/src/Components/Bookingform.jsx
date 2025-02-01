import React, { useState } from 'react';
import PropTypes from 'prop-types';
import api from '/src/utils/api';
import { ChevronDown } from 'lucide-react';

const BookingForm = ({ event, onClose }) => {
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);

  const availableSeats = event.totalSlots - (event.attendees?.length || 0);
  const totalAmount = seats * event.price;

  const handlePayment = async () => {
    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }
  
    try {
      setLoading(true);
      setError(null);
  
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please login first');
      }
  
      console.log("🔹 Making API call to /bookings with payload:", {
        eventId: event._id,
        numberOfSeats: seats,
        paymentMethod
      });
  
      const response = await api.post('/bookings', 
        {
          eventId: event._id,
          numberOfSeats: seats,
          paymentMethod
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
  
      console.log("🔹 Backend Response:", response.data); // Debugging log
  
      if (response.data.paymentUrl) {
        console.log("Redirecting to payment URL:", response.data.paymentUrl);
        window.location.href = response.data.paymentUrl;
      } else {
        console.error(" Payment URL not received from server:", response.data);
        setError('Payment URL not received. Please try again.');
      }
    } catch (err) {
      console.error(' Booking error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Payment initiation failed');
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
          <div className="bg-red-50 text-red-500 p-4 rounded-md">
            {error}
          </div>
        )}

        {/* Seats Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Number of Seats</label>
          <input
            type="number"
            min="1"
            max={availableSeats}
            value={seats}
            onChange={(e) => setSeats(Math.min(parseInt(e.target.value) || 1, availableSeats))}
            className="w-full px-4 py-2 border rounded-md"
          />
          <p className="text-sm text-gray-500">Available seats: {availableSeats}</p>
        </div>

        {/* Payment Method Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Payment Method</label>
          <div className="relative">
            <button
              onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}
              className="w-full px-4 py-2 border rounded-md flex items-center justify-between"
            >
              {paymentMethod ? `Pay via ${paymentMethod === 'esewa' ? 'eSewa' : 'Khalti'}` : 'Select payment method'}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showPaymentDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                <PaymentMethodButton method="esewa" />
                <PaymentMethodButton method="khalti" />
              </div>
            )}
          </div>
        </div>

        {/* Total Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Total Amount</label>
          <p className="text-lg font-semibold text-purple-600">NPR {totalAmount}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handlePayment}
            disabled={loading || !paymentMethod || seats < 1 || seats > availableSeats}
            className={`flex-1 px-4 py-2 rounded-md text-white ${
              loading || !paymentMethod || seats < 1 || seats > availableSeats
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

BookingForm.propTypes = {
  event: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default BookingForm;
