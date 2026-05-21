# ComiLink

ComiLink 是一个面向漫展、Kigurumi 聚会、Cosplay 活动等线下场景的 NFC 扩列系统 MVP。

用户只需要触碰 NFC 标签，即可打开个人主页、查看电子邮票与联系方式，并自动建立图鉴关系。

## 核心流程

```text
触碰 NFC
→ 打开用户主页
→ 自动建立图鉴关系
→ 查看电子邮票与联系方式
```

## MVP 功能

* QQ + 密码登录
* 用户资料编辑
* 电子邮票上传
* 社交入口管理
* NFC 用户主页
* 自动图鉴收集
* 图鉴查看
* 后台用户导入
* 活动切换
* 管理员重置密码

## 技术栈

* Next.js
* TypeScript
* PostgreSQL
* Prisma
* Tailwind CSS

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env`：

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/comilink"
SESSION_SECRET="replace-with-random-secret"
APP_URL="http://localhost:3000"
```

### 3. 初始化数据库

```bash
npx prisma migrate dev
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问：

```text
http://localhost:3000
```

## 开发原则

* 一个阶段一个功能
* 不擅自扩展 MVP 范围
* 优先跑通核心闭环
* 每完成一个阶段提交 Git Commit

## MVP 不包含

* 即时聊天
* 动态社区
* 排行榜
* 任务系统
* OAuth 登录
* 用户注册
* 推送通知

## 项目目标

ComiLink 的核心目标不是“社交平台”，而是：

> 让线下扩列变成一种低压力、快速且具有收藏感的互动体验。
