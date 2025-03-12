export interface CommonProduct {
    id: string;
    marketplace: string;
    name: string;
    brand: string;
    category: string;
    currentPrice: number;
    originalPrice: number;
    discount: number;
    rating: number;
    imageUrl: string;
    productUrl: string;
    query?: string;
}

export interface SearchResult {
    products: CommonProduct[];
    totalFound: number;
    hasMore: boolean;
}

export interface PriceInfo {
    current: number;
    original: number;
}

export interface CategoryInfo {
    id: number | string;
    name: string;
    subject?: string;
} 