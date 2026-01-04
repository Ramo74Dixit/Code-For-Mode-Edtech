const Razorpay = require('razorpay');
const crypto = require('crypto');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create Razorpay Order
// @route   POST /api/payments/create-order
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // MOCK ORDER FOR TESTING IF KEYS ARE DUMMY
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID.includes('dummy')) {
        return res.json({
            success: true,
            order: {
                id: `order_mock_${Date.now()}`,
                currency: 'INR',
                amount: course.price * 100,
                status: 'created'
            }
        });
    }

    const options = {
      amount: course.price * 100, // amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ success: false, message: 'Some error occured' });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Payment and Enroll
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseId
    } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    
    let isAuthentic = false;

    if (razorpay_order_id.startsWith('order_mock_')) {
        isAuthentic = true; 
    } else {
        const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

        isAuthentic = expectedSignature === razorpay_signature;
    }

    if (isAuthentic) {
      // Payment Successful - Proceed to Enroll
      
      const userId = req.user.id;
      
      // Check if already enrolled to avoid duplicates if verify is called multiple times
      const existingEnrollment = await Enrollment.findOne({
          student: userId,
          course: courseId
      });

      if(existingEnrollment) {
           return res.json({ success: true, message: 'Payment verified and already enrolled' });
      }

      const course = await Course.findById(courseId);

      const enrollment = await Enrollment.create({
        student: userId,
        course: courseId,
        paymentStatus: 'paid',
        paymentAmount: course.price,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      });

      course.studentsEnrolled += 1;
      await course.save();

      await User.findByIdAndUpdate(userId, { $addToSet: { enrolledCourses: courseId } });

      res.json({
        success: true,
        message: 'Payment verified and enrolled successfully',
        enrollmentId: enrollment._id
      });

    } else {
      res.status(400).json({ success: false, message: 'Invalid Signature' });
    }
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
