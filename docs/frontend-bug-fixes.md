# Danh sách lỗi cần khắc phục (Frontend)

> Kết quả rà soát logic toàn bộ thư mục `src/` (nhánh `retest`, ngày 01/10/2026).
> Mỗi mục gồm: vị trí, mô tả lỗi, tình huống gây lỗi và hướng sửa đề xuất.
> Đánh dấu `[x]` khi đã sửa xong.

## Mục lục

- [🔴 Mức 1 — Nghiêm trọng (bảo mật)](#-mức-1--nghiêm-trọng-bảo-mật)
- [🟠 Mức 2 — Lỗi logic chắc chắn](#-mức-2--lỗi-logic-chắc-chắn)
- [🟡 Mức 3 — Trung bình](#-mức-3--trung-bình)
- [⚪ Mức 4 — Nhỏ / cải thiện](#-mức-4--nhỏ--cải-thiện)
- [Thứ tự sửa đề xuất](#thứ-tự-sửa-đề-xuất)

---

## 🔴 Mức 1 — Nghiêm trọng (bảo mật)

### [ ] 1.1. Khóa bí mật JWT bị lộ trong bundle production và lịch sử git

- **Vị trí:** [src/config/config.js:5](../src/config/config.js#L5), [src/utils/TokenDecode.js](../src/utils/TokenDecode.js)
- **Mô tả:** `config.js` tham chiếu `process.env.REACT_APP_TOKEN_SECRET_KEY`. Create React App nhúng mọi biến `REACT_APP_*` được tham chiếu vào file JS. Đã xác nhận giá trị khóa xuất hiện trong `build/static/js/main.*.js`. File `.env` chứa khóa này cũng đã từng được commit (7 commit cũ trên GitHub).
- **Hậu quả:** Bất kỳ ai cũng có thể lấy khóa để **tự ký token giả**, kể cả token có `role = admin`.
- **Hướng sửa:**
  1. **Backend:** tạo khóa ký JWT mới và thu hồi khóa cũ (bắt buộc, vì khóa cũ đã công khai).
  2. Xóa dòng `tokenKey` trong `config.js`.
  3. Xóa file `src/utils/TokenDecode.js` (không được dùng ở đâu) và gỡ gói `jsonwebtoken` khỏi `package.json`.
  4. Xóa `REACT_APP_TOKEN_SECRET_KEY` khỏi `.env`, rồi build lại.
  5. Frontend **không bao giờ** được giữ khóa ký. Nếu cần đọc payload JWT, chỉ decode phần base64 (không verify).

---

## 🟠 Mức 2 — Lỗi logic chắc chắn

### [x] 2.1. Nút ngôi sao "Yêu thích" ở chế độ lưới gây crash

- **Vị trí:** [src/pages/Library/MyLibraryPage.tsx:529-543](../src/pages/Library/MyLibraryPage.tsx#L529-L543) và [dòng 619](../src/pages/Library/MyLibraryPage.tsx#L619)
- **Mô tả:** `WorkspaceItemCard` gọi `onFavorite()` nhưng không destructure prop `onFavorite`, nên ném `ReferenceError: onFavorite is not defined`.
- **Tình huống:** Mở `/library` (chế độ lưới là mặc định) → bấm biểu tượng ngôi sao → lỗi, không thêm được vào yêu thích. Chế độ danh sách vẫn hoạt động.
- **Hướng sửa:** Thêm `onFavorite` vào danh sách tham số và kiểu props của `WorkspaceItemCard`. Đồng thời xóa khai báo trùng `onFavorite` trong kiểu props của `WorkspaceToolbar` (dòng 296 và 300).

### [x] 2.2. `checkNotSigned()` không chặn thao tác của người chưa đăng nhập

- **Vị trí:**
  - [src/utils/CheckSigned.js:23](../src/utils/CheckSigned.js#L23)
  - [src/pages/Documents/DocumentDetail/DocumentDetail.tsx:287](../src/pages/Documents/DocumentDetail/DocumentDetail.tsx#L287) (`handleDownloadDocument`)
  - [src/pages/Documents/DocumentDetail/DocumentDetail.tsx:348](../src/pages/Documents/DocumentDetail/DocumentDetail.tsx#L348) (`handleLike`)
- **Mô tả:**
  - Hàm chỉ gán `window.location.href = '/login'` rồi trả về; nơi gọi vẫn chạy tiếp.
  - Trong `handleDownloadDocument`, lệnh `window.location.href = downloadUrl` phía sau **ghi đè** lệnh chuyển trang, nên khách vẫn tải được file.
  - `handleLike` vẫn gọi API khi chưa đăng nhập và không có `try/catch`, gây unhandled promise rejection.
  - Điều kiện `!token && !userToken` sai: thiếu một trong hai cookie thì vẫn coi là đã đăng nhập.
- **Hướng sửa:**
  - Đổi điều kiện thành `!token || !userToken`.
  - Cho hàm trả về `boolean` (ví dụ `true` nếu đã chuyển hướng), và ở nơi gọi: `if (checkNotSigned()) return;`.
  - Bọc `handleLike` trong `try/catch` và hiển thị toast khi lỗi.

### [x] 2.3. Lượt xem tài liệu bị đếm khống

- **Vị trí:** [src/pages/Documents/DocumentDetail/DocumentDetail.tsx:262-265](../src/pages/Documents/DocumentDetail/DocumentDetail.tsx#L262-L265) và [dòng 237-260](../src/pages/Documents/DocumentDetail/DocumentDetail.tsx#L237-L260)
- **Mô tả:** Effect `recordView` và effect lấy trạng thái report phụ thuộc vào cả object `documentData`. Mỗi lần like hoặc tải xuống, `setDocumentData` tạo object mới nên effect chạy lại.
- **Tình huống:** Mở tài liệu rồi bấm like 3 lần → ghi nhận 4 lượt xem và gọi lại API report-status 4 lần.
- **Hướng sửa:** Đổi dependency thành `[documentID, documentData?.document_id]` (hoặc dùng một cờ `loaded` boolean).

### [x] 2.4. Tìm kiếm hỏng với ký tự đặc biệt và không reset trang

- **Vị trí:**
  - [src/api/documentsApi.js:18](../src/api/documentsApi.js#L18) (`getSearchDocuments`)
  - [src/api/categoriesAPI.js:8](../src/api/categoriesAPI.js#L8), [src/api/tagsAPI.js:8](../src/api/tagsAPI.js#L8)
  - [src/pages/Search/Search.tsx](../src/pages/Search/Search.tsx)
- **Mô tả:**
  - Từ khóa được ghép thẳng vào URL mà không encode: `C++` thành `C  `, `a&b` tách thành hai tham số, `#` cắt mất phần sau.
  - `Search.tsx` không đưa `currentPage` về 1 khi từ khóa đổi.
- **Tình huống:** Đang xem trang 3 của từ khóa "java", tìm từ khóa mới chỉ có 1 trang kết quả → hiển thị danh sách trống.
- **Hướng sửa:**
  - Dùng `axiosInstance.get(url, { params: { search, PageNumber, PageSize } })` để axios tự encode.
  - Thêm `useEffect(() => setCurrentPage(1), [search]);` trong `Search.tsx`.

### [x] 2.5. Phím tắt chạy cả khi người dùng đang gõ chữ

- **Vị trí:** [src/pages/Library/MyLibraryPage.tsx:1384-1409](../src/pages/Library/MyLibraryPage.tsx#L1384-L1409), [src/pages/Folders/FolderDetailPage.tsx:1379-1400](../src/pages/Folders/FolderDetailPage.tsx#L1379-L1400)
- **Mô tả:** Listener `keydown` gắn trên `window` không kiểm tra phần tử đang focus.
- **Tình huống:**
  - Không gõ được ký tự `/` trong ô đổi tên, tạo thư mục, mật khẩu chia sẻ… (bị `preventDefault` và con trỏ nhảy sang ô tìm kiếm).
  - Ctrl+A trong ô tìm kiếm chọn tất cả file thay vì bôi đen chữ.
  - Nhấn Delete khi đang sửa chữ (trong lúc có file được chọn) sẽ mở hộp thoại "Chuyển vào thùng rác".
  - Phím Delete không kiểm tra quyền `canDelete`, dù nút Xóa trên toolbar đang bị vô hiệu hóa.
- **Hướng sửa:** Đầu handler, bỏ qua khi đang nhập liệu:
  ```ts
  const target = event.target as HTMLElement;
  if (target.closest("input, textarea, select, [contenteditable='true']") && event.key !== "Escape") return;
  ```
  Đồng thời kiểm tra `canEvery(selectedItems, "canDelete")` trước khi gọi `trashSelected()`.

### [x] 2.6. Cập nhật hồ sơ làm hỏng cookie `user`

- **Vị trí:** [src/pages/Account/Profile.tsx:583](../src/pages/Account/Profile.tsx#L583) và [dòng 615](../src/pages/Account/Profile.tsx#L615)
- **Mô tả:** `Cookies.set("user", ...)` không kèm `expires`, `sameSite`, `secure`, nên cookie thành cookie phiên, trong khi cookie `token` vẫn có hạn.
- **Tình huống:** Đổi avatar → đóng và mở lại trình duyệt → cookie `user` mất, `token` còn → header hiện nút "Đăng nhập", bị chặn vào `/admin`.
- **Hướng sửa:** Tạo hàm `updateStoredUser(user)` trong `utils/authSession.js` dùng cùng `cookieOptions` và giữ thời hạn của cookie token (hoặc lưu thời điểm hết hạn khi đăng nhập), rồi dùng hàm này ở cả hai chỗ.
- **Kèm theo:** Ở dòng 576-582, nếu backend không trả `data.user`, `avatarUrl` bị gán `undefined` nên avatar trong cookie bị xóa. Cần fallback về `user.avatarUrl` cũ.

### [x] 2.7. Chính sách mật khẩu không thống nhất

- **Vị trí:** [src/pages/Auth/Register.tsx:41](../src/pages/Auth/Register.tsx#L41), [dòng 51](../src/pages/Auth/Register.tsx#L51), [src/pages/Auth/ChangePassword.js:56](../src/pages/Auth/ChangePassword.js#L56)
- **Mô tả:**
  - Trang đăng ký chấp nhận ký tự đặc biệt `!@#$%^&*(),.?":{}|<>`, còn trang đặt lại mật khẩu dùng regex `[A-Za-z\d@$!%*?&]{8,}`: chỉ cho phép `@$!%*?&` và **từ chối mọi ký tự khác** (`#`, `.`, `-`, `_`, khoảng trắng…), kèm thông báo lỗi sai lý do.
  - Trang đăng ký gọi `value.trim()` trên mật khẩu, còn trang đăng nhập thì không.
- **Tình huống:** Người dùng đặt mật khẩu `Abc#1234` khi đăng ký, nhưng không thể đặt lại cùng kiểu mật khẩu đó.
- **Hướng sửa:** Gom quy tắc vào một hàm dùng chung `utils/passwordPolicy.js` (ví dụ: ≥ 8 ký tự, có chữ hoa, có số, có ít nhất một ký tự không phải chữ/số). Không `trim()` mật khẩu.

### [x] 2.8. Thanh dung lượng lưu trữ bị đưa về 0%

- **Vị trí:** [src/pages/Library/MyLibraryPage.tsx:1306](../src/pages/Library/MyLibraryPage.tsx#L1306), [dòng 1318](../src/pages/Library/MyLibraryPage.tsx#L1318), [dòng 1341](../src/pages/Library/MyLibraryPage.tsx#L1341)
- **Mô tả:** `loadLibrary` gọi `setStorage({})` hoặc `setStorage(response.storage || {})`, ghi đè số liệu đã lấy từ `featureUpgradesApi.getStorage()`.
- **Tình huống:** Mở mục "Liên kết đã chia sẻ" hoặc "Hoạt động mở rộng" → sidebar hiện `0% · 0 B / 0 B`.
- **Hướng sửa:** Chỉ gọi `setStorage` khi response thực sự có `storage`; bỏ các lệnh `setStorage({})`.

### [x] 2.9. Kết nối realtime thông báo không tự phục hồi

- **Vị trí:** [src/api/notificationRealtime.js:65-77](../src/api/notificationRealtime.js#L65-L77)
- **Mô tả:**
  - Khi `withAutomaticReconnect` đã thử hết số lần, `onclose` chỉ reset `startPromise`, còn `connection` và `activeToken` giữ nguyên. Các lần gọi `startNotificationRealtime()` sau đó trả về kết nối đã đóng.
  - Trong `.catch` của `start()`, việc gán `connection = null` có thể xóa nhầm một kết nối **mới hơn** nếu token đã đổi.
- **Hướng sửa:** Trong `onclose`, reset `connection = null; activeToken = null;` nếu đó vẫn là kết nối hiện tại. Lưu kết nối vào biến cục bộ và so sánh `if (connection === localConnection)` trước khi reset.

### [x] 2.10. API like gửi header vào body

- **Vị trí:** [src/api/documentsApi.js:113-120](../src/api/documentsApi.js#L113-L120)
- **Mô tả:** `axiosInstance.post(url, { headers: {...} })`: tham số thứ hai của `post` là **body**, nên token bị gửi trong JSON body. (Xác thực vẫn chạy nhờ interceptor.)
- **Hướng sửa:** `axiosInstance.post(url, null, { params: { documentId, reaction } })`, bỏ header thủ công.

---

## 🟡 Mức 3 — Trung bình

### [x] 3.1. Response cũ ghi đè response mới (race condition)

- **Vị trí:**
  - `loadLibrary`: [src/pages/Library/MyLibraryPage.tsx:1294](../src/pages/Library/MyLibraryPage.tsx#L1294)
  - `loadFolder`: [src/pages/Folders/FolderDetailPage.tsx:1348](../src/pages/Folders/FolderDetailPage.tsx#L1348)
  - Tìm kiếm trong Admin (Users, Documents, Collections): [src/pages/Admin/Admin.tsx:289](../src/pages/Admin/Admin.tsx#L289), dòng 417, 674, 1153 (mỗi phím gõ gửi một request, không debounce)
  - `PreviewDrawer`: [src/pages/Library/MyLibraryPage.tsx:739-751](../src/pages/Library/MyLibraryPage.tsx#L739-L751)
- **Tình huống:**
  - Chuyển nhanh giữa các mục thư viện → dữ liệu của mục trước hiện ra ở mục sau.
  - Trong `PreviewDrawer`: xem file A rồi chuyển sang file B, trong lúc chờ API thì drawer vẫn dùng `preview.document` của A, nên tiêu đề sai và **nút Tải xuống tải nhầm file A**.
- **Hướng sửa:**
  - Dùng `AbortController` hoặc biến `ignore` trong effect, chỉ set state khi response vẫn còn hợp lệ.
  - `PreviewDrawer`: `setPreview(null)` ngay khi `item` đổi, và chỉ dùng `preview` khi `preview.document?.id === item.id`.
  - Admin: debounce 250–300ms giống `TaxonomyView`.

### [x] 3.2. Không xử lý token hết hạn (401) tập trung

- **Vị trí:** [src/api/axiosInstance.js](../src/api/axiosInstance.js)
- **Mô tả:** Không có response interceptor. Khi token hết hạn, giao diện vẫn như đang đăng nhập, mọi request đều lỗi với thông báo chung chung.
- **Hướng sửa:** Thêm interceptor: khi nhận `401` thì xóa cookie `token`/`user`, dừng realtime và chuyển về `/login?redirect=<đường dẫn hiện tại>`. Bỏ qua các endpoint `public/*` và các request đăng nhập.

### [x] 3.3. Thiếu `try/catch` khi tạo/xóa chuyên mục và thẻ (Admin)

- **Vị trí:** [src/pages/Admin/Admin.tsx:1029](../src/pages/Admin/Admin.tsx#L1029) (`createItem`), [dòng 1047](../src/pages/Admin/Admin.tsx#L1047) (`deleteItem`)
- **Tình huống:** Tạo chuyên mục trùng tên → backend trả lỗi → không có thông báo nào, chỉ có unhandled rejection trong console.
- **Hướng sửa:** Bọc trong `try/catch` và gọi `toast.error(error?.response?.data?.message || ...)`.

### [x] 3.4. Header re-render mỗi giây

- **Vị trí:** [src/components/Headers/AccountButton.jsx:34-38](../src/components/Headers/AccountButton.jsx#L34-L38)
- **Mô tả:** `setInterval` đọc cookie mỗi 1 giây, `normalizeUser` luôn tạo object mới, nên `AccountButton` và cả `NotificationDropdown` render lại liên tục.
- **Hướng sửa:** Chỉ `setUser` khi chuỗi cookie thay đổi (so sánh với giá trị trước, lưu trong `useRef`). Tốt hơn nữa là dùng React Context cho trạng thái đăng nhập.

### [x] 3.5. Chặn quyền truy cập chỉ ở frontend

- **Vị trí:** [src/App.js](../src/App.js), [src/pages/Admin/Admin.tsx:104-117](../src/pages/Admin/Admin.tsx#L104-L117)
- **Mô tả:**
  - Các trang `/library`, `/account/*`, `/upload-document`, `/my-collections`, `/my-reports` không có route guard; khách vào sẽ thấy spinner treo hoặc toast lỗi.
  - Quyền vào Admin dựa trên `role` trong cookie, mà người dùng có thể tự sửa cookie này.
- **Hướng sửa:** Tạo component `<RequireAuth>` (và `<RequireAdmin>`) để bọc các route cần đăng nhập. **Backend phải tự kiểm tra quyền** ở mọi endpoint `admin/*`.

---

## ⚪ Mức 4 — Nhỏ / cải thiện

- [x] **4.1.** [DocumentInsightsPanel.tsx:161](../src/components/Documents/DocumentInsightsPanel.tsx#L161), [dòng 177](../src/components/Documents/DocumentInsightsPanel.tsx#L177): `insights.daily.map` và `insights.sources.length` crash nếu backend thiếu trường. Dùng `(insights.daily || [])`.
- [x] **4.2.** `JSON.parse` cookie `documentHistory` không có `try/catch` ([DocumentsHistory.tsx:65](../src/components/Documents/DocumentsHistory.tsx#L65), [DocumentDetail.tsx:176](../src/pages/Documents/DocumentDetail/DocumentDetail.tsx#L176)). Cookie hỏng có thể làm crash trang chủ.
- [x] **4.3.** [UploadDocument.tsx](../src/pages/Documents/DocumentUpload/UploadDocument.tsx):
  - `clearSelectedFile` không reset `input.value`, nên chọn lại đúng file đó thì `onChange` không chạy.
  - Kiểm tra theo `file.type` có thể từ chối `.docx`/`.txt` khi trình duyệt trả MIME rỗng. Nên thêm kiểm tra theo đuôi file.
- [x] **4.4.** [MyCollections.tsx:56-69](../src/pages/Collections/MyCollections.tsx#L56-L69): tạo bộ sưu tập thất bại vẫn đóng modal và xóa dữ liệu đã nhập. Chỉ đóng và reset khi thành công.
- [x] **4.5.** Nút "Copy link" khi chưa có link chỉ tạo link mà không copy ([DocumentDetail.tsx:417](../src/pages/Documents/DocumentDetail/DocumentDetail.tsx#L417), [MyLibraryPage.tsx:1142](../src/pages/Library/MyLibraryPage.tsx#L1142)). Sau `save()` nên copy luôn `response.shareLink.shareUrl`.
- [x] **4.6.** `MoveCopyDialog` cho phép chọn chính thư mục đang di chuyển (hoặc thư mục con của nó) làm đích ([MyLibraryPage.tsx:1031](../src/pages/Library/MyLibraryPage.tsx#L1031)). Nên vô hiệu hóa các node này.
- [x] **4.7.** `ForgotPassword.js` và `ChangePassword.js`: `setInterval`/`setTimeout` không được dọn khi component unmount.
- [x] **4.8.** Dự án không có `tsconfig.json`, nên CRA không kiểm tra kiểu và các lỗi như mục 2.1 lọt qua. Các lỗi kiểu khác hiện có: [Profile.tsx:581](../src/pages/Account/Profile.tsx#L581), [FolderDetailPage.tsx:192](../src/pages/Folders/FolderDetailPage.tsx#L192). Nên thêm `tsconfig.json` và chạy `tsc --noEmit` trong CI.
- [x] **4.9.** Xóa `console.log` còn sót: [LoginPage.tsx:234-236](../src/pages/Auth/LoginPage.tsx#L234-L236), [DocumentDetail.tsx:194](../src/pages/Documents/DocumentDetail/DocumentDetail.tsx#L194), [TokenDecode.js:10](../src/utils/TokenDecode.js#L10).

---

## Thứ tự sửa đề xuất

| Ưu tiên | Mục | Ghi chú |
|---|---|---|
| 1 | 1.1 | Đổi khóa JWT ở backend **ngay**, rồi dọn frontend |
| 2 | 2.1, 2.2, 2.3 | Crash và lỗ hổng chặn đăng nhập, sửa nhanh |
| 3 | 2.4 – 2.10 | Lỗi logic ảnh hưởng trực tiếp người dùng |
| 4 | 3.1 – 3.5 | Độ ổn định và kiến trúc xác thực |
| 5 | 4.x | Dọn dẹp khi có thời gian |

## Kết quả sửa trong workspace

- Đã xử lý các mục 2.1–2.10, 3.1–3.5 và 4.1–4.9 trong mã nguồn.
- Mục 1.1: FE đã gỡ khóa ký, TokenDecode và jsonwebtoken; BE cục bộ đã đổi khóa trong appsettings được gitignore. Chưa đánh dấu hoàn tất vì cần thay JWT_SECRET_KEY và khởi động lại BE trên các máy chủ triển khai để thu hồi khóa cũ. Xem [hướng dẫn đổi khóa](../../DocShareAPI/docs/jwt-key-rotation.md).
- Thêm route guard kiểm tra admin qua API hồ sơ; middleware BE kiểm tra role hiện tại trong database cho mọi /api/admin/*.
- Thêm tsconfig, npm run typecheck và workflow CI; sửa các kiểu dữ liệu cũ để typecheck toàn bộ src chạy được.
- Kiểm tra đã qua: FE `npm run typecheck`, production build ở chế độ CI, 27 test hồi quy trong 4 suite; BE `dotnet build` (0 warning, 0 error). Chưa kiểm thử tích hợp với máy chủ triển khai.
