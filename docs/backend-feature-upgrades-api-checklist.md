# Backend Checklist: Các chức năng FE mới cần endpoint

> Mục tiêu: tài liệu này liệt kê các chức năng FE vừa thêm để agent BE kiểm tra backend đã có endpoint tương ứng chưa.
> Các endpoint bên dưới đang được FE gọi qua `src/api/featureUpgradesApi.ts` và một phần qua `src/api/workspaceLibraryApi.ts`.

## 1. Public share link

FE liên quan:

- `src/pages/Share/PublicSharePage.tsx`
- `src/pages/Documents/DocumentDetail/DocumentDetail.tsx`
- `src/pages/Library/MyLibraryPage.tsx`
- `src/api/featureUpgradesApi.ts`
- `src/api/workspaceLibraryApi.ts`

Route FE:

```text
/s/:token
```

Endpoint FE đang cần:

```http
GET /api/s/:token
POST /api/s/:token/verify-password
POST /api/share-links
GET /api/share-links?itemId=1&itemType=document
DELETE /api/share-links/:shareLinkId
GET /api/share-links/my
```

Payload tạo/cập nhật link:

```json
{
  "itemId": 1,
  "itemType": "document",
  "access": "anyone_with_link",
  "permission": "viewer",
  "allowDownload": true,
  "password": null,
  "expiresAt": null,
  "maxViews": null,
  "maxDownloads": null
}
```

Response FE kỳ vọng khi tạo/lấy setting:

```json
{
  "shareLink": {
    "id": "share-link-id",
    "shareUrl": "https://domain/s/token",
    "access": "anyone_with_link",
    "permission": "viewer",
    "allowDownload": true,
    "expiresAt": null,
    "maxViews": null,
    "maxDownloads": null
  }
}
```

Response public share không cần mật khẩu:

```json
{
  "item": {
    "id": 1,
    "title": "Tai lieu",
    "description": "Mo ta",
    "fileUrl": "https://...",
    "downloadUrl": "https://..."
  },
  "permission": "viewer",
  "allowDownload": true,
  "requiresPassword": false
}
```

Response public share có mật khẩu nhưng chưa verify:

```json
{
  "requiresPassword": true
}
```

Payload verify password:

```json
{
  "password": "plain-text-password"
}
```

Checklist BE:

- [ ] Link hết hạn trả lỗi rõ ràng, ví dụ `410` hoặc `403`.
- [ ] Link vượt `maxViews` hoặc `maxDownloads` bị chặn.
- [ ] Password được hash ở DB, không lưu plain text.
- [ ] `allowDownload: false` vẫn cho preview nhưng không trả/không cho download nếu policy yêu cầu.
- [ ] `GET /api/s/:token` nên tăng view count khi mở thành công.
- [ ] Download qua public link nếu cần giới hạn download nên đi qua endpoint BE riêng để tăng download count.

## 2. Bình luận tài liệu

Trạng thái hiện tại: **chưa thực hiện được end-to-end**. FE đã dựng panel và đã gọi API, nhưng nếu BE chưa có các endpoint bên dưới thì người dùng sẽ không tải/gửi/sửa/xóa được bình luận.

FE liên quan:

- `src/components/Documents/DocumentCommentsPanel.tsx`
- `src/pages/Documents/DocumentDetail/DocumentDetail.tsx`

Endpoint FE đang gọi:

```http
GET /api/documents/:documentId/comments?PageNumber=1&PageSize=50
POST /api/documents/:documentId/comments
PATCH /api/comments/:commentId
DELETE /api/comments/:commentId
```

Nếu BE đang giữ convention route cũ kiểu PascalCase, có thể map tương đương:

```http
GET /api/Documents/:documentId/comments?PageNumber=1&PageSize=50
POST /api/Documents/:documentId/comments
PATCH /api/Comments/:commentId
DELETE /api/Comments/:commentId
```

Nhưng khuyến nghị chuẩn hóa theo route lowercase mới để đồng bộ với các API library/feed/share mới.

Payload tạo bình luận gốc:

```json
{
  "content": "Noi dung binh luan",
  "parentCommentId": null
}
```

Payload tạo reply:

```json
{
  "content": "Noi dung tra loi",
  "parentCommentId": 10
}
```

Payload sửa bình luận:

```json
{
  "content": "Noi dung da sua"
}
```

Response list FE kỳ vọng:

```json
{
  "comments": [
    {
      "id": 10,
      "content": "Noi dung",
      "author": {
        "userId": "user-id",
        "username": "username",
        "fullName": "Nguyen Van A",
        "avatarUrl": "https://..."
      },
      "canEdit": true,
      "createdAt": "2026-05-23T10:00:00Z",
      "updatedAt": "2026-05-23T10:00:00Z",
      "replies": []
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 50,
    "totalCount": 1,
    "totalPages": 1
  }
}
```

Checklist BE:

- [ ] Tạo migration/bảng lưu bình luận nếu chưa có.
- [ ] Implement đủ 4 endpoint list/create/update/delete comment.
- [ ] User phải đăng nhập để tạo/sửa/xóa comment.
- [ ] Người tạo comment hoặc admin/moderator mới có `canEdit: true`.
- [ ] Reply nên giới hạn depth hợp lý. FE hiện render đệ quy, nhưng UX tốt nhất là 1-2 cấp.
- [ ] Xóa comment có thể soft delete để giữ thread, hoặc hard delete nếu không có reply.
- [ ] Khi có comment/reply mới, nên tạo notification cho chủ tài liệu và người được reply.
- [ ] Nên ghi audit log cho create/update/delete comment.

## 3. Lịch sử phiên bản tài liệu

FE liên quan:

- `src/components/Documents/DocumentVersionsPanel.tsx`
- `src/pages/Documents/DocumentDetail/DocumentDetail.tsx`

Endpoint FE đang gọi:

```http
GET /api/documents/:documentId/versions
POST /api/documents/:documentId/versions
POST /api/documents/:documentId/versions/:versionId/restore
GET /api/documents/:documentId/versions/:versionId/download
```

Upload version dùng `multipart/form-data`:

```text
file=<binary>
changeNote=Chinh sua chuong 2
```

Response list FE kỳ vọng:

```json
{
  "permissions": {
    "canViewVersions": true,
    "canUploadVersion": true,
    "canRestoreVersion": true,
    "canDownloadVersion": true
  },
  "versions": [
    {
      "id": 1,
      "versionNumber": 2,
      "changeNote": "Chinh sua chuong 2",
      "createdAt": "2026-05-23T10:00:00Z",
      "uploader": {
        "fullName": "Nguyen Van A",
        "username": "username"
      },
      "fileName": "tai-lieu-v2.pdf",
      "fileSize": 1048576,
      "mimeType": "application/pdf",
      "downloadUrl": "https://...",
      "checksum": "sha256...",
      "isCurrent": true,
      "status": "active"
    }
  ]
}
```

Checklist BE:

- [ ] Chỉ owner/editor hoặc user có quyền upload version mới được `POST`.
- [ ] Version mới không làm mất file cũ.
- [ ] Restore version cập nhật file hiện hành và nên tạo thêm version/audit event để truy vết.
- [ ] Validate loại file/kích thước theo rule upload document hiện có.
- [ ] Nếu user không có quyền xem version, trả `401/403`; FE đã xử lý im lặng cho hai status này.
- [ ] `GET versions` nên trả object `permissions` để FE bật/tắt upload, restore, download đúng quyền.
- [ ] Chỉ một phiên bản nên có `isCurrent: true`.
- [ ] `versionNumber` tăng tuần tự, không tái sử dụng số version đã xóa.
- [ ] Lưu `fileName`, `fileSize`, `mimeType`, `checksum`, `storageKey`, `createdBy`.
- [ ] Upload version phải kiểm tra quota trước khi lưu file.
- [ ] Restore version phải chạy trong transaction và ghi audit log `document.version.restored`.
- [ ] `GET /versions/:versionId/download` chỉ cho user có quyền xem/download version.
- [ ] Nếu restore tạo một bản snapshot mới thay vì đảo con trỏ current, response/list vẫn phải cho FE biết bản nào hiện hành.

