import { Product } from './product';

export interface SearchConfig {
    categories: string[];
    minRating: number;
    minDiscount: number;
    maxResults?: number;
    sortBy?: 'price' | 'rating' | 'discount' | 'popular';
    sortOrder?: 'asc' | 'desc';
    filters?: {
        minPrice?: number;
        maxPrice?: number;
        brands?: string[];
        inStock?: boolean;
    };
}

export interface SearchTask {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    results: Product[];
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface SearchResponse {
    taskId: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    results?: Product[];
    error?: string;
} 