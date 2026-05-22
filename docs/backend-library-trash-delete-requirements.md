# Backend Requirements: Delete, Trash, Restore cho Library và Folder

> Mục tiêu: sửa lỗi FE không xóa được file/thư mục trong `/library` và `/library/folders/:folderId`.
> FE hiện đã gọi API workspace item chung cho cả `document` và `folder`; BE cần bổ sung/chuẩn hóa endpoint và database để hỗ trợ soft delete, trash, restore và delete forever.

## 1. FE đang gọi API nào

File FE liên quan:

- `src/api/workspaceLibraryApi.ts`
- `src/pages/Library/MyLibraryPage.tsx`
- `src/pages/Folders/FolderDetailPage.tsx`

Các method FE đang gọi:

```ts
workspaceLibraryApi.trashItems(items)
workspaceLibraryApi.restoreItems(items)
workspaceLibraryApi.deleteItemsForever(items)
workspaceLibraryApi.getTrash(params)
```

Endpoint tương ứng:

```http
PATCH /api/library-items/trash
PATCH /api/library-items/restore
DELETE /api/library-items
GET /api/library/trash
```

Nếu backend đang dùng base route không có `/api`, giữ route tương đương:

```http
PATCH /library-items/trash
PATCH /library-items/restore
DELETE /library-items
GET /library/trash
```

## 2. Item model FE cần

BE cần coi `document` và `folder` là `library item` chung.

```ts
type LibraryItemType = "document" | "folder";

interface LibraryItemRef {
  id: number;
  type: LibraryItemType;
}
```

Payload batch luôn có dạng:

```json
{
  "items": [
    { "id": 10, "type": "document" },
    { "id": 22, "type": "folder" }
  ]
}
```

## 3. Endpoint chuyển vào thùng rác

```http
PATCH /api/library-items/trash
Content-Type: application/json
Authorization: Bearer <token>
```

Request:

```json
{
  "items": [
    { "id": 10, "type": "document" },
    { "id": 22, "type": "folder" }
  ]
}
```

Response thành công toàn bộ:

```json
{
  "success": true,
  "trashed": [
    {
      "id": 10,
      "type": "document",
      "trashedAt": "2026-05-21T10:00:00Z"
    },
    {
      "id": 22,
      "type": "folder",
      "trashedAt": "2026-05-21T10:00:00Z"
    }
  ],
  "failed": []
}
```

Response thành công một phần:

```json
{
  "success": false,
  "trashed": [
    {
      "id": 10,
      "type": "document",
      "trashedAt": "2026-05-21T10:00:00Z"
    }
  ],
  "failed": [
    {
      "id": 22,
      "type": "folder",
      "code": "FORBIDDEN",
      "message": "Bạn không có quyền xóa thư mục này."
    }
  ]
}
```

Business rules:

- User phải đăng nhập.
- User chỉ được trash item nếu có quyền `canDelete`.
- Owner/admin được xóa.
- Viewer không được xóa.
- Editor/contributor có được xóa hay không tùy policy BE, nhưng response `permissions.canDelete` phải phản ánh đúng.
- Item đã ở trash gọi lại nên trả success idempotent hoặc failed với code rõ ràng `ALREADY_TRASHED`.
- Khi trash folder, toàn bộ folder con và document bên trong phải bị ẩn khỏi library thường.
- Nên trash đệ quy toàn bộ subtree trong transaction.
- Trash folder root chỉ nên hiển thị folder root trong thùng rác, không cần hiển thị từng item con riêng lẻ.

## 4. Endpoint lấy thùng rác

```http
GET /api/library/trash?pageNumber=1&pageSize=50&sort=deleted_desc
Authorization: Bearer <token>
```

Response:

```json
{
  "folder": {
    "id": null,
    "name": "Thùng rác",
    "parentFolderId": null,
    "breadcrumb": [
      { "id": null, "name": "Thư viện", "href": "/library" },
      { "id": null, "name": "Thùng rác", "href": "/library?area=trash" }
    ],
    "permissions": {
      "canView": true,
      "canDelete": true
    }
  },
  "items": [
    {
      "id": 22,
      "type": "folder",
      "name": "Marketing",
      "parentFolderId": null,
      "ownerId": "user-1",
      "ownerName": "Nguyen Van A",
      "documentCount": 12,
      "folderCount": 3,
      "childrenCount": 15,
      "totalSize": 2048000,
      "trashedAt": "2026-05-21T10:00:00Z",
      "permissions": {
        "canView": true,
        "canDelete": true,
        "canRename": false,
        "canMove": false,
        "canCopy": false,
        "canShare": false,
        "canDownload": false
      }
    },
    {
      "id": 10,
      "type": "document",
      "name": "Bao cao.pdf",
      "title": "Bao cao",
      "parentFolderId": null,
      "ownerId": "user-1",
      "ownerName": "Nguyen Van A",
      "mimeType": "application/pdf",
      "extension": "pdf",
      "size": 500000,
      "trashedAt": "2026-05-21T10:00:00Z",
      "permissions": {
        "canView": true,
        "canDelete": true,
        "canDownload": false
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 50,
    "totalCount": 2,
    "totalPages": 1
  },
  "counts": {
    "trash": 2
  }
}
```

