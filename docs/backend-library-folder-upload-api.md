# Backend API Notes: My Library + Folder Upload

Frontend đã gộp `My Documents` và `Folders` thành một màn hình:

```text
/library
/library?tab=documents
/library?tab=folders
/library?tab=shared
/library/folders/:folderId
```

Các route cũ chỉ còn redirect/compat:

```text
/my-documents -> /library?tab=documents
/folders -> /library?tab=folders
/folders/shared-with-me -> /library?tab=shared
```

## 1. API thư viện đề xuất

Hiện FE đang gọi song song:

```http
GET /api/Documents/my-uploaded-documents
GET /api/folders/my
GET /api/folders/shared-with-me
```

Để tối ưu, BE có thể thêm endpoint tổng hợp:

```http
GET /api/library/my?search=&pageNumber=1&pageSize=24
Authorization: Bearer <access_token>
```

Response đề xuất:

```json
{
  "success": true,
  "documents": [],
  "folders": [],
  "shared_folders": [],
  "counts": {
    "documents": 12,
    "folders": 4,
    "shared_folders": 2
  }
}
```

## 2. Upload tài liệu trực tiếp vào folder

FE hiện gọi:

```text
/upload-document?folderId=123
```

Trong flow này, tài liệu trong folder **không cần tag và categories**.

Hiện FE vẫn dùng flow an toàn:

1. `POST /api/Documents/upload-document`
2. `PUT /api/Documents/update-document-after-upload`
3. `POST /api/folders/:folderId/documents`

BE nên hỗ trợ flow ngắn hơn bằng cách cho upload nhận thêm `folder_id`.

```http
POST /api/Documents/upload-document
Content-Type: multipart/form-data
Authorization: Bearer <access_token>
```

Form data:

```text
file=<binary>
folder_id=123 optional
```

Behavior:

- Nếu không có `folder_id`: giữ behavior upload hiện tại.
- Nếu có `folder_id`:
  - Kiểm tra folder tồn tại.
  - Kiểm tra user có `can_add_document`.
  - Tạo document draft như hiện tại.
  - Gắn document vào folder hoặc trả thông tin để FE gọi bước gắn sau.
  - Không bắt buộc document có categories/tags.

Response nên có:

```json
{
  "success": true,
  "document_id": 10,
  "folder_id": 123,
  "added_to_folder": true,
  "title": "file.pdf",
  "thumbnail_url": "https://..."
}
```

## 3. Update metadata sau upload trong folder

Endpoint hiện tại:

```http
PUT /api/Documents/update-document-after-upload
```

Payload folder upload:

```json
{
  "document_id": 10,
  "title": "Tài liệu nhóm",
  "description": "Bản dùng trong thư mục lớp",
  "is_public": false,
  "tags": [],
  "categories": []
}
```

Yêu cầu BE:

- Cho phép `tags` rỗng.
- Cho phép `categories` rỗng khi document đã/đang được gắn với folder.
- Không trả lỗi validation bắt buộc category trong trường hợp folder upload.

Nếu muốn rõ ràng hơn, BE có thể nhận thêm:

```json
{
  "folder_id": 123,
  "skip_discovery_metadata": true
}
```

## 4. Folder document permissions

Khi FE mở:

```http
GET /api/folders/:folderId
```

FE dùng `permissions.can_add_document` để hiện:

- `Tải tài liệu mới`
- `Thêm tài liệu có sẵn`

BE cần đảm bảo response có:

```json
{
  "current_user_role": "editor",
  "permissions": {
    "can_add_document": true,
    "can_remove_document": true
  }
}
```

## 5. Notification target_url mới

BE nên ưu tiên trả `target_url` theo route mới:

| Type | target_url |
|---|---|
| `folder_invite` | `/folder-invites` |
| `folder_invite_accepted` | `/library/folders/:folderId` |
| `folder_invite_declined` | `/library/folders/:folderId/invites` |
| `folder_member_added` | `/library/folders/:folderId` |
| `folder_member_removed` | `/library?tab=shared` |
| `folder_role_changed` | `/library/folders/:folderId` |
| `folder_document_added` | `/library/folders/:folderId/documents` |

FE vẫn có fallback cho URL cũ dạng `/folders/:folderId`.
