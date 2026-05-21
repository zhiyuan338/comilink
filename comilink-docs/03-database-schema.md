# ComiLink MVP 数据库 Schema 设计

以下为推荐 Prisma Schema 草案。

```prisma
model User {
  id            String       @id @default(cuid())
  qq            String       @unique
  passwordHash  String
  username      String
  token         String       @unique
  stampImageUrl String?
  isAdmin       Boolean      @default(false)
  isDisabled    Boolean      @default(false)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  socialLinks   SocialLink[]
  collectionsA  Collection[] @relation("CollectionUserA")
  collectionsB  Collection[] @relation("CollectionUserB")
}

model SocialLink {
  id           String   @id @default(cuid())
  userId       String
  type         String   // link | qrcode
  platformName String
  url          String?
  imageUrl     String?
  sortOrder    Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model Event {
  id          String       @id @default(cuid())
  name        String
  description String?
  isActive    Boolean      @default(false)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  collections Collection[]
}

model Collection {
  id          String    @id @default(cuid())
  userAId     String
  userBId     String
  eventId     String?
  collectedAt DateTime  @default(now())

  userA       User      @relation("CollectionUserA", fields: [userAId], references: [id])
  userB       User      @relation("CollectionUserB", fields: [userBId], references: [id])
  event       Event?    @relation(fields: [eventId], references: [id])

  @@unique([userAId, userBId, eventId])
  @@index([userAId])
  @@index([userBId])
  @@index([eventId])
}
```

## 关键规则

### User

- `qq` 必须唯一
- `token` 必须唯一
- 初始密码为 QQ 号，但数据库只保存加密后的 `passwordHash`
- 管理员重置密码时，将密码重置为该用户 QQ 号并重新加密保存

### Collection

图鉴关系必须双向可见，但数据库只存一条记录。

写入前固定排序：

```text
较小 userId = userAId
较大 userId = userBId
```

这样可以避免 A 收集 B 和 B 收集 A 被写成两条数据。

### Event

系统最多只有一个 `isActive = true` 的活动。

应用层需要保证切换活动时：

1. 先将所有活动设为非当前活动
2. 再将目标活动设为当前活动

建议放在事务中执行。
