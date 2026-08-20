import {
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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

interface AuthenticatedRequest {
  user: { userId: number; username: string };
}

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('categories')
  listCategories() {
    return this.communityService.listCategories();
  }

  @Get('posts')
  listPosts(@Query() query: ListPostsQueryDto) {
    return this.communityService.listPosts(query);
  }

  @Get('posts/:id')
  getPost(@Param('id', ParseIntPipe) id: number) {
    return this.communityService.getPost(id);
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  createPost(@Req() req: AuthenticatedRequest, @Body() dto: CreatePostDto) {
    return this.communityService.createPost(req.user.userId, dto);
  }

  @Patch('posts/:id')
  @UseGuards(JwtAuthGuard)
  updatePost(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
  ) {
    return this.communityService.updatePost(req.user.userId, id, dto);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  deletePost(@Req() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.communityService.deletePost(req.user.userId, id);
  }

  @Get('posts/:id/comments')
  listComments(@Param('id', ParseIntPipe) id: number) {
    return this.communityService.listComments(id);
  }

  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  createComment(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommentDto,
  ) {
    return this.communityService.createComment(req.user.userId, id, dto);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  deleteComment(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.communityService.deleteComment(req.user.userId, id);
  }
}
