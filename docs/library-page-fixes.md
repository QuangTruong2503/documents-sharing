# Rà soát trang `/library`: lỗi và hướng dẫn sửa

> Kết quả rà soát trang Thư viện (`/library`) và trang con thư mục (`/library/folders/:folderId`), nhánh `retest`, ngày 03/10/2026.
> Tài liệu dành cho agent có quyền đọc và sửa cả **Frontend (FE)** lẫn **Backend (BE)**.
> Mỗi mục gồm: vị trí, mô tả, tình huống tái hiện, hướng sửa và tiêu chí hoàn thành. Đánh dấu `[x]` khi đã sửa xong.

## Mục lục

- [0. Bối cảnh và quy ước](#0-bối-cảnh-và-quy-ước)
- [1. Lỗi logic (ưu tiên cao)](#1-lỗi-logic-ưu-tiên-cao)
- [2. Logic phân cấp và điều hướng](#2-logic-phân-cấp-và-điều-hướng)
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
| [src/pages/Library/MyLibraryPage.tsx](../src/pages/Library/MyLibraryPage.tsx) | Trang `/library` (cấp 0). Chứa sidebar 8 khu vực, toolbar, grid/list, các dialog. ~1.800 dòng. |
| [src/pages/Folders/FolderDetailPage.tsx](../src/pages/Folders/FolderDetailPage.tsx) | Trang `/library/folders/:folderId` (cấp 1+). Chứa **bản sao** của hầu hết component ở trên, thêm Members/Invites/Settings. ~1.700 dòng. |
| [src/api/workspaceLibraryApi.ts](../src/api/workspaceLibraryApi.ts) | Client API cho thư viện và kiểu `WorkspaceItem`, `WorkspaceFolder`. |
| [src/utils/workspaceLibraryHelpers.ts](../src/utils/workspaceLibraryHelpers.ts) | Helper: `canEvery`, pagination, download, thông báo batch. |
| [src/components/Workspace/](../src/components/Workspace/) | Component dùng chung đã có: `WorkspaceCreateDropdown`, `WorkspaceConfirmDialog`, `WorkspaceActivityView`, `WorkspaceLoadingSkeleton`. |
| [src/pages/Folders/FolderListPage.tsx](../src/pages/Folders/FolderListPage.tsx) | Không còn được dùng làm route (`/folders` đã redirect về `/library`), nhưng vẫn export `apiMessage`, `Badge`, `roleLabel` cho các trang khác. |
| [src/App.js](../src/App.js) (dòng ~111–149) | Khai báo route `/library`, các redirect cũ và route folder. |

### Khu vực (`area`) của trang `/library`

Giá trị lấy từ query `?area=`: `my` (mặc định), `shared`, `team`, `recent`, `favorites`, `shared-links`, `activity`, `trash`. Mỗi khu vực gọi một endpoint riêng (xem [mục 5](#5-yêu-cầu-và-kiểm-tra-phía-backend)).

### Quy ước

- Số dòng ghi trong tài liệu là theo trạng thái hiện tại và có thể lệch sau khi sửa. Hãy tìm theo **tên hàm/component** được nêu kèm.
- Working copy hiện có một số fix **chưa commit** trong `MyLibraryPage.tsx`: chống race condition khi preview, chặn di chuyển folder vào chính nó/thư mục con, sửa nút "Sao chép liên kết". Đừng revert các fix này.
- Code style: TSX, Tailwind với token màu dự án (`text-ink`, `bg-surface`, `border-line`, `btn-primary`, `btn-secondary`, `input-field`…), icon `lucide-react`, toast `react-toastify`. Toàn bộ text giao diện bằng **tiếng Việt**.

---

## 1. Lỗi logic (ưu tiên cao)

### [x] 1.1. Các fix gần đây chỉ được áp dụng ở MyLibraryPage, FolderDetailPage vẫn còn lỗi

- **Vị trí:** [FolderDetailPage.tsx](../src/pages/Folders/FolderDetailPage.tsx)
  - `PreviewDrawer` (~dòng 569–580)
  - `MoveCopyDialog`, hàm `flatNodes` (~dòng 798–808)
  - `ShareDialog`, hàm `copyLink` (~dòng 931–938)
- **Mô tả:** Hai trang có component trùng lặp. Ba fix trong `MyLibraryPage.tsx` chưa được chép sang:
  1. **Preview race:** không có cờ `ignore`, nên khi bấm nhanh file A rồi file B, response của A về sau có thể ghi đè và drawer hiện thông tin của A.
  2. **Move vào chính nó:** cây thư mục cho phép chọn chính folder đang di chuyển hoặc folder con của nó làm đích.
  3. **Copy link:** khi chưa có link, `copyLink` chỉ gọi `save()` rồi `return` nên không copy gì. Ngoài ra không bắt lỗi clipboard.
- **Hướng sửa:**
  - Cách tốt nhất là làm mục 3.1 (tách component dùng chung) để fix một lần.
  - Nếu cần sửa nhanh trước, chép đúng logic từ `MyLibraryPage.tsx`:
    - `PreviewDrawer`: tham khảo dòng ~740–756 (`let ignore`, cleanup, so khớp `preview.document.id === item.id`).
    - `MoveCopyDialog`: dòng ~996–1007 (`walk(list, depth, parentBlocked)` và deps `[nodes, items]`).
    - `ShareDialog`: `save()` phải `return response.shareLink`, còn `copyLink` dùng giá trị trả về và bọc `try/catch` quanh `copyTextToClipboard`.
- **Tiêu chí hoàn thành:** Trong một folder con, ba hành vi trên giống hệt ở `/library`.

### [x] 1.2. State không được reset khi đổi khu vực (area)

- **Vị trí:** `MyLibraryPage`, các state `search`, `fileType`, `selectedKeys`, `previewItem`, `viewMode` (~dòng 1272–1292). `navItems` (~dòng 114–123).
- **Mô tả:**
  - `search` và `fileType` chỉ khởi tạo từ URL một lần. Bấm sidebar chuyển area thì URL mất `search`/`fileType` nhưng input vẫn giữ giá trị cũ. Ô tìm kiếm hiện từ khóa nhưng danh sách không được lọc.
  - `selectedKeys` không bị xóa. Một item có mặt ở cả hai area (ví dụ `document-5` ở "Của tôi" và "Yêu thích") vẫn hiển thị là đang chọn.
  - `previewItem` không bị xóa nên drawer vẫn mở khi sang area khác.
  - `href` trong `navItems` viết cứng, không mang theo `view`, nên chuyển area thì grid/list bị reset về grid.
- **Tình huống:** Ở "Tài liệu của tôi", gõ "abc" rồi bấm Tìm, chọn 1 item, mở preview → bấm "Yêu thích" trên sidebar → ô tìm vẫn ghi "abc", item vẫn được chọn, drawer vẫn mở.
- **Hướng sửa:**
  ```tsx
  // Đồng bộ input với URL mỗi khi URL thay đổi
  useEffect(() => {
    setSearch(querySearch);
    setFileType(queryFileType);
  }, [querySearch, queryFileType]);

  // Xóa lựa chọn và preview khi đổi ngữ cảnh danh sách
  useEffect(() => {
    setSelectedKeys([]);
    setPreviewItem(null);
  }, [area, querySearch, queryFileType, pageNumber]);
  ```
  - Với `viewMode`: lưu vào `localStorage` (bọc `try/catch`) làm lựa chọn ưu tiên của người dùng, hoặc build `href` của sidebar có kèm `view` hiện tại.
  - Áp dụng tương tự cho `FolderDetailPage` khi `folderId` đổi (điều hướng giữa các folder dùng chung component nên state cũng bị giữ lại).
- **Tiêu chí hoàn thành:** Chuyển area hoặc folder thì ô tìm kiếm khớp URL, không còn item nào được chọn, drawer đóng, chế độ grid/list được giữ nguyên.

### [x] 1.3. `sort` và `viewMode` là state trùng với URL, gây gọi API 2 lần

- **Vị trí:** `MyLibraryPage` ~dòng 1274–1302 và effect `loadLibrary` (~dòng 1364–1369).
- **Mô tả:** `sort` là state, chỉ được đồng bộ từ URL trong một effect riêng. Khi chuyển từ "Của tôi" sang "Thùng rác", lần render đầu gọi `getTrash` với `sort=updated_desc` (không hợp lệ cho trash), sau đó effect đổi thành `deleted_desc` và gọi lại lần nữa. `requestId` chặn được việc response cũ ghi đè, nhưng vẫn tốn 1 request thừa.
- **Hướng sửa:** Coi URL là nguồn sự thật duy nhất.
  ```tsx
  const defaultSort = area === "trash" ? "deleted_desc" : "updated_desc";
  const sort = searchParams.get("sort") || defaultSort;
  const viewMode = (searchParams.get("view") as ViewMode) || "grid"; // hoặc fallback localStorage
  ```
  - Xóa `useState` của `sort`/`viewMode` và effect đồng bộ ở dòng ~1299–1302.
  - `changeSort` và `changeViewMode` chỉ cần gọi `setSearchParams`.
  - Kiểm tra giá trị sort có hợp lệ với area không (ví dụ `deleted_*` chỉ dùng ở trash). Nếu không hợp lệ thì dùng `defaultSort`.
  - Gom các lời gọi `setSearchParams({...})` lặp lại (`setQuery`, `submitSearch`, `changeSort`) thành **một** helper `updateQuery(patch, { resetPage })`.
- **Tiêu chí hoàn thành:** Network tab chỉ có **1** request khi chuyển area.

### [x] 1.4. Số đếm ở header và sidebar sai hoặc chập chờn

- **Vị trí:** `MyLibraryPage`, object `counts` (~dòng 1389–1398) và đoạn mô tả dưới `<h1>` (~dòng 1598–1604). Header của `FolderDetailPage` (~dòng 1567).
- **Mô tả:**
  - Header "X mục · Y thư mục · Z tài liệu" đếm trên `visibleItems`, tức là **chỉ trang hiện tại** (`pageSize: 50`). Khi có hơn 50 mục, số hiển thị sai.
  - `setWorkspaceCounts({})` ở nhánh `shared-links`, và mỗi endpoint có thể trả `counts` khác nhau, nên các số trên sidebar biến mất hoặc nhảy khi chuyển area.
  - `recent: area === "recent" ? visibleItems.length : 0` và `"shared-links": shareLinks.length` chỉ có số khi đang đứng đúng tab đó.
- **Hướng sửa:**
  - Header: dùng `pagination.totalCount` cho tổng số. Nếu BE trả về số folder và document riêng (`counts.folders`, `counts.documents` cho thư mục hiện tại) thì dùng, nếu không thì chỉ hiện tổng.
  - Sidebar: tách counts thành state riêng, **chỉ merge** khi response có trả về (`setWorkspaceCounts(prev => ({ ...prev, ...response.counts }))`) và không bao giờ reset về `{}`.
  - Tốt nhất: BE cung cấp một endpoint tổng hợp số đếm (xem mục 5.2). FE gọi một lần khi mount và gọi lại sau mỗi thao tác thay đổi dữ liệu (trash, restore, delete, favorite, upload, create).
  - Bỏ số đếm cho `recent` nếu không có nguồn đáng tin cậy.
- **Tiêu chí hoàn thành:** Số trên sidebar giữ ổn định khi chuyển area. Header đúng với tổng số kể cả khi có nhiều trang.

### [x] 1.5. Bỏ yêu thích trong tab "Yêu thích" nhưng item vẫn nằm trong danh sách

- **Vị trí:** `MyLibraryPage.toggleFavoriteItem` (~dòng 1569–1580).
- **Mô tả:** Cập nhật lạc quan (optimistic update) chỉ đổi `isFavorite`. Ở `area === "favorites"`, item phải biến mất. `counts.favorites` cũng không cập nhật.
- **Hướng sửa:**
  ```tsx
  if (area === "favorites" && !nextFavorite) {
    setItems((current) => current.filter((row) => !(row.id === item.id && row.type === item.type)));
  }
  setWorkspaceCounts((prev) => ({ ...prev, favorites: Math.max(0, (prev.favorites || 0) + (nextFavorite ? 1 : -1)) }));
  ```
  Nếu API lỗi thì rollback cả hai thay đổi (nên lưu snapshot `items` trước khi sửa).
- **Tiêu chí hoàn thành:** Bỏ sao trong tab Yêu thích thì item biến mất ngay và số trên sidebar giảm 1.

### [x] 1.6. Thiếu kiểm tra quyền cho "Gom vào thư mục" và nút yêu thích ở Thùng rác

- **Vị trí:**
  - `WorkspaceToolbar` (~dòng 360–365): nút "Gom vào thư mục".
  - `WorkspaceItemCard` (~dòng 616–629) và `WorkspaceItemList` (~dòng 713–722): nút ngôi sao.
  - `MergeDialog` được render với `parentFolderId={null}` (~dòng 1775).
- **Mô tả:**
  - Nút "Gom" chỉ kiểm tra "tất cả là document và có hơn 1 mục", không kiểm tra `canMove`. Ở tab Được chia sẻ, Nhóm, Gần đây hay Yêu thích, nút vẫn hiện và sẽ gom tài liệu (có thể của người khác) vào **thư mục gốc của người dùng hiện tại**.
  - Ở Thùng rác vẫn bấm được ngôi sao để yêu thích item đã xóa.
- **Hướng sửa:**
  - FE: `canMerge = allDocuments && selectedCount > 1 && canEvery(selectedItems, "canMove") && area === "my"`. Truyền `disabled={!canMerge}` hoặc ẩn nút.
  - FE: ẩn nút ngôi sao khi `area === "trash"`.
  - BE: xác minh endpoint `POST folders/merge` (gọi qua `mergeDocumentsIntoFolder`) **từ chối** document mà người gọi không có quyền move (xem mục 5.5). FE chỉ là lớp bảo vệ thứ hai.
- **Tiêu chí hoàn thành:** Nút Gom không hiện hoặc bị disable khi không đủ quyền hay không ở area `my`. Không có ngôi sao trong Thùng rác.

### [x] 1.7. EmptyState ghi "Kéo thả file vào đây" nhưng tính năng kéo thả chưa có

- **Vị trí:** `EmptyState` (~dòng 176). Cả hai trang đều không có handler `onDrop`/`onDragOver`.
- **Hướng sửa (chọn một):**
  - **A (nhanh):** Sửa câu chữ thành "Tải file lên hoặc tạo thư mục đầu tiên."
  - **B (đầy đủ):** Cài đặt kéo thả trên vùng `<section>` nội dung khi `canUpload`:
    - Hiện overlay "Thả để tải lên" khi `dragenter`, ẩn khi `dragleave` (đếm số lần enter/leave để không nhấp nháy).
    - Khi `drop`: lọc file lớn hơn 10MB giống `UploadDialog.handleFilesChange`, rồi gọi `workspaceLibraryApi.uploadDocuments(files, parentFolderId, onProgress)`.
    - Đặt logic trong một hook dùng chung `useFileDrop` để cả hai trang cùng dùng.
- **Tiêu chí hoàn thành:** Text khớp với tính năng thực tế.

### [x] 1.8. `area` không được kiểm tra hợp lệ

- **Vị trí:** `MyLibraryPage` ~dòng 1273 (`as LibraryArea`).
- **Mô tả:** Vào `?area=abc` thì trang gọi `getMyLibrary` nhưng sidebar không có mục nào active, và tiêu đề rơi về fallback.
- **Hướng sửa:**
  ```tsx
  const LIBRARY_AREAS = navItems.map((item) => item.key) as LibraryArea[];
  const rawArea = searchParams.get("area") || (searchParams.get("tab") === "shared" ? "shared" : "my");
  const area: LibraryArea = LIBRARY_AREAS.includes(rawArea as LibraryArea) ? (rawArea as LibraryArea) : "my";
  ```

### [x] 1.9. Phím tắt chạy cả khi đang mở dialog, và effect đăng ký lại mỗi lần render

- **Vị trí:** effect `keydown` trong `MyLibraryPage` (~dòng 1400–1427) và `FolderDetailPage` (~dòng 1384–1406). Effect không có mảng deps.
- **Mô tả:** Khi đang mở dialog hoặc confirm, Ctrl+A vẫn chọn item phía sau, Delete vẫn mở thêm confirm, F2 vẫn mở dialog rename đè lên. Listener bị gỡ và gắn lại sau mỗi lần render.
- **Hướng sửa:**
  - Thoát sớm nếu `dialog || confirmAction` (trừ phím Escape).
  - Lưu handler mới nhất vào `useRef` và đăng ký listener một lần (`useEffect(..., [])`), hoặc tách thành hook `useWorkspaceShortcuts`.

### [x] 1.10. Bộ lọc loại file không áp dụng ngay, không nhất quán với sort

- **Vị trí:** `<select>` `fileType` (~dòng 1648–1656). So sánh với `changeSort` (~dòng 1443).
- **Mô tả:** Đổi sort thì danh sách cập nhật ngay, nhưng đổi loại file thì phải bấm "Tìm".
- **Hướng sửa:** `onChange` của `fileType` gọi `updateQuery({ fileType }, { resetPage: true })` giống sort. Nút "Tìm" chỉ dành cho ô tìm kiếm.

---

## 2. Logic phân cấp và điều hướng

### [x] 2.1. Breadcrumb sai về ngữ nghĩa

- **Vị trí:** `MyLibraryPage` ~dòng 1592–1596.
- **Hiện tại:** `Tài liệu của tôi / Thùng rác`, `Tài liệu của tôi / Được chia sẻ với tôi`. Cách hiển thị này ngụ ý các khu vực là con của "Tài liệu của tôi", nhưng thực tế chúng **ngang cấp**.
- **Mong muốn:**
  ```
  Thư viện / Tài liệu của tôi
  Thư viện / Được chia sẻ với tôi
  Thư viện / Tài liệu của tôi / Folder A / Folder B     (trong folder)
  Thư viện / Được chia sẻ với tôi / Folder X            (folder người khác chia sẻ)
  ```
- **Hướng sửa:** Tạo component `LibraryBreadcrumb` dùng chung cho cả hai trang. Phần tử gốc là "Thư viện" (`/library`), phần tử thứ hai là khu vực (`/library?area=...`), sau đó là chuỗi folder.

### [x] 2.2. Mở folder từ tab "Được chia sẻ" hoặc "Nhóm" thì breadcrumb mất ngữ cảnh

- **Vị trí:** `FolderDetailPage` ~dòng 1546–1556. Fallback là `[{ name: "Tài liệu của tôi", href: "/library" }, { name: folder.name }]`. Code còn đang vá chuỗi `href` bằng `.replace("/documents/my", "/library")`, cho thấy BE đang trả về URL kiểu cũ.
- **Mô tả:** Folder của người khác vẫn hiện gốc là "Tài liệu của tôi". Bấm vào gốc sẽ về thư viện của mình chứ không về tab Được chia sẻ.
- **Hướng sửa:**
  - **BE (ưu tiên):** `GET folders/:id/items` trả `folder.breadcrumb` đầy đủ từ gốc **theo góc nhìn của người dùng hiện tại**, kèm trường cho biết gốc (xem mục 5.1). `href` phải là route mới (`/library...`), không còn `/documents/...`.
  - **FE:** Khi điều hướng vào folder từ một area, truyền `state={{ fromArea: area }}` trong `NavLink`. Ở `FolderDetailPage`, ưu tiên `folder.rootArea` từ BE, sau đó tới `location.state.fromArea`, cuối cùng mới fallback về `"my"`. Xóa các lời gọi `.replace(...)` khi BE đã trả đúng route.
- **Tiêu chí hoàn thành:** Mở folder X từ tab Được chia sẻ thì breadcrumb là `Thư viện / Được chia sẻ với tôi / X`, và bấm "Được chia sẻ với tôi" sẽ về đúng tab.

### [x] 2.3. Sidebar điều hướng biến mất khi vào folder

- **Vị trí:** `LibrarySidebar` trong `MyLibraryPage` (~dòng 197–256) và `FolderWorkspaceSidebar` trong `FolderDetailPage` (~dòng 131–212). Route ở `App.js` ~dòng 111, 146–149.
- **Mô tả:** Ở cấp 0 có sidebar 8 khu vực. Vào folder thì sidebar bị thay hoàn toàn bằng sidebar thông tin folder, nên người dùng không thể chuyển sang Thùng rác hay Được chia sẻ nếu không quay lại.
- **Hướng sửa (tái cấu trúc):**
  1. Tạo `src/pages/Library/LibraryLayout.tsx` chứa `LibrarySidebar` cố định và vùng `<Outlet />`.
  2. Đổi route trong `App.js` thành nested route:
     ```jsx
     <Route path="/library" element={<RequireAuth><LibraryLayout /></RequireAuth>}>
       <Route index element={<MyLibraryPage />} />
       <Route path="folders/:folderId" element={<FolderDetailPage />} />
       <Route path="folders/:folderId/documents" element={<FolderDetailPage />} />
       <Route path="folders/:folderId/members" element={<FolderDetailPage />} />
       <Route path="folders/:folderId/invites" element={<FolderDetailPage />} />
     </Route>
     ```
  3. Trong `FolderDetailPage`, bỏ `FolderWorkspaceSidebar`. Chuyển các phần của nó như sau:
     - Tên, quyền, mô tả folder: đưa vào header (đã có `<h1>` và `Badge`).
     - Nút "Thêm mới" và "Share folder": đưa lên header, cạnh tiêu đề.
     - Tab Tài liệu, Thành viên, Lời mời, Cài đặt: chuyển thành **tab bar ngang** dưới header.
  4. Storage và counts lấy ở `LibraryLayout` một lần, rồi truyền xuống qua context để không gọi lại mỗi khi chuyển trang.
  5. Khi đang ở trong folder, highlight khu vực gốc (lấy từ mục 2.2) trên sidebar.
- **Tiêu chí hoàn thành:** Sidebar khu vực hiển thị ở mọi cấp thư mục. Các tab của folder vẫn hoạt động, và các URL `/members` hay `/invites` vẫn mở đúng tab.

### [x] 2.4. Folder và file hiển thị trộn lẫn

- **Mô tả:** Mọi item được sắp xếp chung theo `updated_desc`, nên folder nằm xen giữa các file.
- **Hướng sửa:**
  - **BE (khuyến nghị):** Các endpoint danh sách (`library/my`, `folders/:id/items`, `library/shared-with-me`, `library/team`, `library/favorites`) luôn sắp xếp folder trước, sau đó áp dụng `sort` cho từng nhóm. Làm ở BE thì phân trang mới đúng.
  - **FE (tạm thời):** Sắp xếp ổn định trong trang hiện tại (`folders.concat(documents)`). Lưu ý cách này chỉ đúng trong phạm vi một trang.
  - Không áp dụng cho `recent` và `trash` (ở đó thứ tự thời gian quan trọng hơn).

### [x] 2.5. Hộp thoại Di chuyển/Sao chép (`MoveCopyDialog`)

- **Vị trí:** `MyLibraryPage` ~dòng 974–1051 (và bản sao trong `FolderDetailPage`).
- **Mô tả:**
  - Cây thư mục bị bung hết thành danh sách phẳng, không thu gọn được, nên chậm khi cây sâu.
  - `getFolderTree({ root: "my", includeShared: true })` trả về lẫn folder của mình và folder được chia sẻ, nhưng tất cả hiện dưới một nhãn "Tài liệu của tôi".
  - Không chặn chọn **folder cha hiện tại** của item làm đích (di chuyển vào đó thì không có gì thay đổi).
  - Mặc định chọn sẵn `targetFolderId = null` (gốc), nên dễ bấm Xác nhận nhầm.
- **Hướng sửa:**
  - Render dạng cây có nút mở/đóng, mặc định chỉ mở các nhánh dẫn tới folder hiện tại.
  - Tách hai nhóm "Tài liệu của tôi" và "Được chia sẻ với tôi". Cần BE trả cờ `isOwner` hoặc `rootArea` cho từng node (xem mục 5.3).
  - Disable node có `id === item.parentFolderId` khi tất cả item có cùng cha (chỉ áp dụng với mode move).
  - Khởi tạo `targetFolderId` là `undefined` và disable nút Xác nhận cho tới khi người dùng chọn đích.
  - Thêm ô tìm folder theo tên, lọc client-side trên cây.

---

## 3. Chất lượng code và tái cấu trúc

### [x] 3.1. Nhân đôi khoảng 1.000 dòng giữa hai trang

- **Mô tả:** Các phần sau gần như giống hệt nhau giữa `MyLibraryPage.tsx` và `FolderDetailPage.tsx`:

  | Loại | Tên |
  |---|---|
  | Component | `ItemActionDropdown`, `WorkspaceItemCard`, `WorkspaceItemList`, `PreviewDrawer`, `CreateFolderDialog`, `UploadDialog`, `RenameDialog`, `MoveCopyDialog`, `MergeDialog`, `ShareDialog`, toolbar |
  | Helper | `getItemName`, `getExtension`, `getPermissions`, `toPayloadItems`, `formatSize`, `fileIconMap`, `defaultPermissions` |
  | Logic | chọn item (`selectedKeys`, `toggleSelection`), phím tắt, trash/restore/delete forever kèm confirm, toggle favorite, download, copy link, `loadX` với `requestId` |

- **Hậu quả:** Fix ở một nơi sẽ bị quên ở nơi kia (đã xảy ra, xem mục 1.1).
- **Cấu trúc đề xuất:**
  ```
  src/components/Workspace/
    WorkspaceItemCard.tsx
    WorkspaceItemList.tsx
    WorkspaceItemActions.tsx      // ItemActionDropdown
    WorkspaceToolbar.tsx          // nhận `context: "library" | "folder"` và `area`
    WorkspacePreviewDrawer.tsx
    LibraryBreadcrumb.tsx
    dialogs/
      CreateFolderDialog.tsx      // parentFolderId: number | null
      UploadDialog.tsx
      RenameDialog.tsx
      MoveCopyDialog.tsx
      MergeDialog.tsx
      ShareDialog.tsx
      Modal.tsx                   // khung modal chung (xem 4.6)
  src/hooks/
    useWorkspaceSelection.ts      // selectedKeys, toggle, selectAll, clear, range select
    useWorkspaceActions.ts        // trash/restore/deleteForever/favorite/download/copyLink + confirm state
    useWorkspaceShortcuts.ts
    useFileDrop.ts
  src/utils/
    workspaceItem.ts              // getItemName, getExtension, getPermissions, toPayloadItems, formatBytes, fileIconMap
    apiMessage.ts                 // chuyển từ FolderListPage.tsx ra
  ```
- **Các bước:**
  1. Tách helper thuần ra `utils/workspaceItem.ts` và `utils/apiMessage.ts`. Cập nhật import ở `MyLibraryPage`, `FolderDetailPage`, `MyFolderInvitesPage`. Có thể giữ re-export tạm trong `FolderListPage.tsx` để không vỡ import.
  2. Tách từng dialog. Lấy bản trong `MyLibraryPage.tsx` làm chuẩn (đã có các fix mới nhất).
  3. Tách card, list và drawer. Prop `area` là optional (trang folder không có area).
  4. Tách hook selection và actions.
  5. Sau mỗi bước, chạy `npx tsc --noEmit` và `npm test`, rồi kiểm tra thủ công theo [mục 7](#7-checklist-kiểm-thử-thủ-công).
  6. Cân nhắc xóa `FolderListPage.tsx` nếu không còn dùng gì ngoài các export đã chuyển đi.
- **Tiêu chí hoàn thành:** Mỗi component và helper chỉ tồn tại ở một nơi. Mỗi trang dưới khoảng 500 dòng.

### [x] 3.2. Code thừa

| Vị trí (MyLibraryPage) | Vấn đề | Xử lý |
|---|---|---|
| `WorkspaceToolbar` props `folderPermissions`, `onCreate`, `onUpload` | Nhận vào nhưng không dùng | Xóa |
| `WorkspaceToolbar` ~dòng 389–391 | Nhánh `<div><></></div>` rỗng | Thay bằng `<div />` hoặc đổi layout để nút view nằm bên phải |
| `PreviewDrawer` prop `onShare` | Không có nút nào dùng | Thêm nút "Chia sẻ" (xem 4.8) hoặc xóa prop |
| `const visibleItems = useMemo(() => items, [items])` | Không có tác dụng | Dùng thẳng `items` |
| `folder` state | Chỉ dùng để tính `folderPermissions` không được dùng | Xóa nếu `/library` không cần |
| `formatSize` và `formatBytes` | Trùng chức năng | Giữ một hàm `formatBytes(bytes, emptyLabel)` |
| Storage | Lấy từ cả `featureUpgradesApi.getStorage()` lẫn `response.storage` | Chỉ giữ một nguồn (xem 5.2) |

### [x] 3.3. Kiểu dữ liệu lỏng

- `any` xuất hiện ở `preview`, `nodes` (cây thư mục), `settings` (share link), `WorkspaceActivityResponse.sections`.
- **Hướng sửa:** Khai báo interface trong `workspaceLibraryApi.ts` (`FolderTreeNode`, `DocumentPreviewResponse`, `ShareLinkSettings`) và cho các hàm API trả về kiểu tương ứng. Đối chiếu với DTO hoặc response ở BE để đặt tên trường chính xác.

---

## 4. UI/UX

### [x] 4.1. Checkbox chọn và menu thao tác bị ẩn trên thiết bị cảm ứng

- **Vị trí:** `WorkspaceItemCard` ~dòng 567–579, `WorkspaceItemList` ~dòng 688–695 và 727.
- **Mô tả:** Các phần này dùng `opacity-0 group-hover:opacity-100`. Thiết bị cảm ứng không có hover nên người dùng không thấy để chọn item hoặc mở menu `⋯`.
- **Hướng sửa:** Thêm variant Tailwind cho `(hover: none)`, hoặc luôn hiện khi màn hình dưới `lg`. Khi đã có ít nhất 1 item được chọn, hiện checkbox của mọi item.

### [x] 4.2. Thiếu "chọn tất cả" và chọn theo dải

- Thêm checkbox ở header của list view (trạng thái checked, unchecked hoặc indeterminate).
- Hỗ trợ Shift+click để chọn một dải item trong `useWorkspaceSelection`.

### [x] 4.3. Toolbar quá nhiều nút

- Khi chọn 1 document, toolbar có thể hiện tới 10 nút và dễ tràn dòng.
- **Hướng sửa:** Chỉ giữ các thao tác chính (Tải xuống, Chia sẻ, Di chuyển, Xóa). Các thao tác còn lại (Đổi tên, Chỉnh sửa, Sao chép, Copy link, Yêu thích, Gom) cho vào menu `⋯`. Trên mobile chỉ hiện icon kèm `aria-label`.

### [x] 4.4. Sidebar trên mobile

- Dưới `lg`, sidebar xếp lên trên với 8 mục cộng phần dung lượng, đẩy nội dung xuống rất thấp.
- **Hướng sửa:** Dưới `lg`, đổi thành thanh tab ngang cuộn được (`overflow-x-auto`) và ẩn khối dung lượng, hoặc dùng drawer mở bằng nút menu.
- Khối thương hiệu "DocShare / File workspace" trong sidebar trùng với header của app. Cân nhắc bỏ.

### [x] 4.5. Việt hóa và text chưa thân thiện

| Vị trí | Hiện tại | Đề xuất |
|---|---|---|
| `ShareDialog` | General access / Restricted / Anyone with link | Quyền truy cập chung / Hạn chế / Bất kỳ ai có liên kết |
| `ShareDialog` | Permission / Viewer / Editor | Quyền / Người xem / Người chỉnh sửa |
| `ShareDialog` | Allow download, Password, Expiration date, Max views, Max downloads | Cho phép tải xuống, Mật khẩu, Ngày hết hạn, Giới hạn lượt xem, Giới hạn lượt tải |
| `ShareDialog` ô mật khẩu | `<input>` dạng text | `type="password"` kèm `autoComplete="new-password"` |
| `PreviewDrawer` Trạng thái | `ready` / `processing` (giá trị thô) | Map sang "Sẵn sàng" / "Đang xử lý" / "Lỗi" |
| `WorkspaceItemList` cột Loại | "Folder" | "Thư mục" |
| `SharedLinksView` cột Loại | `row.itemType` thô | "Thư mục" / "Tài liệu" |
| Tab Hoạt động | "Hoạt động mở rộng" và mô tả "Workspace/library, sharing, versioning, report/moderation…" | "Hoạt động" và "Lịch sử thay đổi, chia sẻ và thông báo liên quan tới tài liệu của bạn." |
| `FolderWorkspaceSidebar` | "Share folder", quyền hiển thị `viewer` thô | "Chia sẻ thư mục", dùng `roleLabel()` |
| `PageTitle` | Luôn là "Tài liệu của tôi" | Dùng `activeLabel` theo area |

### [x] 4.6. Dialog thiếu khả năng truy cập (a11y)

- Mọi dialog đều dùng `div.fixed.inset-0` tự viết, không có `role="dialog"`, `aria-modal`, `aria-labelledby`, không có focus trap, không trả focus về nút đã mở dialog, và bấm ra nền ngoài không đóng.
- **Hướng sửa:** Tạo `components/Workspace/dialogs/Modal.tsx` dùng chung (portal, focus trap, đóng khi bấm nền hoặc nhấn Escape, khóa scroll của body) và cho tất cả dialog dùng nó. Kiểm tra `WorkspaceConfirmDialog` xem đã làm đúng chưa để tái sử dụng.

### [x] 4.7. Các chi tiết nhỏ

- Nút ngôi sao trong `WorkspaceItemList` thiếu `aria-label` (bản grid đã có).
- Mỗi lần toggle yêu thích hiện một toast, khá ồn. Bỏ toast khi thành công vì icon đã thể hiện trạng thái, chỉ giữ toast khi lỗi.
- Khi đổi trang, không tự cuộn lên đầu danh sách.

### [x] 4.8. Preview drawer

- Không có nền mờ phía sau, bấm ra ngoài không đóng.
- Có prop `onShare` nhưng không có nút Chia sẻ. Thêm nút khi `permissions.canShare`.
- Hiển thị thêm ngày tạo, ngày cập nhật, kích thước và thư mục chứa (có link tới folder).

---

## 5. Yêu cầu và kiểm tra phía Backend

> FE gọi các endpoint qua [workspaceLibraryApi.ts](../src/api/workspaceLibraryApi.ts) với `axiosInstance` (base URL nằm trong `src/config/config.js`). Agent cần tìm controller hoặc route tương ứng trong repo BE để xác minh.

### Bảng endpoint đang dùng

| Hàm FE | Method và path | Dùng ở |
|---|---|---|
| `getMyLibrary` | `GET library/my` | area `my` |
| `getSharedWithMe` | `GET library/shared-with-me` | area `shared` |
| `getTeam` | `GET library/team` | area `team` |
| `getRecent` | `GET library/recent` | area `recent` |
| `getFavorites` | `GET library/favorites` | area `favorites` |
| `getTrash` | `GET library/trash` | area `trash` |
| `getMyShareLinks` | `GET share-links/my` | area `shared-links` |
| `getActivity` | `GET workspace/activity` | area `activity` |
| `getFolderItems` | `GET folders/:id/items` | FolderDetailPage |
| `getFolderTree` | `GET folders/tree?root=my&includeShared=true` | MoveCopyDialog |
| `mergeDocumentsIntoFolder` | `POST folders/merge` | MergeDialog |
| `moveItems` / `copyItems` | xem file API | MoveCopyDialog |
| `trashItems` / `restoreItems` / `deleteItemsForever` | `PATCH library-items/trash`, `PATCH library-items/restore`, `DELETE library-items` | Thao tác xóa |
| `setFavorite` | `PUT library-items/:id/favorite` | Ngôi sao |
| `featureUpgradesApi.getStorage` | `GET users/me/storage` | Khối dung lượng |

Query param chung cho các endpoint danh sách: `search`, `sort`, `fileType`, `pageNumber`, `pageSize`. Response mong đợi: `{ folder?, items, pagination, counts?, storage?, message? }`.

### [x] 5.1. Breadcrumb của folder

- **Cần:** `GET folders/:id/items` trả về `folder.breadcrumb` là danh sách folder **từ gốc tới folder hiện tại** mà người dùng có quyền xem, cùng với `folder.rootArea: "my" | "shared" | "team"`.
- **Kiểm tra:** `href` hiện có còn trả về dạng `/documents/my` hay `/documents/folders/...` không (FE đang phải `.replace`). Nên trả về `id` và để FE tự build route, hoặc trả route mới `/library/folders/:id`.
- **Với folder được chia sẻ:** breadcrumb chỉ bắt đầu từ folder cao nhất mà người dùng được chia sẻ, không được lộ tên các folder cha mà họ không có quyền xem.

### [x] 5.2. Endpoint số đếm cho sidebar

- **Cần:** Một nguồn số đếm ổn định, ví dụ `GET library/summary` trả `{ counts: { my, shared, team, favorites, trash, sharedLinks }, storage: { usedBytes, limitBytes } }`. Một cách khác là bảo đảm **mọi** endpoint danh sách đều trả cùng một object `counts` đầy đủ.
- Nếu tạo endpoint mới, FE sẽ bỏ lời gọi `users/me/storage` riêng lẻ trong trang này.

### [x] 5.3. Cây thư mục `folders/tree`

- **Cần:** Mỗi node có `id`, `name`, `parentFolderId`, `children`, `canReceiveItems`, và thêm `rootArea` hoặc `isOwner` để FE nhóm "Của tôi" và "Được chia sẻ".
- **Kiểm tra:** `canReceiveItems` có tính đúng quyền `canUpload`/`canCreateFolder` của người gọi trên folder đó không.

### [x] 5.4. Thứ tự folder trước file

- Xem mục 2.4. Áp dụng ở tầng truy vấn để phân trang đúng.

### [x] 5.5. Kiểm tra quyền ở BE

FE chỉ ẩn hoặc disable nút. BE **phải** tự kiểm tra quyền:

- `POST folders/merge`: từ chối document mà người gọi không có quyền move. Folder đích (`parentFolderId`) phải thuộc quyền của người gọi.
- Move/copy: từ chối khi đích là chính folder nguồn hoặc thư mục con của nó (tránh tạo vòng lặp trong cây). Từ chối khi người gọi không có quyền ghi vào folder đích.
- `PUT library-items/:id/favorite`: xác định hành vi với item đang ở thùng rác (nên từ chối hoặc bỏ qua).
- Trash/restore/delete: kiểm tra `canDelete` cho từng item và trả về `failed[]` kèm lý do (FE đã xử lý `response.failed`).

### [x] 5.6. Giá trị `sort` hợp lệ

- Xác nhận danh sách giá trị BE hỗ trợ cho từng endpoint: `updated_desc`, `updated_asc`, `name_asc`, `name_desc`, `type`, `size_desc`, và `deleted_desc`/`deleted_asc` cho trash. BE nên trả 400 hoặc dùng mặc định khi nhận giá trị không hợp lệ, thay vì lỗi 500.
- Xác nhận `fileType=image` được BE hiểu là nhóm nhiều đuôi file (png, jpg, jpeg, gif…).

---

## 6. Thứ tự thực hiện đề xuất

1. **Sửa nhanh, rủi ro thấp (FE):** 1.2, 1.3, 1.5, 1.6 (phần FE), 1.7 (phương án A), 1.8, 1.10, 4.5.
2. **Kiểm tra và bổ sung BE:** 5.5 (bảo mật quyền), 5.6, sau đó 5.1, 5.2, 5.3.
3. **Tái cấu trúc FE (3.1, 3.2):** tách component, hook và helper dùng chung. Mục 1.1 sẽ tự được giải quyết ở bước này. Nếu cần ship sớm thì làm 1.1 theo hướng chép tạm trước.
4. **Phân cấp và điều hướng:** 2.1, 2.2, 2.3 (layout route), 1.4 (dựa trên 5.2).
5. **UX nâng cao:** 2.4, 2.5, 4.1–4.4, 4.6–4.8, 1.7 (phương án B kéo thả), 1.9.

Sau mỗi bước, chạy `npx tsc --noEmit` và `npm test` (đã có test cho `axiosInstance`, `documentsApi`, `notificationRealtime`, `authSession`), rồi kiểm tra theo checklist bên dưới. Nên commit mỗi bước riêng.

---

## 7. Checklist kiểm thử thủ công

- [ ] Chuyển lần lượt 8 khu vực trên sidebar: mỗi lần chỉ có **1** request danh sách, ô tìm kiếm trống (hoặc khớp URL), không còn item nào được chọn, drawer đóng, chế độ grid/list được giữ nguyên.
- [ ] `?area=abc` hiện "Tài liệu của tôi" và mục đó active trên sidebar.
- [ ] Tạo hơn 50 mục: header hiện đúng tổng số, phân trang hoạt động.
- [ ] Số trên sidebar không nhảy hoặc biến mất khi chuyển khu vực, và cập nhật sau khi trash, restore hoặc favorite.
- [ ] Tab Yêu thích: bỏ sao thì item biến mất và số đếm giảm. Ngắt mạng rồi thử lại thì item quay về như cũ.
- [ ] Thùng rác: không có ngôi sao. Khôi phục và xóa vĩnh viễn hoạt động, có confirm.
- [ ] Tab Được chia sẻ: không có nút "Gom vào thư mục". Gọi thẳng API merge với document của người khác thì BE từ chối.
- [ ] Trong folder con: di chuyển folder A thì A và các thư mục con bị disable trong cây. Bấm nhanh hai file thì preview luôn khớp file cuối. "Sao chép liên kết" khi chưa có link thì vừa tạo vừa copy.
- [ ] Mở folder từ tab Được chia sẻ: breadcrumb là `Thư viện / Được chia sẻ với tôi / …`, sidebar khu vực vẫn hiển thị và highlight "Được chia sẻ với tôi".
- [ ] `/library/folders/:id/members` và `/invites` mở đúng tab.
- [ ] Mobile (375px): chọn được item, mở được menu `⋯`, sidebar không đẩy nội dung xuống quá thấp, không có thanh cuộn ngang ở cấp trang.
- [ ] Bàn phím: Tab tới card hiện checkbox và menu. Mở dialog thì focus vào ô đầu tiên, nhấn Escape đóng và trả focus về nút đã mở. Ctrl+A hay Delete không có tác dụng khi đang mở dialog.
- [ ] Không còn text tiếng Anh trên giao diện của trang và các dialog.

## 8. Kết quả thực hiện (03/10/2026)

- Đã thực hiện các mục 1–5 ở cả `documents-sharing` và `DocShareAPI`. Mục 1.7 chọn phương án A: sửa câu chữ; không bổ sung kéo thả.
- Component, dialog, selection, shortcuts, favorite và các thao tác batch đã dùng chung. `MyLibraryPage.tsx` còn 451 dòng; `FolderDetailPage.tsx` còn 383 dòng. Các panel quản lý folder được tách riêng. `FolderListPage.tsx` được giữ để tương thích; helper đã chuyển ra utils.
- `LibraryLayout` giữ sidebar xuyên suốt các cấp thư mục, lấy counts/storage từ `GET library/summary`, và làm mới sau các thao tác thay đổi dữ liệu. Không hiện số recent khi không có nguồn tổng hợp tin cậy.
- URL quyết định sort/view; bộ lọc áp dụng ngay. Lựa chọn, preview và nội dung tìm kiếm được reset/đồng bộ khi đổi ngữ cảnh. Yêu thích có cập nhật lạc quan, loại item khỏi tab Yêu thích và rollback khi lỗi.
- BE bổ sung breadcrumb theo quyền xem, rootArea, thông tin phân nhóm cây thư mục, lọc ảnh, sắp xếp thư mục trước tài liệu ở BE trước phân trang. Recent và trash giữ thứ tự thời gian. Endpoint merge kiểm tra quyền trước khi tạo folder và trả lỗi có cấu trúc khi rollback.
- FE: `npm run typecheck`, `npm test -- --watchAll=false --runInBand`: 38 test đạt, gồm 11 test hồi quy mới. `npm run build` được chạy để xác minh bản production.
- BE: `dotnet test DocShareAPI.Tests/DocShareAPI.Tests.csproj --no-restore`: 11 test đạt. Bộ test được thêm vào solution; dùng EF InMemory, không kết nối cơ sở dữ liệu thật.
- Đã kiểm tra trình duyệt với component thật và dữ liệu giả cục bộ: mobile 375px không tràn ngang ở cấp trang; checkbox/menu hiển thị; sidebar và các tab còn khi vào folder; dialog focus vào trường nhập, Escape đóng và trả focus về nút Thêm mới.
- Checklist mục 7 được giữ chưa đánh dấu vì chưa chạy toàn bộ quy trình với tài khoản và API/cơ sở dữ liệu thật. Kiểm tra network, thao tác upload/download, quyền và lỗi mạng trên hệ thống triển khai vẫn cần kiểm thử tích hợp.