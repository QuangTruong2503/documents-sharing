# BE Requirements: Documents / Folders Workspace API for DocShare

> Mục tiêu: cung cấp API đầy đủ để FE triển khai trải nghiệm quản lý tài liệu kiểu Jumpshare: thư viện cá nhân, folder nhiều cấp, file/folder nằm chung một danh sách, preview, share link, phân quyền, thao tác hàng loạt, favorite và trash.

Tài liệu này là yêu cầu backend cho spec FE `docshare-fe-documents-folders-jumpshare-style.md`.

---

## 1. Nguyên tắc sản phẩm

BE cần coi `folder` và `document` là các `library item` cùng tồn tại trong một cây thư viện.

Các khả năng bắt buộc:

- Một user có thư viện cá nhân gốc.
- Folder có thể lồng nhiều cấp bằng `parentFolderId`.
- Một folder chứa cả folder con và document.
- FE lấy một endpoint để render nội dung folder gồm cả file và folder.
- Mọi item có permission rõ ràng để FE khóa/mở action.
- Delete mặc định chuyển vào trash, không xóa cứng ngay.
- Share link có thể áp dụng cho cả folder và document.
- Search/sort/filter hoạt động thống nhất trên library item.

---

## 2. Naming contract

Ưu tiên trả JSON theo camelCase cho FE.

Nếu BE đang dùng snake_case trong DB/internal, mapper API nên chuẩn hóa:

```json
{
  "folderId": 123,
  "parentFolderId": null,
  "createdAt": "2026-05-20T08:00:00Z",
  "updatedAt": "2026-05-20T08:00:00Z"
}
```

FE có thể tạm hỗ trợ field cũ, nhưng API mới nên thống nhất camelCase.

---

## 3. Data model FE cần nhận

### 3.1 Permission

```ts
type Permission = "owner" | "editor" | "viewer";

type ItemPermissions = {
  canView: boolean;
  canDownload: boolean;
  canUpload: boolean;
  canCreateFolder: boolean;
  canRename: boolean;
  canMove: boolean;
  canCopy: boolean;
  canShare: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
};
```

### 3.2 Breadcrumb item

```ts
type BreadcrumbItem = {
  id: number | null;
  name: string;
  href: string;
};
```

### 3.3 Folder item

```ts
type FolderItem = {
  id: number;
  type: "folder";
  name: string;
  parentFolderId: number | null;
  ownerId: string;
  ownerName?: string;
  description?: string | null;
  color?: string | null;
  childrenCount: number;
  documentCount: number;
  folderCount: number;
  totalSize: number;
  isFavorite: boolean;
  isShared: boolean;
  permission: Permission;
  permissions: ItemPermissions;
  createdAt: string;
  updatedAt: string;
};
```

### 3.4 Document item

```ts
type DocumentItem = {
  id: number;
  type: "document";
  name: string;
  title: string;
  description?: string | null;
  parentFolderId: number | null;
  ownerId: string;
  ownerName?: string;
  mimeType: string;
  extension: string;
  size: number;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
  downloadUrl?: string | null;
  status: "ready" | "processing" | "failed" | "uploading";
  isFavorite: boolean;
  isShared: boolean;
  allowDownload: boolean;
  permission: Permission;
  permissions: ItemPermissions;
  createdAt: string;
  updatedAt: string;
};
```

---

## 4. Endpoint bắt buộc theo phase

## Phase 1: Library và folder tree

### 4.1 Lấy thư viện cá nhân root

```http
GET /api/library/my?sort=updated_desc&view=grid&pageNumber=1&pageSize=50
Authorization: Bearer <token>
```

Query params:

| Param | Type | Notes |
|---|---|---|
| `search` | string optional | Tìm trong root |
| `sort` | string optional | `name_asc`, `name_desc`, `updated_desc`, `updated_asc`, `type`, `size_desc` |
| `fileType` | string optional | `pdf`, `docx`, `image`, etc. |
| `ownerId` | string optional | Lọc theo owner |
| `shared` | boolean optional | Lọc shared status |
| `favorite` | boolean optional | Lọc favorite |
| `pageNumber` | number | 1-based |
| `pageSize` | number | default 50 |

