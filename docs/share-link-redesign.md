# Thiết kế lại chức năng chia sẻ tài liệu (FE + BE)

> Hướng dẫn thực thi cho Agent. Nhánh `retest`, ngày 04/10/2026.
> Phạm vi: modal chia sẻ ở trang `/document/:documentID`, dialog chia sẻ ở `/library` và API `share-links`.
> Đánh dấu `[x]` khi đã xong từng mục.

## Mục lục

- [1. Bối cảnh](#1-bối-cảnh)
- [2. Các lỗi hiện tại cần xử lý](#2-các-lỗi-hiện-tại-cần-xử-lý)
- [3. Thiết kế đích](#3-thiết-kế-đích)
- [4. Backend (DocShareAPI)](#4-backend-docshareapi)
- [5. Frontend (documents-sharing)](#5-frontend-documents-sharing)
- [6. Kiểm thử](#6-kiểm-thử)
- [7. Thứ tự thực hiện và tiêu chí hoàn thành](#7-thứ-tự-thực-hiện-và-tiêu-chí-hoàn-thành)
- [8. Ngoài phạm vi](#8-ngoài-phạm-vi)

---

## 1. Bối cảnh

### Hai repo

| Repo | Đường dẫn | Công nghệ |
|---|---|---|
| Frontend | `C:\HocTap\GitHub\documents-sharing` | React 19 + CRA (`react-scripts` 5), TypeScript, Tailwind |
| Backend | `C:\HocTap\GitHub\DocShareAPI` | ASP.NET Core, EF Core + MySQL, xUnit (`DocShareAPI.Tests`) |

### File liên quan

**Frontend**

- [src/pages/Documents/DocumentDetail/DocumentDetail.tsx](../src/pages/Documents/DocumentDetail/DocumentDetail.tsx): state chia sẻ (dòng ~139-147), handler `handleShare` / `saveShareLink` / `copyShareLink` / `disableShareLink` (dòng ~368-450), nút "Chia sẻ" (dòng ~747-756), modal viết inline (dòng ~870-936).
- [src/components/Workspace/dialogs/ShareDialog.tsx](../src/components/Workspace/dialogs/ShareDialog.tsx): dialog chia sẻ dùng ở thư viện. Đang phụ thuộc `useLibraryContext()`, hook này **throw lỗi** nếu không nằm trong `LibraryLayout`.
- [src/components/Workspace/dialogs/Modal.tsx](../src/components/Workspace/dialogs/Modal.tsx): modal dùng chung, đã có Esc, click nền để đóng, focus trap và prop `busy`.
- [src/api/workspaceLibraryApi.ts](../src/api/workspaceLibraryApi.ts): `ShareLinkSettings`, `createShareLink`, `getShareLinkSettings`, `disableShareLink`.
- [src/utils/workspaceItemLinks.ts](../src/utils/workspaceItemLinks.ts): `copyTextToClipboard` (có fallback khi không có Clipboard API).
- [src/utils/workspaceLibraryHelpers.ts](../src/utils/workspaceLibraryHelpers.ts): `toDateTimeLocalValue`.
- Nơi dùng `ShareDialog`: [MyLibraryPage.tsx:435](../src/pages/Library/MyLibraryPage.tsx#L435), [FolderDetailPage.tsx:367](../src/pages/Folders/FolderDetailPage.tsx#L367).
- Test: [src/components/Workspace/workspaceRegression.test.js](../src/components/Workspace/workspaceRegression.test.js) (test `copy link creates a missing link and catches clipboard errors`).
- Trang công khai của link: [src/pages/Share/PublicSharePage.tsx](../src/pages/Share/PublicSharePage.tsx) (route `/s/:token`). **Không cần sửa.**

**Backend**

- `DocShareAPI/Controllers/ShareLinksController.cs`: toàn bộ API share link.
- `DocShareAPI/Controllers/Public/PublicDocumentsController.cs`: `GET /api/public/document/{documentID}` (`GetDocumentByID`), là dữ liệu của trang `/document/:id`.
- `DocShareAPI/Models/ShareLinks.cs`
- `DocShareAPI.Tests/BackendSecurityRegressionTests.cs`: mẫu test có dùng `SHARE_LINKS`.

### Hành vi backend hiện tại (đã đọc code, cần nắm rõ)

- `POST /api/share-links` tạo **hoặc cập nhật** link duy nhất đang hoạt động của cặp (owner, item). **Token giữ nguyên khi cập nhật**, nên URL không đổi.
- Chỉ chủ tài liệu hoặc admin được tạo link (`CanShare`). Với thư mục thì chỉ chủ thư mục. Người khác nhận `Forbid()`, tức 403 **không có body**.
- `permission` chỉ nhận `null` hoặc `"viewer"`. Gửi `"editor"` sẽ nhận 400 `INVALID_PERMISSION`.
- `access` nhận `"anyone_with_link"` hoặc `"restricted"`. Tuy nhiên `GetActivePublicLink` chỉ tìm link có `access == "anyone_with_link"`, nên **link `restricted` không ai mở được** (404).
- `password`: `null` nghĩa là giữ nguyên, `""` (hoặc khoảng trắng) nghĩa là xóa mật khẩu, chuỗi khác nghĩa là đặt mật khẩu mới.
- Response `ToResponse` đã trả về `requiresPassword`, `views`, `downloads`, `expiresAt`... nhưng FE chưa dùng.
- `expiresAt` là `DateTime?`, được lưu và so sánh trực tiếp với `DateTime.UtcNow`, không chuẩn hóa múi giờ.

---

## 2. Các lỗi hiện tại cần xử lý

| # | Lỗi | Nguyên nhân | Xử lý ở |
|---|---|---|---|
| L1 | Chọn "Editor" ở trang tài liệu thì báo lỗi | FE có option `editor`, BE chỉ nhận `viewer` | FE 5.2 |
| L2 | Chọn "Restricted" vẫn hiện và cho copy một link chết | BE không phục vụ link `restricted` | FE 5.2 |
| L3 | Người không phải chủ bấm "Chia sẻ" thì nhận lỗi khó hiểu | Nút hiện cho mọi người; BE trả 403 rỗng | BE 4.1, 4.3; FE 5.3 |
| L4 | "Sao chép liên kết" không lưu thay đổi cài đặt | `copyShareLink` chỉ lưu khi chưa có link | FE 5.2 |
| L5 | Không biết link có mật khẩu chưa; không xóa được mật khẩu | FE luôn reset ô mật khẩu về rỗng rồi gửi `null` | FE 5.2 |
| L6 | Hạn dùng lệch múi giờ (VN: link sống thêm 7 giờ) | FE gửi giờ địa phương không có offset; BE coi như UTC; BE trả về không có `Z` | BE 4.2; FE 5.2 |
| L7 | Ô mật khẩu ở trang tài liệu là `type="text"` | Modal viết riêng, lệch với `ShareDialog` | FE 5.3 (dùng chung dialog) |
| L8 | Nhãn lẫn tiếng Anh (`Restricted`, `Permission`, `Viewer`...) | Modal viết riêng | FE 5.3 |
| L9 | Modal ở trang tài liệu không đóng bằng Esc hay click nền, không có trạng thái đang tải | Không dùng `Modal.tsx` | FE 5.3 |
| L10 | Nhãn nguồn truy cập không bao giờ hiển thị đúng | FE map key `public` / `owner`, BE trả `public_document` / `owner_or_admin` | FE 5.4 |

---

## 3. Thiết kế đích

### 3.1. Nguyên tắc

1. Trường hợp phổ biến nhất ("lấy link rồi copy") chỉ cần **một cú bấm**.
2. Không hiển thị lựa chọn nào mà backend không hỗ trợ.
3. Mọi thay đổi đều có trạng thái rõ ràng: đã lưu, đang lưu hoặc chưa lưu.
4. Một component chia sẻ duy nhất cho cả trang tài liệu và thư viện.

### 3.2. Nút "Chia sẻ" trên trang `/document/:id`

| Người xem | Hành vi khi bấm |
|---|---|
| Chủ tài liệu hoặc admin (`can_share === true`) | Mở `ShareDialog` |
| Người khác, tài liệu công khai | Copy `window.location.origin + "/document/" + id`, toast "Đã sao chép liên kết trang tài liệu." **Không yêu cầu đăng nhập.** |
| Người khác, tài liệu riêng tư (xem được qua thư mục) | Copy link trang như trên, toast "Đã sao chép liên kết. Chỉ người có quyền truy cập thư mục mới mở được." |

Trên thiết bị có `navigator.share` (điện thoại), có thể gọi `navigator.share({ title, url })` thay cho copy. Nếu người dùng hủy (`AbortError`) thì không báo lỗi.

### 3.3. `ShareDialog` (chủ sở hữu)

```
┌ Chia sẻ "Tên tài liệu" ─────────────────────────────── ✕ ┐
│ [●━] Chia sẻ qua liên kết                                │
│      Bất kỳ ai có liên kết đều xem được.                 │
│ ┌────────────────────────────────────┐ [Sao chép liên kết] │
│ │ https://…/s/abc123                 │                    │
│ └────────────────────────────────────┘                    │
│ 12 lượt xem · 3 lượt tải                                  │
│ [✓] Cho phép tải xuống                                    │
│                                                           │
│ ▸ Tùy chọn nâng cao   🔒 Có mật khẩu · Hết hạn 11/10/2026 │
│   ┌───────────────────────────────────────────────────┐   │
│   │ Mật khẩu:  Đã đặt  [Đổi mật khẩu] [Xóa mật khẩu]   │   │
│   │ Hết hạn:   (Không)(1 ngày)(7 ngày)(30 ngày)(Tùy chọn)│  │
│   │ Giới hạn lượt xem: [    ]  Giới hạn lượt tải: [    ]│   │
│   │                          [Lưu tùy chọn nâng cao]    │   │
│   └───────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

**Trạng thái "tắt"** (chưa có link, hoặc link hiện có là `restricted`): chỉ hiện công tắc, dòng mô tả "Chỉ bạn xem được tài liệu này qua liên kết chia sẻ." và nút chính **"Tạo liên kết"**. Phần còn lại ẩn đi.

**Quy tắc lưu**

| Điều khiển | Khi thay đổi |
|---|---|
| Công tắc bật | `POST` với `access: "anyone_with_link"`, giữ các cài đặt hiện có |
| Công tắc tắt | `DELETE /share-links/{id}` (thu hồi) |
| "Cho phép tải xuống" | `POST` ngay |
| Mức chọn nhanh của "Hết hạn" | `POST` ngay |
| Mật khẩu, ngày giờ "Tùy chọn", 2 ô giới hạn | Chỉ lưu khi bấm "Lưu tùy chọn nâng cao". Khi có thay đổi chưa lưu thì hiện chữ "Chưa lưu" cạnh nút |
| "Xóa mật khẩu" | `POST` ngay với `password: ""` |
| "Sao chép liên kết" | Chỉ copy (URL không đổi khi cập nhật). Nếu chưa có link thì tạo trước rồi copy |

- Trong lúc đang gọi API: khóa mọi điều khiển và truyền `busy` cho `Modal`.
- Khi lỗi: giữ nguyên trạng thái đã lưu gần nhất, hiện toast thông báo.
- Dòng tóm tắt cạnh "Tùy chọn nâng cao" chỉ liệt kê các giới hạn đang bật. Nếu không có giới hạn nào thì hiện "Không giới hạn".
- Nếu `expiresAt` đã qua: hiện cảnh báo màu đỏ "Liên kết đã hết hạn" và gợi ý chọn hạn mới.
- Nếu `views >= maxViews` hoặc `downloads >= maxDownloads`: hiện cảnh báo tương ứng.
- Mặc định thu gọn "Tùy chọn nâng cao". Tự mở ra nếu link đang có ít nhất một giới hạn.

**Không còn trên giao diện:** select "Quyền truy cập", select "Quyền / Permission", nút "Tạo/Cập nhật link", nút "Tắt link" riêng.

---

## 4. Backend (DocShareAPI)

> Không cần migration. Không đổi format URL `/s/{token}`. Giữ tương thích ngược cho client cũ.

### [x] 4.1. Trả về `can_share` trong chi tiết tài liệu

- **File:** `DocShareAPI/Controllers/Public/PublicDocumentsController.cs`, method `GetDocumentByID`.
- **Việc cần làm:**
  1. Tính `isOwner` và `isAdmin` **ở ngoài** khối `if (!document.is_public)`. Hiện hai biến này chỉ được tính bên trong khối đó, nên cần đưa ra ngoài và dùng lại.
  2. Thêm vào object trả về: `can_share = isOwner || isAdmin`. Nếu chưa đăng nhập thì `false`.
- **Lưu ý:** logic phải khớp `ShareLinksController.CanShare` (owner hoặc `roleID == "admin"`). So sánh role không phân biệt hoa thường, giống code hiện có.

### [x] 4.2. Chuẩn hóa `expiresAt` về UTC

- **File:** `ShareLinksController.cs`.
- **Đầu vào** (`CreateOrUpdateShareLink`): trước khi validate, chuẩn hóa như sau:
  ```csharp
  var expiresAt = request.expiresAt switch
  {
      null => (DateTime?)null,
      { Kind: DateTimeKind.Utc } v => v,
      { Kind: DateTimeKind.Local } v => v.ToUniversalTime(),
      var v => DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) // Unspecified: quy ước client gửi UTC
  };
  ```
  Sau đó dùng `expiresAt` cho cả bước validate (`<= DateTime.UtcNow`) lẫn bước gán `link.expires_at`.
- **Đầu ra** (`ToResponse`): MySQL trả `DateTime` với `Kind = Unspecified`, nên JSON sẽ thiếu `Z` và trình duyệt hiểu nhầm là giờ địa phương. Cần trả về:
  ```csharp
  expiresAt = link.expires_at.HasValue ? DateTime.SpecifyKind(link.expires_at.Value, DateTimeKind.Utc) : (DateTime?)null,
  ```
  Làm tương tự cho `createdAt` và `updatedAt` trong `ToResponse`.
- Không sửa cách serialize ngày giờ toàn cục ở `Program.cs`, vì ngoài phạm vi và có thể ảnh hưởng các API khác.

### [x] 4.3. Trả lỗi 403 có nội dung

- **File:** `ShareLinksController.cs`, `CreateOrUpdateShareLink`.
- Thay `return Forbid();` (sau `CanShare`) bằng:
  ```csharp
  return StatusCode(StatusCodes.Status403Forbidden, Error("SHARE_FORBIDDEN", "Chỉ chủ sở hữu mới có thể tạo liên kết chia sẻ."));
  ```
- **Không** sửa `Forbid()` trong `VerifyPassword`, vì `PublicSharePage` đang dựa vào hành vi đó.

### [x] 4.4. Giữ nguyên, chỉ cần viết test

- `access = "restricted"` vẫn được chấp nhận để client cũ không vỡ. FE mới sẽ không gửi giá trị này nữa.
- Ngữ nghĩa `password` (`null` giữ nguyên, `""` xóa) đã đúng. Không sửa, chỉ thêm test ở mục 6.2.

---

## 5. Frontend (documents-sharing)

### [x] 5.1. Cập nhật kiểu và API

- **File:** [src/api/workspaceLibraryApi.ts](../src/api/workspaceLibraryApi.ts).
- Bổ sung vào `ShareLinkSettings` các trường BE đã trả về: `requiresPassword?: boolean; views?: number; downloads?: number; itemName?: string | null;`.
- Thêm kiểu payload rõ ràng thay cho `Record<string, any>`:
  ```ts
  export interface ShareLinkPayload {
    itemId: number;
    itemType: WorkspaceItemType;
    access: "anyone_with_link";
    permission: "viewer";
    allowDownload: boolean;
    password?: string;            // bỏ trống = giữ nguyên, "" = xóa, chuỗi khác = đặt mới
    expiresAt: string | null;     // ISO UTC, ví dụ "2026-10-11T03:00:00.000Z"
    maxViews: number | null;
    maxDownloads: number | null;
  }
  ```
  `createShareLink(payload: ShareLinkPayload)`.

### [x] 5.2. Viết lại `ShareDialog`

- **File:** [src/components/Workspace/dialogs/ShareDialog.tsx](../src/components/Workspace/dialogs/ShareDialog.tsx).
- **Props mới:**
  ```ts
  { item: { id: number; type: WorkspaceItemType; name: string }; onClose: () => void; onChanged?: () => void }
  ```
  - **Bỏ** `useLibraryContext()`. Gọi `onChanged?.()` sau mỗi lần tạo, cập nhật hoặc thu hồi thành công.
  - Tên hiển thị lấy từ `item.name`. Nơi gọi tự dùng `getItemName(item)` để truyền vào.
- **State:**
  - `saved: ShareLinkSettings | null`: bản đã lưu trên server, là nguồn sự thật duy nhất.
  - `loading`: đúng trong lúc đang `getShareLinkSettings` (hiện skeleton hoặc spinner, không hiện form mặc định).
  - `busy`: đúng trong lúc đang POST hoặc DELETE.
  - `advancedDraft`: nháp cho các trường lưu thủ công gồm `password` (chuỗi), `passwordMode` (`"keep" | "set"`), `expiresAtLocal` (cho "Tùy chọn"), `maxViews`, `maxDownloads`.
  - `isOn = saved?.access === "anyone_with_link"`.
- **Hàm lưu chung:** luôn dựng payload **từ `saved`**, rồi ghi đè phần vừa thay đổi. Như vậy một thay đổi nhỏ không xóa mất các cài đặt khác:
  ```ts
  const persist = async (patch: Partial<ShareLinkPayload>) => {
    const payload: ShareLinkPayload = {
      itemId: item.id, itemType: item.type, access: "anyone_with_link", permission: "viewer",
      allowDownload: saved?.allowDownload ?? true,
      expiresAt: saved?.expiresAt ?? null,
      maxViews: saved?.maxViews ?? null,
      maxDownloads: saved?.maxDownloads ?? null,
      ...patch,
    };
    // KHÔNG đưa `password` vào payload trừ khi patch có password
  };
  ```
- **Hạn dùng:**
  - Mức chọn nhanh: `new Date(Date.now() + days * 86400000).toISOString()`. Chọn "Không" thì gửi `null`.
  - Ngày giờ "Tùy chọn": lấy giá trị từ `<input type="datetime-local">` rồi gửi `new Date(value).toISOString()` (trình duyệt hiểu là giờ địa phương và đổi sang UTC). Hiển thị lại bằng `toDateTimeLocalValue(saved.expiresAt)`.
  - Validate ở FE: thời điểm phải ở tương lai. Nếu sai, hiện lỗi ngay dưới ô và không gửi request.
  - Hiển thị ngày hết hạn bằng `toLocaleString("vi-VN")`.
- **Mật khẩu:**
  - `saved.requiresPassword === true`: hiện "Đã đặt mật khẩu" cùng hai nút **Đổi mật khẩu** (mở ô nhập) và **Xóa mật khẩu** (`persist({ password: "" })`).
  - Chưa có mật khẩu: hiện nút "Đặt mật khẩu" để mở ô nhập.
  - Ô nhập dùng `type="password"`, `autoComplete="new-password"`. Mật khẩu chỉ được gửi khi bấm "Lưu tùy chọn nâng cao" và ô không rỗng.
- **Giới hạn lượt:** `<input type="number" min="1" step="1">`. Ô rỗng nghĩa là `null`. Giá trị `< 1` hoặc không phải số nguyên thì hiện lỗi tại ô và không gửi.
- **Thông báo lỗi:** dùng `apiMessage(error, fallback)`. Toast thành công cần ngắn gọn và đúng hành động: "Đã bật chia sẻ qua liên kết.", "Đã tắt chia sẻ qua liên kết.", "Đã lưu tùy chọn.", "Đã xóa mật khẩu.", "Đã sao chép liên kết."
- **Đóng dialog khi còn nháp chưa lưu:** cho phép đóng và bỏ nháp. Không cần hỏi xác nhận.
- **Accessibility:** công tắc là `<button role="switch" aria-checked={isOn}>`. Phần nâng cao dùng `<details>/<summary>` hoặc nút có `aria-expanded`. Ô hiển thị URL là `<input readOnly>` để người dùng chọn và copy được bằng tay.
- **Giữ nguyên chữ** trên nút copy là `Sao chép liên kết`, vì test hiện có tìm theo chữ này.

### [x] 5.3. Dùng `ShareDialog` ở trang tài liệu

- **File:** [src/pages/Documents/DocumentDetail/DocumentDetail.tsx](../src/pages/Documents/DocumentDetail/DocumentDetail.tsx).
- Thêm `can_share?: boolean` vào `interface DocumentData`.
- **Xóa:** state `shareSettings`, `shareSaving`, `shareDisabling`, `shareForm`; các hàm `saveShareLink`, `copyShareLink`, `disableShareLink`; toàn bộ JSX modal inline (khối `{showShareModal && (...)}`). Xóa `toDateTimeLocalValue` nội bộ nếu không còn chỗ nào dùng.
- **Viết lại `handleShare`** theo bảng ở mục 3.2:
  ```ts
  const handleShare = async () => {
    if (documentData?.can_share) { setShowShareModal(true); return; }
    const url = `${window.location.origin}/document/${documentData.document_id}`;
    // navigator.share nếu có (bỏ qua AbortError), nếu không thì copyTextToClipboard(url) và toast theo is_public
  };
  ```
  **Không** gọi `checkNotSigned()` ở nhánh copy link trang.
- **Render:**
  ```tsx
  {showShareModal && (
    <ShareDialog
      item={{ id: documentData.document_id, type: "document", name: documentData.title }}
      onClose={() => setShowShareModal(false)}
    />
  )}
  ```

### [x] 5.4. Sửa nhãn nguồn truy cập (L10)

- **File:** `DocumentDetail.tsx`, hằng `accessSourceLabel`.
- Đổi key cho khớp BE: `public_document: "Tài liệu công khai"`, `folder: "Truy cập qua thư mục"`, `owner_or_admin: "Tài liệu của bạn"`. Nếu `can_share` là `false` với `owner_or_admin` (trường hợp admin xem tài liệu riêng tư của người khác) thì không cần xử lý riêng.

### [x] 5.5. Cập nhật nơi gọi `ShareDialog` trong thư viện

- [MyLibraryPage.tsx:435](../src/pages/Library/MyLibraryPage.tsx#L435) và [FolderDetailPage.tsx:367](../src/pages/Folders/FolderDetailPage.tsx#L367):
  ```tsx
  <ShareDialog item={{ id: dialog.item.id, type: dialog.item.type, name: getItemName(dialog.item) }} onClose={() => setDialog(null)} onChanged={refreshSummary} />
  ```
  `refreshSummary` đã có sẵn từ `useLibraryContext()` ở cả hai trang.
- Dialog vẫn dùng cho **thư mục**. Thiết kế ở mục 3.3 áp dụng nguyên vẹn, chỉ đổi chữ "tài liệu" thành "thư mục" ở những chỗ cần thiết.

---

## 6. Kiểm thử

### 6.1. Frontend (Jest, CRA)

Chạy:
```bash
CI=true npx react-scripts test --watchAll=false src/components/Workspace
npm run typecheck
```

- **Sửa test hiện có** `copy link creates a missing link and catches clipboard errors` trong [workspaceRegression.test.js](../src/components/Workspace/workspaceRegression.test.js). Sau khi bỏ `useLibraryContext`, có thể render `ShareDialog` trực tiếp, không cần bọc `LibraryLayout`. Hãy thêm `disableShareLink: jest.fn()` vào mock của `workspaceLibraryApi`.
- **Thêm test** (cùng file, theo đúng style `render` / `click` / `byText` đang dùng):
  1. Chưa có link: không render select "Quyền truy cập" hay "Permission", và không có chữ `Editor` hoặc `Restricted`.
  2. Bấm "Tạo liên kết": gọi `createShareLink` với `access: "anyone_with_link"` và `permission: "viewer"`, payload **không có** key `password`.
  3. `getShareLinkSettings` trả link `access: "restricted"`: công tắc ở trạng thái tắt.
  4. Link đang bật, bấm công tắc: gọi `disableShareLink(id)`.
  5. Bỏ tick "Cho phép tải xuống": gọi `createShareLink` với `allowDownload: false`, các giá trị `maxViews` / `expiresAt` cũ được giữ nguyên.
  6. `requiresPassword: true`: hiện "Đã đặt mật khẩu". Bấm "Xóa mật khẩu" thì payload có `password: ""`.
  7. Chọn "7 ngày": `expiresAt` là chuỗi ISO kết thúc bằng `Z`, cách hiện tại khoảng 7 ngày (dùng `jest.useFakeTimers().setSystemTime(...)`).
  8. Nhập `maxViews = 0` rồi bấm lưu: không gọi `createShareLink`, có hiện lỗi.
  9. `createShareLink` bị reject: toast lỗi và trạng thái công tắc không đổi.
- Test cho `DocumentDetail` là tùy chọn, vì trang này nhiều phụ thuộc. Nếu viết, chỉ cần kiểm tra: `can_share: false` cùng `is_public: true` thì bấm "Chia sẻ" gọi `copyTextToClipboard` với URL `/document/{id}` và không render dialog.

### 6.2. Backend (xUnit)

Chạy trong `C:\HocTap\GitHub\DocShareAPI`:
```bash
dotnet test
```

Thêm test theo mẫu `BackendSecurityRegressionTests.cs` (DbContext in-memory hoặc SQLite giống file đó):

1. `GetDocumentByID` trả `can_share = true` cho chủ tài liệu và admin, `false` cho người khác và cho khách chưa đăng nhập.
2. `POST /share-links` từ người không phải chủ: status 403, body có `code == "SHARE_FORBIDDEN"`.
3. Gửi `expiresAt` dạng `"…Z"`: `link.expires_at` lưu đúng giờ UTC. `ToResponse` trả về `DateTimeKind.Utc`.
4. Gửi `expiresAt` trong quá khứ: 400 `INVALID_LIMIT`.
5. Mật khẩu: đặt `"abc"` thì `requiresPassword = true`; gửi lại **không có** `password` thì vẫn `true`; gửi `password = ""` thì `false`.
6. Link `restricted` vẫn trả 404 ở `GET /api/s/{token}` (giữ hành vi cũ).

### 6.3. Kiểm tra tay (sau khi chạy `npm start` và API)

- [ ] Chủ tài liệu: mở `/document/:id`, bấm Chia sẻ, bấm Tạo liên kết, rồi Sao chép. Mở link ở cửa sổ ẩn danh thì xem được.
- [ ] Đặt mật khẩu: link ẩn danh hỏi mật khẩu. Xóa mật khẩu: không còn hỏi.
- [ ] Hết hạn "1 ngày": thời điểm hiển thị đúng giờ Việt Nam, cột `expires_at` trong DB là giờ UTC (lệch 7 giờ).
- [ ] Tắt chia sẻ: link ẩn danh báo không khả dụng.
- [ ] Tài khoản khác, tài liệu công khai: bấm Chia sẻ chỉ copy link trang, không mở modal và không có toast lỗi.
- [ ] Chưa đăng nhập, tài liệu công khai: bấm Chia sẻ copy được link, không bị đẩy sang trang đăng nhập.
- [ ] `/library`: chia sẻ tài liệu và thư mục hoạt động như trên; số đếm "Liên kết chia sẻ" ở sidebar cập nhật sau khi bật/tắt.
- [ ] Esc, click nền, Tab đều hoạt động. Không đóng được trong lúc đang lưu.

---

## 7. Thứ tự thực hiện và tiêu chí hoàn thành

1. **BE 4.1 → 4.3** và test 6.2. Chạy `dotnet test` phải pass.
2. **FE 5.1** (kiểu và API).
3. **FE 5.2** (`ShareDialog`) và test 6.1.
4. **FE 5.5** (nơi gọi trong thư viện). Chạy test Workspace phải pass.
5. **FE 5.3, 5.4** (trang tài liệu).
6. `npm run typecheck` không có lỗi mới. Chạy toàn bộ `CI=true npx react-scripts test --watchAll=false` phải pass.
7. Kiểm tra tay theo 6.3.

**Hoàn thành khi:** cả 10 lỗi L1–L10 ở mục 2 không còn tái hiện được, toàn bộ test pass, và trong code FE không còn chuỗi `"editor"`, `"restricted"`, `Restricted` hay `Anyone with link` liên quan đến chia sẻ.

> Commit theo từng repo, mỗi repo một commit riêng (BE trước, FE sau). Không commit các file đang dở dang không liên quan trong working tree, như `src/api/aiGenerate*.js`, `src/components/Chat/*`, `src/utils/aiHistory.ts`.

---

## 8. Ngoài phạm vi

- Chia sẻ trực tiếp cho người dùng hoặc email cụ thể (mời theo tài khoản). Hiện chỉ có thư mục làm được việc này, qua thành viên thư mục.
- Quyền chỉnh sửa qua link.
- Cho phép nhiều link cho cùng một tài liệu.
- Thay đổi `PublicSharePage` (`/s/:token`).
- Sửa cách serialize `DateTime` toàn cục của API.

## Kết quả triển khai (04/10/2026)

- [x] Backend: can_share, 403 có nội dung, chuẩn hóa UTC và kiểm thử tương thích client cũ.
- [x] Frontend: dialog dùng chung, công tắc thu hồi, mật khẩu, hạn dùng, giới hạn, nháp và trạng thái tải/lưu.
- [x] Trang tài liệu: chủ/admin mở dialog; người khác sao chép link trang mà không yêu cầu đăng nhập; nhãn nguồn truy cập khớp API.
- [x] Kiểm thử tự động: backend 83 pass, 1 OpenAI live test có sẵn skip; frontend 70 pass; TypeScript pass; production build compiled successfully.
- [ ] Kiểm tra tay mục 6.3: chưa thực hiện vì cả cua_repl và node_repl đều lỗi khởi tạo với thông báo `failed to write kernel assets: The system cannot find the path specified`. Không đánh dấu các kiểm tra trình duyệt/MySQL thực tế là đã hoàn tất.

Backend được kiểm thử bằng `dotnet test -c Release` để tránh file Debug đang bị API localhost khóa. Không thay đổi PublicSharePage, schema database hoặc serializer ngày giờ toàn cục. Các chuỗi dành cho quyền thành viên thư mục và fixture kiểm thử client cũ được giữ nguyên; giao diện chia sẻ mới không có lựa chọn editor/restricted.