## 4. Feed trang chủ: trending, recommended, following, history

FE liên quan:

- `src/components/Documents/DocumentFeedTabs.tsx`
- `src/components/Documents/DocumentCard.tsx`
- `src/pages/Home.js`

Endpoint FE đang gọi:

```http
GET /api/documents/trending?PageNumber=1&PageSize=10&days=7
GET /api/feed/recommended?PageNumber=1&PageSize=10
GET /api/feed/following?PageNumber=1&PageSize=10
GET /api/users/me/history?PageNumber=1&PageSize=10
POST /api/documents/:documentId/view
```

Payload record view:

```json
{
  "source": "document_detail"
}
```

Response feed FE chấp nhận một trong các key:

```json
{
  "documents": [
    {
      "document_id": 1,
      "title": "Tai lieu",
      "full_name": "Nguyen Van A",
      "thumbnail_url": "https://...",
      "isFavorite": false
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalCount": 20,
    "totalPages": 2
  }
}
```

FE cũng chấp nhận `items`, `data` hoặc `history` thay cho `documents`.

Checklist BE:

- [ ] `trending` có thể public, không bắt buộc đăng nhập.
- [ ] `recommended`, `following`, `history` yêu cầu đăng nhập.
- [ ] `recordView` nên chống spam bằng debounce theo user/session/ip/document/time window.
- [ ] History nên lưu document đã xem và thời điểm xem gần nhất.
- [ ] Không trả document đang private nếu user không có quyền.
- [ ] Không trả document trong trash/deleted.

## 5. Favorite tài liệu/thư viện

FE liên quan:

- `src/components/Documents/DocumentCard.tsx`
- `src/pages/Library/MyLibraryPage.tsx`
- `src/api/workspaceLibraryApi.ts`

Endpoint FE đang gọi:

```http
PUT /api/library-items/:itemId/favorite
GET /api/library/favorites
```

Payload:

```json
{
  "type": "document",
  "favorite": true
}
```

`type` có thể là:

```text
document
folder
```

Checklist BE:

- [ ] Favorite là idempotent: set true nhiều lần vẫn thành công.
- [ ] `GET /api/library/my`, feed, search, favorites nên trả `isFavorite`.
- [ ] User chỉ favorite item mình có quyền xem.
- [ ] Không trả favorite đã bị trash/deleted trong list thường.

## 6. Cài đặt thông báo

FE liên quan:

- `src/pages/Account/NotificationSettings.tsx`
- `src/pages/Account/AccountPage.tsx`

Endpoint FE đang gọi:

```http
GET /api/notifications/settings
PUT /api/notifications/settings
```

Payload update:

```json
{
  "inAppEnabled": true,
  "emailOnComment": true,
  "emailOnFollow": true,
  "emailOnFolderInvite": true,
  "emailOnReportUpdate": true
}
```

Response FE chấp nhận:

```json
{
  "settings": {
    "inAppEnabled": true,
    "emailOnComment": true,
    "emailOnFollow": true,
    "emailOnFolderInvite": true,
    "emailOnReportUpdate": true
  }
}
```

Hoặc trả trực tiếp object settings.

Checklist BE:

- [ ] Tự tạo default settings nếu user chưa có record.
- [ ] Những notification/email tương ứng phải đọc settings trước khi gửi.
- [ ] `inAppEnabled: false` nên chặn tạo notification in-app, trừ thông báo hệ thống bắt buộc nếu có policy riêng.

## 7. Storage quota và dung lượng

FE liên quan:

- `src/pages/Library/MyLibraryPage.tsx`
- `src/pages/Admin/Admin.tsx`
- `src/api/featureUpgradesApi.ts`

Endpoint FE đang gọi:

```http
GET /api/users/me/storage
PATCH /api/admin/users/:userId/storage
```

Payload admin cập nhật quota:

```json
{
  "storageLimitBytes": 10737418240
}
```

Response storage FE kỳ vọng:

```json
{
  "storage": {
    "usedBytes": 1024,
    "limitBytes": 10737418240
  }
}
```

Checklist BE:

- [ ] `GET /users/me/storage` trả dung lượng đang dùng và quota hiện tại.
- [ ] Upload document/version phải kiểm tra quota trước khi lưu.
- [ ] `PATCH /admin/users/:userId/storage` chỉ admin được gọi.
- [ ] Validate `storageLimitBytes` là số dương.
- [ ] Nếu giảm quota thấp hơn dung lượng đã dùng, cần policy rõ: cho lưu nhưng chặn upload mới, hoặc từ chối cập nhật.

## 8. Admin engagement analytics

FE liên quan:

- `src/pages/Admin/Admin.tsx`
- `src/api/featureUpgradesApi.ts`

Endpoint FE đang gọi:

```http
GET /api/admin/analytics/engagement?days=30
```

Response FE kỳ vọng:

```json
{
  "totalViews": 1000,
  "totalDownloads": 120,
  "dailyViews": [
    {
      "date": "2026-05-23",
      "count": 30
    }
  ],
  "dailyDownloads": [
    {
      "date": "2026-05-23",
      "count": 4
    }
  ]
}
```

Checklist BE:

- [ ] Chỉ admin được xem.
- [ ] `days` hỗ trợ ít nhất `7`, `30`, `90`.
- [ ] Daily arrays nên cùng khoảng ngày để biểu đồ FE dễ khớp.
- [ ] Nên tính từ các event view/download thực tế, không chỉ tổng document counters nếu có thể.

## 9. Admin audit logs

FE liên quan:

- `src/pages/Admin/Admin.tsx`
- `src/api/featureUpgradesApi.ts`

Endpoint FE đang gọi:

```http
GET /api/admin/audit-logs?PageNumber=1&PageSize=50&action=&entityType=&actorUserId=
```

Response FE kỳ vọng:

```json
{
  "auditLogs": [
    {
      "id": 1,
      "createdAt": "2026-05-23T10:00:00Z",
      "action": "comment.created",
      "entityType": "document",
      "entityId": 1,
      "actorUserId": "user-id",
      "description": "Created comment",
      "metadata": {}
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 50,
    "totalCount": 1,
    "totalPages": 1
  }
}
```

FE cũng chấp nhận `logs` hoặc `data` thay cho `auditLogs`.

Checklist BE:

- [ ] Chỉ admin được xem.
- [ ] Filter được theo `action`, `entityType`, `actorUserId`.
- [ ] Ghi audit cho các action quan trọng: share link, comment, version upload/restore, quota update, delete/trash/restore.
- [ ] Metadata không chứa password/token/raw secret.

## 10. Các field response nên thống nhất

Để FE không cần map quá nhiều biến thể, BE nên ưu tiên camelCase cho chức năng mới:

```json
{
  "documentId": 1,
  "thumbnailUrl": "https://...",
  "fileUrl": "https://...",
  "downloadUrl": "https://...",
  "createdAt": "2026-05-23T10:00:00Z",
  "updatedAt": "2026-05-23T10:00:00Z",
  "isFavorite": false,
  "allowDownload": true
}
```

FE hiện vẫn fallback một số snake_case cũ như `document_id`, `thumbnail_url`, `file_url`, `download_url`.

## 11. Checklist nghiệm thu nhanh

- [ ] Mở `/s/:token` xem được public share không mật khẩu.
- [ ] Mở `/s/:token` có password, nhập đúng password thì xem được.
- [ ] Tạo/cập nhật/tắt share link từ detail document.
- [ ] Tạo share link có `maxViews`, `maxDownloads`, `expiresAt`.
- [ ] Xem danh sách comment trên detail document.
- [ ] Tạo, reply, sửa, xóa comment.
- [ ] Xem danh sách version.
- [ ] Upload version mới.
- [ ] Restore version cũ.
- [ ] Trang chủ tải được tab trending.
- [ ] User đã đăng nhập tải được recommended/following/history.
- [ ] Vào detail document gọi record view thành công.
- [ ] Bấm favorite trên card và trong library cập nhật được.
- [ ] Account notification settings load và save được.
- [ ] Library hiển thị đúng storage usage/quota.
- [ ] Admin cập nhật quota user được.
- [ ] Admin xem được engagement analytics.
- [ ] Admin xem/filter được audit logs.