Response:

```json
{
  "folder": {
    "id": null,
    "name": "Tài liệu của tôi",
    "parentFolderId": null,
    "breadcrumb": [
      { "id": null, "name": "Tài liệu của tôi", "href": "/documents/my" }
    ],
    "permission": "owner",
    "permissions": {
      "canView": true,
      "canDownload": true,
      "canUpload": true,
      "canCreateFolder": true,
      "canRename": false,
      "canMove": false,
      "canCopy": false,
      "canShare": false,
      "canDelete": false,
      "canManageMembers": false
    }
  },
  "items": [],
  "pagination": {
    "currentPage": 1,
    "pageSize": 50,
    "totalCount": 0,
    "totalPages": 1
  },
  "counts": {
    "folders": 0,
    "documents": 0,
    "shared": 0,
    "favorites": 0,
    "trash": 0
  },
  "storage": {
    "usedBytes": 0,
    "limitBytes": 10737418240
  }
}
```

### 4.2 Lấy nội dung folder bất kỳ

```http
GET /api/folders/:folderId/items?sort=updated_desc&pageNumber=1&pageSize=50
Authorization: Bearer <token>
```

Response giống `/api/library/my`, nhưng `folder.id` là folder hiện tại.

BE phải trả breadcrumb đầy đủ:

```json
{
  "folder": {
    "id": 123,
    "name": "Marketing",
    "parentFolderId": null,
    "description": "Tài liệu chiến dịch",
    "isShared": true,
    "permission": "editor",
    "breadcrumb": [
      { "id": null, "name": "Tài liệu của tôi", "href": "/documents/my" },
      { "id": 123, "name": "Marketing", "href": "/documents/folders/123" }
    ],
    "permissions": {
      "canView": true,
      "canDownload": true,
      "canUpload": true,
      "canCreateFolder": true,
      "canRename": true,
      "canMove": true,
      "canCopy": true,
      "canShare": true,
      "canDelete": true,
      "canManageMembers": false
    }
  },
  "items": [
    {
      "id": 456,
      "type": "folder",
      "name": "SEO",
      "parentFolderId": 123,
      "childrenCount": 12,
      "documentCount": 10,
      "folderCount": 2,
      "totalSize": 2400000,
      "isFavorite": false,
      "isShared": false,
      "permission": "editor",
      "permissions": {},
      "createdAt": "2026-05-20T08:00:00Z",
      "updatedAt": "2026-05-20T08:00:00Z"
    },
    {
      "id": 789,
      "type": "document",
      "name": "bao-gia.pdf",
      "title": "Báo giá",
      "parentFolderId": 123,
      "mimeType": "application/pdf",
      "extension": "pdf",
      "size": 2400000,
      "thumbnailUrl": "/thumbs/789.jpg",
      "previewUrl": "/previews/789",
      "downloadUrl": "/api/documents/789/download",
      "status": "ready",
      "isFavorite": false,
      "isShared": true,
      "allowDownload": true,
      "permission": "editor",
      "permissions": {},
      "createdAt": "2026-05-20T08:00:00Z",
      "updatedAt": "2026-05-20T08:30:00Z"
    }
  ],
  "pagination": {}
}
```

### 4.3 Lấy folder tree cho FolderPickerDialog

```http
GET /api/folders/tree?root=my&includeShared=true
Authorization: Bearer <token>
```

Response:

```json
{
  "nodes": [
    {
      "id": 123,
      "name": "Marketing",
      "parentFolderId": null,
      "permission": "owner",
      "canReceiveItems": true,
      "children": [
        {
          "id": 456,
          "name": "SEO",
          "parentFolderId": 123,
          "permission": "editor",
          "canReceiveItems": true,
          "children": []
        }
      ]
    }
  ]
}
```

BE nên tính sẵn `canReceiveItems` để FE disable folder đích không hợp lệ.

---

## Phase 2: Folder và upload

### 4.4 Tạo folder ở root hoặc tạo folder con trong folder cha

Chức năng này bắt buộc để FE có nút **Thư mục mới** khi người dùng đang đứng trong một folder bất kỳ.

