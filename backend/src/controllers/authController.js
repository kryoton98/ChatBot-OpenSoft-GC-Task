/**
 * @file authController.js
 * @description Handles Dual-Layer Authentication + Google Login.
 */
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library'); // Import ONCE here

// Helper Functions
const generateAccessToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
const generateRefreshToken = (id) => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

// --- REGISTER ---
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: "All fields required" });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already exists" });

        const user = await User.create({ name, email, password });
        
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateAccessToken(user._id),
            refreshToken: generateRefreshToken(user._id)
        });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ error: "Server error during registration" });
    }
};

// --- LOGIN ---
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                email: user.email,
                token: generateAccessToken(user._id),
                refreshToken: generateRefreshToken(user._id)
            });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- REFRESH TOKEN ---
exports.refreshToken = async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        res.json({ accessToken: generateAccessToken(decoded.id) });
    } catch (error) {
        res.status(403).json({ error: 'Invalid Refresh Token' });
    }
};

// --- GOOGLE LOGIN (FIXED) ---
exports.googleLogin = async (req, res) => {
    const { token } = req.body; 

    // HARDCODED ID FOR SAFETY
    const MY_CLIENT_ID = "500551401336-afj4fc0u0asb0jrho87rucul8b4p4vh9.apps.googleusercontent.com";
    const client = new OAuth2Client(MY_CLIENT_ID);

    console.log("-----------------------------------------");
    console.log("GOOGLE LOGIN ATTEMPT RECEIVED");

    if (!token) {
        return res.status(400).json({ error: "No Google token provided" });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: MY_CLIENT_ID, 
        });
        
        const { name, email, picture } = ticket.getPayload();
        console.log("User Email:", email);

        let user = await User.findOne({ email });

        if (!user) {
            console.log("Creating new Google user...");
            const dummyPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            user = await User.create({
                name,
                email,
                password: dummyPassword,
            });
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: accessToken,
            refreshToken: refreshToken
        });

    } catch (error) {
        console.error("GOOGLE LOGIN FAILED:", error.message);
        res.status(401).json({ error: "Google Login Failed: " + error.message });
    }
};