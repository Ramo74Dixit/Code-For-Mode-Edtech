const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Course = require('./models/Course');
const Batch = require('./models/Batch');
const BatchEnrollment = require('./models/BatchEnrollment');

dotenv.config();

const debugData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    console.log('\n--- USERS (Last 3) ---');
    const users = await User.find().sort('-createdAt').limit(3);
    users.forEach(u => console.log(`${u.name} (${u.role}) - ${u._id}`));

    console.log('\n--- COURSES ---');
    const courses = await Course.find();
    courses.forEach(c => console.log(`${c.title} - ${c._id}`));

    console.log('\n--- BATCHES ---');
    const batches = await Batch.find();
    batches.forEach(b => {
        console.log(`[${b.status}] ${b.name} (Course: ${b.course}) - ${b._id}`);
        console.log(`   Students (count ${b.enrolledStudents.length}): ${b.enrolledStudents}`);
    });

    console.log('\n--- BATCH ENROLLMENTS ---');
    const enrollments = await BatchEnrollment.find();
    enrollments.forEach(e => {
        console.log(`Student: ${e.student} | Batch: ${e.batch} | Course: ${e.course} | Status: ${e.enrollmentStatus}`);
    });

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

debugData();