BE cần hỗ trợ tạo folder theo `parentFolderId`:

- `parentFolderId = null`: tạo folder ở thư viện gốc của user.
- `parentFolderId = 123`: tạo folder con nằm bên trong folder cha `123`.
- Folder con sau khi tạo phải xuất hiện trong response của `GET /api/folders/123/items`.

```http
POST /api/folders
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "name": "SEO",
  "parentFolderId": 123,
  "description": "Tài liệu SEO nằm trong folder Marketing",
  "color": null
}
```

Rules:

- `name` trim, không rỗng.
- Không cho trùng tên folder trong cùng folder cha `parentFolderId`, hoặc trả conflict rõ ràng.
- `parentFolderId = null` tạo ở root.
- `parentFolderId != null` tạo folder con trong folder cha tương ứng.
- User phải có `canCreateFolder` trong folder cha.
- Nếu folder cha không tồn tại hoặc user không nhìn thấy folder cha, trả `404 FOLDER_NOT_FOUND`.
- Nếu user thấy folder cha nhưng không có quyền tạo folder con, trả `403 FORBIDDEN`.
- Sau khi tạo folder con, BE cần cập nhật `folderCount`, `childrenCount`, `updatedAt` của folder cha.

Response:

```json
{
  "folder": {
    "id": 999,
    "type": "folder",
    "name": "SEO",
    "parentFolderId": 123,
    "childrenCount": 0,
    "documentCount": 0,
    "folderCount": 0,
    "totalSize": 0,
    "permission": "owner",
    "permissions": {},
    "createdAt": "2026-05-20T08:00:00Z",
    "updatedAt": "2026-05-20T08:00:00Z"
  }
}
```

Endpoint alias tùy chọn, dễ đọc hơn cho BE/REST:

```http
POST /api/folders/:parentFolderId/folders
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "name": "SEO",
  "description": "Tài liệu SEO nằm trong folder Marketing",
  "color": null
}
```

Behavior endpoint alias:

- Tương đương `POST /api/folders` với `parentFolderId = :parentFolderId`.
- Response giống endpoint chính.
- Nếu BE chỉ muốn giữ một endpoint, ưu tiên `POST /api/folders` với `parentFolderId`.

Ví dụ flow FE cần:

```txt
User đang ở /documents/folders/123
→ click "Thư mục mới"
→ FE gọi POST /api/folders { name, parentFolderId: 123 }
→ BE tạo folder con
→ FE refetch GET /api/folders/123/items
→ folder con xuất hiện chung với document/folder khác
```

### 4.5 Upload nhiều file vào folder hiện tại

