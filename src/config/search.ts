export interface SearchConfig {
  categories: string[];
  minRating: number;
  minDiscount: number;
  maxResults?: number;
  sortBy?: 'popular' | 'price' | 'rating' | 'discount';
  sortOrder?: 'asc' | 'desc';
}

export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  categories: [],
  minRating: 4.0,
  minDiscount: 50,
  maxResults: 100,
  sortBy: 'popular',
  sortOrder: 'desc'
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