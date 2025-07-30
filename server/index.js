// server.js
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const MongoStore = require("connect-mongo");
const authRoutes = require("./routes/AuthRoutes");
const basicRoutes = require("./routes/BasicRoutes");
const repairerRoutes = require("./routes/RepairerRoutes");

const app = express();

// MongoDB Connection
mongoose
  .connect(
    "mongodb+srv://dhyanu:Goodboy%402216@cluster0.dwmer2w.mongodb.net/Furious-Repair?retryWrites=true&w=majority&appName=Cluster0",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("Mongo Error:", err));

// Trust proxy for secure cookies on Render
app.set("trust proxy", 1);

// Allowed origins
const allowedOrigins = [
  "https://furious-repair-frontend-w9nd.vercel.app",
  "http://localhost:5173", // For local development
];

// CORS Configuration
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "repair_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl:
        "mongodb+srv://dhyanu:Goodboy%402216@cluster0.dwmer2w.mongodb.net/Furious-Repair?retryWrites=true&w=majority&appName=Cluster0",
    }),
    cookie: {
      secure: true,           // must be true for cross-site cookies
      sameSite: "none",       // allow cross-origin cookies
      httpOnly: true,         // protect against XSS
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", basicRoutes);
app.use("/api/repairer", repairerRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Furious Repair API is running!" });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Server start
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
