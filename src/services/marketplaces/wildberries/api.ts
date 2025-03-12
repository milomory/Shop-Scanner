import axios from 'axios';
import { WB_API_CONFIG, WB_CATEGORIES } from '../../../config/marketplaces/wildberries';
import { Product } from '../../../types/product';
import { SearchConfig } from '../../../types/search';
import { SearchResult, CategoryInfo } from '../../../types/common';

export class WildberriesMarketplace {
    private async searchProducts(categoryInfo: CategoryInfo, config: SearchConfig): Promise<SearchResult> {
        try {
            const { minRating, minDiscount, filters } = config;
            const { minPrice, maxPrice } = filters || {};

            console.log('======= ЗАПУСК ПОИСКА WILDBERRIES =======');
            console.log('Категория:', categoryInfo);
            console.log('Конфигурация поиска:', config);

            const params: any = {
                ...WB_API_CONFIG.defaultParams,
                query: categoryInfo.name,
            };

            if (categoryInfo.subject) {
                params.subject = categoryInfo.subject;
                console.log('Используем subject для категории:', categoryInfo.subject);
            }

            if (minPrice) {
                params.priceU = minPrice * 100;
            }
            
            if (maxPrice) {
                params.priceU = `${params.priceU || 0};${maxPrice * 100}`;
            }

            const url = `${WB_API_CONFIG.baseUrl}`;
            console.log(`Запрос к Wildberries API: ${url} с параметрами:`, JSON.stringify(params));
            
            const queryParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                queryParams.append(key, String(value));
            });
            const fullUrl = `${url}?${queryParams.toString()}`;
            console.log(`Полный URL запроса: ${fullUrl}`);

            console.log('Отправляем запрос к API Wildberries...');
            const response = await axios.get(url, {
                params,
                headers: WB_API_CONFIG.headers
            });

            console.log('Статус ответа:', response.status);
            console.log('Заголовки ответа:', JSON.stringify(response.headers));

            if (response.status !== 200) {
                console.error('Ошибка при запросе к Wildberries API:', response.status, response.statusText);
                return { products: [], totalFound: 0, hasMore: false };
            }

            const data = response.data;
            console.log('Получен ответ от Wildberries API. Тип данных:', typeof data);
            console.log('Структура ответа:', Object.keys(data));
            
            // Анализируем структуру ответа 
            console.log('Детальная структура ответа API:');
            if (data.metadata) console.log('data.metadata:', Object.keys(data.metadata));
            if (data.data) console.log('data.data:', Object.keys(data.data));
            if (data.products) console.log('data.products:', typeof data.products, Array.isArray(data.products) ? data.products.length : 'not an array');
            
            // Получаем массив продуктов из новой структуры ответа
            let products = [];
            
            // Вариант 1: Старая структура data.data.products
            if (data.data && data.data.products) {
                console.log('Используем структуру data.data.products');
                products = data.data.products;
            } 
            // Вариант 2: Прямой массив в data.products
            else if (data.products && Array.isArray(data.products)) {
                console.log('Используем структуру data.products');
                products = data.products;
            }
            // Вариант 3: Новая структура в metadata
            else if (data.metadata && data.metadata.catalog_type) {
                console.log('Анализируем новую структуру с metadata');
                if (data.data) {
                    console.log('Пробуем извлечь массив продуктов из структуры с metadata');
                    products = Array.isArray(data.data) ? data.data : [];
                }
            }
            // Вариант 4: Новый формат в products
            else {
                // Пытаемся найти массив объектов где-то в json объекте
                console.log('Пытаемся найти массив продуктов в ответе');
                for (const key in data) {
                    if (Array.isArray(data[key]) && data[key].length > 0 && typeof data[key][0] === 'object') {
                        console.log(`Найден массив объектов в ключе ${key}, длина:`, data[key].length);
                        products = data[key];
                        break;
                    }
                }
            }

            if (!products || products.length === 0) {
                console.log('Товары не найдены в ответе API. Дамп ответа:', 
                    JSON.stringify(data).substring(0, 500) + '...');
                return { products: [], totalFound: 0, hasMore: false };
            }

            console.log('Всего найдено товаров перед фильтрацией:', products.length);
            console.log('Пример первого продукта:', JSON.stringify(products[0]).substring(0, 500));

