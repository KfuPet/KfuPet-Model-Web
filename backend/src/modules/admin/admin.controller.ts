import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';
import { PaginationDto } from './dto/pagination.dto';
import { ListModelsQueryDto } from './dto/list-models-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdatePostStatusDto } from './dto/update-post-status.dto';
import { UpdateModelStatusDto } from './dto/update-model-status.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers(@Query() query: PaginationDto) {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:id/status')
  updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, dto);
  }

  @Get('posts')
  listPosts(@Query() query: PaginationDto) {
    return this.adminService.listPosts(query);
  }

  @Patch('posts/:id/status')
  updatePostStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostStatusDto,
  ) {
    return this.adminService.updatePostStatus(id, dto);
  }

  @Get('models')
  listModels(@Query() query: ListModelsQueryDto) {
    return this.adminService.listModels(query);
  }

  @Patch('models/:id/status')
  updateModelStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateModelStatusDto,
  ) {
    return this.adminService.updateModelStatus(id, dto);
  }
}
