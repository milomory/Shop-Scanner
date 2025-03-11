import { WildberriesMarketplace } from './services/marketplaces/wildberries/api';
import { DEFAULT_SEARCH_CONFIG, SearchConfig } from './config/search';
import { formatPrice } from './utils/helpers/price';

async function printProducts(products: any[]) {
  console.log(`\nВсего найдено товаров: ${products.length}\n`);

  // Группируем товары по скидке
  const discountGroups: { [key: string]: any[] } = {
    '90-100': [],
    '80-89': [],
    '70-79': []
  };

  products.forEach(product => {
    if (product.discount >= 90) {
      discountGroups['90-100'].push(product);
    } else if (product.discount >= 80) {
      discountGroups['80-89'].push(product);
    } else if (product.discount >= 70) {
      discountGroups['70-79'].push(product);
    }
  });

  // Выводим товары по группам
  for (const [range, items] of Object.entries(discountGroups)) {
    if (items.length > 0) {
      console.log(`\nТовары со скидкой ${range}%:\n`);
      items.forEach(product => {
        console.log('----------------------------------------');
        console.log(`🏷️ ${product.brand} - ${product.name}`);
        console.log(`📁 Категория поиска: ${product.category}`);
        console.log(`💰 Цена: ${formatPrice(product.currentPrice)} (было ${formatPrice(product.originalPrice)})`);
        console.log(`📊 Скидка: ${product.discount}%`);
        if (product.rating) {
          console.log(`⭐ Рейтинг: ${product.rating}`);
        }
        console.log(`🔗 Прямая ссылка на товар:\n${product.url}`);
        console.log('----------------------------------------\n');
      });
    }
  }
}

async function main() {
  try {
    const marketplace = new WildberriesMarketplace();
    
    // Здесь настраиваются параметры поиска
    const searchConfig: SearchConfig = {
      ...DEFAULT_SEARCH_CONFIG,
      // Список категорий для поиска - можно добавлять/удалять категории
      categories: [
        'игрушки',
        'детская одежда',
        'кольца',
        'серьги',
        'цепочки',
        'браслеты'
        // Примеры других категорий:
        // 'платье',
        // 'джинсы',
        // 'куртка',
        // 'обувь женская',
        // 'сумка женская'
      ],
      // Минимальный рейтинг товара (от 1 до 5)
      minRating: 4.7,
      // Минимальная скидка в процентах (от 0 до 100)
      minDiscount: 70
    };

    const products = await marketplace.searchProducts(searchConfig);
    await printProducts(products);
  } catch (error) {
    console.error('Ошибка в главной функции:', error);
  }
}

main(); 