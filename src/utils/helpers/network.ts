export function getRandomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 10000,
    maxDelay: number = 30000
): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            
            // Если это ошибка превышения лимита запросов, увеличиваем задержку
            if (error?.response?.status === 429) {
                const retryDelay = Math.min(baseDelay * Math.pow(2, i), maxDelay);
                const jitter = getRandomDelay(-1000, 1000);
                const totalDelay = retryDelay + jitter;
                
                console.log(`Превышен лимит запросов. Ждем ${Math.round(totalDelay / 1000)} секунд перед повторной попыткой...`);
                await delay(totalDelay);
                continue;
            }
            
            throw error;
        }
    }
    
    throw lastError;
} 