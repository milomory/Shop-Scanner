export interface WildberriesProduct {
    id: number;
    root: number;
    kindId: number;
    name: string;
    brand: string;
    brandId: number;
    siteBrandId: number;
    sale: number;
    salePriceU: number;     // Цена со скидкой в копейках
    priceU: number;         // Оригинальная цена в копейках
    pics: number;
    rating: number;
    feedbacks: number;
    colors: string[];
}

export interface WildberriesSearchResponse {
    state: number;
    version: number;
    params?: {
        version: number;
        curr: string;
        spp: number;
        dest: number;
    };
    data: {
        products: WildberriesProduct[];
        total: number;
    };
    error?: string;
}

export interface WildberriesCategory {
    id: number;
    subject: string;
} 