import { Controller, Get } from '@nestjs/common';
import { ModelsService } from './models.service';

@Controller('model-categories')
export class ModelCategoriesController {
  constructor(private readonly modelsService: ModelsService) {}

  @Get()
  listModelCategories() {
    return this.modelsService.listModelCategories();
  }
}
