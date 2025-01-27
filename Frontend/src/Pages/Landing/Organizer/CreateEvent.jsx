import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { getToken } from '../../../utils/auth';

const CreateEvent = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        const token = getToken();
        if (!token) {
          throw new Error("No authentication token found");
        }

        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        if (!decodedToken.user?.email) {
          throw new Error("Token does not contain user email");
        }

        const [userResponse, categoryResponse] = await Promise.all([
          api.get(`/users/email/${decodedToken.user.email}`),
          api.get("/categories")
        ]);

        setUserData(userResponse.data.user);
        setCategories(categoryResponse.data);
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError("Failed to load initial data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleCreateEvent = async (event) => {
    event.preventDefault();
    setError("");
   
    setLoading(true);
    

    try {
      if (!userData?._id) {
        throw new Error("User data not found. Please try again.");
      }

      const form = event.target;
      const eventDate = new Date(form.event_date.value);
      const registrationDeadline = new Date(form.registrationDeadline.value);
      const currentDate = new Date();
      const categoryId = form.category.value;

      // Validations
      if (!categoryId) {
        throw new Error("Please select a valid category");
      }

      if (registrationDeadline >= eventDate) {
        throw new Error("Registration deadline must be before event date");
      }

      if (eventDate <= currentDate) {
        throw new Error("Event date must be in the future");
      }

      const eventData = {
        event_name: form.event_name.value.trim(),
        description: form.description.value.trim(),
        event_date: form.event_date.value,
        registrationDeadline: form.registrationDeadline.value,
        time: form.time.value,
        location: form.location.value.trim(),
        price: Number(form.price.value),
        category: categoryId,
        image: 'default-event.jpg',
        totalSlots: Number(form.totalSlots.value),
        status: 'pending',
        org_ID: userData._id,
        isPublic: form.isPublic.checked,
        tags: form.tags.value ? form.tags.value.split(",").map(tag => tag.trim()) : [],
        paymentMethod: form.paymentMethod.value,
        esewaId: form.esewaID.value.trim(),  // Ensure this is being populated
      };
      console.log("Event Data being sent:", eventData);

      
      const response = await api.post("/events/create", eventData);


      if (response.data) {
        navigate("/orgdb/my-events");
      }
    } catch (err) {
      console.error("Error creating event:", err);
      let errorMessage = "Failed to create event";

      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
       
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && (!categories.length || !userData)) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <form 
      className={`${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white'} p-6 rounded-lg shadow space-y-6`} 
      onSubmit={handleCreateEvent}
    >
      {error && <div className="text-red-500 p-3 rounded bg-red-50">{error}</div>}

      <div>
        <h3 className="text-lg font-semibold mb-2">Event Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Event Name</label>
            <input 
              name="event_name" 
              type="text" 
              className={`w-full p-2 border rounded ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'
              }`}
              required 
            />
          </div>
            
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select 
              name="category" 
              className={`w-full p-2 border rounded ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'
              }`}
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.categoryName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Event Date</label>
            <input 
              name="event_date" 
              type="date" 
              className="w-full p-2 border rounded" 
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Registration Deadline</label>
            <input 
              name="registrationDeadline" 
              type="date" 
              className="w-full p-2 border rounded" 
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Time</label>
            <input 
              name="time" 
              type="time" 
              className="w-full p-2 border rounded" 
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input 
              name="location" 
              type="text" 
              className="w-full p-2 border rounded" 
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <input
              name="price"
              type="number"
              className={`w-full p-2 border rounded ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'
              }`}
              required
              min="0"
              placeholder="Enter total price for the event"
            />
          </div>
                
          <div>
            <label className="block text-sm font-medium mb-1">Payment Method</label>
            <select 
              name="paymentMethod" 
              className={`w-full p-2 border rounded ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'
              }`}
              required
            >
              <option value="">Select Payment Method</option>
              <option value="eSewa">eSewa</option>
            </select>
          </div>
            
          <div>
            <label className="block text-sm font-medium mb-1">eSewa ID</label>
            <input 
              name="esewaID" 
              type="text" 
              className={`w-full p-2 border rounded ${
                isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'
              }`}
              required
              placeholder="Enter eSewa ID"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Total Slots</label>
            <input 
              name="totalSlots" 
              type="number" 
              className="w-full p-2 border rounded" 
              required 
              min="1" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <input 
              name="tags" 
              type="text" 
              placeholder="Separate tags with commas" 
              className="w-full p-2 border rounded" 
            />
          </div>

          <div className="flex items-center pt-6">
            <input 
              name="isPublic" 
              type="checkbox" 
              className="mr-2" 
            />
            <label>Make Event Public</label>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            className={`w-full p-2 border rounded ${
              isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'
            }`}
            rows="4"
            required
          />
        </div>
      </div>

      <button 
        type="submit" 
        className="w-full p-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        disabled={loading}
      >
        {loading ? "Creating Event..." : "Create Event"}
      </button>
    </form>
  );
};

export default CreateEvent;
