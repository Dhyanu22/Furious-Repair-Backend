const express = require("express");
const Issue = require("../models/Issue");
const Repairer = require("../models/Repairer");
const Chat = require("../models/Chat");
const router = express.Router();

// Middleware to check repairer authentication
const requireRepairerAuth = (req, res, next) => {
  if (req.session && req.session.userId && req.session.isRepairer) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Get issues matching repairer's expertise
router.get("/issues", requireRepairerAuth, async (req, res) => {
  try {
    const repairer = await Repairer.findById(req.session.userId);
    const expertise = repairer.expertise || [];
    const issues = await Issue.find({
      $or: [
        { deviceType: { $in: expertise } },
        { vehicleType: { $in: expertise } },
      ],
      status: "pending",
    })
      .sort({ createdAt: -1 })
      .populate("user", "name"); // <-- populate user name

    res.json({ issues });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", requireRepairerAuth, async (req, res) => {
  try {
    const repairer = await Repairer.findById(req.session.userId);
    if (!repairer)
      return res.status(404).json({ message: "Repairer not found" });
    res.json({
      isRepairer: repairer.isRepairer, // <-- fetch from DB
      expertise: repairer.expertise,
      name: repairer.name,
      email: repairer.email,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/issues/:id/claim", requireRepairerAuth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    if (issue.status !== "pending")
      return res.status(400).json({ message: "Issue already claimed" });

    issue.status = "working";
    issue.repairer = req.session.userId;
    await issue.save();

    // Add the issue to the repairer's issues array if not already present
    await Repairer.findByIdAndUpdate(req.session.userId, {
      $addToSet: { issues: issue._id },
    });

    res.json({ message: "Issue claimed", issue });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/claimed", requireRepairerAuth, async (req, res) => {
  try {
    const repairer = await Repairer.findById(req.session.userId).populate({
      path: "issues",
      populate: { path: "user", select: "name" },
    });
    res.json({ issues: repairer.issues || [] });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get details for a claimed issue by ID (for chat/details page)
router.get("/claimed/:issueId", requireRepairerAuth, async (req, res) => {
  try {
    const repairer = await Repairer.findById(req.session.userId);
    if (!repairer)
      return res.status(404).json({ message: "Repairer not found" });

    // Only allow access if the issue is in the repairer's claimed issues
    if (!repairer.issues.includes(req.params.issueId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const issue = await Issue.findById(req.params.issueId)
      .populate("user", "name email")
      .populate("repairer", "name email");

    if (!issue) return res.status(404).json({ message: "Issue not found" });

    res.json({ issue });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get chat for a claimed issue (create if not exists)
router.get("/claimed/:issueId/chat", requireRepairerAuth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.issueId);
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
router.post(
  "/claimed/:issueId/chat/message",
  requireRepairerAuth,
  async (req, res) => {
    try {
      const { message, sender } = req.body;
      const issue = await Issue.findById(req.params.issueId);
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
  }
);

// Get repairer shop location
router.get("/shop-location", requireRepairerAuth, async (req, res) => {
  try {
    const repairer = await Repairer.findById(req.session.userId);
    if (!repairer || !repairer.geoloc)
      return res.status(404).json({ message: "Location not found" });
    res.json({
      location: {
        lat: repairer.geoloc.lat,
        lng: repairer.geoloc.long,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/shop-location/:repairerId", async (req, res) => {
  try {
    const repairer = await Repairer.findById(req.params.repairerId);
    if (!repairer || !repairer.geoloc)
      return res.status(404).json({ message: "Location not found" });
    res.json({
      location: {
        lat: repairer.geoloc.lat,
        lng: repairer.geoloc.long,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get all shops with available locations
router.get("/all-shops", async (req, res) => {
  try {
    const shops = await Repairer.find({ geoloc: { $exists: true } });
    res.json({ shops });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
