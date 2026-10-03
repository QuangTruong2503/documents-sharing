import useWorkspaceFavorite from "hooks/useWorkspaceFavorite.ts";
import { EmptyState, SharedLinksView } from "components/Workspace/LibraryViews.tsx";
import { ActivityItem } from "components/Workspace/WorkspaceActivityView.tsx";
import useWorkspaceActions from "hooks/useWorkspaceActions.ts";
import { useLibraryContext } from "./LibraryLayout.tsx";
import { libraryLabels } from "utils/libraryQuery.ts";
import useWorkspaceSelection from "hooks/useWorkspaceSelection.ts";
import useWorkspaceShortcuts from "hooks/useWorkspaceShortcuts.ts";
import LibraryBreadcrumb from "components/Workspace/LibraryBreadcrumb.tsx";
import { validArea, validSort, preferredView, saveView, patchQuery } from "utils/libraryQuery.ts";
import { getItemName } from "utils/workspaceItem.ts";
import WorkspaceToolbar from "components/Workspace/WorkspaceToolbar.tsx";
import WorkspaceItemCard from "components/Workspace/WorkspaceItemCard.tsx";
import WorkspaceItemList from "components/Workspace/WorkspaceItemList.tsx";
import PreviewDrawer from "components/Workspace/PreviewDrawer.tsx";
import CreateFolderDialog from "components/Workspace/dialogs/CreateFolderDialog.tsx";
import UploadDialog from "components/Workspace/dialogs/UploadDialog.tsx";
import RenameDialog from "components/Workspace/dialogs/RenameDialog.tsx";
import MoveCopyDialog from "components/Workspace/dialogs/MoveCopyDialog.tsx";
import MergeDialog from "components/Workspace/dialogs/MergeDialog.tsx";
import ShareDialog from "components/Workspace/dialogs/ShareDialog.tsx";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { toast } from "react-toastify";
import PageTitle from "components/PageTitle.js";
import workspaceLibraryApi, { WorkspaceFolder, WorkspaceItem, WorkspaceItemType } from "api/workspaceLibraryApi.ts";

import PaginationComponent from "components/Pagination/Pagination.tsx";
import WorkspaceCreateDropdown from "components/Workspace/WorkspaceCreateDropdown.tsx";
import WorkspaceConfirmDialog from "components/Workspace/WorkspaceConfirmDialog.tsx";
import WorkspaceActivityView from "components/Workspace/WorkspaceActivityView.tsx";
import WorkspaceLoadingSkeleton from "components/Workspace/WorkspaceLoadingSkeleton.tsx";
import EditDocumentModal from "components/Modal/EditDocumentModal.tsx";
import { canEvery, defaultWorkspacePagination, normalizeWorkspacePagination, WorkspacePagination } from "utils/workspaceLibraryHelpers.ts";

import { apiMessage } from "utils/apiMessage.ts";

type ViewMode = "grid" | "list";

type DialogState =
  | { type: "create-folder" }
  | { type: "upload" }
  | { type: "rename"; item: WorkspaceItem }
  | { type: "edit-document"; item: WorkspaceItem }
  | { type: "move"; mode: "move" | "copy"; items: WorkspaceItem[] }
  | { type: "merge"; items: WorkspaceItem[] }
  | { type: "share"; item: WorkspaceItem }
  | null;

interface WorkspaceListResponse {
  folder?: WorkspaceFolder;
  items?: WorkspaceItem[];
  pagination?: WorkspacePagination;
  counts?: Record<string, number>;
  storage?: { usedBytes?: number; limitBytes?: number };
  message?: string;
}

interface ShareLinkRow {
  id: string;
  itemId: number;
  itemType: WorkspaceItemType;
  itemName?: string | null;
  shareUrl: string;
  access: string;
  permission: string;
  views?: number;
  downloads?: number;
  expiresAt?: string | null;
  createdAt?: string;
}

interface WorkspaceActivityResponse {
  summary?: Record<string, number>;
  sections?: Record<string, ActivityItem[]>;
  timeline?: ActivityItem[];
  counts?: Record<string, number>;
}

const MyLibraryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const area = validArea(searchParams.get("area") || (searchParams.get("tab") === "shared" ? "shared" : "my"));
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const sort = validSort(searchParams.get("sort"), area === "trash");
  const [fileType, setFileType] = useState(searchParams.get("fileType") || "");
  const viewMode = preferredView(searchParams.get("view"));
  useEffect(() => { saveView(viewMode); }, [viewMode]);

  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLinkRow[]>([]);
  const [activity, setActivity] = useState<WorkspaceActivityResponse | null>(null);
  const [pagination, setPagination] = useState<WorkspacePagination>(defaultWorkspacePagination);
  const { setCounts: setWorkspaceCounts, refreshSummary } = useLibraryContext();

  const [loading, setLoading] = useState(true);
  const { selectedKeys, setSelectedKeys, toggleSelection } = useWorkspaceSelection(items);
  const [previewItem, setPreviewItem] = useState<WorkspaceItem | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const { confirmAction, setConfirmAction, confirmLoading, runConfirmAction, copyItemLink, downloadItems, trashItems, restoreItems, deleteForeverItems } = useWorkspaceActions(() => closeDialogAndReload());
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const querySearch = searchParams.get("search") || "";
  const queryFileType = searchParams.get("fileType") || "";
  const pageNumber = Number(searchParams.get("pageNumber") || 1);

  useEffect(() => { setSearch(querySearch); setFileType(queryFileType); }, [area, querySearch, queryFileType]);
  useEffect(() => {
    setSelectedKeys([]); setPreviewItem(null); setDialog(null); setConfirmAction(null);
  }, [area, querySearch, queryFileType, pageNumber, setSelectedKeys, setConfirmAction]);
  useEffect(() => { document.querySelector('[data-library-content]')?.scrollIntoView({ block: "start" }); }, [pageNumber]);
  const updateQuery = (patch: Record<string, string>, resetPage = false) => setSearchParams(patchQuery(searchParams, patch, resetPage));

  const requestId = useRef(0);
  const loadLibrary = async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    try {
      const params = { search: querySearch, sort, ...(area !== "trash" ? { fileType: queryFileType } : {}), pageNumber, pageSize: 50 };
      if (area === "shared-links") {
        const response = await workspaceLibraryApi.getMyShareLinks(params);
        if (currentRequest !== requestId.current) return;
        setShareLinks(response.shareLinks || []);
        setActivity(null);
        setPagination(normalizeWorkspacePagination(response.pagination));
        setItems([]);

        return;
      }

      if (area === "activity") {
        const response = await workspaceLibraryApi.getActivity({ limit: 20 });
        if (currentRequest !== requestId.current) return;
        setActivity(response);
        setShareLinks([]);
        setItems([]);
        setPagination(defaultWorkspacePagination);

        return;
      }

      const response: WorkspaceListResponse =
        area === "shared"
          ? await workspaceLibraryApi.getSharedWithMe(params)
          : area === "recent"
            ? await workspaceLibraryApi.getRecent(params)
            : area === "favorites"
              ? await workspaceLibraryApi.getFavorites(params)
              : area === "trash"
                ? await workspaceLibraryApi.getTrash(params)
                : area === "team"
                  ? await workspaceLibraryApi.getTeam(params)
                  : await workspaceLibraryApi.getMyLibrary(params);
      if (currentRequest !== requestId.current) return;
      setItems(response.items || []);
      setShareLinks([]);
      setActivity(null);
      setPagination(normalizeWorkspacePagination(response.pagination));


      if (response.message) toast.info(response.message);
    } catch (error: any) {
      if (currentRequest !== requestId.current) return;
      toast.error(apiMessage(error, "Không tải được thư viện."));
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
    const invalidateRequests = () => { requestId.current++; };
    return () => { invalidateRequests(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area, querySearch, queryFileType, pageNumber, sort]);

  const visibleItems = items;
  const selectedItems = useMemo(
    () => visibleItems.filter((item) => selectedKeys.includes(`${item.type}-${item.id}`)),
    [selectedKeys, visibleItems]
  );
  const activeLabel = libraryLabels[area];
  const canCreate = area === "my";


  useWorkspaceShortcuts((event: KeyboardEvent) => {
      if (dialog || confirmAction) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable]:not([contenteditable=\"false\"])") && event.key !== "Escape") return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a" && area !== "shared-links") {
        event.preventDefault();
        setSelectedKeys(visibleItems.map((item) => `${item.type}-${item.id}`));
      }
      if (event.key === "Escape") {
        setSelectedKeys([]);
        setPreviewItem(null);
        setDialog(null);
        setConfirmAction(null);
      }
      if (event.key === "/" && document.activeElement !== searchInputRef.current) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === "Delete" && canEvery(selectedItems, "canDelete") && selectedItems.length > 0 && area !== "trash") {
        trashSelected();
      }
      if (event.key === "F2" && selectedItems.length === 1 && selectedItems[0].permissions?.canRename !== false) {
        setDialog({ type: "rename", item: selectedItems[0] });
      }
  });

  const setQuery = (patch: Record<string, string>) => updateQuery(patch);
  const submitSearch = (event: React.FormEvent) => { event.preventDefault(); updateQuery({ search: search.trim() }, true); };
  const changeViewMode = (mode: ViewMode) => { saveView(mode); updateQuery({ view: mode }); };
  const changeSort = (sort: string) => updateQuery({ sort }, true);

  const closeDialogAndReload = () => {
    setDialog(null);
    setSelectedKeys([]);
    loadLibrary();
    refreshSummary();
  };

  const openSingleAction = (type: "rename" | "share" | "edit-document") => {
    if (selectedItems.length !== 1) return;
    setDialog({ type, item: selectedItems[0] } as DialogState);
  };

  const trashSelected = () => trashItems(selectedItems);
  const moveSingleItem = (item: WorkspaceItem) => {
    setSelectedKeys([`${item.type}-${item.id}`]);
    setDialog({ type: "move", mode: "move", items: [item] });
  };

  const restoreSelected = () => restoreItems(selectedItems);

  const deleteForeverSelected = () => deleteForeverItems(selectedItems);

  const favoriteSelected = async () => {
    if (selectedItems.length !== 1) return;
    await toggleFavoriteItem(selectedItems[0]);
  };

  const toggleFavoriteItem = useWorkspaceFavorite({ area: area, items, setItems, setCounts: setWorkspaceCounts, setPagination, requestId, refreshSummary, reload: loadLibrary });

  return (
    <>
      <PageTitle title={activeLabel} description="Không gian quản lý tài liệu và thư mục DocShare." />
      <div className="mx-auto max-w-7xl">
        <div className="min-w-0">
          <section data-library-content className="relative overflow-hidden rounded-lg border border-line bg-surface">
            <div className="border-b border-line bg-surface px-4 py-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0">
                  <LibraryBreadcrumb area={area} />
                  <h1 className="text-3xl font-bold text-ink">{activeLabel}</h1>
                  <p className="mt-2 text-sm text-ink-secondary">
                    {area === "activity"
                      ? "Lịch sử thay đổi, chia sẻ và thông báo liên quan tới tài liệu của bạn."
                      : area === "shared-links"
                      ? `${pagination.totalCount} liên kết`
                      : `${pagination.totalCount} mục`}
                  </p>
                </div>
                {canCreate && (
                  <WorkspaceCreateDropdown
                    canUpload={canCreate}
                    canCreateFolder={canCreate}
                    onUpload={() => setDialog({ type: "upload" })}
                    onCreateFolder={() => setDialog({ type: "create-folder" })}
                  />
                )}
              </div>
              {area !== "activity" && <form onSubmit={submitSearch} className="mt-4 flex max-w-3xl flex-col gap-2 sm:flex-row">
                <label className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral" />
                  <input
                    ref={searchInputRef}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="input-field pl-9"
                    placeholder="Tìm theo tên file, thư mục, loại file"
                    aria-label="Tìm trong thư viện"
                  />
                </label>
                <select value={sort} onChange={(event) => changeSort(event.target.value)} className="input-field sm:w-44">
                  {area === "trash" ? (
                    <>
                      <option value="deleted_desc">Xóa mới nhất</option>
                      <option value="deleted_asc">Xóa cũ nhất</option>
                    </>
                  ) : (
                    <>
                      <option value="updated_desc">Mới nhất</option>
                      <option value="updated_asc">Cũ nhất</option>
                    </>
                  )}
                  <option value="name_asc">Tên A-Z</option>
                  <option value="name_desc">Tên Z-A</option>
                  {area !== "trash" && (
                    <>
                      <option value="type">Loại</option>
                      <option value="size_desc">Kích thước</option>
                    </>
                  )}
                </select>
                {area !== "trash" && (
                  <select value={fileType} onChange={(event) => updateQuery({ fileType: event.target.value }, true)} className="input-field sm:w-40">
                    <option value="">Tất cả loại</option>
                    <option value="pdf">PDF</option>
                    <option value="docx">Word</option>
                    <option value="xlsx">Excel</option>
                    <option value="image">Ảnh</option>
                  </select>
                )}
                <button type="submit" className="btn-secondary px-3">Tìm</button>
              </form>}
            </div>

            {area !== "shared-links" && area !== "activity" && (
              <WorkspaceToolbar
                selectedItems={selectedItems}
                area={area}
                viewMode={viewMode}
                onViewMode={changeViewMode}
                onClear={() => setSelectedKeys([])}
                onRename={() => openSingleAction("rename")}
                onEditDocument={() => openSingleAction("edit-document")}
                onMove={() => setDialog({ type: "move", mode: "move", items: selectedItems })}
                onCopy={() => setDialog({ type: "move", mode: "copy", items: selectedItems })}
                onDownload={() => downloadItems(selectedItems)}
                onCopyLink={() => selectedItems.length === 1 && copyItemLink(selectedItems[0])}
                onMerge={() => setDialog({ type: "merge", items: selectedItems })}
                onShare={() => openSingleAction("share")}
                onFavorite={favoriteSelected}
                onTrash={trashSelected}
                onRestore={restoreSelected}
                onDeleteForever={deleteForeverSelected}
              />
            )}

            <div className="p-4">
              {loading ? (
                <WorkspaceLoadingSkeleton />
              ) : area === "activity" ? (
                <WorkspaceActivityView data={activity} />
              ) : area === "shared-links" ? (
                <SharedLinksView rows={shareLinks} />
              ) : visibleItems.length === 0 ? (
                <EmptyState
                  area={area}
                  canCreate={canCreate}
                  canUpload={canCreate}
                  onCreate={() => setDialog({ type: "create-folder" })}
                  onUpload={() => setDialog({ type: "upload" })}
                />
              ) : viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {visibleItems.map((item) => (
                    <WorkspaceItemCard
                      key={`${item.type}-${item.id}`}
                      item={item}
                      area={area}
                      selectionActive={selectedKeys.length > 0}
                      selected={selectedKeys.includes(`${item.type}-${item.id}`)}
                      onSelect={(event) => toggleSelection(item, event?.shiftKey)}
                      onPreview={() => setPreviewItem(item)}
                      onCopyLink={() => copyItemLink(item)}
                      onDownload={() => downloadItems([item])}
                      onRename={() => setDialog({ type: "rename", item })}
                      onEditDocument={() => setDialog({ type: "edit-document", item })}
                      onMove={() => moveSingleItem(item)}
                      onTrash={() => trashItems([item])}
                      onRestore={() => restoreItems([item])}
                      onDeleteForever={() => deleteForeverItems([item])}
                      onFavorite={() => toggleFavoriteItem(item)}
                    />
                  ))}
                </div>
              ) : (
                <WorkspaceItemList
                  items={visibleItems}
                  area={area}
                  selectedIds={selectedKeys}
                  onSelectAll={() => setSelectedKeys(selectedKeys.length === visibleItems.length ? [] : visibleItems.map(item => `${item.type}-${item.id}`))}
                  onToggle={toggleSelection}
                  onPreview={setPreviewItem}
                  onCopyLink={copyItemLink}
                  onDownload={(item) => downloadItems([item])}
                  onRename={(item) => setDialog({ type: "rename", item })}
                  onEditDocument={(item) => setDialog({ type: "edit-document", item })}
                  onMove={moveSingleItem}
                  onTrash={(item) => trashItems([item])}
                  onRestore={(item) => restoreItems([item])}
                  onDeleteForever={(item) => deleteForeverItems([item])}
                  onFavorite={toggleFavoriteItem}
                />
              )}
              {area !== "activity" && (
                <PaginationComponent
                  itemLabel="mục"
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalCount={pagination.totalCount}
                  onPageChange={(nextPage) => setQuery({ pageNumber: String(nextPage) })}
                />
              )}
            </div>

            <PreviewDrawer item={previewItem} onClose={() => setPreviewItem(null)} onShare={(item) => { setPreviewItem(null); setDialog({ type: "share", item }); }} />
          </section>
        </div>
      </div>

      {dialog?.type === "create-folder" && <CreateFolderDialog parentFolderId={null} onClose={() => setDialog(null)} onDone={closeDialogAndReload} />}
      {dialog?.type === "upload" && <UploadDialog parentFolderId={null} onClose={() => setDialog(null)} onDone={closeDialogAndReload} />}
      {dialog?.type === "rename" && <RenameDialog item={dialog.item} onClose={() => setDialog(null)} onDone={closeDialogAndReload} />}
      {dialog?.type === "edit-document" && (
        <EditDocumentModal
          documentID={dialog.item.id}
          initialDocument={{
            document_id: dialog.item.id,
            title: getItemName(dialog.item),
            description: dialog.item.description ?? null,
            thumbnail_url: dialog.item.thumbnailUrl || "",
            uploaded_at: dialog.item.createdAt || dialog.item.updatedAt || "",
            is_public: dialog.item.isShared === true,
          }}
          onClose={() => setDialog(null)}
          onUpdate={() => closeDialogAndReload()}
        />
      )}
      {dialog?.type === "move" && <MoveCopyDialog mode={dialog.mode} items={dialog.items} onClose={() => setDialog(null)} onDone={closeDialogAndReload} />}
      {dialog?.type === "merge" && <MergeDialog items={dialog.items} parentFolderId={null} onClose={() => setDialog(null)} onDone={closeDialogAndReload} />}
      {dialog?.type === "share" && <ShareDialog item={dialog.item} onClose={() => setDialog(null)} />}
      {confirmAction && (
        <WorkspaceConfirmDialog
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel={confirmAction.confirmLabel}
          variant={confirmAction.variant}
          loading={confirmLoading}
          onCancel={() => setConfirmAction(null)}
          onConfirm={runConfirmAction}
        />
      )}
    </>
  );
};

export default MyLibraryPage;
