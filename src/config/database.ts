import dotenv from 'dotenv';

dotenv.config();

export const DB_CONFIG = {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/shop_scanner',
    options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    }
}; 