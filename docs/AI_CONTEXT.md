# ComiLink AI Context

ComiLink 是 NFC 扩列系统 MVP。

核心流程：
用户触碰 NFC → 打开用户主页 → 自动建立图鉴关系 → 查看电子邮票与联系方式。

技术栈：
- Next.js
- TypeScript
- PostgreSQL
- Prisma
- Tailwind CSS

MVP 不做：
- 聊天
- 动态社区
- 排行榜
- 任务系统
- 注册功能
- OAuth
- 注销账号

开发原则：
- 一个阶段一个功能
- 不擅自扩展 MVP 范围
- 优先跑通 NFC → 主页 → 图鉴收集闭环
- 每个阶段完成后提交 Git commit