import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Users, TrendingUp, Heart, Star, MapPin, Share2, Clock, Search, Filter, X } from 'lucide-react';
import { debounce } from 'lodash';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/api';
const BookingForm = ({ event, onClose }) => {
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');

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
        window.location.href = response.data.paymentUrl; // Directly redirect to the payment URL
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

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Number of Seats
          </label>
          <input
            type="number"
            min="1"
            max={availableSeats}
            value={seats}
            onChange={(e) => setSeats(Math.min(parseInt(e.target.value) || 1, availableSeats))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500">
            Available seats: {availableSeats}
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Select payment method</option>
            <option value="esewa">Pay via eSewa</option>
            <option value="khalti">Pay via Khalti</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Total Amount
          </label>
          <p className="text-xl font-bold text-purple-600">
            NPR {totalAmount}
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handlePayment}
            disabled={loading || seats < 1 || seats > availableSeats || !paymentMethod}
            className={`flex-1 px-4 py-2 text-white rounded-md ${
              loading || seats < 1 || seats > availableSeats || !paymentMethod
                ? 'bg-purple-300 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {loading ? 'Processing...' : 'Pay Now'}
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
const UserDashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeEvent, setActiveEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlist, setWishlist] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    priceRange: '',
    date: '',
    status: '',
  });

  const { isDarkMode } = useTheme();

  const themeClasses = {
    layout: isDarkMode
      ? 'bg-gradient-to-br from-gray-900 to-gray-800'
      : 'bg-gradient-to-br from-blue-50 to-white',
    text: isDarkMode ? 'text-gray-100' : 'text-gray-800',
    textMuted: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    card: isDarkMode
      ? 'bg-gray-800/50 border-gray-700'
      : 'bg-white/50 border-gray-200',
    button: isDarkMode
      ? 'bg-purple-600 hover:bg-purple-500'
      : 'bg-purple-500 hover:bg-purple-600',
    input: isDarkMode
      ? 'bg-gray-800 border-gray-700 text-white'
      : 'bg-white border-gray-200 text-gray-900',
    cardHover: isDarkMode
      ? 'hover:border-gray-600'
      : 'hover:border-purple-200',
    filterBtn: isDarkMode
      ? 'hover:bg-gray-700'
      : 'hover:bg-gray-50',
  };

  const categories = [
    { id: 'all', name: 'All Events', icon: Calendar },
    { id: 'trending', name: 'Trending', icon: TrendingUp },
    { id: 'featured', name: 'Featured', icon: Star },
    { id: 'regular', name: 'Regular', icon: Users },
  ];

  const priceRanges = ['Free', '$0-$50', '$51-$100', '$101-$200', '$200+'];
  const statuses = ['Upcoming', 'Ongoing', 'Completed'];

  const debouncedFetch = useCallback(
    debounce(async (category, filterParams) => {
      setLoading(true);
      try {
        const response = await api.get('/events', {
          params: {
            category: category !== 'all' ? category : undefined,
            ...filterParams,
          },
        });
        setEvents(response.data);

        const userId = localStorage.getItem('userId');
        if (userId) {
          const userResponse = await api.get(`/users/${userId}/wishlist`);
          setWishlist(new Set(userResponse.data.map((event) => event._id)));
        }

        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 500),
    []

  );

  useEffect(() => {
    debouncedFetch(selectedCategory, filters);
    return () => debouncedFetch.cancel();
  }, [selectedCategory, filters, debouncedFetch]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      location: '',
      priceRange: '',
      date: '',
      status: ''
    });
  };

  const handleWishlist = async (eventId) => {
    try {
      const newWishlist = new Set(wishlist);
      if (wishlist.has(eventId)) {
        await api.delete(`/events/${eventId}/wishlist`);
        newWishlist.delete(eventId);
      } else {
        await api.post(`/events/${eventId}/wishlist`);
        newWishlist.add(eventId);
      }
      setWishlist(newWishlist);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleShare = async (eventId) => {
    try {
      const shareData = {
        title: 'Event Share',
        text: 'Check out this event!',
        url: `${window.location.origin}/events/${eventId}`
      };
      await navigator.share(shareData);
    } catch (err) {
      console.log('Error sharing:', err);
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-screen ${themeClasses.layout} ${themeClasses.text}`}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">Error: {error}</div>
    );
  }

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className={`min-h-screen ${themeClasses.layout}`}>
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        {/* Category buttons */}
        <div className="flex flex-col space-y-4 mb-8">
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? `${themeClasses.button} text-white`
                      : `${themeClasses.card} ${themeClasses.text}`
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>

          {/* Search and filter section */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <div className="relative">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${themeClasses.textMuted}`} />
                <input
                  type="text"
                  placeholder="Search for events..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 rounded-lg border ${themeClasses.input} focus:ring-2 focus:ring-purple-500 outline-none`}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-6 py-4 rounded-lg border ${themeClasses.card} ${themeClasses.filterBtn}`}
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className={`${themeClasses.button} text-white text-xs px-2 py-1 rounded-full`}>
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className={`flex items-center gap-2 px-6 py-4 rounded-lg border ${themeClasses.card} ${themeClasses.filterBtn}`}
                >
                  <X className="w-5 h-5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className={`${themeClasses.card} rounded-lg border p-6`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries({
                  location: { icon: MapPin, type: 'text', placeholder: 'Enter location' },
                  priceRange: { icon: Star, type: 'select', options: priceRanges },
                  date: { icon: Calendar, type: 'date' },
                  status: { icon: Clock, type: 'select', options: statuses }
                }).map(([key, config]) => (
                  <div key={key} className="space-y-2">
                    <label className={`flex items-center gap-2 text-sm font-medium ${themeClasses.text}`}>
                      <config.icon className="w-4 h-4" />
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                    {config.type === 'select' ? (
                      <select
                        value={filters[key]}
                        onChange={(e) => handleFilterChange(key, e.target.value)}
                        className={`w-full p-3 rounded-lg border ${themeClasses.input}`}
                      >
                        <option value="">All {key}s</option>
                        {config.options.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : config.type === 'date' ? (
                      <input
                        type="date"
                        value={filters[key]}
                        onChange={(e) => handleFilterChange(key, e.target.value)}
                        className={`w-full p-3 rounded-lg border ${themeClasses.input}`}
                      />
                    ) : (
                      <input
                        type="text"
                        value={filters[key]}
                        onChange={(e) => handleFilterChange(key, e.target.value)}
                        placeholder={config.placeholder}
                        className={`w-full p-3 rounded-lg border ${themeClasses.input}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

       {/* Events grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <div
              key={event._id}
              className={`${themeClasses.card} rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer ${themeClasses.cardHover}`}
              onClick={() => setActiveEvent(activeEvent === event._id ? null : event._id)}
            >
              <div className="relative">
                <img
                  src={event.image || '/api/placeholder/600/400'}
                  alt={event.event_name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button 
                    className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWishlist(event._id);
                    }}
                  >
                    <Heart 
                      className={`h-4 w-4 ${wishlist.has(event._id) ? 'text-red-500 fill-red-500' : 'text-white'}`} 
                    />
                  </button>
                  <button 
                    className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(event._id);
                    }}
                  >
                    <Share2 className="h-4 w-4 text-white" />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm">
                    NPR {event.price}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Clock className={`h-4 w-4 ${themeClasses.textMuted}`} />
                    <span className={`text-sm ${themeClasses.textMuted}`}>{event.time}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className={`h-4 w-4 ${themeClasses.textMuted}`} />
                    <span className={`text-sm ${themeClasses.textMuted}`}>
                      {event.attendees?.length || 0}/{event.totalSlots}
                    </span>
                  </div>
                </div>
                <h3 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>{event.event_name}</h3>
                <div className="flex items-center space-x-2">
                  <MapPin className={`h-4 w-4 ${themeClasses.textMuted}`} />
                  <span className={`text-sm ${themeClasses.textMuted}`}>{event.location}</span>
                </div>
                {activeEvent === event._id && (
                  <div className="mt-4">
                    <p className={`text-sm ${themeClasses.textMuted}`}>{event.description}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button 
                        className={`py-2 ${themeClasses.button} text-white rounded-lg`}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/events/${event._id}`;
                        }}
                      >
                        View Details
                      </button>
                      <button 
                        className={`py-2 ${themeClasses.button} text-white rounded-lg`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                          setShowBookingForm(true);
                        }}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Booking Form Modal */}
        {showBookingForm && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <BookingForm 
                event={selectedEvent} 
                onClose={() => {
                  setShowBookingForm(false);
                  setSelectedEvent(null);
                }} 
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserDashboard;