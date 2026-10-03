import useWorkspaceFavorite from "hooks/useWorkspaceFavorite.ts";
import { MembersPanel, InvitesPanel, SettingsPanel } from "components/Workspace/FolderPanels.tsx";
import useWorkspaceActions from "hooks/useWorkspaceActions.ts";

import { useLibraryContext } from "pages/Library/LibraryLayout.tsx";
import useWorkspaceSelection from "hooks/useWorkspaceSelection.ts";
import useWorkspaceShortcuts from "hooks/useWorkspaceShortcuts.ts";
import LibraryBreadcrumb from "components/Workspace/LibraryBreadcrumb.tsx";
import { validArea, validSort, preferredView, saveView, patchQuery } from "utils/libraryQuery.ts";
import { getItemName, getPermissions } from "utils/workspaceItem.ts";
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
import { NavLink, useLocation, useParams, useSearchParams } from "react-router-dom";
import { Folder, Lock, Search } from "lucide-react";

import PageTitle from "components/PageTitle.js";
import WorkspaceCreateDropdown from "components/Workspace/WorkspaceCreateDropdown.tsx";
import WorkspaceConfirmDialog from "components/Workspace/WorkspaceConfirmDialog.tsx";
import WorkspaceLoadingSkeleton from "components/Workspace/WorkspaceLoadingSkeleton.tsx";
import EditDocumentModal from "components/Modal/EditDocumentModal.tsx";
import workspaceLibraryApi, { WorkspaceFolder, WorkspaceItem } from "api/workspaceLibraryApi.ts";

import PaginationComponent from "components/Pagination/Pagination.tsx";

import { canEvery, defaultWorkspacePagination, normalizeWorkspacePagination, WorkspacePagination } from "utils/workspaceLibraryHelpers.ts";

import { Badge, roleLabel } from "utils/folderDisplay.tsx";
import { apiMessage } from "utils/apiMessage.ts";

type WorkspaceTab = "documents" | "members" | "invites" | "settings";

type DialogState =
  | { type: "create-folder" }
  | { type: "upload" }
  | { type: "rename"; item: WorkspaceItem }
  | { type: "edit-document"; item: WorkspaceItem }
  | { type: "move"; mode: "move" | "copy"; items: WorkspaceItem[] }
  | { type: "merge"; items: WorkspaceItem[] }
  | { type: "share"; item: WorkspaceItem }
  | null;


const FolderDetailPage: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const location = useLocation();
  const { refreshSummary, setRootArea, setCounts } = useLibraryContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const numericFolderId = Number(folderId);
  const routeTab = location.pathname.endsWith("/members") ? "members" : location.pathname.endsWith("/invites") ? "invites" : "documents";
  const requestedTab = searchParams.get("tab") || routeTab;
  const activeTab: WorkspaceTab = ["documents", "members", "invites", "settings"].includes(requestedTab) ? requestedTab as WorkspaceTab : "documents";
  const querySearch = searchParams.get("search") || "";
  const queryFileType = searchParams.get("fileType") || "";
  const pageNumber = Number(searchParams.get("pageNumber") || 1);

  const [folder, setFolder] = useState<WorkspaceFolder | null>(null);
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const sort = validSort(searchParams.get("sort"));
  const [fileType, setFileType] = useState(searchParams.get("fileType") || "");
  const viewMode = preferredView(searchParams.get("view"));
  useEffect(() => { saveView(viewMode); }, [viewMode]);
  const [pagination, setPagination] = useState<WorkspacePagination>(defaultWorkspacePagination);
  const { selectedKeys, setSelectedKeys, toggleSelection } = useWorkspaceSelection(items);
  const [previewItem, setPreviewItem] = useState<WorkspaceItem | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const { confirmAction, setConfirmAction, confirmLoading, runConfirmAction, copyItemLink, downloadItems, trashItems } = useWorkspaceActions(() => closeDialogAndReload());

  const rootArea = validArea(folder?.rootArea || location.state?.fromArea || "my");
  useEffect(() => { setRootArea(rootArea); }, [rootArea, setRootArea]);
  const folderPermissions = getPermissions(folder);
  const visibleItems = items;
  const selectedItems = useMemo(() => visibleItems.filter((item) => selectedKeys.includes(`${item.type}-${item.id}`)), [selectedKeys, visibleItems]);

  useEffect(() => { setSearch(querySearch); setFileType(queryFileType); }, [numericFolderId, querySearch, queryFileType]);
  useEffect(() => {
    setSelectedKeys([]); setPreviewItem(null); setDialog(null); setConfirmAction(null);
  }, [numericFolderId, activeTab, querySearch, queryFileType, pageNumber, setSelectedKeys, setConfirmAction]);
  useEffect(() => { document.querySelector('[data-library-content]')?.scrollIntoView({ block: "start" }); }, [pageNumber]);
  const updateQuery = (patch: Record<string, string>, resetPage = false) => setSearchParams(patchQuery(searchParams, patch, resetPage));

  const requestId = useRef(0);
  const loadFolder = async () => {
    const currentRequest = ++requestId.current;
    if (!numericFolderId) {
      setError("Không tìm thấy thư mục.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await workspaceLibraryApi.getFolderItems(numericFolderId, {
        rootArea: location.state?.fromArea === "team" ? "team" : undefined,
        search: querySearch,
        sort,
        fileType: queryFileType,
        pageNumber,
        pageSize: 50,
      });
      if (currentRequest !== requestId.current) return;
      setFolder(response.folder);
      setItems(response.items || []);
      setPagination(normalizeWorkspacePagination(response.pagination));
      setError("");
    } catch (error: any) {
      if (currentRequest !== requestId.current) return;
      setError(apiMessage(error, "Không thể mở thư mục."));
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    loadFolder();
    const invalidateRequests = () => { requestId.current++; };
    return () => { invalidateRequests(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericFolderId, querySearch, queryFileType, pageNumber, sort]);

  useWorkspaceShortcuts((event: KeyboardEvent) => {
      if (dialog || confirmAction) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable]:not([contenteditable=\"false\"])") && event.key !== "Escape") return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a" && activeTab === "documents") {
        event.preventDefault();
        setSelectedKeys(visibleItems.map((item) => `${item.type}-${item.id}`));
      }
      if (event.key === "Escape") {
        setSelectedKeys([]);
        setPreviewItem(null);
        setDialog(null);
        setConfirmAction(null);
      }
      if (event.key === "Delete" && canEvery(selectedItems, "canDelete") && selectedItems.length > 0) {
        trashSelected();
      }
      if (event.key === "F2" && selectedItems.length === 1 && selectedItems[0].permissions?.canRename !== false) {
        setDialog({ type: "rename", item: selectedItems[0] });
      }
  });

  const setTab = (tab: WorkspaceTab) => updateQuery({ tab, pageNumber: "1" });

  const submitSearch = (event: React.FormEvent) => { event.preventDefault(); updateQuery({ search: search.trim() }, true); };

  const closeDialogAndReload = () => {
    setDialog(null);
    setSelectedKeys([]);
    loadFolder();
    refreshSummary();
  };

  const trashSelected = () => trashItems(selectedItems);
  const moveSingleItem = (item: WorkspaceItem) => {
    setSelectedKeys([`${item.type}-${item.id}`]);
    setDialog({ type: "move", mode: "move", items: [item] });
  };

  const toggleFavoriteItem = useWorkspaceFavorite({ area: "my", items, setItems, setCounts: setCounts, setPagination, requestId, refreshSummary, reload: loadFolder });

  if (loading) return <WorkspaceLoadingSkeleton />;

  if (error || !folder) {
    return (
      <div className="surface-card mx-auto max-w-xl p-8 text-center">
        <Lock className="mx-auto h-10 w-10 text-neutral" />
        <h1 className="mt-4 text-xl font-bold text-ink">Không thể mở thư mục</h1>
        <p className="mt-2 text-sm text-ink-secondary">{error}</p>
        <NavLink to="/library" className="btn-primary mt-6">Quay lại thư viện</NavLink>
      </div>
    );
  }

  return (
    <>
      <PageTitle title={folder.name} description={folder.description || "Thư mục DocShare"} />
      <div className="mx-auto max-w-7xl">
        <div className="min-w-0">

          <section data-library-content className="relative overflow-hidden rounded-lg border border-line bg-surface">
            <div className="border-b border-line px-4 py-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0">
                  <LibraryBreadcrumb area={rootArea} folder={folder} />
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-bold text-ink">{folder.name}</h1>
                    <Badge>{roleLabel[folder.permission || "viewer"] || "Người xem"}</Badge>
                    {folder.isShared && <Badge>Đang chia sẻ</Badge>}
                  </div>
                  <p className="mt-2 text-sm text-ink-secondary">
                    {pagination.totalCount} mục
                  </p>
                </div>
              </div>

              <p className="mt-2 text-sm text-ink-secondary">{folder.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <WorkspaceCreateDropdown canUpload={!!folderPermissions.canUpload} canCreateFolder={!!folderPermissions.canCreateFolder} onUpload={() => setDialog({ type: "upload" })} onCreateFolder={() => setDialog({ type: "create-folder" })} />
                {folderPermissions.canShare && <button type="button" className="btn-secondary" onClick={() => setDialog({ type: "share", item: { ...folder, id: numericFolderId, type: "folder" } })}>Chia sẻ thư mục</button>}
              </div>
              <nav aria-label="Nội dung thư mục" className="mt-4 flex gap-2 overflow-x-auto">
                {(["documents", "members", "invites", "settings"] as WorkspaceTab[]).filter(tab => folderPermissions.canManageMembers || (tab !== "members" && tab !== "invites")).map(tab => <button key={tab} type="button" aria-current={activeTab === tab ? "page" : undefined} onClick={() => setTab(tab)} className={activeTab === tab ? "btn-primary" : "btn-secondary"}>{{ documents: "Tài liệu", members: "Thành viên", invites: "Lời mời", settings: "Cài đặt" }[tab]}</button>)}
              </nav>
              {activeTab === "documents" && (
                <form onSubmit={submitSearch} className="mt-4 flex max-w-3xl flex-col gap-2 sm:flex-row">
                  <label className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} className="input-field pl-9" placeholder="Tìm trong thư mục hiện tại" aria-label="Tìm trong thư mục hiện tại" />
                  </label>
                  <select
                    value={sort}
                    onChange={(event) => updateQuery({ sort: event.target.value }, true)}
                    className="input-field sm:w-44"
                  >
                    <option value="updated_desc">Mới nhất</option>
                    <option value="updated_asc">Cũ nhất</option>
                    <option value="name_asc">Tên A-Z</option>
                    <option value="name_desc">Tên Z-A</option>
                    <option value="type">Loại</option>
                    <option value="size_desc">Kích thước</option>
                  </select>
                  <select value={fileType} onChange={(event) => updateQuery({ fileType: event.target.value }, true)} className="input-field sm:w-40">
                    <option value="">Tất cả loại</option>
                    <option value="pdf">PDF</option>
                    <option value="docx">Word</option>
                    <option value="xlsx">Excel</option>
                    <option value="image">Ảnh</option>
                  </select>
                  <button type="submit" className="btn-secondary px-3">Tìm</button>
                </form>
              )}
            </div>

            {activeTab === "documents" && (
              <>
                <WorkspaceToolbar
                  area={rootArea}
                  onFavorite={() => selectedItems[0] && toggleFavoriteItem(selectedItems[0])}
                  onRestore={() => undefined}
                  onDeleteForever={() => undefined}
                  selectedItems={selectedItems}
                  viewMode={viewMode}
                  onViewMode={(mode) => { saveView(mode); updateQuery({ view: mode }); }}
                  onClear={() => setSelectedKeys([])}
                  onRename={() => selectedItems.length === 1 && setDialog({ type: "rename", item: selectedItems[0] })}
                  onEditDocument={() => selectedItems.length === 1 && setDialog({ type: "edit-document", item: selectedItems[0] })}
                  onMove={() => setDialog({ type: "move", mode: "move", items: selectedItems })}
                  onCopy={() => setDialog({ type: "move", mode: "copy", items: selectedItems })}
                  onDownload={() => downloadItems(selectedItems)}
                  onCopyLink={() => selectedItems.length === 1 && copyItemLink(selectedItems[0])}
                  onMerge={() => setDialog({ type: "merge", items: selectedItems })}
                  onShare={() => selectedItems.length === 1 && setDialog({ type: "share", item: selectedItems[0] })}
                  onTrash={trashSelected}
                />
                <div className={`p-4`}>
                  {visibleItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-line bg-surface px-5 py-14 text-center">
                      <Folder className="mx-auto h-10 w-10 text-neutral" />
                      <h2 className="mt-4 text-lg font-bold text-ink">Thư mục này đang trống</h2>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">Tải file lên hoặc tạo thư mục con đầu tiên.</p>
                      {(folderPermissions.canUpload || folderPermissions.canCreateFolder) && (
                        <div className="mt-6 flex justify-center">
                          <WorkspaceCreateDropdown
                            canUpload={folderPermissions.canUpload !== false}
                            canCreateFolder={folderPermissions.canCreateFolder !== false}
                            onUpload={() => setDialog({ type: "upload" })}
                            onCreateFolder={() => setDialog({ type: "create-folder" })}
                          />
                        </div>
                      )}
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {visibleItems.map((item) => (
                        <WorkspaceItemCard
                          key={`${item.type}-${item.id}`}
                          item={item}
                          selectionActive={selectedKeys.length > 0}
                      selected={selectedKeys.includes(`${item.type}-${item.id}`)}
                          onFavorite={() => toggleFavoriteItem(item)}
                          onSelect={(event) => toggleSelection(item, event?.shiftKey)}
                          onPreview={() => setPreviewItem(item)}
                          onCopyLink={() => copyItemLink(item)}
                          onDownload={() => downloadItems([item])}
                          onRename={() => setDialog({ type: "rename", item })}
                          onEditDocument={() => setDialog({ type: "edit-document", item })}
                          onMove={() => moveSingleItem(item)}
                          onTrash={() => trashItems([item])}
                        />
                      ))}
                    </div>
                  ) : (
                    <WorkspaceItemList
                      items={visibleItems}
                      selectedIds={selectedKeys}
                      onSelectAll={() => setSelectedKeys(selectedKeys.length === visibleItems.length ? [] : visibleItems.map(item => `${item.type}-${item.id}`))}
                  onToggle={toggleSelection}
                      onFavorite={toggleFavoriteItem}
                      onPreview={setPreviewItem}
                      onCopyLink={copyItemLink}
                      onDownload={(item) => downloadItems([item])}
                      onRename={(item) => setDialog({ type: "rename", item })}
                      onEditDocument={(item) => setDialog({ type: "edit-document", item })}
                      onMove={moveSingleItem}
                      onTrash={(item) => trashItems([item])}
                    />
                  )}
                  <PaginationComponent
                    itemLabel="mục"
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    totalCount={pagination.totalCount}
                    onPageChange={(nextPage) =>
                      setSearchParams({
                        tab: activeTab,
                        ...(querySearch ? { search: querySearch } : {}),
                        ...(queryFileType ? { fileType: queryFileType } : {}),
                        view: viewMode,
                        sort,
                        pageNumber: String(nextPage),
                      })
                    }
                  />
                </div>
                <PreviewDrawer item={previewItem} onClose={() => setPreviewItem(null)} onShare={(item) => { setPreviewItem(null); setDialog({ type: "share", item }); }} />
              </>
            )}

            {activeTab === "members" && <MembersPanel key={numericFolderId} folderId={numericFolderId} />}
            {activeTab === "invites" && <InvitesPanel folderId={numericFolderId} />}
            {activeTab === "settings" && <SettingsPanel folder={folder} />}
          </section>
        </div>
      </div>

      {dialog?.type === "create-folder" && <CreateFolderDialog parentFolderId={numericFolderId} onClose={() => setDialog(null)} onDone={closeDialogAndReload} />}
      {dialog?.type === "upload" && <UploadDialog parentFolderId={numericFolderId} onClose={() => setDialog(null)} onDone={closeDialogAndReload} />}
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
      {dialog?.type === "merge" && <MergeDialog items={dialog.items} parentFolderId={numericFolderId} onClose={() => setDialog(null)} onDone={closeDialogAndReload} />}
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

export default FolderDetailPage;
