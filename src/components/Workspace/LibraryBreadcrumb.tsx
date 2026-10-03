import React from "react";
import { NavLink } from "react-router-dom";
import { WorkspaceFolder } from "api/workspaceLibraryApi.ts";
import { LibraryArea, libraryLabels } from "utils/libraryQuery.ts";

export default function LibraryBreadcrumb({ area, folder }: { area: LibraryArea; folder?: WorkspaceFolder }) {
  const crumbs = folder ? (folder.breadcrumb?.filter(crumb => crumb.id !== null) || [{ id: folder.id, name: folder.name }]) : [];
  return <nav aria-label="Đường dẫn thư viện" className="mb-2 flex flex-wrap items-center gap-2 text-sm text-ink-secondary">
    <NavLink to="/library" className="hover:text-primary">Thư viện</NavLink><span>/</span>
    {folder ? <NavLink to={`/library?area=${area}`} className="hover:text-primary">{libraryLabels[area]}</NavLink> : <span aria-current="page">{libraryLabels[area]}</span>}
    {crumbs.map((crumb,index) => <React.Fragment key={crumb.id}><span>/</span>
      {index === crumbs.length - 1 ? <span aria-current="page" className="font-semibold text-ink">{crumb.name}</span> :
        <NavLink to={`/library/folders/${crumb.id}`} state={{ fromArea: area }} className="hover:text-primary">{crumb.name}</NavLink>}
    </React.Fragment>)}
  </nav>;
}
