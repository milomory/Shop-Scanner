import { Product } from './product';

export interface SearchFilters {
    minPrice?: number;
    maxPrice?: number;
    brands?: string[];
    colors?: string[];
    sizes?: string[];
    sellers?: string[];
    inStock?: boolean;
}

export interface SortOptions {
    field: 'price' | 'rating' | 'discount' | 'popular';
    direction: 'asc' | 'desc';
}

export interface PaginationOptions {
    page: number;
    limit: number;
}

export interface SearchRequest {
    category: string;
    query?: string;
    filters?: SearchFilters;
    sort?: SortOptions;
    pagination?: PaginationOptions;
    minRating?: number;
    minDiscount?: number;
}

export interface SearchResponse {
    products: Product[];
    total: number;
    page: number;
    totalPages: number;
    category: string;
    appliedFilters: SearchFilters;
} 