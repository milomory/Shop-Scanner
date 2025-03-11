import axios from 'axios';
import { IMarketplace } from '../../../interfaces/marketplace';
import { CommonProduct, SearchResult, CategoryInfo } from '../../../types/common';
import { WildberriesProduct } from '../../../types/wildberries';
import { WB_CATEGORIES, WB_API_CONFIG } from '../../../config/marketplaces/wildberries';
import { delay, getRandomDelay, withRetry } from '../../../utils/helpers/network';
import { formatPrice } from '../../../utils/helpers/price';
import { Product } from '../../../types/product';
import { SearchConfig } from '../../../config/search';

export class WildberriesMarketplace implements IMarketplace {
    name = 'Wildberries';

    async searchProducts(config: SearchConfig): Promise<Product[]> {
        const allProducts: Product[] = [];

        for (const query of config.categories) {
            console.log(`\nПоиск товаров по запросу "${query}"...`);
            console.log('Отправляем запрос к API Wildberries для поиска "' + query + '"...');
            console.log('URL:', `${WB_API_CONFIG.baseUrl}/exactmatch/ru/common/v4/search`);

            const requestDelay = await getRandomDelay(10000, 20000);
            console.log(`Ждем ${Math.round(requestDelay / 1000)} секунд перед запросом...`);
            await new Promise(resolve => setTimeout(resolve, requestDelay));

            const params = {
                appType: 1,
                curr: 'rub',
                dest: -1257786,
                page: 1,
                query: query,
                resultset: 'catalog',
                sort: 'popular',
                spp: 0,
                suppressSpellcheck: false,
                regions: '80,38,83,4,64,33,68,70,30,40,86,75,69,1,31,66,110,48,22,71,114',
                locale: 'ru',
                lang: 'ru',
                priceU: true,
                discount: true
            };

            console.log('Параметры запроса:', params);

            try {
                const response = await axios.get(`${WB_API_CONFIG.baseUrl}/exactmatch/ru/common/v4/search`, { params });
                const products = response.data.data.products || [];
                
                const filteredProducts = products
                    .filter((product: WildberriesProduct) => 
                        product.rating >= config.minRating && 
                        ((product.priceU - product.salePriceU) / product.priceU * 100) >= config.minDiscount
                    )
                    .map((product: WildberriesProduct): Product => ({
                        name: product.name,
                        brand: product.brand,
                        category: query,
                        currentPrice: Math.round(product.salePriceU / 100),
                        originalPrice: Math.round(product.priceU / 100),
                        discount: Math.round((product.priceU - product.salePriceU) / product.priceU * 100),
                        rating: product.rating,
                        url: `https://www.wildberries.ru/catalog/${product.id}/detail.aspx`
                    }));

                console.log(`Найдено ${filteredProducts.length} товаров для запроса "${query}"`);
                allProducts.push(...filteredProducts);

                console.log('Ждем 5 секунд перед следующим запросом...\n');
                await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.error('Ошибка при запросе к API:', {
                        status: error.response?.status,
                        data: error.response?.data
                    });
                } else {
                    console.error('Неизвестная ошибка:', error);
                }
            }
        }

        return allProducts;
    }

    async getProductsByCategory(categoryId: string, page: number = 1): Promise<SearchResult> {
        const category = Object.values(WB_CATEGORIES).find(cat => cat.id.toString() === categoryId);
        if (!category || !category.subject) {
            throw new Error(`Category not found: ${categoryId}`);
        }

        const url = `${WB_API_CONFIG.baseUrl}/catalog/${category.subject}/catalog`;
        
        try {
            const response = await withRetry(async () => {
                return await axios.get(url, {
                    params: {
                        ...WB_API_CONFIG.defaultParams,
                        cat: categoryId,
                        xsubject: categoryId,
                        page
                    },
                    headers: WB_API_CONFIG.headers
                });
            });

            const products = response.data?.data?.products || [];
            const commonProducts = products.map((product: WildberriesProduct) => this.parseProduct(product));

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

    parseProduct(product: WildberriesProduct, query?: string): CommonProduct {
        const currentPrice = product.salePriceU / 100;
        const originalPrice = product.priceU / 100;
        
        return {
            id: product.id.toString(),
            marketplace: this.name,
            name: product.name,
            brand: product.brand,
            category: query || '',
            currentPrice,
            originalPrice,
            discount: this.calculateDiscount(originalPrice, currentPrice),
            url: this.getProductUrl(product.id)
        };
    }

    calculateDiscount(originalPrice: number, currentPrice: number): number {
        return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }

    getProductUrl(productId: string | number): string {
        return `https://www.wildberries.ru/catalog/${productId}/detail.aspx`;
    }

    getCategories(): CategoryInfo[] {
        return Object.values(WB_CATEGORIES);
    }

    formatPrice(price: number): string {
        return formatPrice(price);
    }
} 