import mongoose from 'mongoose';
import { SearchResult, ISearchResult } from '../models/search-result.model';
import { SearchConfig } from '../types/search';
import { Product } from '../types/product';

export class DatabaseService {
    private static instance: DatabaseService;
    private isConnected: boolean = false;

    private constructor() {}

    static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    async connect(): Promise<void> {
        if (this.isConnected) return;

        try {
            const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/shop_scanner';
            await mongoose.connect(mongoUrl);
            this.isConnected = true;
            console.log('Successfully connected to MongoDB.');
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
            throw error;
        }
    }

    async saveSearchResults(taskId: string, config: SearchConfig, results: Product[]): Promise<void> {
        await this.connect();

        const searchResult: Partial<ISearchResult> = {
            taskId,
            query: {
                categories: config.categories,
                minRating: config.minRating,
                minDiscount: config.minDiscount,
                filters: config.filters
            },
            results
        };

        await SearchResult.findOneAndUpdate(
            { taskId },
            searchResult,
            { upsert: true, new: true }
        );
    }

    async getSearchResults(taskId: string): Promise<ISearchResult | null> {
        await this.connect();
        return SearchResult.findOne({ taskId });
    }

    async deleteSearchResults(taskId: string): Promise<void> {
        await this.connect();
        await SearchResult.deleteOne({ taskId });
    }

    async cleanup(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
        await this.connect();
        const cutoffDate = new Date(Date.now() - maxAgeMs);
        await SearchResult.deleteMany({ createdAt: { $lt: cutoffDate } });
    }
} 