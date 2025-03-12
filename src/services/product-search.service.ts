import { WildberriesMarketplace } from './marketplaces/wildberries/api';
import { DatabaseService } from './database.service';
import { Product } from '../types/product';
import { WB_CATEGORIES } from '../config/marketplaces/wildberries';

export interface ProductSearchOptions {
  minRating?: number;
  minDiscount?: number;
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    brands?: string[];
  };
}

export class ProductSearchService {
  private static instance: ProductSearchService;
  private wildberriesApi: WildberriesMarketplace;
  private dbService: DatabaseService;
  
  private constructor() {
    this.wildberriesApi = new WildberriesMarketplace();
    this.dbService = DatabaseService.getInstance();
  }
  
  public static getInstance(): ProductSearchService {
    if (!ProductSearchService.instance) {
      ProductSearchService.instance = new ProductSearchService();
    }
    return ProductSearchService.instance;
  }
  
  /**
   * Ищет товары для указанной категории и сохраняет в базе данных
   */
  public async searchAndSaveProducts(
    category: string, 
    options: ProductSearchOptions = {}
  ): Promise<{ categoryName: string; count: number }> {
    console.log(`Запуск поиска товаров для категории: ${category}`);
    
    // Находим категорию в списке по имени
    const categoryInfo = Object.entries(WB_CATEGORIES).find(
      ([name, _]) => name.toLowerCase() === category.toLowerCase()
    );
    
    if (!categoryInfo) {
      console.error(`Категория не найдена: ${category}`);
      return { categoryName: category, count: 0 };
    }
    
    const [categoryName, categoryData] = categoryInfo;
    console.log(`Найдена категория: ${categoryName}, ID: ${categoryData.id}`);
    
    try {
      // Конвертируем параметры в формат, который ожидает API
      const searchConfig = {
        categories: [categoryName],
        minRating: options.minRating || 0,
        minDiscount: options.minDiscount || 0,
        filters: options.filters || {}
      };
      
      // Выполняем поиск товаров
      console.log(`Поиск товаров для категории ${categoryName} с параметрами:`, searchConfig);
      const products = await this.wildberriesApi.searchProductsByCategory(
        categoryData.id.toString(), 
        searchConfig
      );
      
      console.log(`Найдено ${products.length} товаров для категории ${categoryName}`);
      
      // Сохраняем в базе данных
      if (products.length > 0) {
        await this.saveProductsByCategory(categoryName, products);
        console.log(`Сохранено ${products.length} товаров для категории ${categoryName}`);
      }
      
      return { categoryName, count: products.length };
    } catch (error) {
      console.error(`Ошибка при поиске товаров для категории ${category}:`, error);
      return { categoryName: category, count: 0 };
    }
  }
  
  /**
   * Сохраняет товары в базе данных, группируя по категории
   */
  private async saveProductsByCategory(category: string, products: Product[]): Promise<void> {
    try {
      await this.dbService.connect();
      
      // Генерируем уникальный ID для категории
      const categoryId = `category-${category.toLowerCase().replace(/\s+/g, '-')}`;
      
      // Сохраняем результаты в базе данных
      await this.dbService.saveSearchResults(
        categoryId,
        {
          categories: [category],
          minRating: 0,
          minDiscount: 0
        },
        products
      );
    } catch (error) {
      console.error(`Ошибка при сохранении товаров для категории ${category}:`, error);
    }
  }
  
  /**
   * Получает товары из базы данных по категории
   */
  public async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      await this.dbService.connect();
      
      // Получаем результаты из базы данных по ID категории
      const categoryId = `category-${category.toLowerCase().replace(/\s+/g, '-')}`;
      const searchResult = await this.dbService.getSearchResults(categoryId);
      
      if (!searchResult) {
        console.log(`Результаты не найдены для категории ${category}`);
        return [];
      }
      
      console.log(`Найдено ${searchResult.results.length} товаров для категории ${category}`);
      return searchResult.results;
    } catch (error) {
      console.error(`Ошибка при получении товаров для категории ${category}:`, error);
      return [];
    }
  }
  
  /**
   * Выполняет поиск для всех доступных категорий
   */
  public async searchAllCategories(options: ProductSearchOptions = {}): Promise<number> {
    console.log('Запуск поиска товаров для всех категорий');
    
    const categories = Object.keys(WB_CATEGORIES);
    let totalProducts = 0;
    
    for (const category of categories) {
      const result = await this.searchAndSaveProducts(category, options);
      totalProducts += result.count;
    }
    
    console.log(`Всего найдено и сохранено ${totalProducts} товаров по всем категориям`);
    return totalProducts;
  }
  
  /**
   * Фильтрует товары по заданным критериям
   */
  public filterProducts(
    products: Product[], 
    options: ProductSearchOptions = {}
  ): Product[] {
    if (!products || products.length === 0) return [];
    
    console.log(`=== ФИЛЬТРАЦИЯ ТОВАРОВ ===`);
    console.log(`Исходное количество товаров: ${products.length}`);
    console.log(`Параметры фильтрации: ${JSON.stringify(options)}`);
    
    const filtered = products.filter(product => {
      // Проверка рейтинга
      if (options.minRating && product.rating < options.minRating) {
        console.log(`Товар ${product.id} (${product.title}) не прошел по рейтингу: ${product.rating} < ${options.minRating}`);
        return false;
      }
      
      // Проверка скидки (используем как discount, так и discountPercent)
      const productDiscount = product.discount || product.discountPercent || 0;
      if (options.minDiscount && productDiscount < options.minDiscount) {
        console.log(`Товар ${product.id} (${product.title}) не прошел по скидке: ${productDiscount}% < ${options.minDiscount}%`);
        return false;
      }
      
      // Проверка цены
      if (options.filters?.minPrice && product.price < options.filters.minPrice) {
        console.log(`Товар ${product.id} (${product.title}) не прошел по мин. цене: ${product.price} < ${options.filters.minPrice}`);
        return false;
      }
      
      if (options.filters?.maxPrice && product.price > options.filters.maxPrice) {
        console.log(`Товар ${product.id} (${product.title}) не прошел по макс. цене: ${product.price} > ${options.filters.maxPrice}`);
        return false;
      }
      
      // Проверка брендов
      if (
        options.filters?.brands && 
        options.filters.brands.length > 0 && 
        product.brand && // Проверяем, что бренд задан
        !options.filters.brands.includes(product.brand)
      ) {
        console.log(`Товар ${product.id} (${product.title}) не прошел по бренду: ${product.brand} не в списке ${options.filters.brands.join(', ')}`);
        return false;
      }
      
      return true;
    });
    
    console.log(`Осталось товаров после фильтрации: ${filtered.length}`);
    return filtered;
  }
} 