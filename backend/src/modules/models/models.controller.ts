import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ModelsService } from './models.service';
import { CreateModelPackageDto } from './dto/create-model-package.dto';
import { UpdateModelPackageDto } from './dto/update-model-package.dto';
import { ListModelsQueryDto } from './dto/list-models-query.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { modelFileStorage } from './multer.storage';

interface AuthenticatedRequest {
  user: { userId: number; username: string };
}

@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Get()
  listModels(@Query() query: ListModelsQueryDto) {
    return this.modelsService.listModels(query);
  }

  @Get(':id')
  getModel(@Param('id', ParseIntPipe) id: number) {
    return this.modelsService.getModel(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createModel(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateModelPackageDto,
  ) {
    return this.modelsService.createModel(req.user.userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateModel(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateModelPackageDto,
  ) {
    return this.modelsService.updateModel(req.user.userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteModel(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.modelsService.deleteModel(req.user.userId, id);
  }

  @Get(':id/versions')
  listVersions(@Param('id', ParseIntPipe) id: number) {
    return this.modelsService.listVersions(id);
  }

  @Post(':id/versions')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { storage: modelFileStorage }))
  createVersion(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateVersionDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }
    return this.modelsService.createVersion(req.user.userId, id, dto, file);
  }

  @Get(':id/versions/:versionId/download')
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Param('versionId', ParseIntPipe) versionId: number,
    @Res() res: Response,
  ) {
    const { filePath, filename } = await this.modelsService.download(
      id,
      versionId,
    );
    res.download(filePath, filename);
  }
}
