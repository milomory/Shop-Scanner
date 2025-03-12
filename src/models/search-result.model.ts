import mongoose, { Schema, Document } from 'mongoose';
import { Product } from '../types/product';

export interface ISearchResult extends Document {
    taskId: string;
    query: {
        categories: string[];
        minRating: number;
        minDiscount: number;
        filters?: {
            minPrice?: number;
            maxPrice?: number;
            brands?: string[];
            inStock?: boolean;
        };
    };
    results: Product[];
    createdAt: Date;
    updatedAt: Date;
}

const SearchResultSchema = new Schema({
    taskId: { type: String, required: true, unique: true },
    query: {
        categories: [{ type: String, required: true }],
        minRating: { type: Number, required: true },
        minDiscount: { type: Number, required: true },
        filters: {
            minPrice: Number,
            maxPrice: Number,
            brands: [String],
            inStock: Boolean
        }
    },
    results: [{
        id: String,
        title: String,
        brand: String,
        category: String,
        price: Number,
        originalPrice: Number,
        discount: Number,
        rating: Number,
        imageUrl: String,
        productUrl: String
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

SearchResultSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 }); // Автоматическое удаление через 24 часа

export const SearchResult = mongoose.model<ISearchResult>('SearchResult', SearchResultSchema); 