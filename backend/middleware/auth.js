const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  console.log("AUTH HEADER =>", req.headers.authorization);
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 1. Agar token nahi hai, to yahin rok dein (return lagana zaruri hai)
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    // 2. Token verify karein
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. User DB se nikalein
    req.user = await User.findById(decoded.id).select('-password');
    console.log("DECODED =>", decoded);

    // 4. SAFETY CHECK: Agar token sahi hai par user DB se delete ho chuka hai
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found' });
    }
    return next(); 
  } catch (error) {
    console.error(error);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Yahan check karein ki req.user exist karta hai ya nahi (safety ke liye)
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found (Auth Error)' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};