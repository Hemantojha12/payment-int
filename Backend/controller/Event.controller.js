import mongoose from "mongoose";
import Event from "../model/event.schema.js";
import User from "../model/user.schema.js";
import Category from "../model/categories.schema.js";

// Create a new event
export const createEvent = async (req, res) => {
  try {
    const { org_ID, category, esewaId } = req.body; // Include esewaId
    
    if (!esewaId || typeof esewaId !== "string" || !esewaId.trim()) {
      return res
        .status(400)
        .json({ message: "eSewa ID is required and must be a valid string." });
    }
    // Fetch and validate organizer
    const organizer = await User.findById(org_ID);
    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }

    // Validate category exists in the Category collection
    const validCategory = await Category.findById(category);
    if (!validCategory) {
      return res.status(400).json({ message: "Invalid category selected" });
    }

    // Validate registration deadline against event date
    if (new Date(req.body.registrationDeadline) >= new Date(req.body.event_date)) {
      return res.status(400).json({
        message: "Registration deadline must be before event date",
      });
    }

    // Validate event date is in the future
    if (new Date(req.body.event_date) <= new Date()) {
      return res.status(400).json({
        message: "Event date must be in the future",
      });
    }

    // Validate esewaId
   


    const newEvent = new Event({
      event_name: req.body.event_name.trim(),
      description: req.body.description.trim(),
      event_date: req.body.event_date,
      registrationDeadline: req.body.registrationDeadline,
      time: req.body.time,
      location: req.body.location.trim(),
      price: req.body.price,
      category: validCategory._id, // Store the validated category ID
      tags: req.body.tags ? req.body.tags.map((tag) => tag.trim()) : [],
      image: req.body.image,
      org_ID,
      totalSlots: req.body.totalSlots,
      isPublic: req.body.isPublic !== undefined ? req.body.isPublic : false,
      status: req.body.status || "pending",
      attendees: [],
      paymentMethod: form.paymentMethod.value,
      esewaId: esewaId.trim(), // Trim and store esewaId
    });

    const savedEvent = await newEvent.save();
    await savedEvent.populate([
      { path: "org_ID", select: "username email" },
      { path: "category", select: "categoryName" }, // Only populate category name
    ]);

    res.status(201).json(savedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error creating event",
      error: error.message,
    });
  }
};

// Get all events
export const getEvents = async (req, res) => {
  const { search, location, category, priceRange, date, status } = req.query;

  try {
    const query = {};

    if (search) {
      query.$or = [
        { event_name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      query.category = new mongoose.Types.ObjectId(category);
    }

    if (status && ["upcoming", "ongoing", "completed", "cancelled"].includes(status)) {
      query.status = status;
    }

    if (priceRange) {
      const [min, max] = priceRange.split("-").map(Number);
      query.price = { $gte: min || 0 };
      if (max) query.price.$lte = max;
    }

    if (date) {
      const searchDate = new Date(date);
      query.event_date = {
        $gte: searchDate,
        $lt: new Date(searchDate.setDate(searchDate.getDate() + 1)),
      };
    }

    const events = await Event.find(query)
      .populate("org_ID", "username email")
      .populate("category")
      .populate("attendees", "username email")
      .sort({ event_date: 1 });

    res.status(200).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching events",
      error: error.message,
    });
  }
};

export const getEventsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user ID format",
        details: "The provided user ID is not in the correct format",
      });
    }

    const events = await Event.find({ org_ID: userId })
      .populate("org_ID", "username email")
      .populate("category")
      .populate("attendees", "username email")
      .sort({ event_date: 1 });

    res.status(200).json(events);
  } catch (error) {
    console.error("Error in getEventsByUserId:", error);
    res.status(500).json({
      message: "Error fetching user events",
      error: error.message,
    });
  }
};

export const getEventById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid event ID format" });
    }

    const event = await Event.findById(req.params.id)
      .populate("org_ID", "username email")
      .populate("category")
      .populate("attendees", "username email");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching event",
      error: error.message,
    });
  }
};

// Update an event
export const updateEvent = async (req, res) => {
  try {
    const updateData = { ...req.body };

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate([
      { path: "org_ID", select: "username email" },
      { path: "category", select: "categoryName" },
    ]);

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error updating event",
      error: error.message,
    });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);

    if (!deletedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({
      message: "Event deleted successfully",
      deletedEvent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error deleting event",
      error: error.message,
    });
  }
};
