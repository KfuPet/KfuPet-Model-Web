import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const communityCategories = [
  { name: '综合讨论', slug: 'general', description: 'KfuPet 相关的综合话题', sortOrder: 1 },
  { name: 'KfuPet 使用', slug: 'usage', description: 'KfuPet 客户端使用相关', sortOrder: 2 },
  { name: '问题反馈', slug: 'feedback', description: 'Bug 反馈与问题求助', sortOrder: 3 },
  { name: '角色制作', slug: 'character-making', description: '角色制作经验交流', sortOrder: 4 },
  { name: '模型制作', slug: 'model-making', description: '模型制作与资源分享', sortOrder: 5 },
  { name: '开发交流', slug: 'development', description: '开发相关技术讨论', sortOrder: 6 },
  { name: '插件 / 工具', slug: 'plugins-tools', description: '插件与工具分享', sortOrder: 7 },
  { name: '公告', slug: 'announcements', description: '网站与项目公告', sortOrder: 8 },
];

const modelCategories = [
  { name: '角色', slug: 'character', description: '角色模型包' },
  { name: '宠物', slug: 'pet', description: '宠物模型包' },
  { name: '桌宠', slug: 'desktop-pet', description: '桌宠模型包' },
  { name: '场景', slug: 'scene', description: '场景模型包' },
  { name: '测试', slug: 'testing', description: '测试用模型包' },
  { name: '其他', slug: 'other', description: '其他类型模型包' },
];

const tags = [
  { name: 'KfuPet', slug: 'kfupet' },
  { name: 'WinUI', slug: 'winui' },
  { name: 'WPF', slug: 'wpf' },
  { name: '模型包', slug: 'model-package' },
  { name: '角色制作', slug: 'character-making' },
  { name: '开发', slug: 'development' },
  { name: 'Bug', slug: 'bug' },
  { name: '教程', slug: 'tutorial' },
];

async function main() {
  console.log('开始写入种子数据...');

  for (const category of communityCategories) {
    await prisma.communityCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  for (const category of modelCategories) {
    await prisma.modelCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: tag,
      create: tag,
    });
  }

  console.log('种子数据写入完成');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
