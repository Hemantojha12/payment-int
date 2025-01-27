import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  event_name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  event_date: { 
    type: Date, 
    required: true,
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Event date must be in the future'
    }
  },
  registrationDeadline: {
    type: Date,
    required: true,
    validate: [
      {
        validator: function(date) {
          return date < this.event_date;
        },
        message: 'Registration deadline must be before event date'
      },
      {
        validator: function(date) {
          return date > new Date();
        },
        message: 'Registration deadline must be in the future'
      }
    ]
  },
  time: { type: String, required: true },
  location: { type: String, required: true, trim: true },
  
  // Add the price field
  price: { 
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
    
  },
  
  category: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  tags: [{ type: String, trim: true }],
  image: { type: String, default: 'default-event.jpg' },
  org_ID: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: function() {
        return this.attendees.length <= this.totalSlots;
      },
      message: 'Event has reached maximum capacity'
    }
  }],
  totalSlots: { 
    type: Number, 
    required: true,
    min: [1, 'Total slots must be at least 1']
  },
  bookedSeats: { 
    type: Number,
    default: 0,
    min: [0, 'Booked seats cannot be less than 0'],
    validate: {
      validator: function(value) {
        return value <= this.totalSlots;
      },
      message: 'Booked seats cannot exceed total slots'
    }
  },
  isPublic: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled', 'pending', 'approved', 'rejected'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['eSewa', 'Cash', 'Card'],
  },
  esewaId: {
    type: String,
    required: function() { 
      return this.paymentMethod === 'eSewa'; 
    },
    trim: true
  }
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

export default Event;
