# ComiLink AI 开发工作流

本文档用于指导使用 AI 工具开发 ComiLink MVP，包括 ChatGPT、Cursor、OpenCode、Claude Code 等。

目标是让 AI 始终围绕 MVP 范围工作，避免上下文丢失、功能蔓延和代码失控。

---

## 1. 项目核心背景

ComiLink 是一个面向漫展、Kigurumi 聚会、Cosplay 活动等线下场景的 NFC 扩列系统。

核心流程：

```text
用户触碰 NFC
→ 打开用户主页
→ 自动建立图鉴关系
→ 查看电子邮票与联系方式
````

项目是 Web App，不是原生 App。

用户不需要下载 App，只需要通过手机浏览器访问页面。

---

## 2. 技术栈

默认技术栈：

```text
Next.js
TypeScript
PostgreSQL
Prisma
Tailwind CSS
```

前期图片上传可以先使用本地存储：

```text
/public/uploads
```

后期再迁移到对象存储，例如：

```text
Cloudflare R2
阿里云 OSS
腾讯云 COS
```

---

## 3. MVP 不做的功能

AI 开发时不得擅自加入以下功能：

```text
即时聊天
动态社区
排行榜
稀有度
任务系统
成就系统
推送通知
用户注册
OAuth 登录
手机号登录
邮箱验证
复杂权限系统
注销账号功能
多活动复杂运营系统
```

如确实需要新增功能，必须先单独确认，不允许直接实现。

---

## 4. 开发优先级

最高优先级是跑通核心闭环：

```text
登录
→ 用户资料
→ NFC 主页
→ 自动收集
→ 图鉴可见
```

优先级顺序：

```text
数据库
登录
用户资料
NFC 页面
图鉴收集
图鉴页
后台导入
活动切换
移动端优化
部署
```

不要先做复杂 UI。

不要先做活动玩法。

不要先做非核心功能。

---

## 5. 每个阶段一个新对话

推荐使用：

```text
一个功能 = 一个新 AI 对话
```

例如：

```text
Prisma Schema
登录系统
用户资料页
电子邮票上传
NFC 访问页
图鉴收集逻辑
后台用户导入
活动切换
部署配置
```

不要在一个超长对话里完成整个项目。

长对话容易导致：

```text
上下文污染
需求遗忘
功能蔓延
代码风格混乱
AI 自由发挥
```

---

## 6. 每次新对话应提供的上下文

每次新开 AI 对话时，按以下顺序提供上下文。

### 6.1 项目定位

固定说明：

```md
这是一个名为 ComiLink 的 NFC 扩列系统 MVP。

核心流程：
用户触碰 NFC → 打开用户主页 → 自动建立图鉴关系 → 查看电子邮票与联系方式。

项目是 Web App，不是原生 App。

MVP 不做聊天、动态、排行榜、任务系统。

重点是：
- 低社交压力
- 快速扩列
- 图鉴收藏感
- 线下活动体验

技术栈：
- Next.js
- TypeScript
- PostgreSQL
- Prisma
- Tailwind CSS
```

### 6.2 当前阶段目标

示例：

```md
当前阶段目标：

实现账号登录系统。

要求：
- QQ + 密码登录
- Session Cookie
- 支持修改密码
- 不做注册
- 不做 OAuth
- 不做验证码
- 管理员可以重置用户密码为 QQ 号
```

### 6.3 相关文档

只提供当前阶段相关文档，不要一次性塞入全部文档。

例如：

做数据库时提供：

```text
03-database-schema.md
04-api-spec.md
07-acceptance-criteria.md
```

做 NFC 页面时提供：

```text
05-routes-and-pages.md
06-edge-cases.md
07-acceptance-criteria.md
```

做后台时提供：

```text
04-api-spec.md
06-edge-cases.md
08-development-plan.md
```

### 6.4 明确输出要求

示例：

```md
请直接修改当前项目代码。

要求：
- 使用 Next.js App Router
- 使用 TypeScript
- 使用 Prisma
- 不新增 MVP 范围外功能
- 修改后告诉我改了哪些文件
- 给出本地测试命令
```

---

## 7. 推荐 Prompt 模板

### 7.1 通用开发模板

```md
你正在开发 ComiLink MVP。

请先阅读：
- AI_CONTEXT.md
- docs/00-project-brief.md
- docs/08-development-plan.md
- 当前任务相关文档

当前任务：

【在这里写当前任务】

要求：
- 严格遵守 MVP 范围
- 不实现未要求的功能
- 使用现有技术栈
- 保持代码简单可维护
- 每完成一个阶段给出测试方式
- 如果发现需求矛盾，先指出，不要自行扩展
```

### 7.2 修 Bug 模板

```md
当前项目是 ComiLink MVP。

我遇到了以下问题：

【粘贴错误信息】

请你：
1. 判断问题原因
2. 找出相关文件
3. 给出最小修改方案
4. 不要重构无关代码
5. 修改后告诉我如何测试
```

### 7.3 代码审查模板

```md
请审查当前实现是否符合 ComiLink MVP 文档。

重点检查：
- 是否超出 MVP 范围
- 是否破坏 NFC → 主页 → 图鉴收集核心流程
- 数据库约束是否正确
- 是否存在重复收集问题
- 是否存在未登录、自己访问自己、重复访问等边界问题

