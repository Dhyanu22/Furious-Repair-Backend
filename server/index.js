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

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true,
  })
);

// Session configuration with MongoDB store
app.use(
  session({
    secret: process.env.SESSION_SECRET || "repair_secret", // use env var in production
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl:
        "mongodb+srv://dhyanu:Goodboy%402216@cluster0.dwmer2w.mongodb.net/Furious-Repair?retryWrites=true&w=majority&appName=Cluster0",
    }),
    cookie: {
      secure: false, // true if HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", basicRoutes);
app.use("/api/repairer", repairerRoutes);

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Furious Repair API is running!" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
