export interface Pagination {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
export interface ListResponse<T> {
  data: T[];
  pagination: Pagination;
  options?: { actions: string[]; entityTypes: string[] };
}
export type Params = Record<string, string | number | boolean | undefined>;
export interface Owner {
  user_id: string;
  username: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
}
export interface AdminUser extends Owner {
  role: string;
  is_verified: boolean;
  two_factor_enabled: boolean;
  created_at: string;
  document_count: number;
  collection_count: number;
  storage_limit_bytes: number | null;
  storage_used_bytes: number;
}
export interface AdminDocument {
  document_id: number;
  title: string;
  description?: string;
  owner?: Owner;
  thumbnail_url: string;
  is_public: boolean;
  uploaded_at: string;
  download_count: number;
  report_count: number;
  file_size: number;
  other_report_count?: number;
}
export interface AdminReport {
  report_id: number;
  document_id: number;
  reason: string;
  status: string;
  created_at: string;
  reporter: Owner;
  document: AdminDocument;
}
export interface Taxonomy {
  category_id?: string;
  tag_id?: string;
  name: string;
  description?: string;
  parent_id?: string;
  parent_name?: string;
  document_count: number;
  child_count?: number;
}
export interface AdminCollection {
  collection_id: number;
  name: string;
  description?: string;
  owner?: Owner;
  is_public: boolean;
  document_count: number;
  created_at: string;
}
export interface AuditLog {
  audit_id: number;
  actor?: Owner;
  actor_user_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  metadata?: string;
}
export interface Dashboard {
  totals: {
    users: number;
    documents: number;
    publicDocuments: number;
    pendingReports: number;
    reports: number;
    downloads: number;
    collections: number;
  };
  last30Days: { newUsers: number };
  recentDocuments: AdminDocument[];
  recentReports: AdminReport[];
}
export interface DailyCount {
  date: string;
  count: number;
}
export interface Analytics {
  uploads: DailyCount[];
  topDocuments: AdminDocument[];
  categoryDistribution: {
    category_id: string;
    name: string;
    document_count: number;
  }[];
}
export interface Engagement {
  totalViews: number;
  totalDownloads: number;
  dailyViews: DailyCount[];
  dailyDownloads: DailyCount[];
}
export interface SeoSettings {
  siteName: string;
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultImage: string;
  locale: string;
}
export interface SitemapRoute {
  path: string;
  changefreq?: string;
  priority?: number;
}
export type ResolveAction =
  | "hide_document"
  | "delete_document"
  | "reject"
  | "mark_resolved";
