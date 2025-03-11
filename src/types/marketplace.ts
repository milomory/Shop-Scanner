import { SearchResult } from './search-result';

export interface IMarketplace {
  name: string;
  searchProducts(query: string, page?: number): Promise<SearchResult>;
} 