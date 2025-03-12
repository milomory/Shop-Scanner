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

export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  categories: [],
  minRating: 4.0,
  minDiscount: 50,
  maxResults: 100,
  sortBy: 'popular',
  sortOrder: 'desc',
  filters: {}
};

// Популярные категории для поиска
export const AVAILABLE_CATEGORIES = [
  'куртка',
  'обувь женская',
  'сумка женская',
  'игрушки',
  'детская одежда',
  'кольца',
  'серьги',
  'цепочки',
  'браслеты',
  'часы',
  'телефоны',
  'ноутбуки',
  'планшеты'
]; 