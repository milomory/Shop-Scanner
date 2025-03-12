import { CategoryInfo } from '../../types/common';

export const WB_CATEGORIES: Record<string, CategoryInfo> = {
    'Одежда': { id: 1, name: 'Одежда', subject: 'clothes' },
    'Обувь': { id: 2, name: 'Обувь', subject: 'shoes' },
    'Детские товары': { id: 306, name: 'Детские товары', subject: 'children-goods' },
    'Спорт': { id: 784, name: 'Спорт', subject: 'sport' },
    'Красота': { id: 4, name: 'Красота', subject: 'beauty' },
    'Ювелирные изделия': { id: 6, name: 'Ювелирные изделия', subject: 'jewelry' }
};

export const WB_SEARCH_QUERIES = [
    'платье',
    'джинсы',
    'куртка',
    'обувь женская',
    'сумка женская'
];

export const WB_DISCOUNT_RANGES = [
    { min: 90, max: 100, label: '90-100%' },
    { min: 80, max: 90, label: '80-90%' },
    { min: 70, max: 80, label: '70-80%' }
];

export const WB_API_CONFIG = {
    baseUrl: 'https://search.wb.ru/exactmatch/ru/common/v4/search',
    productBaseUrl: 'https://www.wildberries.ru/catalog',
    imageBaseUrl: 'https://images.wbstatic.net/c246x328/new',
    defaultParams: {
        appType: 1,
        curr: 'rub',
        dest: -1257786,
        sort: 'popular',
        spp: 0,
        resultset: 'catalog'
    },
    headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
    }
}; 