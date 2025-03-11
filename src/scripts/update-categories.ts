import { CategoryService } from '../services/category-service';

async function main() {
    try {
        console.log('Начинаем обновление категорий Wildberries...');
        
        const categoryService = new CategoryService();
        await categoryService.updateCategories();
        
        console.log('Категории успешно обновлены!');
        console.log('\nСтруктура категорий:');
        console.log(categoryService.getCategoryTree());
    } catch (error) {
        console.error('Ошибка при обновлении категорий:', error);
        process.exit(1);
    }
}

main(); 