Rules:

- Chỉ trả item user có quyền nhìn thấy/xóa khỏi trash.
- Với folder bị trash đệ quy, chỉ trả folder root nếu `deletedRootType = "folder"` và `deletedRootId = folder.id`.
- Không trả các item con riêng lẻ nếu chúng bị trash do folder cha.
- Sort mặc định `deleted_desc`.

## 5. Endpoint khôi phục

```http
PATCH /api/library-items/restore
Content-Type: application/json
Authorization: Bearer <token>
```

Request:

```json
{
  "items": [
    { "id": 10, "type": "document" },
    { "id": 22, "type": "folder" }
  ]
}
```

Response:

```json
{
  "success": true,
  "restored": [
    { "id": 10, "type": "document", "parentFolderId": null },
    { "id": 22, "type": "folder", "parentFolderId": null }
  ],
  "failed": []
}
```

Business rules:

- Chỉ restore item đang ở trash.
- Restore folder phải restore cả subtree đã bị trash bởi folder đó.
- Nếu parent folder cũ vẫn tồn tại và không bị trash, restore về parent cũ.
- Nếu parent folder cũ đã bị xóa vĩnh viễn hoặc user không còn quyền, restore về root library của user và trả `parentFolderId: null`.
- Nếu tên bị trùng trong parent đích, BE nên auto rename, ví dụ `Marketing (restored)` hoặc `Marketing (1)`.
- Restore phải chạy trong transaction.

## 6. Endpoint xóa vĩnh viễn

```http
DELETE /api/library-items
Content-Type: application/json
Authorization: Bearer <token>
```

Request:

```json
{
  "items": [
    { "id": 10, "type": "document" },
    { "id": 22, "type": "folder" }
  ]
}
```

Response:

```json
{
  "success": true,
  "deleted": [
    { "id": 10, "type": "document" },
    { "id": 22, "type": "folder" }
  ],
  "failed": []
}
```

Business rules:

- Chỉ cho delete forever với item đang ở trash.
- Delete forever document phải xóa DB record liên quan hoặc đánh dấu hard-deleted theo policy hiện có.
- Delete forever folder phải xóa toàn bộ subtree folder + document con.
- Cần xóa/cascade dữ liệu phụ thuộc nếu có:
  - share links
  - favorites
  - folder members/invites
  - document-folder relation nếu có bảng join
  - previews/thumbnails metadata
  - search index entries
- File vật lý/blob storage nên xóa async qua job nếu hệ thống có storage riêng. DB vẫn cần phản ánh item đã bị xóa vĩnh viễn ngay.

## 7. Database yêu cầu

Nếu database hiện chưa có soft delete/trash, agent BE cần sinh migration SQL.

### 7.1 Cột bắt buộc cho `documents`

Thêm nếu chưa có:

```sql
ALTER TABLE documents
ADD COLUMN deleted_at TIMESTAMPTZ NULL,
ADD COLUMN deleted_by UUID NULL,
ADD COLUMN deleted_root_type VARCHAR(20) NULL,
ADD COLUMN deleted_root_id BIGINT NULL,
ADD COLUMN original_parent_folder_id BIGINT NULL;
```

Ý nghĩa:

- `deleted_at`: thời điểm item vào trash.
- `deleted_by`: user xóa.
- `deleted_root_type`: `document` hoặc `folder`.
- `deleted_root_id`: id của item gốc được user bấm xóa.
- `original_parent_folder_id`: parent folder trước khi vào trash, dùng để restore.

Nếu bảng user dùng kiểu khác UUID, đổi `deleted_by` theo type khóa chính thực tế.

### 7.2 Cột bắt buộc cho `folders`

Thêm nếu chưa có:

```sql
ALTER TABLE folders
ADD COLUMN deleted_at TIMESTAMPTZ NULL,
ADD COLUMN deleted_by UUID NULL,
ADD COLUMN deleted_root_type VARCHAR(20) NULL,
ADD COLUMN deleted_root_id BIGINT NULL,
ADD COLUMN original_parent_folder_id BIGINT NULL;
```

