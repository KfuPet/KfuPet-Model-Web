import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SafeUser, toSafeUser } from '../../common/safe-user';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return toSafeUser(user);
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<SafeUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
    return toSafeUser(user);
  }

  async listMyPosts(userId: number, query: PaginationDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = { authorId: userId };

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { author: true, category: true, tags: true },
      }),
      this.prisma.post.count({ where }),
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

  async listMyModels(userId: number, query: PaginationDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = { authorId: userId };

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

  private sanitizeModel(model: any) {
    const result: any = { ...model, author: toSafeUser(model.author) };
    if (result._count) {
      result.versionCount = result._count.versions;
      delete result._count;
    }
    return result;
  }
}
