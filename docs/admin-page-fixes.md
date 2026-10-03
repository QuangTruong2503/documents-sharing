# Rà soát trang `/admin`: lỗi và hướng dẫn sửa

> Kết quả rà soát trang Quản trị (`/admin/*`), nhánh `retest`, ngày 03/10/2026.
> Tài liệu dành cho agent có quyền đọc và sửa cả **Frontend (FE)** lẫn **Backend (BE)**.
> Mỗi mục gồm: vị trí, mô tả, tình huống tái hiện, hướng sửa và tiêu chí hoàn thành. Đánh dấu `[x]` khi đã sửa xong.

## Mục lục

- [0. Bối cảnh và quy ước](#0-bối-cảnh-và-quy-ước)
- [1. Lỗi logic và rủi ro (ưu tiên cao)](#1-lỗi-logic-và-rủi-ro-ưu-tiên-cao)
- [2. Thiếu chức năng và luồng nghiệp vụ](#2-thiếu-chức-năng-và-luồng-nghiệp-vụ)
- [3. Chất lượng code và tái cấu trúc](#3-chất-lượng-code-và-tái-cấu-trúc)
- [4. UI/UX](#4-uiux)
- [5. Yêu cầu và kiểm tra phía Backend](#5-yêu-cầu-và-kiểm-tra-phía-backend)
- [6. Thứ tự thực hiện đề xuất](#6-thứ-tự-thực-hiện-đề-xuất)
- [7. Checklist kiểm thử thủ công](#7-checklist-kiểm-thử-thủ-công)

---

## 0. Bối cảnh và quy ước

### File liên quan (FE)

| File | Vai trò |
|---|---|
| [src/pages/Admin/Admin.tsx](../src/pages/Admin/Admin.tsx) | Toàn bộ trang admin: 11 tab, mỗi tab là một function component trong cùng file. ~1.700 dòng, gần như toàn bộ dữ liệu có kiểu `any`. |
| [src/api/adminApi.js](../src/api/adminApi.js) | API admin: dashboard, users, documents, categories, tags, reports, collections, analytics, SEO. Trả về **response axios thô** (cần `unwrap`). |
| [src/api/featureUpgradesApi.ts](../src/api/featureUpgradesApi.ts) | `getAuditLogs`, `getEngagementAnalytics`, `updateUserStorage`. Trả về `response.data`, **khác cách** với `adminApi`. |
| [src/api/reportsApi.js](../src/api/reportsApi.js) | Có `getOptions()` trả danh sách trạng thái báo cáo. Trang admin chưa dùng. |
| [src/components/RequireAuth.jsx](../src/components/RequireAuth.jsx) | Bảo vệ route với prop `admin`: gọi `userApi.getUserById()` và kiểm tra `role === "admin"`. |
| [src/App.js](../src/App.js) | Route `/admin/*` nằm trong `MainLayout`, có bọc `<RequireAuth admin>`. |
| [src/components/Workspace/WorkspaceConfirmDialog.tsx](../src/components/Workspace/WorkspaceConfirmDialog.tsx) | Dialog xác nhận đã có sẵn, có thể dùng thay `window.confirm`. |
| [src/pages/Reports/MyReports.tsx](../src/pages/Reports/MyReports.tsx) | Ví dụ mẫu: đã dùng `reportsApi.getOptions()` và đồng bộ filter với URL (`useSearchParams`). |

### Cấu trúc tab hiện tại

`AdminContent` (~dòng 1608) đọc `useParams()["*"]` để chọn tab. Các tab: `dashboard`, `users`, `documents`, `reports`, `categories`, `tags`, `collections`, `analytics`, `engagement`, `audit`, `seo`. Mỗi tab tương ứng một component: `DashboardView`, `UsersView`, `DocumentsView`, `ReportsView`, `TaxonomyView` (dùng chung cho categories/tags), `CollectionsView`, `AnalyticsView`, `EngagementView`, `AuditLogsView`, `SeoView`.

### Quy ước

- Số dòng ghi trong tài liệu là theo trạng thái hiện tại và có thể lệch sau khi sửa. Hãy tìm theo **tên component/hàm** được nêu kèm.
- Code style: TSX, Tailwind với token màu dự án (`text-ink`, `text-ink-secondary`, `bg-surface`, `bg-canvas`, `border-line`, `btn-primary`, `btn-secondary`, `input-field`, `surface-card`), icon `lucide-react`, toast `react-toastify`. Toàn bộ text giao diện bằng **tiếng Việt**.
- Mọi kiểm tra quyền ở FE chỉ là lớp bảo vệ thứ hai. BE **bắt buộc** phải tự kiểm tra (xem mục 5).

---

## 1. Lỗi logic và rủi ro (ưu tiên cao)

### [x] 1.1. Cấp/gỡ quyền admin chỉ bằng 1 click, không xác nhận; admin có thể tự hạ quyền hoặc tự xóa

- **Vị trí:** `UsersView.handleUserAction` (~dòng 387–394), nhánh `"toggle-role"` gọi thẳng `updateUser(user, { role: ... })`. Menu thao tác (~dòng 472–517).
- **Mô tả:**
  - Bấm "Đặt làm admin" là cấp quyền quản trị ngay, không có bước xác nhận. Thao tác nhạy cảm này rất dễ bị bấm nhầm.
  - Menu hiện đủ thao tác (đổi quyền, xóa) trên **dòng của chính admin đang đăng nhập**. Admin có thể tự hạ quyền mình xuống user (bị đá khỏi trang ngay sau đó) hoặc tự xóa tài khoản.
  - Không có gì ngăn việc gỡ **admin cuối cùng** của hệ thống.
- **Hướng sửa FE:**
  1. Lấy ID người dùng hiện tại (từ cookie `user` qua helper trong `src/utils/authSession.js` hoặc `CheckSigned.js`, kiểm tra helper nào đang có sẵn). So với `user.user_id` trên từng dòng.
  2. Với dòng của chính mình: ẩn hoặc disable "Đặt làm user" và "Xóa người dùng", kèm `title` giải thích lý do.
  3. "Đặt làm admin"/"Đặt làm user" phải mở dialog xác nhận nêu rõ hậu quả, ví dụ: *"Cấp quyền quản trị cho {email}? Người này sẽ có toàn quyền quản lý người dùng, tài liệu và cấu hình hệ thống."*
  4. Thay `window.confirm` khi xóa người dùng bằng dialog xác nhận, nêu rõ số tài liệu sẽ bị ảnh hưởng (`user.document_count`).
- **Hướng sửa BE:** xem mục 5.1.
- **Tiêu chí hoàn thành:** Không thể đổi quyền nếu không xác nhận. Trên dòng của chính mình không có thao tác hạ quyền hay xóa. Gọi thẳng API để tự hạ quyền hoặc gỡ admin cuối cùng thì BE trả lỗi 400/403.

### [x] 1.2. SEO: lỗi tải cấu hình bị nuốt, dễ ghi đè cấu hình thật bằng giá trị mặc định

- **Vị trí:** `SeoView` (~dòng 1445–1523). Hằng `defaultSeoForm` (~dòng 1425) và `defaultRobots` (~dòng 1435).
- **Mô tả:**
  - Code dùng `Promise.allSettled(...)`, vốn **không bao giờ reject**, nên `.catch(() => toast.error(...))` không bao giờ chạy. Khi API lỗi, form vẫn hiện các giá trị mặc định viết cứng như thể đó là cấu hình thật. Admin bấm "Lưu" là **ghi đè** cấu hình thật trên BE.
  - `setRobots(data?.content ?? data ?? defaultRobots)`: nếu BE trả về object không có `content`, state sẽ là object và textarea hiện `[object Object]`.
  - `defaultRobots` đã lỗi thời: vẫn chặn `/my-documents`, `/my-collections` (đã thành redirect), trong khi chưa chặn `/library`, `/s/` (link chia sẻ riêng tư), `/upload-document`, `/my-reports`.
  - Mọi lỗi khi lưu đều báo "Backend chưa hỗ trợ…", kể cả lỗi validate (400) hay lỗi server (500).
  - `generateSitemap` gọi tuần tự hai API. Nếu bước 1 thành công mà bước 2 lỗi thì thông báo vẫn là "chưa hỗ trợ".
  - Chỉ có một biến `saving` dùng chung cho ba khu vực (metadata, robots, sitemap), nên không biết thao tác nào đang chạy.
- **Hướng sửa:**
  1. Theo dõi trạng thái tải của từng phần: `loadState: { settings: "ok" | "error", robots: ..., routes: ... }`. Phần nào tải lỗi thì hiện banner *"Không tải được cấu hình hiện tại. Thử lại"* kèm nút thử lại, và **disable nút Lưu** của phần đó cho tới khi tải thành công.
  2. Chuẩn hóa robots: `const content = typeof data === "string" ? data : data?.content; setRobots(typeof content === "string" ? content : "")`.
  3. Cập nhật `defaultRobots` theo các route thực tế trong `App.js` (chỉ dùng làm gợi ý khi BE chưa có dữ liệu, và hiện rõ là "mẫu gợi ý").
  4. Hiện thông báo lỗi theo response: dùng `error?.response?.data?.message` nếu có. Chỉ báo "chưa hỗ trợ" khi status là 404 hoặc 501.
  5. Tách state `saving` riêng cho từng khu vực.
  6. Validate trước khi lưu: `siteUrl` và `defaultImage` phải là URL `https://` hợp lệ. Route sitemap phải bắt đầu bằng `/`.
- **Tiêu chí hoàn thành:** Tắt BE hoặc làm API SEO trả 500 thì UI báo lỗi rõ ràng và không cho lưu. robots.txt không bao giờ hiện `[object Object]`.

### [x] 1.3. Thiếu try/catch, không chặn double-click ở các thao tác ghi

- **Vị trí:**
  - `DocumentsView.toggleVisibility` và `deleteDocument` (~dòng 656–667)
  - `CollectionsView.deleteCollection` (~dòng 1159–1164)
  - `TaxonomyView.createItem` (~dòng 1030): không có trạng thái saving
- **Mô tả:** Khi API lỗi, promise bị reject mà không ai bắt, nên không có toast lỗi và console báo unhandled rejection. Nút không bị disable khi đang xử lý, nên double-click gửi 2 request (tạo trùng chuyên mục hoặc xóa 2 lần).
- **Hướng sửa:**
  - Bọc mọi thao tác ghi trong `try/catch/finally` và hiện `toast.error(error?.response?.data?.message || "...")`.
  - Thêm state `busyId` (theo từng dòng) hoặc `saving` (theo form), và disable nút trong lúc chờ.
  - Tốt nhất là tạo helper dùng chung, ví dụ `runAdminAction(fn, { success, error })`, để không phải lặp code (xem mục 3.2).
- **Tiêu chí hoàn thành:** Mọi thao tác ghi đều có toast khi thành công và khi lỗi. Double-click chỉ gửi 1 request.

### [x] 1.4. Biểu đồ "Phân bổ chuyên mục" tính sai độ rộng

- **Vị trí:** `AnalyticsView` (~dòng 1276): `style={{ width: \`${Math.min(100, category.document_count)}%\` }}`.
- **Mô tả:** Code lấy **số lượng tuyệt đối** làm phần trăm. Chuyên mục có 100 hay 5.000 tài liệu đều hiện full thanh, còn chuyên mục có 3 tài liệu chỉ hiện 3%.
- **Hướng sửa:**
  ```tsx
  const maxCategory = useMemo(
    () => Math.max(1, ...(data?.categoryDistribution ?? []).map((c: any) => c.document_count ?? 0)),
    [data]
  );
  // ...
  style={{ width: `${((category.document_count ?? 0) / maxCategory) * 100}%` }}
  ```
  Nếu muốn hiển thị tỷ lệ trên tổng thì chia cho tổng và hiện thêm `%` bên cạnh số lượng.
- **Bổ sung:** "Tài liệu tải nhiều" và "Phân bổ chuyên mục" chưa có empty state.

### [x] 1.5. Biểu đồ "Tương tác" ghép views và downloads theo index thay vì theo ngày

- **Vị trí:** `EngagementView` (~dòng 1331–1335): `const downloadItem = dailyDownloads[index]`.
- **Mô tả:** Code giả định `dailyViews` và `dailyDownloads` có cùng tập ngày và cùng thứ tự. Nếu BE bỏ qua những ngày có 0 lượt tải (thường gặp khi `GROUP BY date`), cột downloads sẽ bị lệch sang ngày khác. Nếu `dailyViews` rỗng mà `dailyDownloads` có dữ liệu thì biểu đồ trống.
- **Hướng sửa:**
  ```tsx
  const series = useMemo(() => {
    const map = new Map<string, { date: string; views: number; downloads: number }>();
    dailyViews.forEach((v: any) => {
      const d = String(v.date);
      map.set(d, { date: d, views: v.count ?? v.views ?? 0, downloads: 0 });
    });
    dailyDownloads.forEach((x: any) => {
      const d = String(x.date);
      const row = map.get(d) ?? { date: d, views: 0, downloads: 0 };
      row.downloads = x.count ?? x.downloads ?? 0;
      map.set(d, row);
    });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [dailyViews, dailyDownloads]);
  ```
  Tốt hơn nữa là BE trả sẵn một mảng đã điền đủ mọi ngày trong khoảng thời gian (xem mục 5.6).

### [x] 1.6. ReportsView và AuditLogsView: không debounce, không chặn race condition

- **Vị trí:** `ReportsView.load` (~dòng 742–755), `ReportsView.openReport` (~dòng 774–785), `AuditLogsView.load` (~dòng 1366–1379).
- **Mô tả:**
  - Mỗi lần gõ vào ô lọc Document ID, User ID, Action, Entity type hay Actor là gửi ngay một request. Response về không theo thứ tự nên kết quả cũ có thể ghi đè kết quả mới.
  - Các view khác (`UsersView`, `DocumentsView`, `TaxonomyView`, `CollectionsView`) đều đã dùng `requestId` cùng debounce 300ms. Riêng hai view này thiếu.
  - `openReport`: bấm xem report A rồi nhanh chóng bấm report B, nếu response của A về sau thì drawer hiện chi tiết A trong khi đang chọn B.
- **Hướng sửa:**
  - Áp dụng đúng pattern `requestId` cùng debounce như `UsersView` (~dòng 273–293), hoặc tốt hơn là dùng hook chung `useAdminList` (mục 3.2).
  - `openReport`: lưu `detailRequestId` trong ref. Khi response về, chỉ `setSelectedReport` nếu ID vẫn khớp với lần bấm mới nhất.
- **Tiêu chí hoàn thành:** Gõ "12345" vào ô Document ID chỉ gửi 1 request sau khi dừng gõ 300ms. Drawer luôn hiện đúng report được bấm sau cùng.

### [x] 1.7. `formatDate` có thể làm sập cả tab

- **Vị trí:** `formatDate` (~dòng 77–86).
- **Mô tả:** Với chuỗi ngày không hợp lệ, `Intl.DateTimeFormat(...).format(new Date("abc"))` ném `RangeError: Invalid time value`. Chỉ cần một bản ghi có ngày sai là cả component bị sập (trang không có error boundary).
- **Hướng sửa:**
  ```ts
  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("vi-VN", { ... }).format(date);
  };
  ```
  Nên tạo sẵn instance `Intl.DateTimeFormat` một lần ở module scope để không khởi tạo lại mỗi lần render.
- **Bổ sung:** Bọc phần `{content}` trong `AdminContent` bằng một Error Boundary để lỗi ở một tab không làm trắng toàn trang.

### [x] 1.8. Trạng thái báo cáo viết cứng và đổi ngay không cần xác nhận

- **Vị trí:** `reportStatuses` và `reportStatusTones` (~dòng 55–61). `<select>` đổi trạng thái trong bảng (~dòng 861–868) và trong drawer (~dòng 949–956).
- **Mô tả:**
  - Chuỗi tiếng Việt ("Chờ giải quyết"…) được dùng **làm giá trị gửi API**. Chỉ cần BE đổi chính tả hoặc thêm trạng thái là FE gửi sai hoặc hiển thị sai.
  - Endpoint `reportsApi.getOptions()` đã tồn tại và [MyReports.tsx](../src/pages/Reports/MyReports.tsx) (~dòng 52–56) đang dùng (`response.data?.data?.statuses`), nhưng trang admin không dùng.
  - Đổi trạng thái qua `<select>` trên từng dòng là áp dụng ngay, không xác nhận, nên dễ đổi nhầm khi cuộn bằng bàn phím hoặc chuột.
  - Bảng hiện cả `Badge` lẫn `<select>` cho cùng một thông tin.
  - `DashboardView` (~dòng 247) luôn tô màu badge trạng thái báo cáo là `warning`, bất kể trạng thái thật.
- **Hướng sửa:**
  1. Load danh sách trạng thái từ `reportsApi.getOptions()` một lần (có thể cache trong module). Chỉ fallback về danh sách viết cứng khi API lỗi, giống `MyReports`.
  2. Map màu theo trạng thái. Nếu BE trả mã trạng thái (xem mục 5.4) thì map theo mã.
  3. Trong bảng: chỉ hiện `Badge`. Việc đổi trạng thái thực hiện trong drawer chi tiết, qua các nút hành động rõ ràng (xem mục 2.1) thay vì `<select>`.
  4. Dashboard dùng chung `reportStatusTones`.

### [x] 1.9. API contract mơ hồ khi cập nhật người dùng

- **Vị trí:** `submitRename` gửi `{ full_name: fullName, fullName }` (~dòng 362). `removeAvatar` gửi `{ avatar_url: null, avatarUrl: null, avatar: null }` (~dòng 377). `openQuotaModal` đọc `user.storage_limit_bytes ?? user.storageLimitBytes` (~dòng 317).
- **Mô tả:** Gửi nhiều tên field cho cùng một giá trị cho thấy chưa chốt DTO. Nếu BE bật kiểm tra field thừa (whitelist/forbidNonWhitelisted), request sẽ bị từ chối. Nếu BE bỏ qua field lạ thì không biết field nào thực sự có tác dụng.
- **Hướng sửa:** Agent đọc DTO hoặc validator của `PATCH /admin/users/:id` bên BE (xem mục 5.2), rồi chỉ gửi đúng tên field đó. Xóa các fallback đọc dữ liệu thừa (`user.fullName`, `user.avatarUrl`…) nếu BE luôn trả về snake_case.
- **Tiêu chí hoàn thành:** Mỗi thao tác gửi đúng một tên field cho mỗi giá trị, khớp với DTO bên BE.

### [x] 1.10. Menu thao tác người dùng bị tách khỏi nút khi cuộn

- **Vị trí:** `UsersView`, `actionMenu` với `top/left` tính một lần khi click (~dòng 453–464). Overlay đóng menu (~dòng 398–405).
- **Mô tả:** Menu dùng `position: fixed` với tọa độ cố định. Khi cuộn trang (overlay không chặn được thao tác cuộn bằng con lăn), menu đứng yên trong khi nút đã trôi đi. Menu không đóng bằng Escape, thiếu `role="menu"`/`role="menuitem"`, không điều hướng được bằng bàn phím. Mở menu gần cuối màn hình thì bị tràn xuống dưới.
- **Hướng sửa:** Tạo component `AdminActionMenu` dùng chung:
  - Định vị `absolute` theo nút (bảng đã có `overflow-x-auto` nên cần portal với tọa độ được tính lại khi `scroll`/`resize`), hoặc đơn giản là đóng menu khi có sự kiện `scroll`.
  - Đóng khi nhấn Escape hoặc bấm ra ngoài. Lật menu lên trên nếu không đủ chỗ phía dưới.
  - Có thể tham khảo `ItemActionDropdown` trong `src/pages/Library/` hoặc `src/components/Workspace/` (đã xử lý bấm ra ngoài và Escape).

---

## 2. Thiếu chức năng và luồng nghiệp vụ

### [x] 2.1. Kiểm duyệt (moderation) báo cáo chưa khép kín

- **Vị trí:** Drawer chi tiết trong `ReportsView` (~dòng 892–980).
- **Mô tả:** Drawer chỉ đổi được trạng thái báo cáo. Không có cách xử lý **tài liệu bị báo cáo** ngay tại đó: muốn ẩn hoặc xóa tài liệu, admin phải sang tab Tài liệu và tự tìm.
- **Hướng sửa FE:** Thêm cụm hành động trong drawer:
  - **"Ẩn tài liệu và đánh dấu Đã xử lý"**: chuyển tài liệu sang riêng tư hoặc ẩn, rồi cập nhật trạng thái báo cáo.
  - **"Xóa tài liệu và đánh dấu Đã xử lý"**: có xác nhận.
  - **"Từ chối báo cáo"**: kèm ô ghi chú lý do (gửi cho người báo cáo nếu BE hỗ trợ).
  - Hiện thêm: trạng thái công khai hiện tại của tài liệu, chủ sở hữu, số báo cáo khác trên cùng tài liệu.
- **Hướng sửa BE:** Nên có một endpoint xử lý nguyên tử (atomic), ví dụ `POST /admin/reports/:id/resolve { action: "hide_document" | "delete_document" | "reject", note }`, để không xảy ra trường hợp đã ẩn tài liệu nhưng cập nhật trạng thái báo cáo thất bại. Xem mục 5.4.

### [x] 2.2. Chuyên mục và thẻ không sửa được, form tạo còn thô

- **Vị trí:** `TaxonomyView` (~dòng 985–1128).
- **Mô tả:**
  - `adminApi.updateCategory` và `updateTag` đã có nhưng giao diện không dùng. Không đổi tên hay đổi chuyên mục cha được.
  - "Parent ID" là ô nhập text tự do, dễ nhập ID không tồn tại.
  - Cột "Parent" hiện ID thay vì tên chuyên mục cha.
  - Ô "ID tùy chọn" cho admin tự đặt ID là điều bất thường. Cần kiểm tra BE có thật sự cần không (có thể ID là slug?).
  - Xóa chuyên mục hoặc thẻ đang có tài liệu (`document_count > 0`) hay có chuyên mục con thì không có cảnh báo.
  - Phân trang phía client trên toàn bộ danh sách (chấp nhận được nếu danh sách nhỏ).
- **Hướng sửa:**
  - Thêm nút "Sửa" trên từng dòng: điền dữ liệu vào form bên trái và đổi nút thành "Cập nhật" kèm "Hủy".
  - Đổi Parent ID thành `<select>` liệt kê các chuyên mục (loại trừ chính nó và các chuyên mục con để không tạo vòng lặp).
  - Cột Parent hiện tên, tra từ `rows`.
  - Nếu ID là slug: đổi nhãn thành "Slug" và tự sinh từ tên (bỏ dấu tiếng Việt), cho phép sửa. Nếu BE tự sinh ID thì bỏ ô này.
  - Khi xóa: dùng dialog xác nhận, nêu rõ "Chuyên mục đang có N tài liệu và M chuyên mục con". Chặn xóa hoặc yêu cầu chọn chuyên mục thay thế nếu BE hỗ trợ (xem mục 5.5).

### [x] 2.3. Thiếu lối đi tắt giữa các tab

- Dashboard: thẻ "Báo cáo · X đang chờ" phải bấm được, đi tới `/admin/reports?status=<mã chờ xử lý>`. Thẻ Người dùng và Tài liệu cũng đi tới tab tương ứng.
- "Tài liệu mới" và "Báo cáo gần đây" trên Dashboard: bấm vào để mở tài liệu hoặc mở drawer chi tiết báo cáo.
- Sidebar: tab "Báo cáo" hiện badge số báo cáo đang chờ (lấy từ `dashboard.totals.pendingReports`, hoặc một endpoint nhẹ).
- Cần làm mục 4.1 (filter trên URL) trước thì link có filter mới hoạt động.

### [x] 2.4. Tab Người dùng còn thiếu

- Thêm cột dung lượng: "Đã dùng / Giới hạn" (kèm thanh tiến trình), vì đã có chức năng set quota. Cần BE trả `storage_used_bytes` (xem mục 5.2).
- Thêm bộ lọc trạng thái xác minh (Đã xác minh / Chưa xác minh).
- Cho phép sắp xếp theo ngày tạo, số tài liệu, dung lượng (hiện đang cố định `created_at desc`).
- Thêm thao tác **khóa/mở khóa tài khoản** thay vì chỉ có xóa cứng (nếu BE hỗ trợ, xem mục 5.2).
- Badge vai trò hiện `admin`/`user` thô, nên đổi thành "Quản trị viên"/"Người dùng".

### [x] 2.5. Tab Tài liệu và Bộ sưu tập

- Tên tài liệu hoặc bộ sưu tập phải là link tới `/document/:id` hoặc `/collection/:id` (mở tab mới).
- Nút "Ẩn"/"Mở" dễ gây hiểu nhầm. Đổi thành "Chuyển riêng tư"/"Công khai", hoặc dùng toggle có nhãn.
- Thêm bộ lọc "Có báo cáo" (`report_count > 0`) và sắp xếp theo lượt tải hoặc số báo cáo.
- Xóa tài liệu: dùng dialog xác nhận, hiển thị số lượt tải và số báo cáo.

### [x] 2.6. Audit log khó dùng

- **Vị trí:** `AuditLogsView` (~dòng 1359–1423).
- Cột Actor hiện user ID thay vì tên/email. Cần BE join thông tin người thực hiện (xem mục 5.7).
- Cột Chi tiết là JSON bị `truncate`, không xem đầy đủ được. Thêm nút mở rộng từng dòng (hiện JSON dạng `<pre>` đã format) hoặc mở drawer.
- Lọc Action và Entity type đang là ô text tự do với placeholder tiếng Anh. Đổi thành `<select>` lấy danh sách từ BE, hoặc ít nhất là danh sách gợi ý.
- Thêm bộ lọc khoảng thời gian (từ ngày, đến ngày).
- Có thể thêm export CSV nếu BE hỗ trợ.

---

## 3. Chất lượng code và tái cấu trúc

### [x] 3.1. Tách file

Đề xuất cấu trúc:

```
src/pages/Admin/
  Admin.tsx                     // chỉ còn layout, sidebar, routing tab, error boundary
  adminTabs.ts                  // định nghĩa tabs và nhóm (xem mục 4.2)
  views/
    DashboardView.tsx
    UsersView.tsx
    DocumentsView.tsx
    ReportsView.tsx
    TaxonomyView.tsx
    CollectionsView.tsx
    AnalyticsView.tsx
    EngagementView.tsx
    AuditLogsView.tsx
    SeoView.tsx
  components/
    AdminBadge.tsx
    AdminEmptyState.tsx
    AdminLoading.tsx            // skeleton bảng
    AdminSearchInput.tsx
    AdminPagination.tsx
    AdminModal.tsx              // dialog chung có a11y (mục 4.5)
    AdminConfirmDialog.tsx      // hoặc tái sử dụng WorkspaceConfirmDialog
    AdminActionMenu.tsx         // mục 1.10
    BarChart.tsx                // nếu tự vẽ chart (mục 4.6)
  hooks/
    useAdminList.ts             // mục 3.2
  adminFormat.ts                // formatDate, formatNumber, formatBytes, ownerName
  types.ts                      // AdminUser, AdminDocument, AdminReport, ...
```

- Có thể dùng `React.lazy` cho từng view để giảm kích thước bundle ban đầu (đặc biệt là SEO và Analytics).
- `Admin()` hiện chỉ bọc `AdminContent()` mà không làm gì thêm, nên gộp làm một. Hai lần kiểm tra `Navigate` (~dòng 1614–1620) cũng gộp làm một.

### [x] 3.2. Hook `useAdminList` cho 6 view đang lặp cùng một pattern

`UsersView`, `DocumentsView`, `ReportsView`, `CollectionsView`, `AuditLogsView` (và một phần `TaxonomyView`) đều lặp: `rows`, `pagination`, `loading`, `page`, `requestId`, debounce, `unwrapList`, toast lỗi.

```ts
function useAdminList<TFilters extends Record<string, any>, TRow>(
  fetcher: (params: TFilters & { PageNumber: number; PageSize: number }) => Promise<{ data: TRow[]; pagination: Pagination }>,
  filters: TFilters,
  options?: { pageSize?: number; debounceMs?: number; errorMessage?: string }
): { rows: TRow[]; pagination: Pagination | null; loading: boolean; page: number; setPage: (p: number) => void; reload: () => void }
```

- Bên trong: debounce, chống race bằng `requestId`, tự reset `page = 1` khi `filters` đổi (so sánh bằng `JSON.stringify`), toast khi lỗi.
- Kết hợp với mục 4.1: `filters` và `page` đọc/ghi từ URL.
- Thêm helper `runAdminAction(fn, { success, error })` cho các thao tác ghi (mục 1.3).

### [x] 3.3. Thống nhất cách gọi API và kiểu dữ liệu

- `adminApi` trả response axios thô (phải `unwrap`), còn `featureUpgradesApi` trả `response.data`. Chọn **một** cách: nên cho `adminApi` trả `response.data` và chuyển sang `.ts` có kiểu.
- Bỏ các fallback đọc nhiều tên field (`body.auditLogs || body.logs || body.data`, `row.createdAt || row.created_at`, `item.count ?? item.views`…) sau khi đã chốt contract với BE (mục 5).
- Khai báo interface trong `src/pages/Admin/types.ts` dựa trên DTO hoặc response thật của BE, thay cho `any`.

### [x] 3.4. Các điểm nhỏ

- `window.confirm` dùng ở 6 chỗ (xóa user, xóa avatar, xóa tài liệu, xóa báo cáo, xóa chuyên mục/thẻ, xóa bộ sưu tập). Thay bằng dialog xác nhận chung.
- Màu viết cứng (`bg-white`, `bg-gray-50`, `bg-gray-100`, `emerald-*`, `amber-*`…) nên đổi sang token dự án (`bg-surface`, `bg-canvas`, `text-success`, `text-warning`, `text-danger`… kiểm tra trong `tailwind.config.js`).
- `Badge` ở đây trùng tên và chức năng với `Badge` export từ `src/pages/Folders/FolderListPage.tsx`. Nên gom về một component trong `src/components/`.
- "Thống kê" và "Tương tác" dùng chung icon `BarChart3`.

---

## 4. UI/UX

### [x] 4.1. Lưu filter, search và page trên URL

- Hiện tất cả là state cục bộ, nên F5 hay bấm Back là mất, và không gửi link đã lọc cho người khác được (cũng là điều kiện cho mục 2.3).
- Dùng `useSearchParams` (tham khảo `MyReports.tsx`). Ví dụ `/admin/reports?status=pending&page=2`, `/admin/users?role=admin&search=abc`.
- Ô search: chỉ ghi URL sau debounce để không làm rối lịch sử trình duyệt (dùng `replace: true`).

### [x] 4.2. Sidebar và header

- Sidebar phẳng 11 mục. Đề xuất nhóm lại:
  - **Tổng quan**
  - **Nội dung:** Tài liệu, Bộ sưu tập, Báo cáo
  - **Người dùng**
  - **Phân loại:** Chuyên mục, Thẻ
  - **Phân tích:** Thống kê, Tương tác
  - **Hệ thống:** Nhật ký hoạt động (Audit), SEO
- Dưới `lg`, sidebar xếp dọc phía trên nội dung. Đổi thành thanh tab ngang cuộn được, hoặc drawer.
- Header lặp tầng: badge "Admin", h1 "Quản trị DocShare", câu mô tả, rồi h2 tên tab (~dòng 1644–1681). Bỏ khối h1 và mô tả, chỉ giữ tiêu đề tab (có thể kèm breadcrumb `Quản trị / {tab}`).
- `PageTitle` luôn là "Quản trị". Đổi thành `Quản trị · {tên tab}`.

### [x] 4.3. Kích thước trang và loading

- `PAGE_SIZE = 8` quá ít cho bảng admin, trong khi Audit log dùng 50. Đặt mặc định 20 và cho chọn 20/50/100.
- `LoadingState` thay cả bảng bằng một spinner, nên khi đổi trang bảng bị nhảy layout. Giữ dữ liệu cũ kèm overlay mờ, hoặc dùng skeleton đúng số dòng.
- `PaginationBar` chỉ có nút trước/sau. Có thể dùng `components/Pagination/Pagination.tsx` (đã dùng ở `/library`) để nhảy trang trực tiếp.

### [x] 4.4. Việt hóa và text

| Vị trí | Hiện tại | Đề xuất |
|---|---|---|
| Tab | Audit logs | Nhật ký hoạt động |
| Menu user | Set dung lượng | Đặt dung lượng |
| Modal quota | Set dung lượng người dùng | Đặt giới hạn dung lượng |
| Drawer báo cáo | Chi tiết moderation / "Xem tài liệu, reporter và thao tác xử lý report." | Chi tiết báo cáo / "Xem tài liệu, người báo cáo và xử lý." |
| Drawer báo cáo | Reporter, Xóa report | Người báo cáo, Xóa báo cáo |
| Bảng báo cáo | Document #123 | Mã tài liệu: 123 |
| Engagement | Views / Downloads, "Views và downloads theo ngày", toast "engagement analytics" | Lượt xem / Lượt tải, "Lượt xem và lượt tải theo ngày", "Không tải được dữ liệu tương tác" |
| Audit | Action, Entity, Actor, placeholder "Action: comment.created" | Hành động, Đối tượng, Người thực hiện |
| SEO | Generate, Sitemap routes, Preview social, Locale | Tạo sitemap, Danh sách route sitemap, Xem trước khi chia sẻ, Ngôn ngữ |
| Lọc vai trò | User / Admin | Người dùng / Quản trị viên |
| Lọc báo cáo | "Lọc theo document ID", "Lọc theo user ID" | Đổi thành ô tìm theo tên tài liệu hoặc email (cần BE hỗ trợ, mục 5.4) |

### [x] 4.5. Modal, drawer và khả năng truy cập (a11y)

- Modal quota, modal đổi tên và drawer báo cáo đều tự viết bằng `div.fixed`, thiếu `role="dialog"`, `aria-modal`, `aria-labelledby`, không có focus trap, không đóng bằng Escape, không trả focus về nút đã mở.
- Drawer báo cáo không có nền mờ phía sau, bấm ra ngoài không đóng.
- Tạo `AdminModal` (và biến thể drawer) dùng chung: portal, focus trap, đóng khi nhấn Escape hoặc bấm nền, khóa scroll của body.
- Các nút chỉ có icon (xóa, xem, đóng) mới có `title`, cần thêm `aria-label`.
- Ô search không có `aria-label`.

### [x] 4.6. Biểu đồ

- Biểu đồ tự vẽ bằng `div`: không có trục Y hay giá trị, tooltip chỉ là `title` (không dùng được trên thiết bị cảm ứng), chọn 365 ngày thành 365 cột cuộn ngang.
- Hướng sửa:
  - Gom dữ liệu theo tuần khi chọn 90 ngày, theo tháng khi chọn 365 ngày (làm ở BE hoặc FE).
  - Hiện giá trị khi hover/tap, có đường lưới hoặc nhãn giá trị lớn nhất.
  - Cân nhắc thư viện chart (kiểm tra `package.json` xem đã có thư viện nào chưa trước khi thêm).
  - Có thể thêm thẻ so sánh với kỳ trước (ví dụ +12% so với 30 ngày trước) nếu BE cung cấp.

---

## 5. Yêu cầu và kiểm tra phía Backend

> FE gọi các endpoint qua [adminApi.js](../src/api/adminApi.js) và [featureUpgradesApi.ts](../src/api/featureUpgradesApi.ts). Agent cần tìm controller, route và DTO tương ứng trong repo BE để xác minh.

### Bảng endpoint đang dùng

| Hàm FE | Method và path | Tab |
|---|---|---|
| `getDashboard` | `GET /admin/dashboard` | Tổng quan |
| `getUsers` | `GET /admin/users?PageNumber&PageSize&search&role&sortBy&sortDirection` | Người dùng |
| `updateUser` | `PATCH /admin/users/:userId` | Người dùng (đổi quyền, đổi tên, xóa avatar) |
| `deleteUser` | `DELETE /admin/users/:userId` | Người dùng |
| `updateUserStorage` | `PATCH admin/users/:userId/storage { storageLimitBytes }` | Người dùng |
| `getDocuments` | `GET /admin/documents?PageNumber&PageSize&search&isPublic&sortBy&sortDirection` | Tài liệu |
| `updateDocument` / `deleteDocument` | `PATCH` / `DELETE /admin/documents/:id` | Tài liệu |
| `getReports` / `getReport` | `GET /admin/reports?PageNumber&PageSize&status&documentId&userId`, `GET /admin/reports/:id` | Báo cáo |
| `updateReport` / `deleteReport` | `PATCH` / `DELETE /admin/reports/:id` | Báo cáo |
| `reportsApi.getOptions` | `GET reports/options` | (nên dùng cho Báo cáo) |
| `getCategories` / `createCategory` / `updateCategory` / `deleteCategory` | `/admin/categories[/:id]` | Chuyên mục |
| `getTags` / `createTag` / `updateTag` / `deleteTag` | `/admin/tags[/:id]` | Thẻ |
| `getCollections` / `deleteCollection` | `/admin/collections[/:id]` | Bộ sưu tập |
| `getDocumentAnalytics` | `GET /admin/analytics/documents?days` | Thống kê |
| `getEngagementAnalytics` | `GET admin/analytics/engagement?days` | Tương tác |
| `getAuditLogs` | `GET admin/audit-logs?PageNumber&PageSize&entityType&action&actorUserId` | Audit |
| `getSeoSettings` / `updateSeoSettings` | `GET` / `PUT /admin/seo/settings` | SEO |
| `getRobotsTxt` / `updateRobotsTxt` | `GET` / `PUT /admin/seo/robots` | SEO |
| `getSitemapRoutes` / `updateSitemapRoutes` | `GET` / `PUT /admin/seo/sitemap-routes` | SEO |
| `generateSitemap` | `POST /admin/seo/sitemap/generate` | SEO |

### [x] 5.0. Bảo vệ route admin

- Xác minh **mọi** route `/admin/*` (bao gồm `admin/audit-logs`, `admin/analytics/engagement`, `admin/users/:id/storage`) đều có middleware hoặc guard kiểm tra `role === "admin"` từ token hoặc DB, không tin vào dữ liệu client gửi lên.
- `RequireAuth admin` ở FE chỉ để điều hướng UI, không phải cơ chế bảo mật.

### [x] 5.1. Ràng buộc khi đổi quyền và xóa người dùng (bảo mật)

`PATCH /admin/users/:id` (field `role`) và `DELETE /admin/users/:id` phải:
- Từ chối khi `:id` là chính người gọi (tự hạ quyền hoặc tự xóa). Trả 400/403 kèm `message` tiếng Việt.
- Từ chối khi thao tác sẽ khiến hệ thống **không còn admin nào**.
- Ghi audit log cho mọi thay đổi `role`, xóa user và đổi quota (kiểm tra xem đã ghi chưa).
- Xác định rõ khi xóa user thì tài liệu, bộ sưu tập, thư mục của họ xử lý thế nào (xóa theo, chuyển chủ sở hữu, hay soft delete). FE cần biết để hiện cảnh báo chính xác.

### [x] 5.2. DTO cập nhật người dùng và dữ liệu danh sách

- Trả lời rõ: `PATCH /admin/users/:id` chấp nhận những field nào và đặt tên ra sao (`full_name` hay `fullName`, `avatar_url` hay `avatarUrl`)? Xóa avatar thì gửi `null` cho field nào? FE sẽ chỉ gửi đúng field đó (mục 1.9).
- `GET /admin/users`: bổ sung `storage_used_bytes` và `storage_limit_bytes` cho mỗi user (mục 2.4). Hỗ trợ lọc `isVerified` và `sortBy` theo `document_count`, `storage_used_bytes`.
- Nếu muốn có khóa/mở khóa tài khoản: thêm field (ví dụ `is_locked` hoặc `status`) và kiểm tra field này khi đăng nhập.

### [x] 5.3. Thao tác trên tài liệu

- `PATCH /admin/documents/:id` hiện nhận `{ isPublic }`. Xác nhận tên field.
- `GET /admin/documents`: hỗ trợ lọc `hasReports=true` và `sortBy` theo `download_count`, `report_count` (mục 2.5).

### [x] 5.4. Báo cáo: mã trạng thái và luồng xử lý

- **Mã trạng thái:** Hiện trạng thái được lưu và gửi dưới dạng chuỗi tiếng Việt. Đề xuất `GET reports/options` trả `statuses: [{ value: "pending", label: "Chờ giải quyết" }, ...]`, và BE nhận `value`. Nếu thay đổi này ảnh hưởng tới dữ liệu cũ hoặc trang `MyReports`, hãy giữ tương thích ngược (chấp nhận cả hai trong giai đoạn chuyển đổi) và cập nhật cả `MyReports.tsx`, `ReportDetail`.
- **Xử lý nguyên tử:** Thêm `POST /admin/reports/:id/resolve` với body `{ action: "hide_document" | "delete_document" | "reject" | "mark_resolved", note?: string }`. Endpoint này cập nhật tài liệu và trạng thái báo cáo trong cùng một transaction, ghi audit log, và gửi thông báo cho người báo cáo nếu có hệ thống notification (mục 2.1).
- **Tìm kiếm:** `GET /admin/reports` hỗ trợ `search` theo tên tài liệu và email người báo cáo, thay vì chỉ lọc theo ID.
- **Chi tiết:** `GET /admin/reports/:id` trả thêm `document.is_public`, `document.owner`, và số báo cáo khác trên cùng tài liệu.

### [x] 5.5. Chuyên mục và thẻ

- Xác nhận `categoryId`/`tagId` khi tạo là gì: slug do người dùng đặt, hay có thể để BE tự sinh? (mục 2.2)
- `PATCH /admin/categories/:id`: kiểm tra `parentId` không tạo vòng lặp (không được là chính nó hoặc con cháu của nó).
- `DELETE`: hành vi hiện tại khi chuyên mục hoặc thẻ đang có tài liệu hay có chuyên mục con là gì? Đề xuất trả 409 kèm số lượng, hoặc nhận tham số `replaceWith` để chuyển tài liệu sang chuyên mục khác.
- Danh sách chuyên mục trả kèm `parent_name` (hoặc FE tự tra).

### [x] 5.6. Analytics

- `GET /admin/analytics/engagement?days=N`: trả về một mảng đã **điền đủ mọi ngày** trong khoảng, gồm cả ngày có giá trị 0, dạng `[{ date: "YYYY-MM-DD", views, downloads }]`. Khi đó FE không phải ghép hai mảng (mục 1.5).
- `GET /admin/analytics/documents?days=N`: `uploads` cũng nên được điền đủ ngày. Hỗ trợ `groupBy=day|week|month` để FE gom nhóm khi chọn khoảng dài (mục 4.6).
- Xác nhận tên field ổn định (`count` hay `views`/`downloads`) để FE bỏ các fallback.

### [x] 5.7. Audit log

- Trả kèm thông tin người thực hiện: `actor: { user_id, username, email, full_name }`.
- Chốt tên field: `createdAt` hay `created_at`, `entityType` hay `entity_type`, `metadata` hay `details`. Chốt luôn tên mảng trong response (`auditLogs`, `logs` hay `data`).
- Hỗ trợ lọc `from`, `to` (khoảng thời gian).
- Có endpoint (hoặc trả trong response) danh sách `action` và `entityType` hợp lệ để FE làm `<select>`.

### [x] 5.8. SEO

- Xác minh các endpoint `/admin/seo/*` đã được cài đặt chưa. Nếu chưa thì trả 501 (hoặc 404 rõ ràng) để FE phân biệt với lỗi khác (mục 1.2).
- Chốt định dạng `GET /admin/seo/robots`: trả chuỗi thuần hay `{ content }`. Chốt định dạng `GET /admin/seo/sitemap-routes`: `string[]` hay `{ path }[]`.
- Validate phía server: `siteUrl` và `defaultImage` là URL hợp lệ, route bắt đầu bằng `/`, giới hạn độ dài title/description.
- Xem xét gộp `updateSitemapRoutes` và `generateSitemap` thành một thao tác, hoặc trả kết quả từng bước để FE báo chính xác.
- Theo ghi chú trên UI, sitemap nên tự bổ sung URL động (tài liệu, chuyên mục, bộ sưu tập công khai).

---

## 6. Thứ tự thực hiện đề xuất

1. **Bảo mật và rủi ro dữ liệu:** 5.0, 5.1 (BE) rồi 1.1 (FE). Sau đó 1.2, 1.3, 1.7.
2. **Sai dữ liệu hiển thị:** 1.4, 1.5 (cùng 5.6 nếu sửa BE), 1.6, 1.8 (cùng 5.4 phần mã trạng thái), 1.9 (cùng 5.2).
3. **Tái cấu trúc FE:** 3.1, 3.2, 3.3, 3.4 và 4.1 (filter trên URL). Làm trước các tính năng mới để không phải sửa nhiều chỗ.
4. **Tính năng:** 2.1 (cùng 5.4 resolve), 2.2 (cùng 5.5), 2.3, 2.4, 2.5, 2.6 (cùng 5.7).
5. **UI/UX:** 1.10, 4.2–4.6.

Sau mỗi bước, chạy `npx tsc --noEmit` và `npm test`, rồi kiểm tra theo checklist bên dưới. Nên commit mỗi bước riêng.

---

## 7. Checklist kiểm thử thủ công

**Bảo mật và quyền**
- [ ] Đăng nhập bằng tài khoản thường rồi vào `/admin`: bị chuyển về `/`. Gọi thẳng `GET /admin/users` bằng token user thường: BE trả 403.
- [ ] Trên dòng của chính mình trong tab Người dùng: không có "Đặt làm user" hay "Xóa người dùng". Gọi thẳng API tự hạ quyền: BE trả lỗi.
- [ ] Hệ thống chỉ có 1 admin: không thể gỡ quyền admin đó, kể cả khi gọi thẳng API.
- [ ] "Đặt làm admin" luôn hỏi xác nhận. Bấm Hủy thì không có request nào được gửi.

**Dữ liệu và thao tác**
- [ ] Làm API trả lỗi (tắt BE hoặc chặn bằng DevTools) khi ẩn/xóa tài liệu, xóa bộ sưu tập, tạo chuyên mục: luôn có toast lỗi, console không có unhandled rejection.
- [ ] Double-click nút xóa hoặc tạo: chỉ có 1 request.
- [ ] Gõ nhanh vào ô lọc ở tab Báo cáo và Audit: chỉ 1 request sau khi dừng gõ, kết quả khớp với giá trị cuối.
- [ ] Bấm nhanh "Xem" ở hai báo cáo khác nhau: drawer hiện đúng báo cáo bấm sau cùng.
- [ ] Danh sách trạng thái báo cáo lấy từ `reports/options`, màu badge đúng ở cả bảng lẫn Dashboard.
- [ ] Biểu đồ phân bổ chuyên mục: chuyên mục nhiều tài liệu nhất có thanh dài 100%, các chuyên mục khác dài theo tỷ lệ.
- [ ] Biểu đồ tương tác: tạo dữ liệu mà một số ngày chỉ có lượt xem không có lượt tải, cột vẫn đúng ngày.
- [ ] Đưa một bản ghi có ngày không hợp lệ vào dữ liệu: tab hiện "-" thay vì bị sập.

**SEO**
- [ ] Làm `GET /admin/seo/settings` trả 500: UI báo lỗi tải, nút Lưu bị disable, không hiện dữ liệu mặc định như thể là dữ liệu thật.
- [ ] `GET /admin/seo/robots` trả object: textarea không hiện `[object Object]`.
- [ ] Lưu khi BE trả 400 kèm message: toast hiện đúng message đó, không phải "chưa hỗ trợ".

**UI/UX**
- [ ] Lọc rồi chuyển trang trong tab Người dùng, sau đó F5: vẫn giữ filter và trang. Copy URL sang tab mới: hiện cùng kết quả.
- [ ] Bấm thẻ "Báo cáo" trên Dashboard: tới tab Báo cáo đã lọc trạng thái chờ xử lý.
- [ ] Mở menu `⋮` của user rồi cuộn trang: menu đóng lại hoặc đi theo nút. Nhấn Escape thì menu đóng.
- [ ] Modal và drawer: focus vào phần tử đầu tiên khi mở, Escape đóng được, focus quay về nút đã mở. Drawer báo cáo có nền mờ, bấm nền thì đóng.
- [ ] Mobile (375px): điều hướng giữa các tab được mà không phải cuộn qua 11 mục, các bảng cuộn ngang bên trong khung, trang không có thanh cuộn ngang.
- [ ] Không còn text tiếng Anh hay thuật ngữ dev trên giao diện (trừ tên kỹ thuật như robots.txt, sitemap).
- [ ] Tiêu đề tab trình duyệt thay đổi theo tab admin.

## 8. Kết quả thực hiện ngày 03/10/2026

Các mục 1–5 đã được triển khai trong working tree FE/BE. Phần mô tả lỗi và số dòng phía trên giữ làm lịch sử rà soát. Các đề xuất có điều kiện như khóa tài khoản, CSV export, React.lazy và so sánh kỳ trước chưa thêm vì chưa có API tương ứng hoặc không phải tiêu chí bắt buộc.

- Admin.tsx chỉ còn layout và chọn view; 10 view, types, formatters, hook danh sách và các thành phần chung được tách riêng. API thống nhất qua adminApi.ts; Badge dùng chung với folder.
- Thao tác ghi có khóa đồng bộ chống double-click, toast và dialog xác nhận; self-demote/self-delete/last-admin và role hiện tại được kiểm tra phía BE. DTO avatar phân biệt field không gửi với null.
- Danh sách có filter/page/pageSize trên URL, debounce search cả URL và request, giữ kết quả khi tải và loại response cũ. Báo cáo dùng statusOptions tương thích legacy, detail lấy kết quả cuối cùng; resolve cập nhật tài liệu/báo cáo/audit/notification trong transaction và đưa notification vào outbox.
- Quota, xác minh, sort users/documents, sửa chuyên mục/thẻ, chống chu trình và trả 409 khi taxonomy đang được dùng; audit có actor, filter thời gian/options và JSON mở rộng.
- Desktop có sidebar nhóm; mobile có select theo nhóm để đi thẳng tới tab. Bảng cuộn trong khung, pagination 20/50/100, tiêu đề theo tab. Modal dùng focus trap có stack cho dialog lồng nhau.
- Biểu đồ ghép dữ liệu theo ngày, có ngày 0, gom tuần/tháng, tỷ lệ theo giá trị lớn nhất và bảng số liệu. BE analytics upload hỗ trợ groupBy=day/week/month; engagement thêm daily có views/downloads đồng thời giữ mảng cũ.
- SEO có trạng thái tải/lỗi riêng, retry và chặn lưu khi tải thất bại; robots object không hợp lệ bị báo lỗi, URL/route được validate ở FE và BE, kết quả lưu route/tạo sitemap được báo riêng khi một bước lỗi.

Kiểm chứng: TypeScript đạt; ESLint được chạy trực tiếp trên source sửa; production build đạt. 46 kiểm thử Jest đạt, gồm ca admin về xác nhận quyền, debounce/race, double-click, SEO lỗi và modal lồng nhau, cùng ca Google liên kết giữ bước 2FA. Kiểm tra trình duyệt với fixture trên 375px xác nhận không tràn ngang, điều hướng theo nhóm, drawer, Escape/focus return và SEO 500/robots sai định dạng. Checklist mục 7 giữ để kiểm tra lại với API thật; fixture không thay thế kiểm thử tích hợp.

Backend có migration external identity và yêu cầu chuyển asset Cloudinary cũ sang authenticated trước khi bảo đảm thu hồi URL cũ. Xem [kết quả backend và điều kiện triển khai](../../DocShareAPI/docs/backend-project-review.md#10-kết-quả-thực-hiện-ngày-03102026). Chưa chạy SQL, commit, push hoặc deploy.
