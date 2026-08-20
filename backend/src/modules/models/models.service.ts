import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { extname, join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { toSafeUser } from '../../common/safe-user';
import { CreateModelPackageDto } from './dto/create-model-package.dto';
import { UpdateModelPackageDto } from './dto/update-model-package.dto';
import { ListModelsQueryDto } from './dto/list-models-query.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { uploadsDir } from './multer.storage';

@Injectable()
export class ModelsService {
  constructor(private readonly prisma: PrismaService) {}

  listModelCategories() {
    return this.prisma.modelCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async listModels(query: ListModelsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: any = { status: query.status ?? 'PUBLISHED' };
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.tagId) {
      where.tags = { some: { id: query.tagId } };
    }

    const orderBy: any =
      query.sort === 'downloads'
        ? { downloadCount: 'desc' }
        : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.modelPackage.findMany({
        where,
        orderBy,
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
      items: items.map((item) => this.sanitizeModel(item)),
      total,
      page,
      pageSize,
    };
  }

  async getModel(id: number) {
    const model = await this.prisma.modelPackage.findUnique({
      where: { id },
      include: {
        author: true,
        category: true,
        tags: true,
        versions: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!model || model.status !== 'PUBLISHED') {
      throw new NotFoundException('模型包不存在');
    }
    return this.sanitizeModel(model);
  }

  async createModel(userId: number, dto: CreateModelPackageDto) {
    await this.ensureCategoryExists(dto.categoryId);
    const slug = `pkg-${randomUUID().slice(0, 8)}`;
    const tagIds = dto.tagIds ?? [];

    const model = await this.prisma.modelPackage.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        coverUrl: dto.coverUrl,
        previewUrls: dto.previewUrls ?? [],
        status: dto.status ?? 'DRAFT',
        author: { connect: { id: userId } },
        category: { connect: { id: dto.categoryId } },
        tags: tagIds.length
          ? { connect: tagIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        author: true,
        category: true,
        tags: true,
        versions: true,
      },
    });

    return this.sanitizeModel(model);
  }

  async updateModel(userId: number, id: number, dto: UpdateModelPackageDto) {
    const model = await this.prisma.modelPackage.findUnique({ where: { id } });
    if (!model || model.status === 'OFFLINE') {
      throw new NotFoundException('模型包不存在');
    }
    await this.assertOwnerOrAdmin(model.authorId, userId);

    if (dto.categoryId !== undefined) {
      await this.ensureCategoryExists(dto.categoryId);
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.coverUrl !== undefined) data.coverUrl = dto.coverUrl;
    if (dto.previewUrls !== undefined) data.previewUrls = dto.previewUrls;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.tagIds !== undefined) {
      data.tags = { set: dto.tagIds.map((tagId) => ({ id: tagId })) };
    }

    const updated = await this.prisma.modelPackage.update({
      where: { id },
      data,
      include: {
        author: true,
        category: true,
        tags: true,
        versions: { orderBy: { createdAt: 'desc' } },
      },
    });

    return this.sanitizeModel(updated);
  }

  async deleteModel(userId: number, id: number) {
    const model = await this.prisma.modelPackage.findUnique({ where: { id } });
    if (!model || model.status === 'OFFLINE') {
      throw new NotFoundException('模型包不存在');
    }
    await this.assertOwnerOrAdmin(model.authorId, userId);

    await this.prisma.modelPackage.update({
      where: { id },
      data: { status: 'OFFLINE' },
    });

    return { success: true };
  }

  async listVersions(modelId: number) {
    await this.ensureModelExists(modelId);
    return this.prisma.packageVersion.findMany({
      where: { packageId: modelId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createVersion(
    userId: number,
    modelId: number,
    dto: CreateVersionDto,
    file: Express.Multer.File,
  ) {
    const model = await this.prisma.modelPackage.findUnique({
      where: { id: modelId },
    });
    if (!model || model.status === 'OFFLINE') {
      throw new NotFoundException('模型包不存在');
    }
    await this.assertOwnerOrAdmin(model.authorId, userId);

    const existing = await this.prisma.packageVersion.findUnique({
      where: {
        packageId_version: { packageId: modelId, version: dto.version },
      },
    });
    if (existing) {
      throw new ConflictException('该版本号已存在');
    }

    return this.prisma.packageVersion.create({
      data: {
        packageId: modelId,
        version: dto.version,
        changelog: dto.changelog,
        minKfuPetVersion: dto.minKfuPetVersion,
        fileSize: file.size,
        storageKey: file.filename,
      },
    });
  }

  async download(modelId: number, versionId: number) {
    const version = await this.prisma.packageVersion.findUnique({
      where: { id: versionId },
      include: { package: true },
    });
    if (!version || version.packageId !== modelId) {
      throw new NotFoundException('版本不存在');
    }
    if (version.package.status !== 'PUBLISHED') {
      throw new NotFoundException('版本不存在');
    }

    const filePath = join(uploadsDir, version.storageKey);
    if (!existsSync(filePath)) {
      throw new NotFoundException('文件不存在');
    }

    await Promise.all([
      this.prisma.packageVersion.update({
        where: { id: versionId },
        data: { downloadCount: { increment: 1 } },
      }),
      this.prisma.modelPackage.update({
        where: { id: modelId },
        data: { downloadCount: { increment: 1 } },
      }),
      this.prisma.downloadRecord.create({
        data: { versionId, userId: null },
      }),
    ]);

    const filename = `${version.package.name}-v${version.version}${extname(version.storageKey)}`;
    return { filePath, filename };
  }

  private sanitizeModel(model: any) {
    const result: any = { ...model, author: toSafeUser(model.author) };
    if (result._count) {
      result.versionCount = result._count.versions;
      delete result._count;
    }
    return result;
  }

  private async ensureCategoryExists(categoryId: number) {
    const category = await this.prisma.modelCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new BadRequestException('分类不存在');
    }
  }

  private async ensureModelExists(modelId: number) {
    const model = await this.prisma.modelPackage.findUnique({
      where: { id: modelId },
    });
    if (!model || model.status === 'OFFLINE') {
      throw new NotFoundException('模型包不存在');
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
