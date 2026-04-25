import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        // Use the encoded URI if your password has special characters
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1); // stop app if DB fails
    }
};