Nếu `folders.parent_folder_id` đã lưu parent hiện tại, vẫn nên giữ `original_parent_folder_id` để restore an toàn khi parent bị đổi/xóa.

### 7.3 Ràng buộc dữ liệu nên có

```sql
ALTER TABLE documents
ADD CONSTRAINT documents_deleted_root_type_check
CHECK (deleted_root_type IS NULL OR deleted_root_type IN ('document', 'folder'));

ALTER TABLE folders
ADD CONSTRAINT folders_deleted_root_type_check
CHECK (deleted_root_type IS NULL OR deleted_root_type IN ('folder'));
```

Ghi chú:

- Với `folders`, root type thường chỉ là `folder`.
- Với `documents`, root type là `document` nếu user xóa trực tiếp document, hoặc `folder` nếu document bị xóa theo folder cha.

### 7.4 Index bắt buộc/nên có

```sql
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at
ON documents (deleted_at);

CREATE INDEX IF NOT EXISTS idx_documents_deleted_root
ON documents (deleted_root_type, deleted_root_id);

CREATE INDEX IF NOT EXISTS idx_documents_owner_deleted
ON documents (user_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_folders_deleted_at
ON folders (deleted_at);

CREATE INDEX IF NOT EXISTS idx_folders_deleted_root
ON folders (deleted_root_type, deleted_root_id);

CREATE INDEX IF NOT EXISTS idx_folders_owner_deleted
ON folders (owner_id, deleted_at);
```

Điều chỉnh tên cột owner:

- Nếu document owner là `user_id`, giữ `user_id`.
- Nếu folder owner là `owner_id`, giữ `owner_id`.
- Nếu schema dùng tên khác, agent BE phải map lại theo schema thực tế.

### 7.5 Bảng trash log tùy chọn

Nếu muốn audit tốt hơn, tạo thêm bảng:

```sql
CREATE TABLE library_trash_events (
  id BIGSERIAL PRIMARY KEY,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('document', 'folder')),
  item_id BIGINT NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('trash', 'restore', 'delete_forever')),
  actor_id UUID NOT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_library_trash_events_item
ON library_trash_events (item_type, item_id, created_at DESC);
```

Bảng này không bắt buộc cho FE, nhưng hữu ích để debug và audit.

## 8. Query/filter bắt buộc ở các endpoint library hiện có

Các endpoint list thường phải loại item trong trash:

```http
GET /api/library/my
GET /api/folders/:folderId/items
GET /api/library/recent
GET /api/library/favorites
GET /api/library/shared-with-me
GET /api/library/team
GET /api/library/search
```

Rule:

- Chỉ trả `documents.deleted_at IS NULL`.
- Chỉ trả `folders.deleted_at IS NULL`.
- Khi lấy folder items, nếu folder hiện tại đã bị trash thì trả `404 FOLDER_NOT_FOUND` hoặc `410 GONE`.
- Search không index/không trả item trong trash.
- Recent không trả item trong trash.
- Favorites không trả item trong trash, trừ khi đang ở `/library/trash`.

## 9. Permission response bắt buộc

Mỗi item trả về FE cần có:

```json
{
  "permissions": {
    "canView": true,
    "canDownload": true,
    "canUpload": false,
    "canCreateFolder": false,
    "canRename": true,
    "canMove": true,
    "canCopy": true,
    "canShare": true,
    "canDelete": true,
    "canManageMembers": false
  }
}
```

Để nút xóa hiện đúng, BE cần trả:

```json
{
  "permissions": {
    "canDelete": true
  }
}
```

cho item mà user được phép xóa. Nếu `canDelete: false`, FE sẽ disable/ẩn thao tác xóa trong một số ngữ cảnh.

## 10. Error contract

Với batch endpoint, ưu tiên trả HTTP 200 nếu request hợp lệ nhưng có item fail một phần.

```json
{
  "success": false,
  "trashed": [],
  "failed": [
    {
      "id": 99,
      "type": "folder",
      "code": "FOLDER_NOT_FOUND",
      "message": "Không tìm thấy thư mục."
    }
  ]
}
```

Các code nên hỗ trợ:

| HTTP | Code | Khi nào dùng |
| --- | --- | --- |
| 400 | `INVALID_PAYLOAD` | Payload thiếu `items` hoặc type sai |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập |
| 403 | `FORBIDDEN` | Không có quyền xóa/restore/delete forever |
| 404 | `DOCUMENT_NOT_FOUND` | Document không tồn tại hoặc không thuộc phạm vi user |
| 404 | `FOLDER_NOT_FOUND` | Folder không tồn tại hoặc không thuộc phạm vi user |
| 409 | `ALREADY_TRASHED` | Item đã ở trash |
| 409 | `NOT_TRASHED` | Restore/delete forever item chưa ở trash |
| 409 | `RESTORE_NAME_CONFLICT` | Nếu BE không auto rename khi restore |

