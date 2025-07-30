// middleware/auth.js
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  } else {
    return res.status(401).json({
      message: "Authentication required",
      redirect: "/login",
    });
  }
};

const requireGuest = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.status(403).json({
      message: "Already authenticated",
      redirect: "/dashboard",
    });
  } else {
    return next();
  }
};

// Check if user is admin (example for future use)
const requireAdmin = (req, res, next) => {
  if (req.session && req.session.userId && req.session.user.role === "admin") {
    return next();
  } else {
    return res.status(403).json({
      message: "Admin access required",
    });
  }
};

module.exports = {
  requireAuth,
  requireGuest,
  requireAdmin,
};
