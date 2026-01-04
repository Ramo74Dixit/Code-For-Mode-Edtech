const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('./models/Course');

dotenv.config();

const checkCourses = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    const courses = await Course.find({});
    console.log(`Found ${courses.length} courses:`);
    courses.forEach(c => {
        console.log(`- ${c.title} (ID: ${c._id}) | IsPublished: ${c.isPublished}`);
    });

    if (courses.length > 0) {
        // Automatically publish all for testing if none are published
        const unpublished = courses.filter(c => !c.isPublished);
        if (unpublished.length > 0) {
            console.log(`\nMarking ${unpublished.length} courses as published...`);
            await Course.updateMany({}, { isPublished: true });
            console.log('All courses marked as published.');
        }
    } else {
        // Create a dummy course if none exist
        console.log('\nNo courses found. Creating a dummy course...');
        await Course.create({
            title: "React Mastery",
            description: "Master React JS from scratch",
            price: 499,
            category: "Development",
            level: "Beginner",
            isPublished: true,
            trainer: new mongoose.Types.ObjectId(), // Random ID, might need valid user ID if strict, but acceptable for listing
            thumbnail: "https://via.placeholder.com/300"
        });
        console.log('Dummy course "React Mastery" created.');
    }

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkCourses();
