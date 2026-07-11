# Milk Tea SaaS

奶茶店扫码点单 SaaS 后端脚手架。

## 快速启动（Docker）

```bash
# 1. 复制环境变量（可选，docker-compose 已内置默认值）
cp .env.example .env

# 2. 启动 MongoDB + API
docker compose up --build -d

# 3. 健康检查
curl http://localhost:8080/v1/health
```

## 初始化演示数据

Docker 启动后执行：

```bash
docker compose --profile seed run --rm seed
```

或本地开发模式：

```bash
cd apps/api
npm install
cp ../../.env.example .env
npm run start:dev

# 另开终端
npm run seed
```

## 演示账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 店长 | admin@demo.com | admin123 |
| 收银员 | cashier@demo.com | admin123 |

## 主要 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/v1/health` | 健康检查 |
| POST | `/v1/auth/login` | 登录 |
| GET | `/v1/public/menu?token=xxx` | 扫码获取菜单 |
| POST | `/v1/public/orders?token=xxx` | 顾客下单 |
| GET | `/v1/pos/menu` | 收银端菜单（需 JWT） |
| POST | `/v1/pos/orders` | 收银点单 |
| GET | `/v1/admin/reports/daily` | 日报 |

## 连接 MongoDB Atlas

环境变量名：**`MONGODB_URI`**

在项目根目录 `.env` 中配置：

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/milktea?retryWrites=true&w=majority&appName=bubbletea
```

测试连接：

```bash
cd apps/api
npm install
npm run test:db
```

Atlas 需将部署服务器 IP 加入 Network Access 白名单。

## 部署到 Google Cloud Run

```bash
# 构建镜像
docker build -t REGION-docker.pkg.dev/PROJECT_ID/milktea/api:latest ./apps/api

# 推送
docker push REGION-docker.pkg.dev/PROJECT_ID/milktea/api:latest

# 部署
gcloud run deploy milktea-api \
  --image REGION-docker.pkg.dev/PROJECT_ID/milktea/api:latest \
  --region asia-east1 \
  --set-env-vars MONGODB_URI="mongodb+srv://..." \
  --set-env-vars JWT_SECRET="your-secret" \
  --allow-unauthenticated
```

## 项目结构

```
milk-tea-saas/
├── apps/api/          # NestJS 后端
│   ├── src/
│   │   ├── modules/   # auth, menu, order, public, report, tenant
│   │   └── schemas/   # MongoDB 模型
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```
