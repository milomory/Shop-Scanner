import { CommonProduct, SearchResult, CategoryInfo } from '../types/common';
import { SearchConfig } from '../config/search';
import { Product } from '../types/product';

export interface IMarketplace {
    name: string;
    
    // Методы поиска и получения товаров
    searchProducts(config: SearchConfig): Promise<Product[]>;
    getProductsByCategory(categoryId: string, page: number): Promise<SearchResult>;
    
    // Методы для работы с данными
    parseProduct(rawData: any): CommonProduct;
    calculateDiscount(originalPrice: number, currentPrice: number): number;
    getProductUrl(productId: string | number): string;
    
    // Вспомогательные методы
    getCategories(): CategoryInfo[];
    formatPrice(price: number): string;
} 