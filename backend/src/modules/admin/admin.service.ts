import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toSafeUser } from '../../common/safe-user';
import { PaginationDto } from './dto/pagination.dto';
import { ListModelsQueryDto } from './dto/list-models-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdatePostStatusDto } from './dto/update-post-status.dto';
import { UpdateModelStatusDto } from './dto/update-model-status.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(query: PaginationDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count(),
    ]);

    return {
      items: items.map((user) => toSafeUser(user)),
      total,
      page,
      pageSize,
    };
  }

  async updateUserStatus(id: number, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    if (user.role === 'SUPERADMIN') {
      throw new ForbiddenException('不能操作超级管理员');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
    });

    return toSafeUser(updated);
  }

  async listPosts(query: PaginationDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { author: true, category: true, tags: true },
      }),
      this.prisma.post.count(),
    ]);

    return {
      items: items.map((post) => ({
        ...post,
        author: toSafeUser(post.author),
      })),
      total,
      page,
      pageSize,
    };
  }

  async updatePostStatus(id: number, dto: UpdatePostStatusDto) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: { status: dto.status },
      include: { author: true, category: true, tags: true },
    });

    return { ...updated, author: toSafeUser(updated.author) };
  }

  async listModels(query: ListModelsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.modelPackage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          author: true,
          category: true,
          tags: true,
          _count: { select: { versions: true } },
        },
      }),
      this.prisma.modelPackage.count({ where }),
    ]);

    return {
      items: items.map((model) => this.sanitizeModel(model)),
      total,
      page,
      pageSize,
    };
  }

  async updateModelStatus(id: number, dto: UpdateModelStatusDto) {
    const model = await this.prisma.modelPackage.findUnique({ where: { id } });
    if (!model) {
      throw new NotFoundException('模型包不存在');
    }

    const updated = await this.prisma.modelPackage.update({
      where: { id },
      data: { status: dto.status },
      include: {
        author: true,
        category: true,
        tags: true,
        _count: { select: { versions: true } },
      },
    });

    return this.sanitizeModel(updated);
  }

  private sanitizeModel(model: any) {
    const result: any = { ...model, author: toSafeUser(model.author) };
    if (result._count) {
      result.versionCount = result._count.versions;
      delete result._count;
    }
    return result;
  }
}
