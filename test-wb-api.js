const { WildberriesMarketplace } = require('./src/services/marketplaces/wildberries/api');
const wbApi = new WildberriesMarketplace();
(async () => {
  console.log('Тестирование API Wildberries...');
  const result = await wbApi.searchProductsByCategory('306', {
    minRating: 4.0,
    minDiscount: 30,
    filters: {
      minPrice: 500,
      maxPrice: 10000
    }
  });
  console.log('Найдено товаров:', result.length);
  if (result.length > 0) {
    console.log('Первый товар:', JSON.stringify(result[0], null, 2));
  }
})().catch(e => console.error('Ошибка:', e)); 