            const filteredProducts = products
                .filter((product: any) => {
                    // Проверка структуры продукта для адаптации к новому формату
                    if (!product) return false;
                    
                    let rating = 0;
                    if (product.rating) rating = parseFloat(product.rating);
                    else if (product.reviewRating) rating = parseFloat(product.reviewRating);
                    else console.log(`Товар без рейтинга:`, product.id);
                    
                    let discount = 0;
                    if (product.sale) discount = product.sale;
                    else if (product.discount) discount = product.discount;
                    else if (product.priceU && product.salePriceU) {
                        discount = Math.round(((product.priceU - product.salePriceU) / product.priceU) * 100);
                    }
                    else console.log(`Товар без скидки:`, product.id);
                    
                    const passesRating = !minRating || rating >= minRating;
                    const passesDiscount = !minDiscount || discount >= minDiscount;
                    
                    if (!passesRating) {
                        console.log(`Товар ${product.id} не прошел по рейтингу: ${rating} < ${minRating}`);
                    }
                    
                    if (!passesDiscount) {
                        console.log(`Товар ${product.id} не прошел по скидке: ${discount}% < ${minDiscount}%`);
                    }
                    
                    return passesRating && passesDiscount;
                })
                .map((product: any) => this.parseProduct(product, categoryInfo.name));

            console.log('Отфильтровано товаров:', filteredProducts.length);
            
            if (filteredProducts.length > 0) {
                console.log('Пример товара после фильтрации:', JSON.stringify(filteredProducts[0]));
            } else {
                console.log('После фильтрации товаров не осталось');
            }

