import { Product } from './product';

export interface SearchResult {
  products: Product[];
  totalFound: number;
  hasMore: boolean;
} 