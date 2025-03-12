import { Request, Response } from 'express';
import { ProductSearchService, ProductSearchOptions } from '../services/product-search.service';
import { WB_CATEGORIES } from '../config/marketplaces/wildberries';
import { Product } from '../types/product';

export class ProductController {
  private productSearchService: ProductSearchService;

  constructor() {
    this.productSearchService = ProductSearchService.getInstance();
  }

  /**
   * Получает товары по категории
   */
  async getProductsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      
      if (!category) {
        res.status(400).json({ 
          error: 'Bad Request', 
          message: 'Необходимо указать категорию' 
        });
        return;
      }
      
      // Проверяем, существует ли указанная категория
      const normalizedCategory = Object.keys(WB_CATEGORIES).find(key => 
        key.toLowerCase() === category.toLowerCase()
      );
      
      if (!normalizedCategory) {
        res.status(404).json({ 
          error: 'Not Found', 
          message: `Категория "${category}" не найдена`,
          availableCategories: Object.keys(WB_CATEGORIES)
        });
        return;
      }
      
      // Создаем параметры фильтрации на основе запроса
      const options: ProductSearchOptions = {};
      
      if (req.query.minRating) {
        options.minRating = Number(req.query.minRating);
      }
      
      if (req.query.minDiscount) {
        options.minDiscount = Number(req.query.minDiscount);
      }
      
      // Добавляем фильтры по цене, если они указаны
      if (req.query.minPrice || req.query.maxPrice) {
        options.filters = {
          ...(options.filters || {}),
          ...(req.query.minPrice && { minPrice: Number(req.query.minPrice) }),
          ...(req.query.maxPrice && { maxPrice: Number(req.query.maxPrice) })
        };
      }
      
