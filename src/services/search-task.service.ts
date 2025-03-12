import { SearchTask, SearchConfig } from '../types/search';
import { v4 as uuidv4 } from 'uuid';
import { WildberriesMarketplace } from './marketplaces/wildberries/api';
import { DatabaseService } from './database.service';

export class SearchTaskService {
    private tasks: Map<string, SearchTask> = new Map();
    private marketplace: WildberriesMarketplace;
    private database: DatabaseService;

    constructor() {
        this.marketplace = new WildberriesMarketplace();
        this.database = DatabaseService.getInstance();
    }

    async createTask(config: SearchConfig): Promise<SearchTask> {
        const task: SearchTask = {
            id: uuidv4(),
            status: 'pending',
            progress: 0,
            results: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.tasks.set(task.id, task);
        this.processTask(task.id, config);

        return task;
    }

    async getTask(taskId: string): Promise<SearchTask | undefined> {
        let task = this.tasks.get(taskId);
        
        if (!task) {
            // Если задача не найдена в памяти, пробуем загрузить из базы
            const savedResults = await this.database.getSearchResults(taskId);
            if (savedResults) {
                task = {
                    id: savedResults.taskId,
                    status: 'completed',
                    progress: 100,
                    results: savedResults.results,
                    createdAt: savedResults.createdAt,
                    updatedAt: savedResults.updatedAt
                };
                this.tasks.set(taskId, task);
            }
        }

        return task;
    }

    private async processTask(taskId: string, config: SearchConfig): Promise<void> {
        const task = this.tasks.get(taskId);
        if (!task) return;

        try {
            task.status = 'processing';
            this.updateTask(task);

            const totalCategories = config.categories.length;
            let processedCategories = 0;

            for (const category of config.categories) {
                const products = await this.marketplace.searchProductsByCategory(category, config);
                task.results.push(...products);
                
                processedCategories++;
                task.progress = Math.round((processedCategories / totalCategories) * 100);
                this.updateTask(task);

                // Добавляем задержку между запросами
                if (processedCategories < totalCategories) {
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));
                }
            }

            task.status = 'completed';
            task.progress = 100;
            this.updateTask(task);

            // Сохраняем результаты в базу данных
            await this.database.saveSearchResults(taskId, config, task.results);

        } catch (error) {
            task.status = 'error';
            task.error = error instanceof Error ? error.message : 'Unknown error';
            this.updateTask(task);
        }
    }

    private updateTask(task: SearchTask): void {
        task.updatedAt = new Date();
        this.tasks.set(task.id, task);
    }

    /**
     * Обновляет статус задачи поиска
     */
    async updateTaskStatus(taskId: string, status: 'pending' | 'processing' | 'completed' | 'error', progress: number): Promise<void> {
        const task = this.tasks.get(taskId);
        if (!task) return;
        
        task.status = status;
        task.progress = progress;
        this.updateTask(task);
    }
    
    /**
     * Обновляет результаты задачи поиска
     */
    async updateTaskResults(taskId: string, results: any[]): Promise<void> {
        const task = this.tasks.get(taskId);
        if (!task) return;
        
        task.results = results;
        this.updateTask(task);
        
        // Сохраняем результаты в базу данных
        await this.database.saveSearchResults(taskId, { categories: [] } as any, results);
    }
    
    /**
     * Обновляет ошибку задачи поиска
     */
    async updateTaskError(taskId: string, errorMessage: string): Promise<void> {
        const task = this.tasks.get(taskId);
        if (!task) return;
        
        task.status = 'error';
        task.error = errorMessage;
        this.updateTask(task);
    }

    // Метод для очистки старых задач
    async cleanupOldTasks(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
        const now = Date.now();
        
        // Очищаем задачи из памяти
        for (const [taskId, task] of this.tasks.entries()) {
            if (now - task.updatedAt.getTime() > maxAgeMs) {
                this.tasks.delete(taskId);
            }
        }

        // Очищаем задачи из базы данных
        await this.database.cleanup(maxAgeMs);
    }
} 