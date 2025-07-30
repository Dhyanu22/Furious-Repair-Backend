const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ["user", "repairer"], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const chatSchema = new mongoose.Schema({
  issueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Issue",
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  repairerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Repairer",
    required: true,
  },
  messages: [messageSchema],
});

module.exports = mongoose.model("Chat", chatSchema);
