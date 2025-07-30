// routes/BasicRoutes.js
const express = require("express");
const User = require("../models/User");
const Issue = require("../models/Issue");
const Chat = require("../models/Chat");
const router = express.Router();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Authentication required" });
  }
};

// Get all users (protected route)
router.get("/", requireAuth, async (req, res) => {
  try {
    const users = await User.find({}, "-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get user profile (protected route)
router.get("/profile", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId, "-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile (protected route)
router.put("/profile", requireAuth, async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.session.userId },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email is already taken" });
    }

    const user = await User.findByIdAndUpdate(
      req.session.userId,
      { name, email },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create new issue (protected route)
router.post("/issue", requireAuth, async (req, res) => {
  try {
    const {
      deviceType,
      vehicleType,
      description,
      estimatedPrice,
      date,
      city,
      state,
      pin,
      geoloc,
    } = req.body;

    const issue = new Issue({
      user: req.session.userId,
      deviceType,
      vehicleType,
      description,
      estimatedPrice,
      dateReported: date,
      status: "pending",
      city,
      state,
      pin,
      geoloc,
    });
    await issue.save();
    res.status(201).json({ message: "Issue created", issue });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get all issues for the logged-in user (protected route)
router.get("/issues", requireAuth, async (req, res) => {
  try {
    const issues = await Issue.find({ user: req.session.userId })
      .sort({ createdAt: -1 })
      .populate("repairer", "name"); // <-- populate repairer name
    res.json({ issues });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get issue details for user
router.get("/issues/:issueId", requireAuth, async (req, res) => {
  try {
    const issue = await Issue.findOne({
      _id: req.params.issueId,
      user: req.session.userId,
    }).populate("repairer", "name");
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    res.json({ issue });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get chat for an issue (create if not exists)
router.get("/issues/:issueId/chat", requireAuth, async (req, res) => {
  try {
    const issue = await Issue.findOne({
      _id: req.params.issueId,
      user: req.session.userId,
    });
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    let chat = await Chat.findOne({ issueId: issue._id });
    if (!chat) {
      chat = await Chat.create({
        issueId: issue._id,
        userId: issue.user,
        repairerId: issue.repairer,
        messages: [],
      });
      issue.chat = chat._id;
      await issue.save();
    }
    res.json({ chat });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add a message to chat
router.post("/issues/:issueId/chat/message", requireAuth, async (req, res) => {
  try {
    const { message, sender } = req.body;
    const issue = await Issue.findOne({
      _id: req.params.issueId,
      user: req.session.userId,
    });
    if (!issue || !issue.chat)
      return res.status(404).json({ message: "Chat not found" });

    const chat = await Chat.findById(issue.chat);
    chat.messages.push({
      sender,
      message,
      timestamp: new Date(),
    });
    await chat.save();
    res.json({ chat });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's location for a specific issue (for repairer)
router.get("/issues/:issueId/user-location", async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.issueId);
    if (!issue || !issue.geoloc)
      return res.status(404).json({ message: "Location not found" });
    res.json({
      location: {
        lat: issue.geoloc.lat,
        lng: issue.geoloc.long,
      },
      city: issue.city,
      state: issue.state,
      pin: issue.pin,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
