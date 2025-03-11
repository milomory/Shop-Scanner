export function formatPrice(price: number): string {
    return price.toLocaleString('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

export function kopecksToRubles(kopecks: number): number {
    return kopecks / 100;
}

export function rublesToKopecks(rubles: number): number {
    return rubles * 100;
} 