## 11. Transaction và thuật toán gợi ý

### 11.1 Trash document

1. Validate item tồn tại và user có `canDelete`.
2. Set:
   - `deleted_at = now()`
   - `deleted_by = current_user_id`
   - `deleted_root_type = 'document'`
   - `deleted_root_id = document.id`
   - `original_parent_folder_id = document.parent_folder_id`
3. Không xóa file vật lý.
4. Commit.

### 11.2 Trash folder

1. Validate folder tồn tại và user có `canDelete`.
2. Lấy toàn bộ descendant folder ids bằng recursive CTE.
3. Lấy toàn bộ documents nằm trong folder root và descendant folders.
4. Trong một transaction:
   - Update folder root và descendants:
     - `deleted_at = now()`
     - `deleted_by = current_user_id`
     - `deleted_root_type = 'folder'`
     - `deleted_root_id = root_folder.id`
     - `original_parent_folder_id = parent_folder_id`
   - Update documents trong subtree:
     - `deleted_at = now()`
     - `deleted_by = current_user_id`
     - `deleted_root_type = 'folder'`
     - `deleted_root_id = root_folder.id`
     - `original_parent_folder_id = parent_folder_id`
5. Commit.

### 11.3 Restore folder

1. Validate folder root đang ở trash và `deleted_root_id = folder.id`.
2. Chọn parent restore:
   - Nếu `original_parent_folder_id` còn tồn tại và không bị trash: dùng parent đó.
   - Ngược lại: `null`.
3. Auto rename nếu trùng tên.
4. Trong transaction:
   - Restore root folder và descendants có `deleted_root_type = 'folder'` + `deleted_root_id = root.id`.
   - Restore documents có cùng root.
   - Clear:
     - `deleted_at`
     - `deleted_by`
     - `deleted_root_type`
     - `deleted_root_id`
   - Có thể giữ hoặc clear `original_parent_folder_id`; khuyến nghị clear sau restore.
5. Commit.

### 11.4 Delete forever folder

1. Chỉ cho xóa nếu folder root đang trash.
2. Lấy descendants/documents cùng `deleted_root_type = 'folder'` và `deleted_root_id = root.id`.
3. Xóa dữ liệu phụ thuộc trước.
4. Xóa documents.
5. Xóa folders từ leaf lên root.
6. Commit.
7. Queue job xóa blob storage nếu có.

## 12. Checklist nghiệm thu

- [ ] `PATCH /api/library-items/trash` xóa mềm được một document ở root library.
- [ ] `PATCH /api/library-items/trash` xóa mềm được một folder rỗng.
- [ ] `PATCH /api/library-items/trash` xóa mềm được folder có folder con và document con.
- [ ] Item đã trash không còn xuất hiện trong `/api/library/my`.
- [ ] Item đã trash không còn xuất hiện trong `/api/folders/:folderId/items`.
- [ ] `GET /api/library/trash` trả document bị xóa trực tiếp.
- [ ] `GET /api/library/trash` trả folder root bị xóa, không spam toàn bộ item con.
- [ ] `PATCH /api/library-items/restore` khôi phục được document.
- [ ] `PATCH /api/library-items/restore` khôi phục được folder cùng subtree.
- [ ] `DELETE /api/library-items` xóa vĩnh viễn được document đang trash.
- [ ] `DELETE /api/library-items` xóa vĩnh viễn được folder đang trash cùng subtree.
- [ ] User không có quyền nhận failed item với message rõ ràng.
- [ ] Response item có `permissions.canDelete` đúng.
- [ ] Batch payload nhiều item trả `trashed/restored/deleted` và `failed` đúng.

## 13. Ghi chú cho agent sinh SQL/code

Agent BE cần đọc schema thực tế trước khi sinh migration:

- Tên bảng document có thể là `documents` hoặc `Documents`.
- Tên khóa chính có thể là `id` hoặc `document_id`.
- Tên bảng folder có thể là `folders`.
- Tên khóa chính folder có thể là `id` hoặc `folder_id`.
- Tên cột owner có thể là `user_id`, `owner_id`, hoặc biến thể khác.
- Tên parent folder có thể là `parent_folder_id` hoặc `parentFolderId`.
- Kiểu user id có thể là `UUID`, `TEXT`, `VARCHAR`, hoặc `INT`.

Không được copy nguyên SQL ở trên nếu schema thực tế khác. Hãy map cột theo database hiện tại rồi mới tạo migration.