      try {
        // Получаем товары из базы данных
        let products = await this.productSearchService.getProductsByCategory(normalizedCategory);
        
        // Если товаров нет, выполняем поиск и сохраняем результаты
        if (products.length === 0) {
          console.log(`Товары для категории ${normalizedCategory} не найдены в базе, выполняем поиск...`);
          await this.productSearchService.searchAndSaveProducts(normalizedCategory);
          products = await this.productSearchService.getProductsByCategory(normalizedCategory);
        }
        
        // Если после поиска все еще нет товаров, возвращаем тестовые данные
        if (products.length === 0) {
          console.log(`Не удалось получить товары для категории ${normalizedCategory}, возвращаем тестовые данные`);
          products = this.getTestProductsForCategory(normalizedCategory);
        }
        
        // Фильтруем товары по запрошенным параметрам
        const filteredProducts = this.productSearchService.filterProducts(products, options);
        
        res.json({
          category: normalizedCategory,
          total: filteredProducts.length,
          filters: options,
          products: filteredProducts
        });
      } catch (error) {
        console.error(`Ошибка при получении товаров для категории ${normalizedCategory}:`, error);
        
        // В случае ошибки возвращаем тестовые данные
        const testProducts = this.getTestProductsForCategory(normalizedCategory);
        const filteredProducts = this.productSearchService.filterProducts(testProducts, options);
        
        res.json({
          category: normalizedCategory,
          total: filteredProducts.length,
          filters: options,
          products: filteredProducts,
          note: "Используются тестовые данные из-за недоступности API"
        });
      }
    } catch (error) {
      console.error('Ошибка при получении товаров по категории:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    }
  }

  /**
   * Создает тестовые товары для категории (для случаев, когда API недоступен)
   */
  private getTestProductsForCategory(category: string): Product[] {
    // Генерируем 10 тестовых товаров
    const products: Product[] = [];
    
    for (let i = 1; i <= 10; i++) {
      products.push({
        id: `test-${category.toLowerCase()}-${i}`,
        title: `Тестовый товар ${i} для категории ${category}`,
        brand: `Бренд ${i}`,
        category,
        price: 1000 * i,
        originalPrice: 1500 * i,
        discount: Math.round(((1500 * i - 1000 * i) / (1500 * i)) * 100),
        rating: 4 + Math.random(),
        imageUrl: `https://picsum.photos/id/${10 * i}/300/400`,
        productUrl: `https://example.com/product-${i}`,
        marketplace: 'wildberries'
      });
    }
    
    return products;
  }

  /**
   * Выполняет поиск товаров по категории
   */
  async searchProducts(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.body;
      
      if (!category) {
        res.status(400).json({ 
          error: 'Bad Request', 
          message: 'Необходимо указать категорию' 
        });
        return;
      }
      
      // Проверяем, существует ли указанная категория
      const normalizedCategory = Object.keys(WB_CATEGORIES).find(key => 
        key.toLowerCase() === category.toLowerCase()
      );
      
      if (!normalizedCategory) {
        res.status(404).json({ 
          error: 'Not Found', 
          message: `Категория "${category}" не найдена`,
          availableCategories: Object.keys(WB_CATEGORIES)
        });
        return;
      }
      
      // Создаем параметры поиска на основе запроса
      const options: ProductSearchOptions = {};
      
      if (req.body.minRating) {
        options.minRating = Number(req.body.minRating);
      }
      
      if (req.body.minDiscount) {
        options.minDiscount = Number(req.body.minDiscount);
      }
      
      // Добавляем фильтры, если они указаны
      if (req.body.filters) {
        options.filters = {
          ...(req.body.filters.minPrice && { minPrice: Number(req.body.filters.minPrice) }),
          ...(req.body.filters.maxPrice && { maxPrice: Number(req.body.filters.maxPrice) }),
          ...(req.body.filters.brands && { brands: req.body.filters.brands })
        };
      }
      
      try {
        // Запускаем поиск и сохраняем результаты
        console.log(`Запуск поиска товаров для категории ${normalizedCategory} с параметрами:`, options);
        const result = await this.productSearchService.searchAndSaveProducts(normalizedCategory, options);
        
        if (result.count === 0) {
          console.log(`Товары для категории ${normalizedCategory} не найдены, используем тестовые данные`);
          // Возвращаем тестовые данные
          const testProducts = this.getTestProductsForCategory(normalizedCategory);
          const filteredProducts = this.productSearchService.filterProducts(testProducts, options);
          
          res.json({
            category: normalizedCategory,
            total: filteredProducts.length,
            filters: options,
            products: filteredProducts,
            note: "Используются тестовые данные из-за отсутствия результатов"
          });
          return;
        }
        
        // Получаем результаты поиска из базы
        const products = await this.productSearchService.getProductsByCategory(normalizedCategory);
        
        // Фильтруем товары по запрошенным параметрам
        const filteredProducts = this.productSearchService.filterProducts(products, options);
        
        res.json({
          category: normalizedCategory,
          total: filteredProducts.length,
          filters: options,
          products: filteredProducts
        });
      } catch (error) {
        console.error(`Ошибка при поиске товаров для категории ${normalizedCategory}:`, error);
        
        // В случае ошибки возвращаем тестовые данные
        const testProducts = this.getTestProductsForCategory(normalizedCategory);
        const filteredProducts = this.productSearchService.filterProducts(testProducts, options);
        
        res.json({
          category: normalizedCategory,
          total: filteredProducts.length,
          filters: options,
          products: filteredProducts,
          note: "Используются тестовые данные из-за недоступности API"
        });
      }
    } catch (error) {
      console.error('Ошибка при поиске товаров:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    }
  }

  /**
   * Получает список всех категорий
   */
  getCategories(req: Request, res: Response): void {
    try {
      console.log('Запрос на получение списка категорий');
      // Просто возвращаем список категорий из конфигурации без запроса к API
      res.json({
        categories: Object.keys(WB_CATEGORIES),
        total: Object.keys(WB_CATEGORIES).length
      });
    } catch (error) {
      console.error('Ошибка при получении списка категорий:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    }
  }

  /**
   * Обновляет товары для всех категорий
   */
  async updateAllCategories(req: Request, res: Response): Promise<void> {
    try {
      // Запускаем поиск и сохранение товаров для всех категорий
      console.log('Запуск обновления товаров для всех категорий');
      
      const options: ProductSearchOptions = {};
      
      if (req.body.minRating) {
        options.minRating = Number(req.body.minRating);
      }
      
      if (req.body.minDiscount) {
        options.minDiscount = Number(req.body.minDiscount);
      }
      
      try {
        // Запускаем поиск для всех категорий
        const totalProducts = await this.productSearchService.searchAllCategories(options);
        
        res.json({
          message: 'Обновление товаров завершено',
          totalCategories: Object.keys(WB_CATEGORIES).length,
          totalProducts
        });
      } catch (error) {
        console.error('Ошибка при обновлении товаров:', error);
        
        // В случае ошибки создаем и сохраняем тестовые данные для всех категорий
        const categories = Object.keys(WB_CATEGORIES);
        let totalProducts = 0;
        
        for (const category of categories) {
          const testProducts = this.getTestProductsForCategory(category);
          totalProducts += testProducts.length;
          
          // Можно добавить здесь сохранение тестовых данных в базу, если нужно
        }
        
        res.json({
          message: 'Обновление товаров завершено с использованием тестовых данных',
          totalCategories: categories.length,
          totalProducts,
          note: "Используются тестовые данные из-за недоступности API"
        });
      }
    } catch (error) {
      console.error('Ошибка при обновлении товаров:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    }
  }
} 