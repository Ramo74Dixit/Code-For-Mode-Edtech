const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    if (!req.body) req.body = {};
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, role: role || 'student' });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    if (!req.body) req.body = {};
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
exports.updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      headline: req.body.headline,
      skills: req.body.skills,
      socialLinks: req.body.socialLinks,
      phoneNumber: req.body.phoneNumber,
      location: req.body.location,
      bio: req.body.bio
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get public profile of a user (trainer)
// @route   GET /api/auth/:id/profile
exports.getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name email role profileImage headline bio skills socialLinks location createdAt');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Connect to Course model to find courses taught by this user
    // We need to require Course model inside here or at top if not circular
    const Course = require('../models/Course'); 
    const courses = await Course.find({ trainer: req.params.id, isPublished: true })
      .select('title thumbnail price level language description slug');

    res.json({
      success: true,
      data: {
        user,
        courses
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Google Login
// @route   POST /api/auth/google
exports.googleLogin = async (req, res) => {
    try {
        const { token, role } = req.body; // Get role from request
        const { OAuth2Client } = require('google-auth-library');
        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const { name, email, picture, sub: googleId } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (user) {
            // User exists, just log them in (update googleId/image if needed)
            if (!user.googleId) {
                user.googleId = googleId;
                if (!user.profileImage) user.profileImage = picture;
                await user.save();
            }
        } else {
            // Create new user with selected role or default to student
            const crypto = require('crypto');
            const randomPassword = crypto.randomBytes(16).toString('hex');
            
            user = await User.create({
                name,
                email,
                googleId,
                profileImage: picture,
                role: role || 'student', 
                password: randomPassword 
            });
        }

        res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage,
                token: generateToken(user._id)
            }
        });

    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ success: false, message: error.message || 'Google authentication failed' });
    }
};