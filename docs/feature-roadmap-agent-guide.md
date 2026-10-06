# Lộ trình phát triển chức năng DocShare: hướng dẫn cho agent

> Tài liệu dành cho agent có quyền đọc và sửa cả **Frontend (FE)** lẫn **Backend (BE)**. Nhánh `retest`, ngày 06/10/2026.
> Mỗi chức năng gồm: mục tiêu, phạm vi, data model, API contract, việc cần làm ở FE và BE, tiêu chí hoàn thành và cách kiểm thử.
> Làm **lần lượt theo phase**. Đánh dấu `[x]` khi xong từng mục và ghi kết quả vào [mục 12](#12-nhật-ký-thực-hiện).

## Mục lục

- [0. Bối cảnh và quy ước bắt buộc](#0-bối-cảnh-và-quy-ước-bắt-buộc)
- [1. Phase 1: Hoàn thiện các chức năng đang dở](#1-phase-1-hoàn-thiện-các-chức-năng-đang-dở)
- [2. Phase 2: Đánh giá tài liệu (sao và nhận xét)](#2-phase-2-đánh-giá-tài-liệu-sao-và-nhận-xét)
- [3. Phase 3: AI gợi ý metadata khi upload](#3-phase-3-ai-gợi-ý-metadata-khi-upload)
- [4. Phase 4: AI tạo trắc nghiệm và flashcard](#4-phase-4-ai-tạo-trắc-nghiệm-và-flashcard)
- [5. Phase 5: Tìm kiếm trong nội dung tài liệu](#5-phase-5-tìm-kiếm-trong-nội-dung-tài-liệu)
- [6. Phase 6: Trình xem PDF tích hợp và watermark](#6-phase-6-trình-xem-pdf-tích-hợp-và-watermark)
- [7. Phase 7: Upload file lớn theo từng phần](#7-phase-7-upload-file-lớn-theo-từng-phần)
- [8. Phase 8: Điểm thưởng, bảng xếp hạng, huy hiệu](#8-phase-8-điểm-thưởng-bảng-xếp-hạng-huy-hiệu)
- [9. Phase 9: Cải thiện kỹ thuật](#9-phase-9-cải-thiện-kỹ-thuật)
- [10. Definition of Done chung](#10-definition-of-done-chung)
- [11. Các quyết định cần chủ dự án xác nhận](#11-các-quyết-định-cần-chủ-dự-án-xác-nhận)
- [12. Nhật ký thực hiện](#12-nhật-ký-thực-hiện)

---

## 0. Bối cảnh và quy ước bắt buộc

### 0.1. Stack FE

| Thành phần | Chi tiết |
|---|---|
| Build | Create React App (`react-scripts` 5), React 19, TypeScript trộn JavaScript |
| Router | `react-router-dom`, khai báo route trong [src/App.js](../src/App.js) |
| HTTP | `axios` qua [src/api/axiosInstance.js](../src/api/axiosInstance.js): tự gắn `Authorization: Bearer <cookie token>`, tự redirect `/login` khi gặp 401 ở route không public |
| State server | Hầu hết component dùng `useState` + `useEffect`. `QueryClientProvider` (`@tanstack/react-query`) đã bọc app nhưng chưa được dùng |
| UI | Tailwind + token màu dự án, icon `lucide-react` (code cũ còn dùng FontAwesome), toast `react-toastify` |
| Realtime | SignalR cho thông báo: [src/api/notificationRealtime.js](../src/api/notificationRealtime.js) |
| Test | Jest qua `react-scripts test`, render bằng `createRoot` + `act`, mock API bằng `jest.mock` |

### 0.2. Quy ước code FE

- **Import tuyệt đối từ `src`** (`baseUrl: "src"` trong `tsconfig.json`), và **ghi rõ đuôi** với file TS/TSX, ví dụ:
  `import featureUpgradesApi from "api/featureUpgradesApi.ts";`
  `import DocumentCard from "components/Documents/DocumentCard.tsx";`
- **API mới** thêm vào [src/api/featureUpgradesApi.ts](../src/api/featureUpgradesApi.ts) (đã có helper `cleanParams`, `unwrapData`), hoặc tạo file `src/api/<tên>Api.ts` theo cùng pattern nếu nhóm chức năng lớn.
- **Normalize response** ở component: chấp nhận cả camelCase lẫn snake_case, giống `normalizeComment` trong [DocumentCommentsPanel.tsx](../src/components/Documents/DocumentCommentsPanel.tsx).
- **Kiểm tra đăng nhập** bằng `Boolean(Cookies.get("token"))`. Component cần đăng nhập **không được gọi API khi chưa đăng nhập** (xem pattern trong working copy của `DocumentInsightsPanel.tsx`, `DocumentVersionsPanel.tsx`).
- **Token màu và class dùng chung:** `text-ink`, `text-ink-secondary`, `text-neutral`, `bg-surface`, `bg-canvas`, `border-line`, `bg-primary`, `bg-primary-soft`, `text-success|warning|danger`, `surface-card`, `btn-primary`, `btn-secondary`, `input-field`, `font-display`. Không hard-code mã hex. Tuân theo [design.md](../design.md).
- **Toàn bộ text giao diện bằng tiếng Việt có dấu.**
- **Lỗi API:** hiển thị bằng `apiMessage(error, "fallback")` từ [src/utils/apiMessage.ts](../src/utils/apiMessage.ts).
- Không thêm thư viện mới nếu chưa ghi rõ trong mục chức năng.

### 0.3. Quy ước BE

- Repo BE nằm riêng. Base URL nằm trong `REACT_APP_API_URL`. Endpoint public có tiền tố `public/`. Endpoint cần đăng nhập không có tiền tố.
- Query phân trang dùng `PageNumber`, `PageSize` (PascalCase, theo các endpoint hiện có).
- **Chức năng mới trả camelCase.** Xem mục 10 trong [backend-feature-upgrades-api-checklist.md](backend-feature-upgrades-api-checklist.md).
- **Error contract** theo mục 8 trong [backend-documents-folders-jumpshare-api-requirements.md](backend-documents-folders-jumpshare-api-requirements.md):
  ```json
  { "success": false, "code": "VALIDATION_ERROR", "message": "Thông báo tiếng Việt.", "details": {} }
  ```
- Mọi thao tác admin ghi **audit log** (đã có `GET admin/audit-logs`).
- Mọi API key (LLM, Cloudinary secret...) **chỉ nằm ở BE**. FE không bao giờ gọi trực tiếp nhà cung cấp AI.

### 0.4. Trạng thái working copy hiện tại (không được revert)

- `src/components/Documents/DocumentFeedTabs.tsx`, `DocumentInsightsPanel.tsx`, `DocumentVersionsPanel.tsx`: có fix **chưa commit**, giúp người chưa đăng nhập không gọi API cần auth.
- `src/components/Documents/anonymousRequests.test.js`: test mới, chưa track.

Hãy giữ nguyên các thay đổi này. Nếu cần sửa cùng file, sửa chồng lên.

### 0.5. Lệnh kiểm tra

```bash
npm run typecheck                         # tsc --noEmit
npx react-scripts test --watchAll=false   # chạy toàn bộ test một lần
npm run build                             # phải build thành công
```

---

## 1. Phase 1: Hoàn thiện các chức năng đang dở

**Mục tiêu:** Mọi chức năng đã có giao diện phải chạy được end-to-end trước khi thêm chức năng mới.
Contract chi tiết đã có trong [backend-feature-upgrades-api-checklist.md](backend-feature-upgrades-api-checklist.md). **Không viết lại contract.** Agent làm theo checklist đó và đánh dấu trực tiếp vào file đó.

### [ ] 1.1. Kiểm tra từng endpoint FE đang gọi

Với mỗi hàm trong [featureUpgradesApi.ts](../src/api/featureUpgradesApi.ts), xác định BE đã có endpoint chưa, response có đúng shape FE normalize không, và phân quyền có đúng không.

| Nhóm | Endpoint | Component FE |
|---|---|---|
| Bình luận | `GET/POST documents/:id/comments`, `PATCH/DELETE comments/:id` | `DocumentCommentsPanel.tsx` |
| Phiên bản | `GET/POST documents/:id/versions`, `.../restore`, `.../download` | `DocumentVersionsPanel.tsx` |
| Feed | `documents/trending`, `feed/recommended`, `feed/following`, `users/me/history` | `DocumentFeedTabs.tsx` |
| Lượt xem | `POST documents/:id/view` | `DocumentDetail.tsx` |
| Insights | `GET documents/:id/insights` | `DocumentInsightsPanel.tsx` |
| Thông báo | `GET/PUT notifications/settings` | `pages/Account/NotificationSettings.tsx` |
| Dung lượng | `GET users/me/storage`, `PATCH admin/users/:id/storage` | Library, Admin Users |
| Admin | `admin/audit-logs`, `admin/analytics/engagement` | Admin views |
| Share link | `s/:token`, `s/:token/verify-password`, `share-links*` | `PublicSharePage.tsx`, `ShareDialog.tsx` |

Lập bảng kết quả (Có / Thiếu / Sai shape) ở [mục 12](#12-nhật-ký-thực-hiện), rồi bổ sung BE cho các mục Thiếu hoặc Sai shape.

### [ ] 1.2. Bình luận chạy end-to-end

- BE tạo bảng `document_comments` (`comment_id`, `document_id`, `user_id`, `parent_comment_id` nullable, `content` tối đa 2000 ký tự, `is_deleted`, `created_at`, `updated_at`).
- Chỉ cho trả lời **1 cấp** (reply của reply gắn vào comment gốc), vì FE hiển thị `replies` một tầng.
- Response mỗi comment phải có `canEdit` (người viết hoặc admin), và `author { userId, username, fullName, avatarUrl }`.
- Khi có `@username` trong nội dung, tạo thông báo loại `comment_mention` cho người được nhắc. Khi có reply, tạo thông báo `comment_reply` cho người viết comment gốc. `targetUrl: /document/:documentId#comment-:commentId`.
- Tài liệu riêng tư: chỉ người có quyền xem tài liệu mới đọc hoặc viết được bình luận (403 `FORBIDDEN`).

### [ ] 1.3. Feed trang chủ

- `documents/trending` là endpoint **public** (người chưa đăng nhập dùng được). Tính theo lượt xem + lượt tải trong `days` ngày gần nhất, chỉ lấy tài liệu công khai.
- `feed/recommended`: giai đoạn đầu dùng heuristic, không cần ML. Lấy các chuyên mục và tag từ lịch sử xem của user, chọn tài liệu công khai cùng chuyên mục/tag mà user chưa xem, sắp theo độ phổ biến. Nếu user chưa có lịch sử, fallback sang trending.
- `feed/following`: tài liệu công khai mới nhất của những người user đang theo dõi (bảng follow đã có, xem `usersApi.followUser`).
- FE: trong `DocumentFeedTabs.tsx`, mảng `tabs` hiện chỉ có `recommended` và `following`. Người chưa đăng nhập thấy tiêu đề "Dành cho bạn" kèm danh sách trending nhưng không có tab nào. Cần xác nhận với chủ dự án ([mục 11](#11-các-quyết-định-cần-chủ-dự-án-xác-nhận)) có thêm tab "Thịnh hành" cho mọi người không, và có đổi tiêu đề thành "Thịnh hành tuần này" khi chưa đăng nhập không.

### [ ] 1.4. Sửa nút Thích giả trên `DocumentCard`

- **Vị trí:** [DocumentCard.tsx](../src/components/Documents/DocumentCard.tsx), hàm `handleLikeClick`.
- **Vấn đề:** Hàm chỉ đổi state cục bộ, không gọi API. Reload trang là mất, gây hiểu nhầm cho người dùng.
- **Hướng sửa:** Dùng API reaction mà `DocumentDetail` đang dùng (`like_count`, `myReaction`). Nếu card không có đủ dữ liệu `myReaction` thì **bỏ nút này** khỏi card. Không giữ nút chỉ có giao diện.

### [ ] 1.5. Cấu hình SEO trong Admin

- [SeoView.tsx](../src/pages/Admin/views/SeoView.tsx) đang hiện "Backend chưa hỗ trợ phần cấu hình này." Kiểm tra endpoint mà view gọi trong [adminApi.ts](../src/api/adminApi.ts) và bổ sung ở BE. Nếu chủ dự án không cần chức năng này thì ẩn phần cấu hình đi.

### Tiêu chí hoàn thành Phase 1

- Toàn bộ checklist mục 11 trong `backend-feature-upgrades-api-checklist.md` được đánh dấu `[x]`.
- Mở trang chủ và trang chi tiết tài liệu khi chưa đăng nhập: tab Network không có request nào trả 401.

---

## 2. Phase 2: Đánh giá tài liệu (sao và nhận xét)

**Mục tiêu:** Người dùng chấm 1–5 sao kèm nhận xét ngắn. Điểm trung bình hiển thị trên trang chi tiết và trên card, dùng làm tín hiệu cho tìm kiếm và gợi ý.
**Khác với like/dislike đã có:** like/dislike là phản hồi nhanh. Đánh giá là chấm điểm chất lượng có nhận xét. Giữ cả hai.

### 2.1. Data model (BE)

```sql
CREATE TABLE document_ratings (
  rating_id    BIGINT PRIMARY KEY IDENTITY,      -- hoặc SERIAL tùy DB
  document_id  INT          NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
  user_id      VARCHAR(...) NOT NULL REFERENCES users(user_id),
  stars        TINYINT      NOT NULL CHECK (stars BETWEEN 1 AND 5),
  review       NVARCHAR(1000) NULL,
  is_hidden    BIT          NOT NULL DEFAULT 0,  -- admin ẩn nhận xét vi phạm
  created_at   DATETIME2    NOT NULL,
  updated_at   DATETIME2    NOT NULL,
  CONSTRAINT uq_rating_user_document UNIQUE (document_id, user_id)
);

ALTER TABLE documents ADD rating_avg DECIMAL(3,2) NOT NULL DEFAULT 0;
ALTER TABLE documents ADD rating_count INT NOT NULL DEFAULT 0;
```

- `rating_avg` và `rating_count` là cột tổng hợp sẵn (denormalized). Cập nhật **trong cùng transaction** với insert/update/delete rating. Không tính lại bằng `AVG()` mỗi lần đọc danh sách.
- Kiểu `user_id` lấy giống cột `user_id` hiện có của bảng `users`.

### 2.2. API contract

**Lấy đánh giá (public, gửi token nếu có để trả `myRating`):**

```http
GET /api/public/documents/:documentId/ratings?PageNumber=1&PageSize=10&sort=newest
```

`sort`: `newest` | `highest` | `lowest`. Response:

```json
{
  "summary": {
    "average": 4.33,
    "count": 12,
    "distribution": { "1": 0, "2": 1, "3": 1, "4": 3, "5": 7 }
  },
  "myRating": { "ratingId": 9, "stars": 5, "review": "Rất hữu ích", "updatedAt": "2026-10-06T08:00:00Z" },
  "canRate": true,
  "cannotRateReason": null,
  "items": [
    {
      "ratingId": 9,
      "stars": 5,
      "review": "Rất hữu ích",
      "author": { "userId": "u1", "username": "an", "fullName": "Nguyễn An", "avatarUrl": "https://..." },
      "createdAt": "2026-10-06T08:00:00Z",
      "updatedAt": "2026-10-06T08:00:00Z"
    }
  ],
  "pageNumber": 1,
  "pageSize": 10,
  "totalCount": 12
}
```

- `myRating` là `null` khi chưa đăng nhập hoặc chưa đánh giá.
- `cannotRateReason`: `NOT_SIGNED_IN` | `OWN_DOCUMENT` | `NO_ACCESS` | `null`.
- `items` không chứa rating có `is_hidden = 1`. Rating chỉ có sao, không có nhận xét, vẫn tính vào `summary` nhưng **không** xuất hiện trong `items`.

**Tạo hoặc cập nhật đánh giá của tôi (upsert):**

```http
PUT /api/documents/:documentId/ratings/me
{ "stars": 5, "review": "Rất hữu ích" }
```

Response: `{ "rating": { ... }, "summary": { ... } }`.

**Xóa đánh giá của tôi:**

```http
DELETE /api/documents/:documentId/ratings/me
```

Response: `{ "summary": { ... } }`.

**Admin ẩn hoặc hiện nhận xét:**

```http
PATCH /api/admin/ratings/:ratingId   { "isHidden": true, "reason": "Spam" }
```

Ghi audit log `rating.hide` hoặc `rating.unhide`.

**Quy tắc nghiệp vụ:**

| Trường hợp | HTTP | `code` |
|---|---:|---|
| `stars` ngoài 1–5, `review` > 1000 ký tự | 400 | `VALIDATION_ERROR` |
| Đánh giá tài liệu của chính mình | 403 | `OWN_DOCUMENT` |
| Không có quyền xem tài liệu | 403 | `FORBIDDEN` |
| Tài liệu không tồn tại hoặc đã xóa | 404 | `DOCUMENT_NOT_FOUND` |
| Gửi quá 20 lần/giờ | 429 | `RATE_LIMITED` |

- Lần **đầu** đánh giá thì tạo thông báo `document_rated` cho chủ tài liệu, `targetUrl: /document/:documentId#ratings`. Cập nhật đánh giá thì không gửi lại thông báo.
- Bổ sung `ratingAvg` và `ratingCount` vào response của: chi tiết tài liệu, các danh sách có `DocumentCard` (feed, carousel, search, category, collection), và admin Documents.

### 2.3. FE: việc cần làm

1. **API** ([featureUpgradesApi.ts](../src/api/featureUpgradesApi.ts)):
   ```ts
   getRatings: (documentId: number | string, params = {}) =>
     axiosInstance.get(`public/documents/${documentId}/ratings`, { params: cleanParams(params) }).then((response) => response.data),
   upsertMyRating: (documentId: number | string, payload: { stars: number; review?: string }) =>
     axiosInstance.put(`documents/${documentId}/ratings/me`, payload).then((response) => response.data),
   deleteMyRating: (documentId: number | string) =>
     axiosInstance.delete(`documents/${documentId}/ratings/me`).then((response) => response.data),
   ```
   Lưu ý: `axiosInstance` coi đường dẫn bắt đầu bằng `public/` là public, nên khi hết phiên đăng nhập sẽ không bị đẩy về trang login.

2. **Component mới** `src/components/Documents/DocumentRatingsPanel.tsx` (props `{ documentId: number }`), dùng `<section id="ratings" className="surface-card p-4 md:p-6">`:
   - **Khối tổng quan:** điểm trung bình (chữ lớn, `font-display`), 5 sao hiển thị theo nửa sao, "12 đánh giá", 5 thanh phân bố dạng thanh ngang `bg-primary` trên nền `bg-canvas`.
   - **Khối đánh giá của tôi:**
     - Chưa đăng nhập: nút "Đăng nhập để đánh giá" dẫn tới `/login?redirect=<đường dẫn hiện tại>`.
     - `OWN_DOCUMENT`: dòng chữ "Bạn không thể đánh giá tài liệu của mình."
     - Còn lại: chọn sao (5 nút `Star` của lucide, có `aria-label="Chọn N sao"`, điều khiển được bằng bàn phím), textarea có bộ đếm `0/1000`, nút "Gửi đánh giá" hoặc "Cập nhật". Khi đã có đánh giá thì thêm nút "Xóa" có xác nhận.
     - Sau khi gửi: cập nhật `summary` từ response, không reload trang. Báo `toast.success("Đã lưu đánh giá.")`.
   - **Danh sách nhận xét:** select sắp xếp (Mới nhất / Cao nhất / Thấp nhất), nút "Xem thêm" để tải trang tiếp theo. Mỗi dòng gồm avatar, tên (link tới `/public-profile/:userId`), số sao, ngày (`formatDateToVN`), nhận xét. Render nhận xét bằng text thường, **không** dùng `dangerouslySetInnerHTML`.
   - Có trạng thái loading (skeleton), trạng thái lỗi kèm nút "Thử lại", và trạng thái rỗng "Chưa có đánh giá nào. Hãy là người đầu tiên."

3. **Gắn vào trang chi tiết:** trong [DocumentDetail.tsx](../src/pages/Documents/DocumentDetail/DocumentDetail.tsx), đặt `<DocumentRatingsPanel documentId={documentData.document_id} />` **ngay trước** `<DocumentCommentsPanel ... />`. Ở khối thông tin bên cạnh (gần dòng "N lượt tải"), thêm "★ 4.3 (12)" và link tới `#ratings`.

4. **Card:** trong [DocumentCard.tsx](../src/components/Documents/DocumentCard.tsx), thêm `ratingAvg?`, `rating_avg?`, `ratingCount?`, `rating_count?` vào interface. Chỉ hiển thị "★ 4.3" khi `ratingCount > 0`.

5. **Admin:** trong `DocumentsView`, thêm cột "Đánh giá" và cho sắp xếp theo `rating_avg`. Phần quản lý nhận xét (ẩn/hiện) có thể làm sau, ghi lại vào nhật ký nếu chưa làm.

### 2.4. Test

Tạo `src/components/Documents/ratingsPanel.test.js` theo pattern của `anonymousRequests.test.js`:

- Chưa đăng nhập: gọi `getRatings`, không render form, có link đăng nhập.
- `cannotRateReason: "OWN_DOCUMENT"`: không render form.
- Chọn 4 sao rồi gửi: `upsertMyRating` được gọi với `{ stars: 4, review: "" }`, và summary cập nhật theo response.
- Review dài hơn 1000 ký tự: nút gửi bị disable.

### Tiêu chí hoàn thành Phase 2

- [ ] Đánh giá, sửa, xóa hoạt động. Điểm trung bình trên card và trang chi tiết khớp nhau.
- [ ] Hai lần gửi liên tiếp không tạo hai bản ghi (constraint unique + upsert).
- [ ] Chủ tài liệu nhận thông báo realtime ở lần đánh giá đầu tiên.

---

## 3. Phase 3: AI gợi ý metadata khi upload

**Mục tiêu:** Sau khi upload, người dùng bấm "Gợi ý bằng AI" để điền sẵn tiêu đề, mô tả, tag và chuyên mục. Người dùng vẫn duyệt và sửa trước khi lưu.

### 3.1. Luồng hiện tại

1. [UploadDocument.tsx](../src/pages/Documents/DocumentUpload/UploadDocument.tsx) gửi file (tối đa 10MB, PDF/DOCX/TXT) qua `documentsApi.postDocument` và nhận `document_id`.
2. [UploadSuccessComponent.tsx](../src/pages/Documents/DocumentUpload/UploadSuccessComponent.tsx) hiển thị form `title`, `description`, `tags`, `categories` (giới hạn `MAX_CATEGORIES`, chọn từ cây `categoriesAPI.getCategoryTree()`), rồi lưu bằng `documentsApi.putDocumentUpdateTitle`.
3. Tài liệu upload vào thư mục (`folderId`) **không có** tag và chuyên mục.

BE đã có AI (`public/ai/document-summary`, `public/ai/chat` trong [aiGenerate.js](../src/api/aiGenerate.js)), nên đã có sẵn bước trích xuất text từ file và client gọi LLM. Hãy tái sử dụng phần này.

### 3.2. API contract (BE)

```http
POST /api/ai/documents/:documentId/metadata-suggestion
```

Chỉ chủ tài liệu được gọi (403 `FORBIDDEN` nếu không phải). Request body rỗng. Response:

```json
{
  "title": "Giáo trình Cấu trúc dữ liệu và Giải thuật",
  "description": "Tổng hợp kiến thức về mảng, danh sách liên kết, cây, đồ thị...",
  "tags": ["cấu trúc dữ liệu", "giải thuật", "c++"],
  "categoryIds": ["lap-trinh"],
  "language": "vi"
}
```

**Cách xử lý ở BE:**

1. Lấy text đã trích xuất (dùng lại phần của tóm tắt AI), cắt còn khoảng 8.000 token đầu.
2. Lấy danh sách chuyên mục dạng phẳng `[{ id, name, path }]` và đưa vào prompt.
3. Gọi LLM ở chế độ **structured output (JSON schema)**. Không parse text tự do.
4. **Validate output trước khi trả về:**
   - `title`: tối đa 200 ký tự. `description`: tối đa 1000 ký tự.
   - `tags`: tối đa 5 tag, chữ thường, bỏ trùng, mỗi tag tối đa 30 ký tự.
   - `categoryIds`: **lọc bỏ id không có trong cây chuyên mục**, giữ tối đa `MAX_CATEGORIES`.
5. Cache kết quả theo `document_id` + hash file. Gọi lại thì trả bản cache.
6. Rate limit: 10 lần/giờ/user. Timeout gọi LLM: 30 giây.

| Trường hợp | HTTP | `code` |
|---|---:|---|
| Không trích được text (file scan, file rỗng) | 422 | `DOCUMENT_TEXT_EMPTY` |
| LLM lỗi hoặc timeout | 503 | `AI_UNAVAILABLE` |
| Vượt rate limit | 429 | `RATE_LIMITED` |

> Nội dung tài liệu là **dữ liệu không tin cậy**. Prompt phải tách rõ phần chỉ dẫn và phần nội dung (ví dụ bọc trong thẻ `<document>`), và yêu cầu model bỏ qua mọi chỉ dẫn nằm trong tài liệu. Bước validate ở trên là lớp bảo vệ cuối cùng.

### 3.3. FE: việc cần làm

1. Thêm vào [aiGenerate.js](../src/api/aiGenerate.js):
   ```js
   suggestMetadata: (documentId, signal) =>
     axiosInstance.post(`ai/documents/${documentId}/metadata-suggestion`, null, { signal }),
   ```
2. Trong `UploadSuccessComponent.tsx`:
   - Thêm nút phụ "Gợi ý bằng AI" (icon `Sparkles`, class `btn-secondary`) ở đầu form.
   - Khi đang chạy: disable nút, hiện "Đang phân tích tài liệu…". Dùng `AbortController` và abort khi unmount.
   - **Không ghi đè im lặng.** Hiện khối "Gợi ý từ AI" với từng trường và nút "Áp dụng" riêng, kèm nút "Áp dụng tất cả".
     - Trường đang rỗng hoặc vẫn là giá trị mặc định (tên file) thì có thể tự điền.
     - Trường người dùng đã sửa thì chỉ hiện gợi ý.
   - Tag gợi ý: thêm bằng hàm `addTag` sẵn có, nên tự bỏ trùng.
   - Chuyên mục gợi ý: thêm qua `toggleCategory`, tuân theo `MAX_CATEGORIES`. Hiển thị bằng tên (dùng lại hàm tìm tên trong cây chuyên mục, khoảng dòng 179).
   - Upload vào thư mục (`folderId`): chỉ áp dụng `title` và `description`.
   - Lỗi `DOCUMENT_TEXT_EMPTY`: "Không đọc được nội dung tài liệu để gợi ý." Lỗi khác: dùng `apiMessage`.
3. Test `src/pages/Documents/DocumentUpload/aiSuggestion.test.js`:
   - Áp dụng gợi ý thì điền đúng trường.
   - Chuyên mục vượt `MAX_CATEGORIES` bị cắt.
   - Upload vào folder thì không thêm tag/chuyên mục.
   - Unmount khi đang gọi thì request bị abort.

### Tiêu chí hoàn thành Phase 3

- [ ] Upload một PDF tiếng Việt, gợi ý trả về trong vòng 30 giây, chuyên mục nằm trong cây.
- [ ] Không còn API key AI nào trong bundle FE (`grep` thư mục `build/`).

---

## 4. Phase 4: AI tạo trắc nghiệm và flashcard

**Mục tiêu:** Từ trang chi tiết tài liệu, người dùng tạo bộ câu hỏi trắc nghiệm hoặc flashcard để ôn tập.

### 4.1. API contract (BE)

```http
POST /api/ai/documents/:documentId/quiz
{ "count": 10, "difficulty": "medium" }        // count 5–20; difficulty: easy | medium | hard
```

```json
{
  "quizId": "q_abc",
  "questions": [
    {
      "question": "Độ phức tạp tìm kiếm nhị phân là?",
      "options": ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
      "answerIndex": 1,
      "explanation": "Mỗi bước chia đôi không gian tìm kiếm.",
      "sourcePage": 12
    }
  ]
}
```

```http
POST /api/ai/documents/:documentId/flashcards
{ "count": 15 }
```

```json
{ "cards": [ { "front": "Stack", "back": "Cấu trúc LIFO..." } ] }
```

- Quyền: ai xem được tài liệu thì tạo được. Bắt buộc đăng nhập để kiểm soát chi phí.
- Validate: đúng 4 lựa chọn, `answerIndex` từ 0 đến 3, không có lựa chọn trùng nhau. Loại bỏ câu không hợp lệ thay vì làm lỗi cả bộ.
- Cache theo (`document_id`, `count`, `difficulty`, hash file). Rate limit 5 lần/giờ/user.
- Giai đoạn đầu **không** lưu kết quả làm bài. Ghi vào [mục 11](#11-các-quyết-định-cần-chủ-dự-án-xác-nhận) nếu cần lưu lịch sử.

### 4.2. FE

- Component mới `src/components/Chat/DocumentStudyTools.tsx`, mở dạng modal từ nút "Ôn tập với AI" đặt cạnh nút tóm tắt AI trong `DocumentDetail.tsx`.
- Có 2 tab: **Trắc nghiệm** và **Flashcard**.
  - Trắc nghiệm: chọn số câu và độ khó, rồi làm từng câu. Chấm điểm ngay trên client: hiện đúng/sai, giải thích, "Trang N". Cuối bài hiện điểm và nút "Làm lại" hoặc "Tạo bộ mới".
  - Flashcard: thẻ lật (CSS transform, tôn trọng `prefers-reduced-motion`), nút Trước/Sau, phím ← → và Space.
- Chưa đăng nhập: hiện CTA đăng nhập, không gọi API.

---

## 5. Phase 5: Tìm kiếm trong nội dung tài liệu

**Mục tiêu:** Tìm được tài liệu theo nội dung bên trong file, không chỉ theo tiêu đề và metadata. Kết quả có đoạn trích chứa từ khóa.

### 5.1. BE

1. **Trích xuất text khi upload** (và khi có version mới). Dùng lại phần trích xuất của AI. Lưu vào bảng `document_contents (document_id PK, content, page_count, extracted_at, extract_status)`.
2. **Đánh index** theo DB đang dùng:
   - SQL Server: Full-Text Index trên `document_contents.content`.
   - PostgreSQL: cột `tsvector` + GIN index, kết hợp extension `unaccent`.
   - Nếu cần chất lượng cao hơn: Meilisearch hoặc Elasticsearch (đồng bộ qua background job).
   - **Bắt buộc tìm được không dấu:** gõ "cau truc du lieu" ra "cấu trúc dữ liệu".
3. **Backfill:** viết job trích xuất cho toàn bộ tài liệu cũ, chạy theo lô, ghi `extract_status`.
4. **Mở rộng** `GET public/search-documents`:
   - Thêm param `scope=all|title|content` (mặc định `all`).
   - Mỗi kết quả thêm `snippet` (khoảng 200 ký tự quanh từ khóa) và `matchedIn: "title" | "content"`.
   - Đánh dấu từ khóa trong `snippet` bằng ký tự đặc biệt `\u0001…\u0002`, **không** chèn HTML.
   - Chỉ trả tài liệu công khai, hoặc tài liệu user có quyền xem.
5. (Tùy chọn) OCR cho PDF scan bằng Tesseract với dữ liệu ngôn ngữ `vie`. Chạy dạng job nền.

### 5.2. FE

- [Search.tsx](../src/pages/Search/Search.tsx): thêm bộ lọc "Tìm trong: Tất cả / Tiêu đề / Nội dung", giữ trên URL bằng query param.
- Render `snippet` bằng cách `split` theo `\u0001` và `\u0002`, bọc phần khớp trong `<mark className="bg-primary-soft text-ink">`. Không dùng `dangerouslySetInnerHTML`.
- Kết quả khớp theo nội dung thì gắn nhãn "Khớp trong nội dung".

---

## 6. Phase 6: Trình xem PDF tích hợp và watermark

**Bối cảnh:** `DocumentDetail.tsx` đang nhúng `iframe`. File PDF dùng thẳng `file_url`. File DOCX/TXT đi qua `docs.google.com/gview` (hàm `buildGoogleViewerUrl`), có cơ chế retry `MAX_VIEWER_RETRIES`.

### 6.1. FE

- Thêm thư viện `pdfjs-dist` (đây là thư viện mới duy nhất được phép thêm ở phase này).
- Component mới `src/components/Documents/PdfViewer.tsx`, **lazy-load** bằng `React.lazy` để không làm nặng bundle chính:
  - Render từng trang ra canvas, lazy theo viewport (`IntersectionObserver`).
  - Thanh công cụ: trang hiện tại/tổng số trang, ô nhảy trang, zoom (−, +, vừa chiều rộng), toàn màn hình.
  - Tìm kiếm trong trang (dùng text layer của pdf.js) là tùy chọn.
  - Nếu pdf.js lỗi (CORS, file hỏng), fallback về `iframe` như hiện tại.
- Chỉ thay viewer cho PDF. DOCX/TXT giữ Google Viewer.
- Dùng cùng component này cho [PublicSharePage.tsx](../src/pages/Share/PublicSharePage.tsx).
- **Watermark khi xem:** khi `allowDownload === false` (share link), hoặc tài liệu riêng tư trong thư mục, phủ một lớp watermark chéo, mờ, hiện "Tên hoặc email người xem · DocShare". Ghi rõ trong code comment rằng lớp này **chỉ để răn đe**.

### 6.2. BE

- File Cloudinary hiện đang public qua `file_url`, nên cờ `allowDownload: false` chỉ chặn được trên giao diện.
- Để chặn thật:
  - Không trả `fileUrl` gốc khi `allowDownload: false`. Thay bằng endpoint stream `GET /api/s/:token/file`, dùng URL ký có thời hạn ngắn (5 phút).
  - Đặt resource Cloudinary về chế độ `authenticated`.
- **Watermark khi tải** (tùy chọn): khi tải qua share link, BE đóng dấu text "Tải bởi … · ngày …" vào từng trang PDF trước khi trả file.

---

## 7. Phase 7: Upload file lớn theo từng phần

**Bối cảnh:** Giới hạn hiện tại là 10MB (`MAX_UPLOAD_FILE_BYTES` trong `UploadDocument.tsx`), upload một request duy nhất. File đã được lưu trên Cloudinary (xem `buildCloudinaryAttachmentUrl`).

### 7.1. Phương án khuyến nghị: upload thẳng lên Cloudinary bằng chữ ký từ BE

1. `POST /api/uploads/signature { fileName, fileSize, mimeType, folderId? }`:
   - BE kiểm tra quota (`users/me/storage`), định dạng và kích thước tối đa mới (ví dụ 100MB, cần chủ dự án chốt).
   - Trả `{ uploadUrl, apiKey, timestamp, signature, publicId, chunkSize }`.
2. FE chia file thành từng phần (ví dụ 6MB), gửi lên Cloudinary kèm header `X-Unique-Upload-Id` và `Content-Range`. Gửi lại tối đa 3 lần cho mỗi phần lỗi.
3. `POST /api/documents/register { publicId, fileName, fileSize, mimeType, folderId? }`:
   - BE xác minh resource có thật trên Cloudinary, tạo bản ghi document.
   - Trả **đúng shape `DocumentResponse`** mà luồng upload hiện tại dùng, để `UploadSuccessComponent` không phải sửa.
4. Có job dọn các resource đã upload nhưng không register sau 24 giờ.

### 7.2. FE

- Tách logic upload ra `src/utils/chunkedUpload.ts`: nhận `File`, `onProgress`, `signal`. Tiến độ tính theo tổng byte đã gửi.
- Trong `UploadDocument.tsx`: file ≤ 10MB vẫn dùng luồng cũ, file lớn hơn dùng luồng chunk. Có nút "Hủy". Hiện tốc độ và thời gian còn lại.
- Chặn đóng tab khi đang upload (`beforeunload`).

---

## 8. Phase 8: Điểm thưởng, bảng xếp hạng, huy hiệu

> **Cần chủ dự án duyệt quy tắc trước khi làm** ([mục 11](#11-các-quyết-định-cần-chủ-dự-án-xác-nhận)). Mặc định **không** dùng điểm để mua lượt tải.

### 8.1. Data model (BE)

```sql
CREATE TABLE point_transactions (
  id          BIGINT PRIMARY KEY IDENTITY,
  user_id     VARCHAR(...) NOT NULL REFERENCES users(user_id),
  delta       INT NOT NULL,
  reason      VARCHAR(40) NOT NULL,   -- upload_public | document_downloaded | rated_5_stars | admin_adjust ...
  ref_type    VARCHAR(20) NULL,       -- document | rating ...
  ref_id      VARCHAR(64) NULL,
  actor_id    VARCHAR(...) NULL,      -- người gây ra sự kiện (người tải, người đánh giá)
  created_at  DATETIME2 NOT NULL,
  CONSTRAINT uq_point_event UNIQUE (user_id, reason, ref_type, ref_id, actor_id)  -- chống cộng trùng
);
ALTER TABLE users ADD points_balance INT NOT NULL DEFAULT 0;

CREATE TABLE badges (badge_code VARCHAR(40) PRIMARY KEY, name NVARCHAR(100), description NVARCHAR(300), icon VARCHAR(40));
CREATE TABLE user_badges (user_id VARCHAR(...), badge_code VARCHAR(40), awarded_at DATETIME2, PRIMARY KEY (user_id, badge_code));
```

**Quy tắc đề xuất** (chờ duyệt):

| Sự kiện | Điểm | Chống gian lận |
|---|---:|---|
| Upload tài liệu công khai | +5 | Chỉ cộng khi tài liệu công khai đủ 24 giờ và không bị báo cáo được duyệt. Bị xóa hoặc ẩn do vi phạm thì trừ lại |
| Người khác tải tài liệu của bạn | +1 | Mỗi người tải chỉ tính 1 lần cho mỗi tài liệu. Tối đa 50 điểm/ngày/tài liệu. Tự tải không tính |
| Nhận đánh giá 5 sao | +2 | Mỗi người đánh giá chỉ tính 1 lần |
| Admin điều chỉnh | ± | Bắt buộc ghi lý do và audit log |

Huy hiệu khởi đầu: `first_upload`, `uploads_10`, `downloads_100`, `top_weekly` (top 10 tuần).

### 8.2. API

```http
GET /api/users/me/points?PageNumber=1&PageSize=20   -> { balance, items: [transactions] }
GET /api/public/leaderboard?period=week|month|all&PageSize=20
    -> { items: [{ rank, user: {...}, points }], myRank? }
GET /api/public/users/:userId/badges               -> { items: [badges] }
POST /api/admin/users/:userId/points { delta, reason }
```

Cộng điểm phải **idempotent** (dựa vào constraint unique), chạy trong cùng transaction với sự kiện gốc hoặc qua outbox/background job.

### 8.3. FE

- Route mới `/leaderboard` → `src/pages/Leaderboard/Leaderboard.tsx`, có tab Tuần / Tháng / Mọi lúc. Thêm link trên header.
- Hiện số điểm trong dropdown tài khoản ([AccountButton.jsx](../src/components/Headers/AccountButton.jsx)).
- Thêm trang lịch sử điểm trong `/account/points` ([AccountPage.tsx](../src/pages/Account/AccountPage.tsx)).
- Hiện huy hiệu trên [PublicProfile.tsx](../src/pages/PublicProfile/PublicProfile.tsx).
- Admin Users: thêm cột điểm và nút điều chỉnh (dialog bắt buộc nhập lý do).

---

## 9. Phase 9: Cải thiện kỹ thuật

Mỗi mục là **một PR riêng**, không trộn với PR chức năng.

### [ ] 9.1. Code splitting

- Trong [App.js](../src/App.js), chuyển các trang nặng sang `React.lazy`: `Admin`, `DocumentDetail`, `LibraryLayout`/`MyLibraryPage`, `FolderDetailPage`, `AccountPage`, `UploadDocument`, `Collections`, `Search`, `PublicSharePage`.
- Bọc `<Routes>` trong `<Suspense fallback={<FullPageLoader />}>` (component đã có ở `components/Loaders/FullPageLoader.js`).
- Giữ nguyên đuôi file khi import: `lazy(() => import("pages/Admin/Admin.tsx"))`.
- Tiêu chí: so sánh kích thước `build/static/js/main.*.js` trước và sau, ghi vào nhật ký.

### [ ] 9.2. Dark mode

- Lợi thế có sẵn: component đã dùng token (`text-ink`, `bg-surface`...). Chỉ cần đổi token sang CSS variable là phần lớn giao diện tự đổi màu.
  1. Trong `src/styles/index.css`, khai báo biến cho `:root` và `.dark`, ví dụ `--color-surface: 255 255 255;`.
  2. Trong `tailwind.config.js`, đặt `darkMode: "class"` và đổi màu sang dạng `surface: "rgb(var(--color-surface) / <alpha-value>)"`.
  3. Thêm lựa chọn Sáng / Tối / Theo hệ thống trong Account, lưu vào `localStorage` (bọc `try/catch`).
     Áp class `dark` lên `<html>` bằng script inline trong `public/index.html` để tránh nháy màu khi tải trang.
- Sau đó tìm và sửa các class hard-code như `bg-white`, `text-gray-*`, `bg-gray-*`, `text-black`.
- Kiểm tra độ tương phản WCAG AA cho cả hai chế độ.

### [ ] 9.3. PWA

- `public/manifest.json` đã có. Thêm service worker (Workbox) chỉ cache app shell và static asset.
- **Không cache** response API có header `Authorization`.
- Có thông báo "Đã có phiên bản mới, tải lại?" khi service worker cập nhật.

### [ ] 9.4. Chuyển CRA sang Vite (làm cuối cùng, PR riêng)

- `react-scripts` đã ngừng phát triển.
- Đổi biến môi trường `REACT_APP_*` → `VITE_*` trong [src/config/config.js](../src/config/config.js) và `config/siteSeo.js`.
- Import tuyệt đối dùng `vite-tsconfig-paths`. Chuyển `public/index.html` ra thư mục gốc.
- Chuyển Jest sang Vitest, giữ nguyên các file test.
- Cập nhật `public/_redirects` nếu cần cho SPA fallback.
- Tiêu chí: `build`, `test`, `typecheck` đều chạy; mọi route vẫn mở được.

### [ ] 9.5. Thống nhất TypeScript

- File mới luôn viết bằng `.ts`/`.tsx`.
- Khi sửa nhiều ở một file `.js`/`.jsx` thì chuyển file đó sang TS trong cùng PR. Không chuyển hàng loạt.

---

## 10. Definition of Done chung

Áp dụng cho **mọi** mục ở trên:

- [ ] `npm run typecheck`, `npx react-scripts test --watchAll=false` và `npm run build` đều chạy thành công.
- [ ] Có test cho logic mới (ít nhất: luồng chính, trường hợp chưa đăng nhập, trường hợp lỗi API).
- [ ] Giao diện chạy ở chiều rộng 375px, không cuộn ngang. Có trạng thái loading, rỗng và lỗi.
- [ ] Người chưa đăng nhập không gọi API cần auth.
- [ ] Text tiếng Việt có dấu, lỗi hiển thị qua `apiMessage`.
- [ ] BE: có kiểm tra quyền, trả lỗi đúng error contract, và ghi audit log cho thao tác admin.
- [ ] Cập nhật tài liệu `docs/` liên quan và [mục 12](#12-nhật-ký-thực-hiện).
- [ ] Commit theo từng chức năng, message rõ ràng. Không commit `.env` hoặc API key.

---

## 11. Các quyết định cần chủ dự án xác nhận

Agent **không tự quyết** các mục sau. Nếu chưa có câu trả lời, làm theo mặc định trong ngoặc và ghi rõ vào nhật ký.

| # | Câu hỏi | Mặc định nếu chưa trả lời |
|---|---|---|
| 1 | Feed trang chủ có tab "Thịnh hành" cho mọi người không? | Hiện trending khi chưa đăng nhập, không thêm tab |
| 2 | Có bắt buộc đã xem hoặc tải tài liệu mới được đánh giá không? | Không bắt buộc |
| 3 | Có lưu lịch sử làm trắc nghiệm không? | Không lưu |
| 4 | Giới hạn kích thước file mới cho upload theo từng phần? | 100MB |
| 5 | Quy tắc điểm thưởng và có dùng điểm để tải tài liệu không? | Dùng bảng ở 8.1, không dùng điểm để tải |
| 6 | Chức năng cấu hình SEO trong Admin có cần không? | Có, bổ sung BE |
| 7 | Có chuyển tài liệu riêng tư trên Cloudinary sang chế độ `authenticated` không? | Có, làm trong Phase 6 |

---

## 12. Nhật ký thực hiện

> Agent ghi theo mẫu: ngày, phase hoặc mục, việc đã làm, file đã sửa, việc còn lại hoặc bị chặn.

| Ngày | Mục | Kết quả | Ghi chú |
|---|---|---|---|
| | | | |