```http
POST /api/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Form data:

```txt
files[]=<binary>
parentFolderId=123 optional
```

Rules:

- Nếu `parentFolderId` không có: upload vào root.
- Nếu có `parentFolderId`: kiểm tra `canUpload`.
- Hỗ trợ nhiều file trong một request.
- Trả document item ngay với `status = processing` nếu preview xử lý async.
- Không bắt buộc categories/tags khi upload vào library/folder.

Response:

```json
{
  "documents": [
    {
      "id": 789,
      "type": "document",
      "name": "bao-gia.pdf",
      "title": "bao-gia.pdf",
      "parentFolderId": 123,
      "mimeType": "application/pdf",
      "extension": "pdf",
      "size": 2400000,
      "thumbnailUrl": null,
      "previewUrl": null,
      "downloadUrl": "/api/documents/789/download",
      "status": "processing",
      "permission": "owner",
      "permissions": {},
      "createdAt": "2026-05-20T08:00:00Z",
      "updatedAt": "2026-05-20T08:00:00Z"
    }
  ]
}
```

### 4.6 Lấy trạng thái upload/preview

```http
GET /api/documents/:documentId/status
Authorization: Bearer <token>
```

Response:

```json
{
  "id": 789,
  "status": "ready",
  "thumbnailUrl": "/thumbs/789.jpg",
  "previewUrl": "/previews/789",
  "errorMessage": null
}
```

---

## Phase 3: Thao tác item cơ bản và hàng loạt

### 4.7 Rename folder hoặc document

```http
PATCH /api/library-items/:itemId/rename
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "type": "document",
  "name": "Tên mới.pdf"
}
```

Rules:

- Kiểm tra `canRename`.
- Không cho tên rỗng.
- Kiểm tra trùng tên trong cùng parent.

Response:

```json
{
  "item": {
    "id": 789,
    "type": "document",
    "name": "Tên mới.pdf",
    "updatedAt": "2026-05-20T08:30:00Z"
  }
}
```

### 4.8 Move nhiều item

```http
PATCH /api/library-items/move
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "items": [
    { "id": 1, "type": "document" },
    { "id": 2, "type": "folder" }
  ],
  "targetFolderId": 123
}
```

Rules:

- Kiểm tra `canMove` trên từng item.
- Kiểm tra user có quyền thêm item vào `targetFolderId`.
- Không cho move folder vào chính nó.
- Không cho move folder vào folder con của chính nó.
- Nếu trùng tên ở target, trả `409 NAME_CONFLICT` hoặc hỗ trợ auto rename qua option.

Optional body:

```json
{
  "conflictStrategy": "error"
}
```

Allowed values: `error`, `auto_rename`, `replace` nếu BE hỗ trợ.

Response:

```json
{
  "moved": [
    { "id": 1, "type": "document", "parentFolderId": 123 },
    { "id": 2, "type": "folder", "parentFolderId": 123 }
  ],
  "failed": []
}
```

### 4.9 Copy nhiều item

```http
POST /api/library-items/copy
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "items": [
    { "id": 1, "type": "document" },
    { "id": 2, "type": "folder" }
  ],
  "targetFolderId": 123,
  "conflictStrategy": "auto_rename"
}
```

Rules:

- Copy folder phải copy toàn bộ cây con, hoặc trả lỗi nếu chưa hỗ trợ.
- Kiểm tra `canCopy` và quyền thêm vào target.

Response:

```json
{
  "copied": [
    { "sourceId": 1, "newId": 1001, "type": "document" }
  ],
  "failed": []
}
```

### 4.10 Merge selected files into folder

```http
POST /api/folders/merge
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "name": "Tài liệu tháng 5",
  "parentFolderId": 123,
  "items": [
    { "id": 1, "type": "document" },
    { "id": 2, "type": "document" }
  ]
}
```

Behavior:

1. Tạo folder mới trong `parentFolderId`.
2. Move các item đã chọn vào folder mới.
3. Transaction atomic: nếu move fail thì rollback folder mới.

Response:

```json
{
  "folder": {
    "id": 999,
    "type": "folder",
    "name": "Tài liệu tháng 5",
    "parentFolderId": 123
  },
  "moved": [
    { "id": 1, "type": "document" },
    { "id": 2, "type": "document" }
  ]
}
```

---

## Phase 4: Trash, restore, favorite

### 4.11 Chuyển item vào trash

```http
PATCH /api/library-items/trash
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "items": [
    { "id": 1, "type": "document" },
    { "id": 2, "type": "folder" }
  ]
}
```

Rules:

- Soft delete bằng `trashedAt`, `trashedBy`.
- Folder vào trash thì toàn bộ cây con bị ẩn khỏi library thường.
- Chỉ owner/editor theo policy mới có `canDelete`.

Response:

```json
{
  "trashed": [
    { "id": 1, "type": "document", "trashedAt": "2026-05-20T08:00:00Z" }
  ],
  "failed": []
}
```

### 4.12 Lấy trash

```http
GET /api/library/trash?pageNumber=1&pageSize=50
Authorization: Bearer <token>
```

Response:

```json
{
  "items": [],
  "pagination": {}
}
```

### 4.13 Restore trash

```http
PATCH /api/library-items/restore
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "items": [
    { "id": 1, "type": "document" }
  ],
  "targetFolderId": 123
}
```

Notes:

- `targetFolderId` optional.
- Nếu parent cũ đã bị xóa, BE nên yêu cầu hoặc tự restore về root.

### 4.14 Delete forever

```http
DELETE /api/library-items
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "items": [
    { "id": 1, "type": "document" }
  ]
}
```

Rules:

- Chỉ item đang ở trash mới được delete forever.
- Xóa file object/blob tương ứng nếu không còn reference.

### 4.15 Favorite item

```http
PUT /api/library-items/:itemId/favorite
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "type": "folder",
  "favorite": true
}
```

Response:

```json
{
  "id": 123,
  "type": "folder",
  "isFavorite": true
}
```

### 4.16 Lấy favorites

```http
GET /api/library/favorites?pageNumber=1&pageSize=50
Authorization: Bearer <token>
```

Response giống library list:

```json
{
  "items": [],
  "pagination": {}
}
```

---

## Phase 5: Share link và permission

### 4.17 Tạo hoặc cập nhật share link

```http
POST /api/share-links
Authorization: Bearer <token>
Content-Type: application/json
```

Body:

```json
{
  "itemId": 789,
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

Allowed:

```txt
access: restricted | anyone_with_link
permission: viewer | editor
```

Response:

```json
{
  "shareLink": {
    "id": "abc123",
    "itemId": 789,
    "itemType": "document",
    "shareUrl": "https://docshare.vn/s/abc123",
    "access": "anyone_with_link",
    "permission": "viewer",
    "allowDownload": true,
    "expiresAt": null,
    "createdAt": "2026-05-20T08:00:00Z"
  }
}
```

### 4.18 Lấy share settings của item

```http
GET /api/share-links?itemId=789&itemType=document
Authorization: Bearer <token>
```

Response:

```json
{
  "shareLink": {
    "id": "abc123",
    "shareUrl": "https://docshare.vn/s/abc123",
    "access": "anyone_with_link",
    "permission": "viewer",
    "allowDownload": true,
    "expiresAt": null
  }
}
```

### 4.19 Tắt share link

```http
DELETE /api/share-links/:shareLinkId
Authorization: Bearer <token>
```

### 4.20 Public access bằng share link

```http
GET /api/s/:shareToken
```

Behavior:

- Nếu có password, trả trạng thái `password_required`.
- Nếu expired, trả `410 SHARE_LINK_EXPIRED`.
- Nếu vượt view/download limit, trả `410 SHARE_LINK_LIMIT_REACHED`.

Response:

```json
{
  "item": {},
  "permission": "viewer",
  "allowDownload": true,
  "requiresPassword": false
}
```

### 4.21 Verify password share link

```http
POST /api/s/:shareToken/verify-password
Content-Type: application/json
```

Body:

```json
{
  "password": "secret"
}
```

Response:

```json
{
  "accessToken": "short-lived-share-access-token"
}
```

---

## Phase 6: Search, recent, shared, team

### 4.22 Search library

```http
GET /api/library/search?q=bao%20gia&scope=all&folderId=123&pageNumber=1&pageSize=50
Authorization: Bearer <token>
```

Params:

| Param | Values |
|---|---|
| `scope` | `current`, `all` |
| `folderId` | required khi `scope=current` |
| `type` | `folder`, `document`, optional |
| `fileType` | `pdf`, `docx`, `image`, optional |
| `ownerId` | optional |
| `shared` | optional |
| `favorite` | optional |
| `dateFrom` / `dateTo` | optional |

Response:

```json
{
  "items": [],
  "pagination": {}
}
```

### 4.23 Recent

```http
GET /api/library/recent?pageNumber=1&pageSize=50
Authorization: Bearer <token>
```

Return các item user đã tạo/mở/cập nhật gần đây.

### 4.24 Shared with me

```http
GET /api/library/shared-with-me?pageNumber=1&pageSize=50
Authorization: Bearer <token>
```

Return cả folder và document được share trực tiếp hoặc qua membership.

### 4.25 Shared links page

```http
GET /api/share-links/my?pageNumber=1&pageSize=50
Authorization: Bearer <token>
```

Response:

```json
{
  "shareLinks": [
    {
      "id": "abc123",
      "itemId": 789,
      "itemType": "document",
      "itemName": "bao-gia.pdf",
      "shareUrl": "https://docshare.vn/s/abc123",
      "access": "anyone_with_link",
      "permission": "viewer",
      "views": 10,
      "downloads": 3,
      "expiresAt": null,
      "createdAt": "2026-05-20T08:00:00Z"
    }
  ],
  "pagination": {}
}
```

### 4.26 Team library

Nếu chưa có team/workspace model, BE có thể trả empty ổn định:

```http
GET /api/library/team
Authorization: Bearer <token>
```

Response:

```json
{
  "items": [],
  "pagination": {},
  "message": "Team library is not enabled"
}
```

---

## 5. Document preview/details

### 5.1 Lấy metadata/preview document

```http
GET /api/documents/:documentId/preview
Authorization: Bearer <token>
```

Response:

```json
{
  "document": {
    "id": 789,
    "type": "document",
    "name": "bao-gia.pdf",
    "mimeType": "application/pdf",
    "extension": "pdf",
    "size": 2400000,
    "thumbnailUrl": "/thumbs/789.jpg",
    "previewUrl": "/previews/789",
    "downloadUrl": "/api/documents/789/download",
    "status": "ready",
    "allowDownload": true,
    "permission": "viewer",
    "permissions": {}
  },
  "metadata": {
    "ownerName": "Nguyen Van A",
    "createdAt": "2026-05-20T08:00:00Z",
    "updatedAt": "2026-05-20T08:30:00Z",
    "views": 10,
    "downloads": 3
  },
  "versions": [],
  "comments": []
}
```

### 5.2 Download document

```http
GET /api/documents/:documentId/download
Authorization: Bearer <token>
```

Rules:

- Kiểm tra `canDownload`.
- Tăng download count.
- Với share token, nhận `Share-Access-Token` hoặc query/token riêng tùy BE chọn.

---

## 6. Member và invite folder

Nếu hệ thống hiện có folder member API, cần chuẩn hóa response permission.

### 6.1 Lấy members

```http
GET /api/folders/:folderId/members
Authorization: Bearer <token>
```

Response:

```json
{
  "members": [
    {
      "userId": "u1",
      "displayName": "Nguyen Van A",
      "email": "a@example.com",
      "avatarUrl": null,
      "role": "editor",
      "joinedAt": "2026-05-20T08:00:00Z"
    }
  ],
  "pagination": {}
}
```

### 6.2 Add/update/remove member

```http
POST /api/folders/:folderId/members
PATCH /api/folders/:folderId/members/:userId
DELETE /api/folders/:folderId/members/:userId
```

Roles:

```txt
owner
admin
editor
viewer
```

BE có thể map role cũ `contributor/commenter` sang permission set, nhưng response nên cho FE biết permission cuối cùng.

### 6.3 Folder invites

```http
POST /api/folders/:folderId/invites
GET /api/folders/:folderId/invites
POST /api/folder-invites/:inviteId/accept
POST /api/folder-invites/:inviteId/decline
POST /api/folders/:folderId/invites/:inviteId/cancel
```

Invite response nên có:

```json
{
  "invite": {
    "id": 1,
    "folderId": 123,
    "folderName": "Marketing",
    "inviteeEmail": "b@example.com",
    "role": "viewer",
    "status": "pending",
    "expiresAt": "2026-06-20T08:00:00Z",
    "createdAt": "2026-05-20T08:00:00Z"
  }
}
```

---

## 7. Permission matrix tối thiểu

| Action | Owner | Editor | Viewer |
|---|---:|---:|---:|
| View item | yes | yes | yes |
| Download | yes | yes | if allowed |
| Upload file | yes | yes | no |
| Create folder | yes | yes | no |
| Rename | yes | policy | no |
| Move | yes | policy | no |
| Copy | yes | yes | no |
| Share | yes | policy | no |
| Delete/trash | yes | policy | no |
| Manage members | yes | no | no |

BE phải trả permission cụ thể trong từng item để FE không tự đoán từ role.

---

## 8. Error contract

Tất cả lỗi nên theo format:

```json
{
  "success": false,
  "code": "FOLDER_NAME_EXISTS",
  "message": "Tên thư mục này đã tồn tại.",
  "details": {}
}
```

Mã lỗi tối thiểu:

| HTTP | Code | Khi nào |
|---:|---|---|
| 400 | `VALIDATION_ERROR` | Payload thiếu/sai |
| 401 | `UNAUTHORIZED` | Chưa login/token hết hạn |
| 403 | `FORBIDDEN` | Không có quyền |
| 404 | `FOLDER_NOT_FOUND` | Folder không tồn tại/không thấy |
| 404 | `DOCUMENT_NOT_FOUND` | Document không tồn tại/không thấy |
| 409 | `FOLDER_NAME_EXISTS` | Trùng folder name trong parent |
| 409 | `DOCUMENT_NAME_EXISTS` | Trùng document name trong parent |
| 409 | `NAME_CONFLICT` | Move/copy conflict |
| 409 | `CANNOT_MOVE_FOLDER_INTO_ITSELF` | Move folder vào chính nó |
| 409 | `CANNOT_MOVE_FOLDER_INTO_DESCENDANT` | Move folder vào folder con |
| 410 | `SHARE_LINK_EXPIRED` | Link share hết hạn |
| 410 | `SHARE_LINK_LIMIT_REACHED` | Link vượt giới hạn |
| 422 | `UNSUPPORTED_FILE_TYPE` | File không hỗ trợ |
| 422 | `FILE_TOO_LARGE` | File quá lớn |
| 500 | `INTERNAL_ERROR` | Lỗi server |

---

## 9. Notification target_url

BE nên trả URL mới theo `/documents`:

| Event | `targetUrl` |
|---|---|
| `folder_invite` | `/folder-invites` |
| `folder_invite_accepted` | `/documents/folders/:folderId` |
| `folder_invite_declined` | `/documents/folders/:folderId/invites` |
| `folder_member_added` | `/documents/folders/:folderId` |
| `folder_member_removed` | `/documents/shared-with-me` |
| `folder_role_changed` | `/documents/folders/:folderId` |
| `folder_document_added` | `/documents/folders/:folderId` |
| `document_shared` | `/documents/files/:documentId` |
| `share_link_viewed` | `/documents/shared-links` |

---

## 10. Backward compatibility

FE hiện còn đang có API cũ:

```http
GET /api/Documents/my-uploaded-documents
POST /api/Documents/upload-document
GET /api/folders/my
GET /api/folders/shared-with-me
GET /api/folders/:folderId
GET /api/folders/:folderId/documents
POST /api/folders/:folderId/documents
DELETE /api/folders/:folderId/documents/:documentId
```

BE có thể giữ API cũ để không phá production, nhưng API workspace mới nên là nguồn chính.

Khuyến nghị migration:

1. Thêm API mới song song.
2. FE chuyển Library/Folder sang API mới.
3. Sau khi ổn định, deprecate endpoint cũ bằng warning/log.

---

## 11. Acceptance checklist cho BE

- [ ] `GET /api/library/my` trả folder + document chung trong `items`.
- [ ] `GET /api/folders/:folderId/items` trả folder hiện tại, breadcrumb, permissions và items.
- [ ] Folder có `parentFolderId` và tạo folder con được.
- [ ] Upload file nhận `parentFolderId` và không bắt buộc categories/tags.
- [ ] Upload nhiều file trả status `processing/ready/failed`.
- [ ] Rename/move/copy/delete hỗ trợ cả folder và document.
- [ ] Move folder vào chính nó/folder con bị chặn ở BE.
- [ ] Trash/restore/delete forever hoạt động.
- [ ] Favorite hoạt động cho cả folder và document.
- [ ] Share link hoạt động cho cả folder và document.
- [ ] Shared-with-me/recent/favorites/shared-links/trash có endpoint riêng.
- [ ] Mọi item trả permission cụ thể.
- [ ] Error response có `code` ổn định cho FE xử lý.
- [ ] Notification target URL dùng route mới.

---

## 12. Ưu tiên triển khai đề xuất

1. `GET /api/library/my`, `GET /api/folders/:folderId/items`, `POST /api/folders`.
2. Upload nhiều file với `parentFolderId` và preview status.
3. Rename/move/copy/trash/favorite unified library item API.
4. Folder tree cho move/copy picker.
5. Share link và shared-links page.
6. Recent/search/filter nâng cao.
7. Team library nếu sản phẩm cần workspace nhóm.
