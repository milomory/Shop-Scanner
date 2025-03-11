import { CategoryInfo } from '../../types/common';

export const WB_CATEGORIES: Record<string, CategoryInfo> = {
    'Одежда': { id: 306, name: 'Одежда', subject: 'fashion' },
    'Обувь': { id: 130, name: 'Обувь', subject: 'shoes' },
    'Детские товары': { id: 306, name: 'Детские товары', subject: 'children' },
    'Спорт': { id: 784, name: 'Спорт', subject: 'sport' },
    'Красота': { id: 543, name: 'Красота', subject: 'beauty' },
    TOYS: {
        id: '1',
        name: 'Игрушки',
        subject: 'toys'
    },
    KIDS_CLOTHES: {
        id: '2',
        name: 'Детская одежда',
        subject: 'kids-clothes'
    },
    JEWELRY: {
        id: '3',
        name: 'Ювелирные изделия',
        subject: 'jewelry'
    }
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
    baseUrl: 'https://search.wb.ru',
    defaultParams: {
        appType: 1,
        curr: 'rub',
        dest: -1257786,
        sort: 'popular',
        spp: 0,
        regions: '80,38,83,4,64,33,68,70,30,40,86,75,69,1,31,66,110,48,22,71,114'
    },
    headers: {
        'Accept': '*/*',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Connection': 'keep-alive',
        'Origin': 'https://www.wildberries.ru',
        'Referer': 'https://www.wildberries.ru/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
}; 