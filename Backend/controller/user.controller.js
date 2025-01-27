import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../model/user.schema.js';  
import Role from '../model/role.schema.js'; 

export const signup = async (req, res) => {
    try {
        const { fullname, email, password, role } = req.body;

        // Validate input
        if (!fullname || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if user already exists
        const userExist = await User.findOne({ email });
        if (userExist) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Find role by name
        const foundRole = await Role.findOne({ role_Name: role });
        if (!foundRole) {
            return res.status(400).json({ message: "Invalid role" });
        }

        // Hash the password
        const hashedPassword = await bcryptjs.hash(password, 10);

        // Create and save user
        const createdUser = new User({
            fullname,
            email,
            password: hashedPassword,
            role: foundRole._id, // Save the ObjectId reference to the Role
            // isApproved: false,
        });
        await createdUser.save();

        // Respond with user details and role_Name
        res.status(201).json({
            message: "User created successfully",
            user: {
                _id: createdUser._id,
                fullname: createdUser.fullname,
                email: createdUser.email,
                role: foundRole.role_Name, // Include the role name in the response
            },
        });
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const login = async (req, res) => {
    try {
        console.log("Login Request Body:", req.body);
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        // Find user by email and populate the role
        const user = await User.findOne({ email }).populate('role');
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Compare password
        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                user: {
                    id: user._id,
                    fullname: user.fullname,
                    email: user.email,
                    role: user.role.role_Name
                }
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log("Login Response:", {
            message: "Login successful",
            token,
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                role: user.role.role_Name
            }
        });

        // Send response
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                role: user.role.role_Name
            }
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getUserByEmail = async (req, res) => {
    try {
        const { email } = req.params;

        // Validate email parameter
        if (!email) {
            return res.status(400).json({ message: "Email parameter is required" });
        }

        // Find user by email and populate the role
        const user = await User.findOne({ email }).populate('role');
        
        // If no user found
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Return user data
        res.status(200).json({
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                role: user.role.role_Name
            }
        });
    } catch (error) {
        console.error("Error fetching user by email:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        // Fetch all users and populate their roles
        const users = await User.find()
            .populate('role')
            .select('-password') // Exclude password from the response
            .sort({ createdAt: -1 }); // Sort by newest first

        // Group users by role
        const usersByRole = users.reduce((acc, user) => {
            const roleName = user.role.role_Name;
            if (!acc[roleName]) {
                acc[roleName] = [];
            }
            acc[roleName].push({
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                createdAt: user.createdAt
            });
            return acc;
        }, {});

        // Get total counts
        const userCounts = {
            total: users.length,
            byRole: Object.keys(usersByRole).reduce((acc, role) => {
                acc[role] = usersByRole[role].length;
                return acc;
            }, {})
        };

        res.status(200).json({
            users: usersByRole,
            counts: userCounts
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};