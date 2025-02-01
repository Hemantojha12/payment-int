import jwt from 'jsonwebtoken';
import User from '../model/user.schema.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const authenticateUser = async (req, res, next) => {
  let token;

  try {
    console.log("Authorization Header:", req.headers.authorization);

    // Extract token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else {
      console.error("No token found in Authorization header.");
      return res.status(401).json({ message: 'Authorization denied: No token provided' });
    }

    console.log("Extracted Token:", token);

    // Ensure JWT_SECRET is loaded properly
    if (!process.env.JWT_SECRET) {
      console.error("Error: JWT_SECRET is not defined in .env file.");
      return res.status(500).json({ message: "Internal Server Error: JWT Secret Missing" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);

    // Find the user associated with the token
    const user = await User.findById(decoded.user.id).select('-password'); // Exclude password for security
    if (!user) {
      console.error("User not found in the database.");
      return res.status(401).json({ message: 'Authorization denied: User not found' });
    }

    console.log("Authenticated User:", user);

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Authorization denied: Token expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Authorization denied: Invalid token' });
    } else {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};
