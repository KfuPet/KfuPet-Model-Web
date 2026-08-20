# KfuPet 后端

KfuPet 网站的后端服务，基于 NestJS + Prisma + PostgreSQL，提供社区、模型包、账号与后台管理的 REST API。

完整说明见根目录 [README](../README.md)。

## 快速启动

```bash
npm install
cp .env.example .env       # 填写 DATABASE_URL / JWT_SECRET
npm run prisma:generate    # 生成 Prisma Client
npm run start:dev
```

默认监听 http://localhost:3000，接口统一前缀 `/api`。
