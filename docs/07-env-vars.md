# ComiLink MVP 环境变量清单

## 必需环境变量

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
SESSION_SECRET="replace-with-random-secret"
APP_URL="https://domain.com"
```

## 图片存储环境变量

如果使用本地存储，MVP 阶段可暂时不配置对象存储。

如果使用 S3 兼容对象存储，需要：

```env
S3_ENDPOINT="https://example.r2.cloudflarestorage.com"
S3_REGION="auto"
S3_BUCKET="comilink"
S3_ACCESS_KEY_ID="access-key"
S3_SECRET_ACCESS_KEY="secret-key"
S3_PUBLIC_BASE_URL="https://cdn.example.com"
```

## 可选环境变量

```env
UPLOAD_MAX_SIZE_MB="5"
STAMP_IMAGE_SIZE="800"
NODE_ENV="development"
```

## 说明

- `SESSION_SECRET` 必须使用随机长字符串
- 生产环境必须使用 HTTPS
- `APP_URL` 用于生成用户 NFC 链接
- 不要将 `.env` 提交到 Git 仓库
