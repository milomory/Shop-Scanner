import express from 'express';
import cors from 'cors';
import { SearchController } from './controllers/search-controller';
import { ProductController } from './controllers/product-controller';
import { ProductSearchService } from './services/product-search.service';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Controllers
const searchController = new SearchController();
const productController = new ProductController();
const productSearchService = ProductSearchService.getInstance();

// Routes
app.post('/api/search', (req, res) => searchController.search(req, res));
app.get('/api/search/:taskId', (req, res) => searchController.getSearchStatus(req, res));

app.get('/api/categories', (req, res) => productController.getCategories(req, res));
app.get('/api/products/:category', (req, res) => productController.getProductsByCategory(req, res));
app.post('/api/products/search', (req, res) => productController.searchProducts(req, res));
app.post('/api/products/refresh', (req, res) => productController.updateAllCategories(req, res));

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// Функция для периодического обновления данных (раз в 12 часов)
const setupAutoRefresh = () => {
    const refreshInterval = 12 * 60 * 60 * 1000; // 12 часов
    
    console.log('Настройка автоматического обновления данных каждые 12 часов');
    
    // Функция обновления
    const refreshData = async () => {
        try {
            console.log(`[${new Date().toISOString()}] Запуск планового обновления данных...`);
            await productSearchService.searchAllCategories();
            console.log(`[${new Date().toISOString()}] Плановое обновление данных завершено`);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Ошибка при плановом обновлении данных:`, error);
        }
    };
    
    // Запускаем первое обновление через 10 секунд после старта сервера
    setTimeout(() => {
        console.log('Запуск первоначального обновления данных...');
        refreshData();
    }, 10000);
    
    // Устанавливаем интервал регулярного обновления
    setInterval(refreshData, refreshInterval);
};

// Start server
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
    console.log(`
Доступные эндпоинты:

Старые (для обратной совместимости):
- POST /api/search - Поиск товаров по категории и фильтрам
- GET /api/search/:taskId - Получение статуса задачи поиска

Новые прямые эндпоинты:
- GET /api/categories - Получение всех доступных категорий
- GET /api/products/:category - Получение товаров по категории
- POST /api/products/search - Запуск поиска товаров по категории
- POST /api/products/refresh - Принудительное обновление всех данных

Пример запроса поиска:
{
    "category": "Детские товары",
    "filters": {
        "minPrice": 1000,
        "maxPrice": 5000
    },
    "minRating": 4.5,
    "minDiscount": 30
}
    `);
    
    // Запускаем автоматическое обновление данных
    setupAutoRefresh();
}); 