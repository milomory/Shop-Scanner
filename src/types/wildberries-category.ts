export interface WildberriesCategory {
    id: string;
    name: string;
    url: string;
    shard: string;
    query: string;
    childrenCount?: number;
    children?: WildberriesCategory[];
}

export interface WildberriesCategoryResponse {
    data: {
        catalog: {
            categories: WildberriesCategory[];
        };
    };
}

// Интерфейс для хранения категорий в кэше
export interface CategoryCache {
    lastUpdate: number;
    categories: WildberriesCategory[];
    version: string;
} 