请只指出需要修改的问题，不要重写整个项目。
```

---

## 8. Git 工作流

推荐：

```text
一个阶段 = 一个 Git Commit
```

示例：

```text
init nextjs project
add prisma schema
implement auth system
implement profile page
implement nfc user page
implement collection logic
implement collection page
implement admin user import
implement event switching
optimize mobile UI
prepare deployment
```

每完成一个阶段：

```bash
git status
git add .
git commit -m "implement auth system"
```

如果 AI 改坏了，可以回滚：

```bash
git restore .
```

或回到上一个提交：

```bash
git reset --hard HEAD
```

谨慎使用 `reset --hard`，确认没有要保留的改动后再执行。

---

## 9. 开发阶段清单

### 阶段 0：开发前准备

目标：

```text
准备文档、技术栈、数据库设计、API 清单、验收标准。
```

完成标准：

```text
docs/ 文档齐全
AI_CONTEXT.md 已创建
.env.example 已创建
```

---

### 阶段 1：项目初始化

目标：

```text
创建 Next.js + TypeScript + Tailwind 项目。
```

完成标准：

```text
npm run dev 可正常启动
首页可访问
Git 仓库已初始化
```

---

### 阶段 2：数据库与 Prisma

目标：

```text
建立 User、Event、SocialLink、Collection 数据表。
```

完成标准：

```text
Prisma migration 成功
数据库唯一约束正确
Collection 不允许重复收集
```

---

### 阶段 3：账号系统

目标：

```text
实现 QQ + 密码登录。
```

要求：

```text
不做注册
不做 OAuth
不做验证码
使用 Session Cookie
管理员可重置密码为 QQ 号
```

完成标准：

```text
用户可登录
用户可退出
用户可修改密码
管理员可重置密码
```

---

### 阶段 4：用户资料

目标：

```text
用户可以编辑昵称、上传电子邮票、配置社交入口。
```

完成标准：

```text
用户能看到自己的 NFC 链接
修改资料不改变 NFC 链接
电子邮票可上传并压缩
社交入口可增删改
```

---

### 阶段 5：NFC 页面

目标：

```text
实现 /u/[token] 页面。
```

完成标准：

```text
token 正确时显示用户主页
token 不存在时显示 404
未登录用户也能查看主页
已登录用户访问他人主页后触发收集
```

---

### 阶段 6：图鉴收集

目标：

```text
实现双向图鉴关系。
```

完成标准：

```text
A 访问 B 后，A 和 B 都能在图鉴中看到对方
A 访问自己不收集
重复访问不重复写入
无当前活动时仍可收集
有当前活动时归属当前活动
```

---

### 阶段 7：后台管理

目标：

```text
实现最小后台。
```

后台功能：

```text
批量导入用户
查看用户列表
重置用户密码为 QQ 号
创建活动
设置当前活动
```

完成标准：

```text
CSV 可导入 QQ、昵称、初始密码
重复 QQ 不重复创建
最多只有一个当前活动
切换活动不影响历史记录
```

---

### 阶段 8：移动端优化

目标：

```text
让核心页面适合线下手机使用。
```

重点页面：

```text
登录页
用户资料页
NFC 主页
图鉴页
```

完成标准：

```text
按钮足够大
首屏信息清晰
NFC 主页加载快
弱网下有基本错误提示
```

---

### 阶段 9：部署上线

目标：

```text
部署生产环境并测试 NFC 标签。
```

完成标准：

```text
线上 HTTPS 可访问
数据库连接正常
图片上传正常
NFC 标签能打开用户主页
图鉴收集能在线上完成
```

---

## 10. AI 修改代码时的规则

AI 修改代码必须遵守：

```text
优先小改，不大重构
优先完成当前任务，不顺手加功能
遇到不确定需求，先说明
不要删除已有业务逻辑
不要改变技术栈
不要擅自引入大型依赖
不要把测试数据写死到业务代码里
不要提交 .env、密码、用户隐私数据
```

---

## 11. 本地测试要求

每个阶段完成后至少运行：

```bash
npm run lint
npm run dev
```

涉及 Prisma 时运行：

```bash
npx prisma validate
npx prisma migrate dev
```

涉及数据库读取时运行：

```bash
npx prisma studio
```

如果后续加入测试框架，再补充：

```bash
npm run test
```

---

## 12. 验收标准

MVP 最终应满足：

```text
管理员可以批量导入用户
用户可以登录并修改密码
管理员可以重置用户密码为 QQ 号
用户可以上传电子邮票
用户可以配置多个社交入口
每个用户拥有唯一 NFC 链接
主流 Android 手机可通过 NFC 打开用户主页
未登录用户仍可查看主页与电子邮票
已登录用户访问他人主页后可自动建立图鉴关系
用户访问自己的主页时不会建立图鉴关系
同一活动内不会重复收集
重复访问不会产生重复数据
无活动状态下系统仍可正常使用
图鉴关系为双向可见
用户可以按活动查看已收集图鉴
用户修改资料后无需重新写 NFC 标签
任意用户之间在同一活动下仅允许存在一条图鉴关系
NFC 页面首屏加载时间应尽量控制在 3 秒以内
图鉴建立操作应尽量在 1 秒内完成
图片资源能够稳定加载
500 人规模活动下系统可稳定完成主页访问与图鉴收集
```

---

## 13. 最重要原则

永远优先保证这条链路：

```text
触碰 NFC → 打开主页 → 自动收集 → 图鉴可见
```

只要这条链路稳定，MVP 就成立。

其他功能都应服务于这条链路。

```
