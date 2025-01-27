// admin.controller.js
import Event from '../model/event.schema.js';
import User from '../model/user.schema.js';

export const getPendingEvents = async (req, res) => {
    try {
        const pendingEvents = await Event.find({ status: 'pending' })
            .populate("org_ID", "fullname email") // Changed from username to fullname
            .populate("category", "categoryName");

        // Map the data to match frontend expectations
        const formattedEvents = pendingEvents.map(event => ({
            ...event._doc,
            organizer: {
                name: event.org_ID.fullname,
                email: event.org_ID.email
            }
        }));

        res.status(200).json({
            success: true,
            data: formattedEvents || []
        });
    } catch (error) {
        console.error('getPendingEvents error:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching pending events",
            error: error.message
        });
    }
};

export const approveRejectEvent = async (req, res) => {
    const { eventId } = req.params;
    const { status } = req.body;

    try {
        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: "Event ID is required"
            });
        }

        if (status !== 'approved' && status !== 'rejected') {
            return res.status(400).json({
                success: false,
                message: "Invalid status, must be 'approved' or 'rejected'"
            });
        }

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        event.status = status === 'approved' ? 'approved' : 'rejected';
        event.isPublic = status === 'approved';
        
        await event.save();

        const user = await User.findById(event.org_ID);
        if (user) {
            if (status === 'approved') {
                user.isApproved = true;
                await user.save();
            }
        }

        res.status(200).json({
            success: true,
            message: `Event ${status} successfully`,
            data: event
        });
    } catch (error) {
        console.error('approveRejectEvent error:', error);
        res.status(500).json({
            success: false,
            message: "Error updating event status",
            error: error.message
        });
    }
};