const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Batch = require('./models/Batch');

dotenv.config();

const repairData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    const batchId = '6958e33c009020c4620d9018'; // Swayam Batch
    const studentId = '695e1a8643937d4977003fd4'; // rado ji

    const batch = await Batch.findById(batchId);
    if (!batch) {
        console.log('Batch not found');
        process.exit(1);
    }

    if (!batch.enrolledStudents.includes(studentId)) {
        console.log(`Adding student ${studentId} to batch ${batch.name}...`);
        batch.enrolledStudents.push(studentId);
        await batch.save();
        console.log('Success! Data Repaired.');
    } else {
        console.log('Student already in batch.');
    }

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

repairData();
