# Admin SEO Backend API Contract

Tài liệu này mô tả các API backend cần bổ sung để frontend Admin > SEO hoạt động.

Base path giả định: `/api` hoặc giá trị trong `REACT_APP_API_URL`.

Tất cả endpoint dưới đây nên yêu cầu quyền `admin`.

## 1. SEO Settings

### GET `/admin/seo/settings`

Trả về cấu hình SEO mặc định của website.

Response:

```json
{
  "data": {
    "siteName": "DocShare",
    "siteUrl": "https://docshare.id.vn",
    "defaultTitle": "DocShare - Nền tảng chia sẻ tài liệu học tập",
    "defaultDescription": "DocShare là nền tảng lưu trữ, tìm kiếm và chia sẻ tài liệu học tập miễn phí.",
    "defaultImage": "https://docshare.id.vn/og-image.svg",
    "locale": "vi_VN"
  }
}
```

### PUT `/admin/seo/settings`

Lưu cấu hình SEO mặc định.

Request:

```json
{
  "siteName": "DocShare",
  "siteUrl": "https://docshare.id.vn",
  "defaultTitle": "DocShare - Nền tảng chia sẻ tài liệu học tập",
  "defaultDescription": "DocShare là nền tảng lưu trữ, tìm kiếm và chia sẻ tài liệu học tập miễn phí.",
  "defaultImage": "https://docshare.id.vn/og-image.svg",
  "locale": "vi_VN"
}
```

Validation gợi ý:

- `siteUrl` phải là URL hợp lệ, không có dấu `/` cuối.
- `defaultTitle` tối đa 70 ký tự.
- `defaultDescription` tối đa 180 ký tự.
- `defaultImage` là URL hợp lệ.
- `locale` mặc định `vi_VN`.

## 2. Robots.txt

### GET `/admin/seo/robots`

Response:

```json
{
  "data": {
    "content": "User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: https://docshare.id.vn/sitemap.xml"
  }
}
```

### PUT `/admin/seo/robots`

Request:

```json
{
  "content": "User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: https://docshare.id.vn/sitemap.xml"
}
```

Backend nên ghi nội dung này ra file public/static tương ứng để truy cập được tại:

```txt
https://docshare.id.vn/robots.txt
```

## 3. Sitemap Routes

### GET `/admin/seo/sitemap-routes`

Trả về danh sách route tĩnh hoặc route admin muốn ép vào sitemap.

Response:

```json
{
  "data": [
    { "path": "/", "priority": 1.0, "changefreq": "daily" },
    { "path": "/search/tai-lieu", "priority": 0.8, "changefreq": "weekly" },
    { "path": "/login", "priority": 0.3, "changefreq": "monthly" }
  ]
}
```

### PUT `/admin/seo/sitemap-routes`

Frontend hiện gửi dạng tối giản:

```json
{
  "routes": ["/", "/search/tai-lieu", "/login", "/register"]
}
```

Backend có thể chuẩn hóa thành object và lưu:

```json
{
  "path": "/",
  "priority": 1.0,
  "changefreq": "daily"
}
```

## 4. Generate Sitemap

### POST `/admin/seo/sitemap/generate`

Generate lại sitemap.xml từ:

- Route tĩnh đã lưu ở `/admin/seo/sitemap-routes`.
- Tài liệu công khai: `/document/{document_id}`.
- Hồ sơ công khai nếu cần: `/public-profile/{user_id}`.
- Bộ sưu tập công khai: `/collection/{collection_id}`.
- Chuyên mục công khai: `/category/{category_id}`.

Response:

```json
{
  "data": {
    "generatedAt": "2026-05-18T10:00:00.000Z",
    "urlCount": 128,
    "sitemapUrl": "https://docshare.id.vn/sitemap.xml"
  }
}
```

File sinh ra cần đúng format:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://docshare.id.vn/</loc>
    <lastmod>2026-05-18</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

Không đưa các route private vào sitemap:

- `/admin`
- `/account`
- `/my-documents`
- `/my-collections`
- `/my-reports`
- route reset password hoặc xác minh email chứa token.

## 5. Gợi ý lưu trữ

Có thể tạo bảng `seo_settings`:

```sql
create table seo_settings (
  id int primary key default 1,
  site_name text not null,
  site_url text not null,
  default_title text not null,
  default_description text not null,
  default_image text not null,
  locale text not null default 'vi_VN',
  robots_txt text not null,
  sitemap_routes jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
```

Chỉ nên có một row `id = 1`.

## 6. Response lỗi chuẩn

```json
{
  "message": "Bạn không có quyền truy cập chức năng SEO.",
  "errors": []
}
```

HTTP status gợi ý:

- `401` nếu chưa đăng nhập.
- `403` nếu không phải admin.
- `400` nếu request không hợp lệ.
- `500` nếu generate file thất bại.
