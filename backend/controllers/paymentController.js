const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const BatchEnrollment = require('../models/BatchEnrollment');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
        return res.status(400).json({ success: false, message: 'Course ID is required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const amount = course.price;

    const options = {
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ success: false, message: 'Some error occured' });
    }

    res.json({
      success: true,
      data: order,
      key_id: process.env.RAZORPAY_KEY_ID 
    });
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payment/verify-payment
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

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Payment Successful
      
      // 1. Save Payment to DB
      await Payment.create({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount: 8000, 
        user: req.user.id,
        course: courseId,
        status: 'success'
      });

      // 2. Enroll User in Course 
      // Find the latest active batch for this course
      let batch = await Batch.findOne({ course: courseId }).sort('-createdAt');
      
      if (!batch) {
          // If no batch exists, create a default "Self Paced" batch (Critical fallback)
           const course = await Course.findById(courseId);
           batch = await Batch.create({
               title: `${course.title} - Self Paced`,
               course: courseId,
               trainer: course.trainer, // Assign to course trainer
               startDate: new Date(),
               students: []
           });
      }

      // Check if already enrolled
      const existingEnrollment = await BatchEnrollment.findOne({ student: req.user.id, batch: batch._id });
      
      if (!existingEnrollment) {
          await BatchEnrollment.create({
              student: req.user.id,
              batch: batch._id,
              course: courseId,
              enrollmentStatus: 'active',
              paymentStatus: 'paid',
              paymentAmount: 8000 // Ideally fetch from course price
          });
          
          // Add student to batch.enrolledStudents array
          batch.enrolledStudents.push(req.user.id);
          const savedBatch = await batch.save();
          console.log("Enrolled user in batch:", savedBatch.title);
      }

      res.json({
        success: true,
        message: 'Payment verified and Enrolled successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }
  } catch (error) {
     console.error("Razorpay Verify Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
