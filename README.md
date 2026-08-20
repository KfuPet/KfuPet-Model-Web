# KfuPet Web

KfuPet 的配套网站平台，承载 **社区交流** 与 **模型包分发** 两大核心业务，为 KfuPet 客户端提供在线资源与账号生态。

## 功能特性

- **社区**：帖子（发帖 / 列表 / 详情 / 编辑 / 删除）、评论（含回复）、分类、标签
- **模型包**：列表 / 详情 / 上传 / 版本管理 / 下载、分类、审核状态流转
- **账号**：注册 / 登录（JWT）、个人资料，社区与模型板块账号互通
- **管理后台**：用户管理、帖子管理、模型包审核

## 技术栈

| 部分 | 技术 |
| --- | --- |
| 前端 | Vue 3 · TypeScript · Vite · Naive UI · Tailwind CSS · Axios |
| 后端 | NestJS · TypeScript · Prisma · JWT (Passport) · Multer |
| 数据库 | PostgreSQL 16 |
| 容器 | Docker Compose（仅 PostgreSQL） |

## 目录结构

```text
KfuPet-Model-Web/
├── backend/            # NestJS 后端
├── frontend/           # Vue 3 前端
├── docs/               # 功能规格、架构、实施计划
├── docker-compose.yml  # PostgreSQL 一键启动
├── LICENSE
└── README.md
```

## 快速开始

### 1. 启动数据库（PostgreSQL）

```bash
docker compose up -d
```

或在本地自行安装 PostgreSQL 并创建对应数据库。

### 2. 启动后端

```bash
cd backend
npm install
cp .env.example .env       # 填写 DATABASE_URL / JWT_SECRET
npm run prisma:generate    # 生成 Prisma Client
npm run prisma:migrate     # 首次执行数据库迁移
npm run start:dev
```

后端默认监听 http://localhost:3000，接口统一前缀 `/api`。

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端默认访问 http://localhost:5173，开发环境下 `/api` 请求会代理到后端 3000 端口。

## 环境变量

后端通过 `backend/.env` 配置，模板见 `backend/.env.example`：

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 连接串 |
| `JWT_SECRET` | JWT 签名密钥（生产环境务必更换） |
| `PORT` | 后端监听端口（默认 3000） |

## 常用脚本

### 后端（backend）

| 命令 | 说明 |
| --- | --- |
| `npm run start:dev` | 开发模式（热重载） |
| `npm run build` | 编译 |
| `npm run start:prod` | 生产模式 |
| `npm run prisma:generate` | 生成 Prisma Client |
| `npm run prisma:migrate` | 执行数据库迁移 |
| `npm run prisma:studio` | 打开 Prisma Studio |

### 前端（frontend）

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览构建产物 |

## 相关文档

- [功能规格说明](docs/KfuPet_Website_Function_Specification.md)
- [架构说明](docs/架构.md)
- [实施计划](docs/实施计划.md)
