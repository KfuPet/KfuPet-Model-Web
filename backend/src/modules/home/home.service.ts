import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toSafeUser } from '../../common/safe-user';

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  async getHome() {
    const [latestPosts, hotPosts, latestModels] = await Promise.all([
      this.prisma.post.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { author: true, category: true, tags: true },
      }),
      this.prisma.post.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: [{ viewCount: 'desc' }, { likeCount: 'desc' }],
        take: 6,
        include: { author: true, category: true, tags: true },
      }),
      this.prisma.modelPackage.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          author: true,
          category: true,
          tags: true,
          _count: { select: { versions: true } },
        },
      }),
    ]);

    return {
      latestPosts: latestPosts.map((post) => this.sanitizePost(post)),
      hotPosts: hotPosts.map((post) => this.sanitizePost(post)),
      latestModels: latestModels.map((model) => this.sanitizeModel(model)),
    };
  }

  private sanitizePost(post: any) {
    return { ...post, author: toSafeUser(post.author) };
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
