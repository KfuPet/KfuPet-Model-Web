import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationDto } from './dto/pagination.dto';

interface AuthenticatedRequest {
  user: { userId: number; username: string };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.findById(req.user.userId);
  }

  @Get('me/posts')
  @UseGuards(JwtAuthGuard)
  listMyPosts(
    @Req() req: AuthenticatedRequest,
    @Query() query: PaginationDto,
  ) {
    return this.usersService.listMyPosts(req.user.userId, query);
  }

  @Get('me/models')
  @UseGuards(JwtAuthGuard)
  listMyModels(
    @Req() req: AuthenticatedRequest,
    @Query() query: PaginationDto,
  ) {
    return this.usersService.listMyModels(req.user.userId, query);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @Get(':id')
  getUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }
}
