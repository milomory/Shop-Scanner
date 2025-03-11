export function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
} 