            return {
                products: filteredProducts,
                totalFound: data.total || filteredProducts.length,
                hasMore: filteredProducts.length < (data.total || 0)
            };
        } catch (error) {
            console.error('Ошибка при поиске продуктов в Wildberries:', error);
            if (axios.isAxiosError(error)) {
                console.error('Детали ошибки Axios:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    config: {
                        url: error.config?.url,
                        method: error.config?.method,
                        params: error.config?.params,
                        headers: error.config?.headers
                    }
                });
            }
            return { products: [], totalFound: 0, hasMore: false };
        }
    }

    private calculateDiscount(originalPrice: number, salePrice: number): number {
        if (!originalPrice || !salePrice) return 0;
        return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
    }

    private getImageUrl(productId: string | number): string {
        const id = productId.toString();
        const part1 = id.substring(0, 4);
        const part2 = id.substring(4, 6);
        return `https://images.wbstatic.net/c246x328/new/${part1}0000/${id}-1.jpg`;
    }

    private getProductUrl(productId: string | number, name: string): string {
        const nameSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        return `https://www.wildberries.ru/catalog/${productId}/detail.aspx?targetUrl=GP`;
    }

    async searchProductsByCategory(categoryId: string, config: SearchConfig): Promise<Product[]> {
        console.log(`Поиск товаров для категории ID: ${categoryId} с параметрами:`, config);
        
        const category = Object.values(WB_CATEGORIES).find(cat => cat.id.toString() === categoryId);
        if (!category) {
            console.error(`Категория не найдена: ${categoryId}`);
            return [];
        }

        const categoryInfo = { 
            id: category.id, 
            name: category.name,
            subject: category.subject 
        };
        
        try {
            const result = await this.searchProducts(categoryInfo, config);
            console.log(`Для категории ${category.name} найдено ${result.products.length} товаров`);
            
            // Преобразуем результаты к нужному формату
            return result.products.map(product => {
                // Для совместимости с разными форматами данных
                const commonProduct = product as any;
                
                return {
                    id: commonProduct.id || '',
                    title: commonProduct.title || commonProduct.name || '',
                    brand: commonProduct.brand || '',
                    category: category.name,
                    price: commonProduct.price || commonProduct.currentPrice || 0,
                    originalPrice: commonProduct.originalPrice || 0,
                    discount: commonProduct.discount || commonProduct.discountPercent || 0,
                    rating: commonProduct.rating || 0,
                    imageUrl: commonProduct.imageUrl || '',
                    productUrl: commonProduct.productUrl || commonProduct.url || ''
                } as Product;
            });
        } catch (error) {
            console.error(`Ошибка при поиске товаров для категории ${category.name}:`, error);
            return [];
        }
    }

    async getProductsByCategory(categoryId: string): Promise<SearchResult> {
        const category = Object.values(WB_CATEGORIES).find(cat => cat.id.toString() === categoryId);
        if (!category) {
            throw new Error(`Категория не найдена: ${categoryId}`);
        }

        try {
            const params: any = {
                ...WB_API_CONFIG.defaultParams,
                query: category.name,
                page: 1
            };
            
            if (category.subject) {
                params.subject = category.subject;
            }
            
            console.log(`Запрос к Wildberries API для категории ${category.name}:`, JSON.stringify(params));
            
            const response = await axios.get(WB_API_CONFIG.baseUrl, {
                params,
                headers: WB_API_CONFIG.headers
            });

            console.log(`Запрос для категории ${category.name}:`, WB_API_CONFIG.baseUrl);
            
            if (!response.data || !response.data.data || !response.data.data.products) {
                console.warn(`Товары не найдены для категории ${category.name}`);
                console.log('Ответ API:', JSON.stringify(response.data, null, 2));
                return { products: [], totalFound: 0, hasMore: false };
            }

            const products = response.data.data.products || [];

            const commonProducts = products.map((item: any) => ({
                id: item.id.toString(),
                marketplace: 'Wildberries',
                name: item.name,
                brand: item.brand,
                category: category.name,
                currentPrice: item.salePriceU / 100,
                originalPrice: item.priceU / 100,
                discount: this.calculateDiscount(item.priceU, item.salePriceU),
                rating: parseFloat(item.rating) || 0,
                imageUrl: this.getImageUrl(item.id),
                productUrl: this.getProductUrl(item.id, item.name)
            }));

            return {
                products: commonProducts,
                totalFound: products.length,
                hasMore: products.length > 0
            };
        } catch (error) {
            console.error('Ошибка при получении товаров по категории:', error);
            return { products: [], totalFound: 0, hasMore: false };
        }
    }

    private parseProduct(product: any, category: string): Product {
        try {
            console.log('Парсинг продукта:', product.id || product.nm || 'unknown');
            
            // Определяем основные поля, адаптируясь к различным структурам ответа API
            const id = product.id || product.nm || product.productId || '';
            const name = product.name || product.brand || '';
            const brand = product.brand || '';
            let title = '';
            
            // Формируем название товара в зависимости от доступных данных
            if (product.name) {
                title = product.name;
            } else if (product.brand && product.goods) {
                title = `${product.brand} ${product.goods}`;
            } else {
                title = id; // Как минимум ID должен быть
            }
            
            // Определяем URL изображения
            let imageUrl = '';
            if (product.image) {
                imageUrl = product.image;
            } else if (product.img || product.pics) {
                imageUrl = this.getImageUrl(id);
            }
            
            // Определяем цены и скидку
            let originalPrice = 0;
            let discountedPrice = 0;
            let discount = 0;
            
            if (product.priceU && product.priceU > 0) {
                originalPrice = product.priceU / 100;
            } else if (product.price) {
                originalPrice = parseFloat(product.price);
            }
            
            if (product.salePriceU && product.salePriceU > 0) {
                discountedPrice = product.salePriceU / 100;
            } else if (product.salePrice) {
                discountedPrice = parseFloat(product.salePrice);
            } else {
                discountedPrice = originalPrice;
            }
            
            // Вычисляем скидку если есть данные
            if (product.sale || product.discount) {
                discount = product.sale || product.discount;
            } else if (originalPrice > 0 && discountedPrice > 0 && originalPrice > discountedPrice) {
                discount = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
            }
            
            // Определяем рейтинг
            let rating = 0;
            if (product.rating && !isNaN(parseFloat(product.rating))) {
                rating = parseFloat(product.rating);
            } else if (product.reviewRating && !isNaN(parseFloat(product.reviewRating))) {
                rating = parseFloat(product.reviewRating);
            }
            
            // Формируем ссылку на продукт
            const productUrl = `${WB_API_CONFIG.productBaseUrl}/${id}/detail.aspx`;
            
            console.log(`Успешно распарсили товар: ${title} (ID: ${id})`);
            
            return {
                id,
                title,
                price: discountedPrice || originalPrice,
                originalPrice: originalPrice || discountedPrice,
                discountPercent: discount,
                imageUrl,
                productUrl,
                rating,
                marketplace: 'wildberries',
                category
            };
        } catch (error) {
            console.error('Ошибка при парсинге продукта:', error);
            return {
                id: product.id || 'unknown',
                title: product.name || 'Unknown Product',
                price: 0,
                originalPrice: 0,
                discountPercent: 0,
                imageUrl: '',
                productUrl: '',
                rating: 0,
                marketplace: 'wildberries',
                category
            };
        }
    }
}