import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toSafeUser } from '../../common/safe-user';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  listCategories() {
    return this.prisma.communityCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  listTags(q?: string) {
    return this.prisma.tag.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { slug: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async listPosts(query: ListPostsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: any = { status: 'PUBLISHED' };
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.tagId) {
      where.tags = { some: { id: query.tagId } };
    }

    const orderBy: any =
      query.sort === 'hot'
        ? [{ isPinned: 'desc' }, { viewCount: 'desc' }]
        : [{ isPinned: 'desc' }, { createdAt: 'desc' }];

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { author: true, category: true, tags: true },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items: items.map((post) => this.sanitizePost(post)),
      total,
      page,
      pageSize,
    };
  }

  async getPost(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { author: true, category: true, tags: true },
    });
    if (!post || post.status !== 'PUBLISHED') {
      throw new NotFoundException('帖子不存在');
    }

    await this.prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return this.sanitizePost({ ...post, viewCount: post.viewCount + 1 });
  }

  async createPost(userId: number, dto: CreatePostDto) {
    await this.ensureCategoryExists(dto.categoryId);
    const tagIds = dto.tagIds ?? [];

    const post = await this.prisma.post.create({
      data: {
        title: dto.title,
        content: dto.content,
        author: { connect: { id: userId } },
        category: { connect: { id: dto.categoryId } },
        tags: tagIds.length
          ? { connect: tagIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { author: true, category: true, tags: true },
    });

    return this.sanitizePost(post);
  }

  async updatePost(userId: number, id: number, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post || post.status === 'DELETED') {
      throw new NotFoundException('帖子不存在');
    }
    await this.assertOwnerOrAdmin(post.authorId, userId);

    if (dto.categoryId !== undefined) {
      await this.ensureCategoryExists(dto.categoryId);
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.tagIds !== undefined) {
      data.tags = { set: dto.tagIds.map((tagId) => ({ id: tagId })) };
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data,
      include: { author: true, category: true, tags: true },
    });

    return this.sanitizePost(updated);
  }

  async deletePost(userId: number, id: number) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post || post.status === 'DELETED') {
      throw new NotFoundException('帖子不存在');
    }
    await this.assertOwnerOrAdmin(post.authorId, userId);

    await this.prisma.post.update({
      where: { id },
      data: { status: 'DELETED' },
    });

    return { success: true };
  }

  async listComments(postId: number) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.status === 'DELETED') {
      throw new NotFoundException('帖子不存在');
    }

    const comments = await this.prisma.comment.findMany({
      where: { postId, status: 'PUBLISHED' },
      orderBy: { createdAt: 'asc' },
      include: { author: true },
    });

    return comments.map((comment) => ({
      ...comment,
      author: toSafeUser(comment.author),
    }));
  }

  async createComment(userId: number, postId: number, dto: CreateCommentDto) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.status !== 'PUBLISHED') {
      throw new NotFoundException('帖子不存在');
    }

    if (dto.parentId !== undefined) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
      });
      if (
        !parent ||
        parent.postId !== postId ||
        parent.status !== 'PUBLISHED'
      ) {
        throw new BadRequestException('父评论不存在');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        parentId: dto.parentId ?? null,
        content: dto.content,
      },
      include: { author: true },
    });

    await this.prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    return { ...comment, author: toSafeUser(comment.author) };
  }

  async deleteComment(userId: number, id: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { post: true },
    });
    if (!comment || comment.status !== 'PUBLISHED') {
      throw new NotFoundException('评论不存在');
    }

    // 评论作者本人、帖子作者、管理员均可删除
    if (comment.authorId !== userId) {
      await this.assertOwnerOrAdmin(comment.post.authorId, userId);
    }

    await this.prisma.comment.update({
      where: { id },
      data: { status: 'DELETED' },
    });

    await this.prisma.post.update({
      where: { id: comment.postId },
      data: { commentCount: { decrement: 1 } },
    });

    return { success: true };
  }

  private sanitizePost(post: any) {
    return {
      ...post,
      author: toSafeUser(post.author),
    };
  }

  private async ensureCategoryExists(categoryId: number) {
    const category = await this.prisma.communityCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new BadRequestException('分类不存在');
    }
  }

  private async assertOwnerOrAdmin(ownerId: number, userId: number) {
    if (ownerId === userId) return;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      throw new ForbiddenException('没有权限执行此操作');
    }
  }
}
