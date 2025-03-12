export interface Product {
  id: string;
  title: string;
  brand?: string;
  category?: string;
  price: number;
  originalPrice: number;
  discount?: number;
  discountPercent?: number;
  rating: number;
  imageUrl: string;
  url?: string;
  productUrl?: string;
  marketplace?: string;
} 