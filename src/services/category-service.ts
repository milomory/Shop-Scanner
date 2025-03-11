import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import { WildberriesCategory, WildberriesCategoryResponse, CategoryCache } from '../types/wildberries-category';

export class CategoryService {
    private static readonly CACHE_FILE = 'wb-categories-cache.json';
    private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа
    private static readonly API_URL = 'https://www.wildberries.ru/webapi/menu/main-menu-ru-ru.json';

    private categories: WildberriesCategory[] = [];
    private lastUpdate: number = 0;

    constructor(private cacheDir: string = 'cache') {
        this.ensureCacheDir();
    }

    private get cacheFilePath(): string {
        return path.join(this.cacheDir, CategoryService.CACHE_FILE);
    }

    private async ensureCacheDir(): Promise<void> {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
        } catch (error) {
            console.error('Ошибка при создании директории кэша:', error);
        }
    }

    async loadCategories(forceUpdate: boolean = false): Promise<WildberriesCategory[]> {
        if (!forceUpdate) {
            // Пробуем загрузить из кэша
            const cachedCategories = await this.loadFromCache();
            if (cachedCategories) {
                this.categories = cachedCategories;
                return this.categories;
            }
        }

        // Если кэш недоступен или требуется принудительное обновление
        try {
            const response = await axios.get<WildberriesCategoryResponse>(CategoryService.API_URL);
            this.categories = response.data.data.catalog.categories;
            this.lastUpdate = Date.now();
            
            // Сохраняем в кэш
            await this.saveToCache();
            
            return this.categories;
        } catch (error) {
            console.error('Ошибка при загрузке категорий:', error);
            throw error;
        }
    }

    private async loadFromCache(): Promise<WildberriesCategory[] | null> {
        try {
            const cacheData = await fs.readFile(this.cacheFilePath, 'utf-8');
            const cache: CategoryCache = JSON.parse(cacheData);
            
            // Проверяем актуальность кэша
            if (Date.now() - cache.lastUpdate < CategoryService.CACHE_TTL) {
                return cache.categories;
            }
        } catch (error) {
            // Если файл не существует или произошла ошибка чтения, возвращаем null
            return null;
        }
        return null;
    }

    private async saveToCache(): Promise<void> {
        const cache: CategoryCache = {
            lastUpdate: this.lastUpdate,
            categories: this.categories,
            version: '1.0'
        };

        try {
            await fs.writeFile(
                this.cacheFilePath,
                JSON.stringify(cache, null, 2),
                'utf-8'
            );
        } catch (error) {
            console.error('Ошибка при сохранении кэша:', error);
        }
    }

    findCategoryByName(name: string): WildberriesCategory | null {
        const searchName = name.toLowerCase();
        return this.findCategoryByNameRecursive(this.categories, searchName);
    }

    private findCategoryByNameRecursive(
        categories: WildberriesCategory[],
        searchName: string
    ): WildberriesCategory | null {
        for (const category of categories) {
            if (category.name.toLowerCase() === searchName) {
                return category;
            }
            if (category.children) {
                const found = this.findCategoryByNameRecursive(category.children, searchName);
                if (found) return found;
            }
        }
        return null;
    }

    async updateCategories(): Promise<void> {
        await this.loadCategories(true);
    }

    getCategoryTree(): string {
        return this.formatCategoryTree(this.categories);
    }

    private formatCategoryTree(categories: WildberriesCategory[], level: number = 0): string {
        let result = '';
        const indent = '  '.repeat(level);

        for (const category of categories) {
            result += `${indent}- ${category.name} (ID: ${category.id})\n`;
            if (category.children && category.children.length > 0) {
                result += this.formatCategoryTree(category.children, level + 1);
            }
        }

        return result;
    }
} 