# ComiLink MVP API 规范

## 认证相关

### POST `/api/auth/login`

Request:

```json
{
  "qq": "123456789",
  "password": "123456789"
}
```

Response:

```json
{
  "success": true
}
```

---

### POST `/api/auth/logout`

Response:

```json
{
  "success": true
}
```

---

### POST `/api/auth/change-password`

Request:

```json
{
  "oldPassword": "123456789",
  "newPassword": "new-password"
}
```

Response:

```json
{
  "success": true
}
```

---

## 当前用户

### GET `/api/me`

Response:

```json
{
  "id": "user_id",
  "qq": "123456789",
  "username": "昵称",
  "token": "token",
  "stampImageUrl": "https://example.com/stamp.webp",
  "nfcUrl": "https://domain.com/u/token"
}
```

---

### PUT `/api/me/profile`

Request:

```json
{
  "username": "新昵称"
}
```

Response:

```json
{
  "success": true
}
```

---

### POST `/api/me/stamp`

说明：上传电子邮票图片。

要求：

- 支持 jpg / png / webp
- 最大 5MB
- 服务端自动压缩
- 转换为 WebP

Response:

```json
{
  "success": true,
  "stampImageUrl": "https://example.com/stamp.webp"
}
```

---

## 社交入口

### GET `/api/me/social-links`

Response:

```json
{
  "items": [
    {
      "id": "link_id",
      "type": "link",
      "platformName": "Telegram",
      "url": "https://t.me/example",
      "imageUrl": null,
      "sortOrder": 0
    }
  ]
}
```

---

### POST `/api/me/social-links`

Request:

```json
{
  "type": "link",
  "platformName": "Telegram",
  "url": "https://t.me/example",
  "imageUrl": null,
  "sortOrder": 0
}
```

Response:

```json
{
  "success": true
}
```

---

### PUT `/api/me/social-links/[id]`

Request:

```json
{
  "platformName": "QQ",
  "url": "https://example.com",
  "sortOrder": 1
}
```

Response:

```json
{
  "success": true
}
```

---

### DELETE `/api/me/social-links/[id]`

Response:

```json
{
  "success": true
}
```

---

## NFC 访问与图鉴收集

### GET `/api/users/by-token/[token]`

Response:

```json
{
  "id": "target_user_id",
  "username": "目标用户昵称",
  "stampImageUrl": "https://example.com/stamp.webp",
  "socialLinks": []
}
```

---

### POST `/api/collections/collect`

Request:

```json
{
  "targetToken": "abc123"
}
```

Response:

```json
{
  "success": true,
  "status": "collected",
  "alreadyCollected": false,
  "selfVisit": false,
  "eventId": "event_id"
}
```

可能状态：

```text
collected
already_collected
self_visit
not_logged_in
target_not_found
user_disabled
```

规则：

- 未登录不建立关系
- 自己访问自己不建立关系
- 重复访问不重复写入
- 没有当前活动时 `eventId = null`
- 使用数据库唯一约束保证幂等

---

### GET `/api/collections`

Query:

```text
?eventId=event_id
```

Response:

```json
{
  "items": [
    {
      "collectionId": "collection_id",
      "user": {
        "id": "other_user_id",
        "username": "对方昵称",
        "stampImageUrl": "https://example.com/stamp.webp"
      },
      "event": {
        "id": "event_id",
        "name": "正式活动"
      },
      "collectedAt": "2026-05-21T12:00:00.000Z"
    }
  ]
}
```

---

## 后台用户管理

### POST `/api/admin/users/import`

说明：管理员批量导入用户。

CSV 字段：

```text
qq,username,password
```

其中 `password` 可选。若为空，则默认初始密码为 QQ 号。

Response:

```json
{
  "success": true,
  "created": 100,
  "skipped": 5
}
```

---

### GET `/api/admin/users`

Response:

```json
{
  "items": [
    {
      "id": "user_id",
      "qq": "123456789",
      "username": "昵称",
      "token": "abc123",
      "isAdmin": false,
      "isDisabled": false,
      "createdAt": "2026-05-21T12:00:00.000Z"
    }
  ]
}
```

---

### POST `/api/admin/users/[id]/reset-password`

说明：管理员将用户密码重置为该用户 QQ 号。

Response:

```json
{
  "success": true,
  "message": "Password has been reset to user's QQ number."
}
```

安全要求：

- 仅管理员可操作
- 操作成功后不要在响应中返回明文密码
- 后台页面可提示“已重置为用户 QQ 号”

---

## 后台活动管理

### POST `/api/admin/events`

Request:

```json
{
  "name": "正式活动",
  "description": "活动说明"
}
```

Response:

```json
{
  "success": true
}
```

---

### GET `/api/admin/events`

Response:

```json
{
  "items": [
    {
      "id": "event_id",
      "name": "正式活动",
      "description": "活动说明",
      "isActive": true,
      "createdAt": "2026-05-21T12:00:00.000Z"
    }
  ]
}
```

---

### PUT `/api/admin/events/[id]/activate`

Response:

```json
{
  "success": true
}
```

规则：

- 系统最多只有一个当前活动
- 切换后，新收集记录归属到新活动
- 历史记录不受影响
