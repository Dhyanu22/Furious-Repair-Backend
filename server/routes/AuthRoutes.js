// routes/AuthRoutes.js
const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Repairer = require("../models/Repairer");
const router = express.Router();

// Sign Up Route
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Create new user
    const user = new User({ name, email, password });
    await user.save();

    // Set session
    req.session.userId = user._id;
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup" });
  }
});

// Sign In Route
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Set session
    req.session.userId = user._id;
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    res.json({
      message: "Sign in successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ message: "Server error during signin" });
  }
});

// Sign Out Route
router.post("/signout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Could not sign out" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Signed out successfully" });
  });
});

// Get Current User
router.get("/me", (req, res) => {
  if (req.session.userId) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

// Repairer Sign Up
router.post("/repairer/signup", async (req, res) => {
  try {
    console.log("signup repairer : ", req.body);

    const {
      name,
      email,
      password,
      phone,
      expertise,
      city,
      state,
      pin,
      geoloc,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
    const existing = await Repairer.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Repairer already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const repairer = await Repairer.create({
      name,
      email,
      password: hashed,
      phone: phone || "",
      expertise: expertise || [],
      city: city || "",
      state: state || "",
      pin: pin || "",
      geoloc: geoloc || { lat: null, long: null },
    });
    req.session.userId = repairer._id;
    req.session.isRepairer = true;
    res.status(201).json({
      user: {
        id: repairer._id,
        name: repairer.name,
        email: repairer.email,
        isRepairer: true,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Repairer Sign In
router.post("/repairer/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const repairer = await Repairer.findOne({ email });
    if (!repairer) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const match = await bcrypt.compare(password, repairer.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    req.session.userId = repairer._id;
    req.session.isRepairer = true;
    res.json({
      user: {
        id: repairer._id,
        name: repairer.name,
        email: repairer.email,
        isRepairer: true,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
