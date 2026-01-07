const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  
  console.log("🛡️ [Auth Middleware] Request Hit:", req.originalUrl);
  console.log("🛡️ [Auth Middleware] Header:", req.headers.authorization);

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 1. Agar token nahi hai
  if (!token) {
    console.error("❌ [Auth Error] No Token Provided");
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    // 2. Token verify karein
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ [Auth Success] Decoded:", decoded);

    // 3. User DB se nikalein
    req.user = await User.findById(decoded.id).select('-password');

    // 4. SAFETY CHECK
    if (!req.user) {
        console.error("❌ [Auth Error] User Not Found in DB:", decoded.id);
        return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    console.log("👤 [Auth User] Authorized:", req.user.email);
    next(); 
  } catch (error) {
    console.error("❌ [Auth Failed] Token Verification Error:", error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed: ' + error.message });
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