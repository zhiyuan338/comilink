# ComiLink MVP 技术栈确认

## 推荐技术栈

- 框架：Next.js
- 语言：TypeScript
- 路由：Next.js App Router
- 数据库：PostgreSQL
- ORM：Prisma
- 样式：Tailwind CSS
- UI 组件：shadcn/ui
- 认证：Session Cookie
- 密码加密：bcrypt 或 argon2
- 图片处理：sharp
- 图片存储：对象存储，或 MVP 阶段临时本地存储
- 部署：Vercel / Railway / Render / VPS

## 认证方案

MVP 推荐使用 Session Cookie，不使用 JWT。

原因：

- 项目是 Web App
- 登录态管理简单
- 安全性更容易控制
- 更适合服务端渲染与 API 路由

## 图片处理方案

电子邮票上传后由服务端自动处理：

- 校验文件类型
- 压缩图片
- 转换为 WebP
- 限制最大尺寸
- 保存压缩后的图片

推荐规则：

- 上传格式：jpg / png / webp
- 上传大小上限：5MB
- 存储格式：webp
- 推荐尺寸：800x800
- 压缩目标：尽量控制在 1MB 以内

## NFC 写入内容

NFC 标签只写入 URL：

```text
https://domain.com/u/{token}
```

不写 JSON，不写 vCard，不写复杂格式。

## 不推荐在 MVP 使用的技术

MVP 阶段不建议使用：

- 原生 App
- 小程序
- 复杂 OAuth
- WebSocket
- 微服务
- Redis 队列
- 实时聊天室
