# SEO Implementation Spec cho React Vite Personal Website

## 1. Mục tiêu

Tài liệu này dùng cho agent Frontend triển khai SEO cho dự án React Vite cá nhân.

Mục tiêu chính:

- Tối ưu SEO cơ bản cho website cá nhân, portfolio, blog hoặc trang giới thiệu dự án.
- Mỗi route có `title`, `meta description`, `canonical`, Open Graph và Twitter Card riêng.
- Có đầy đủ `robots.txt`, `sitemap.xml`, favicon, ảnh chia sẻ mạng xã hội.
- Tối ưu semantic HTML để Google hiểu nội dung tốt hơn.
- Chuẩn bị nền tảng để mở rộng sang blog, project detail, prerender hoặc SSR nếu cần.

---

## 2. Phạm vi triển khai

Agent FE cần triển khai các hạng mục sau:

1. Cài và cấu hình `react-helmet-async`.
2. Tạo component SEO dùng chung.
3. Gắn SEO cho từng page.
4. Cập nhật `index.html`.
5. Thêm file `robots.txt`.
6. Thêm file `sitemap.xml`.
7. Thêm ảnh Open Graph mặc định.
8. Kiểm tra route khi deploy SPA.
9. Tối ưu heading, alt image, link nội bộ.
10. Chuẩn bị schema JSON-LD nếu website có thông tin cá nhân rõ ràng.

---

## 3. Công nghệ giả định

Dự án đang dùng:

```txt
React
Vite
React Router DOM
JavaScript hoặc TypeScript
SPA deployment
```

Nếu dự án chưa dùng React Router, vẫn có thể áp dụng phần SEO component cho các page/component hiện có.

---

## 4. Cài đặt package cần thiết

Chạy lệnh:

```bash
npm install react-helmet-async
```

Nếu dùng TypeScript, package này đã có type phù hợp trong đa số trường hợp.

---

## 5. Cấu trúc thư mục đề xuất

Agent FE cần đảm bảo hoặc tạo cấu trúc gần giống sau:

```txt
project-root/
├── public/
│   ├── favicon.ico
│   ├── og-image.jpg
│   ├── robots.txt
│   └── sitemap.xml
│
├── src/
│   ├── components/
│   │   └── SEO.jsx
│   │
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── About.jsx
│   │   ├── Projects.jsx
│   │   ├── ProjectDetail.jsx
│   │   ├── Blog.jsx
│   │   ├── BlogDetail.jsx
│   │   └── Contact.jsx
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── index.html
└── package.json
```

Nếu dự án dùng TypeScript, đổi:

```txt
SEO.jsx -> SEO.tsx
Home.jsx -> Home.tsx
...
```

---

## 6. Cấu hình HelmetProvider

### File cần sửa

```txt
src/main.jsx
```

### Yêu cầu

Bọc toàn bộ ứng dụng bằng `HelmetProvider`.

### Code mẫu

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);
```

Nếu dự án đã có `BrowserRouter` trong `main.jsx`, giữ nguyên và chỉ thêm `HelmetProvider` bao ngoài hoặc bao trong đều được, miễn là toàn bộ App được nằm trong provider.

Ví dụ:

```jsx
<React.StrictMode>
  <HelmetProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </HelmetProvider>
</React.StrictMode>
```

---

## 7. Tạo component SEO dùng chung

### File cần tạo

```txt
src/components/SEO.jsx
```

### Yêu cầu

Component cần hỗ trợ:

- `title`
- `description`
- `url`
- `image`
- `type`
- `robots`
- `siteName`
- `locale`
- `jsonLd`

### Code mẫu

```jsx
import { Helmet } from "react-helmet-async";

const SITE_NAME = "Tên của bạn";
const SITE_URL = "https://your-domain.com";
const DEFAULT_TITLE = "Tên của bạn - Frontend Developer";
const DEFAULT_DESCRIPTION =
  "Portfolio cá nhân giới thiệu kỹ năng, dự án, kinh nghiệm và bài viết về lập trình web.";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;
const DEFAULT_LOCALE = "vi_VN";

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  url = SITE_URL,
  image = DEFAULT_IMAGE,
  type = "website",
  robots = "index, follow",
  siteName = SITE_NAME,
  locale = DEFAULT_LOCALE,
  jsonLd,
}) {
  const finalTitle = title;
  const finalDescription = description;
  const finalUrl = url;
  const finalImage = image;

  return (
    <Helmet>
      <title>{finalTitle}</title>

      <meta name="description" content={finalDescription} />
      <meta name="robots" content={robots} />

      <link rel="canonical" href={finalUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={finalUrl} />
      <meta property="og:image" content={finalImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />

      {jsonLd ? (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      ) : null}
    </Helmet>
  );
}
```

---

## 8. Biến cấu hình website

Agent FE nên tạo file config để dễ sửa domain, tên, ảnh.

### File đề xuất

```txt
src/config/site.js
```

### Code mẫu

```js
export const siteConfig = {
  name: "Tên của bạn",
  jobTitle: "Frontend Developer",
  domain: "https://your-domain.com",
  defaultTitle: "Tên của bạn - Frontend Developer",
  defaultDescription:
    "Portfolio cá nhân giới thiệu kỹ năng, dự án, kinh nghiệm và bài viết về lập trình web.",
  defaultImage: "https://your-domain.com/og-image.jpg",
  locale: "vi_VN",
  author: "Tên của bạn",
  email: "your-email@example.com",
  sameAs: [
    "https://github.com/your-username",
    "https://www.linkedin.com/in/your-username"
  ]
};
```

Sau đó có thể import vào `SEO.jsx` để tránh hard-code.

---

## 9. Gắn SEO cho từng page

## 9.1 Trang Home

### File

```txt
src/pages/Home.jsx
```

### Code mẫu

```jsx
import SEO from "../components/SEO";

export default function Home() {
  return (
    <>
      <SEO
        title="Tên của bạn - Frontend Developer"
        description="Portfolio cá nhân của Tên của bạn, chuyên xây dựng website React, Vite, UI/UX và tối ưu hiệu năng."
        url="https://your-domain.com/"
      />

      <main>
        <section>
          <h1>Tên của bạn - Frontend Developer</h1>
          <p>
            Tôi xây dựng giao diện web hiện đại, nhanh, dễ dùng và tối ưu trải nghiệm người dùng.
          </p>
        </section>
      </main>
    </>
  );
}
```

### Checklist

- Có đúng 1 thẻ `h1`.
- Có đoạn mô tả rõ nghề nghiệp, kỹ năng, định hướng.
- Có link đến Projects, About, Contact.
- Có ảnh đại diện hoặc hero image với `alt`.

---

## 9.2 Trang About

```jsx
import SEO from "../components/SEO";

export default function About() {
  return (
    <>
      <SEO
        title="Giới thiệu - Tên của bạn"
        description="Tìm hiểu về kinh nghiệm, kỹ năng, định hướng nghề nghiệp và hành trình phát triển phần mềm của Tên của bạn."
        url="https://your-domain.com/about"
      />

      <main>
        <h1>Giới thiệu</h1>
        <p>
          Nội dung giới thiệu bản thân, kinh nghiệm, kỹ năng và định hướng nghề nghiệp.
        </p>
      </main>
    </>
  );
}
```

### Checklist

- Có nội dung thật, không chỉ vài dòng quá ngắn.
- Có các nhóm kỹ năng: Frontend, Backend, Database, Tools nếu phù hợp.
- Có internal link về Projects hoặc Contact.

---

## 9.3 Trang Projects

```jsx
import SEO from "../components/SEO";

export default function Projects() {
  return (
    <>
      <SEO
        title="Dự án React và Web App - Tên của bạn"
        description="Tổng hợp các dự án cá nhân sử dụng React, Vite, JavaScript, Supabase và các công nghệ web hiện đại."
        url="https://your-domain.com/projects"
      />

      <main>
        <h1>Dự án cá nhân</h1>

        <section aria-labelledby="featured-projects">
          <h2 id="featured-projects">Dự án nổi bật</h2>
          {/* Render project cards here */}
        </section>
      </main>
    </>
  );
}
```

### Checklist

Mỗi project card nên có:

```txt
Tên dự án
Mô tả ngắn
Tech stack
Ảnh có alt
Link chi tiết
Link demo nếu có
Link GitHub nếu có
```

---

## 9.4 Trang Project Detail

Nếu website có route dạng:

```txt
/projects/:slug
```

thì mỗi project cần SEO riêng.

```jsx
import SEO from "../components/SEO";

export default function ProjectDetail({ project }) {
  if (!project) return null;

  return (
    <>
      <SEO
        title={`${project.title} - Dự án của Tên của bạn`}
        description={project.description}
        url={`https://your-domain.com/projects/${project.slug}`}
        image={project.image || "https://your-domain.com/og-image.jpg"}
        type="article"
      />

      <main>
        <article>
          <h1>{project.title}</h1>
          <p>{project.description}</p>
        </article>
      </main>
    </>
  );
}
```

### Checklist

- Mỗi project detail có URL riêng.
- Có canonical trỏ đúng URL.
- Có ảnh chia sẻ riêng nếu có.
- Có mô tả dài hơn card ngoài danh sách.

---

## 9.5 Trang Blog

```jsx
import SEO from "../components/SEO";

export default function Blog() {
  return (
    <>
      <SEO
        title="Blog lập trình web - Tên của bạn"
        description="Các bài viết về React, Vite, JavaScript, UI/UX, tối ưu hiệu năng và hành trình học lập trình web."
        url="https://your-domain.com/blog"
      />

      <main>
        <h1>Blog lập trình web</h1>
        {/* Render blog list here */}
      </main>
    </>
  );
}
```

---

## 9.6 Trang Blog Detail

Nếu có route:

```txt
/blog/:slug
```

mỗi bài viết cần SEO riêng.

```jsx
import SEO from "../components/SEO";

export default function BlogDetail({ post }) {
  if (!post) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: post.image,
    author: {
      "@type": "Person",
      name: "Tên của bạn"
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://your-domain.com/blog/${post.slug}`
    }
  };

  return (
    <>
      <SEO
        title={`${post.title} - Blog`}
        description={post.description}
        url={`https://your-domain.com/blog/${post.slug}`}
        image={post.image || "https://your-domain.com/og-image.jpg"}
        type="article"
        jsonLd={jsonLd}
      />

      <main>
        <article>
          <h1>{post.title}</h1>
          <p>{post.description}</p>
        </article>
      </main>
    </>
  );
}
```

---

## 9.7 Trang Contact

```jsx
import SEO from "../components/SEO";

export default function Contact() {
  return (
    <>
      <SEO
        title="Liên hệ - Tên của bạn"
        description="Liên hệ với Tên của bạn để trao đổi về dự án website, frontend development hoặc cơ hội hợp tác."
        url="https://your-domain.com/contact"
      />

      <main>
        <h1>Liên hệ</h1>
        <p>
          Bạn có thể liên hệ với tôi qua email hoặc các nền tảng mạng xã hội.
        </p>
      </main>
    </>
  );
}
```

---

## 10. Cập nhật index.html

### File cần sửa

```txt
index.html
```

### Nội dung đề xuất

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />

    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>Tên của bạn - Frontend Developer</title>

    <meta
      name="description"
      content="Portfolio cá nhân giới thiệu kỹ năng, dự án và kinh nghiệm lập trình web."
    />

    <meta name="theme-color" content="#0f172a" />

    <link rel="icon" href="/favicon.ico" />
    <link rel="canonical" href="https://your-domain.com/" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Tên của bạn" />
    <meta property="og:title" content="Tên của bạn - Frontend Developer" />
    <meta
      property="og:description"
      content="Portfolio cá nhân giới thiệu kỹ năng, dự án và kinh nghiệm lập trình web."
    />
    <meta property="og:url" content="https://your-domain.com/" />
    <meta property="og:image" content="https://your-domain.com/og-image.jpg" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Tên của bạn - Frontend Developer" />
    <meta
      name="twitter:description"
      content="Portfolio cá nhân giới thiệu kỹ năng, dự án và kinh nghiệm lập trình web."
    />
    <meta name="twitter:image" content="https://your-domain.com/og-image.jpg" />
  </head>

  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

Lưu ý:

- `index.html` chỉ là fallback mặc định.
- Meta riêng theo từng route sẽ do `SEO.jsx` xử lý.
- Không để title quá dài.
- Không để description trùng nhau ở tất cả các trang.

---

## 11. Tạo robots.txt

### File cần tạo

```txt
public/robots.txt
```

### Nội dung

```txt
User-agent: *
Allow: /

Sitemap: https://your-domain.com/sitemap.xml
```

Nếu có trang không muốn index, ví dụ `/admin`, thêm:

```txt
Disallow: /admin
```

---

## 12. Tạo sitemap.xml

### File cần tạo

```txt
public/sitemap.xml
```

### Nội dung mẫu

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <url>
    <loc>https://your-domain.com/</loc>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>https://your-domain.com/about</loc>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://your-domain.com/projects</loc>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://your-domain.com/blog</loc>
    <priority>0.7</priority>
  </url>

  <url>
    <loc>https://your-domain.com/contact</loc>
    <priority>0.6</priority>
  </url>

</urlset>
```

Nếu có route project/blog động, agent FE cần generate thêm URL tương ứng.

Ví dụ:

```xml
<url>
  <loc>https://your-domain.com/projects/docshare</loc>
  <priority>0.7</priority>
</url>

<url>
  <loc>https://your-domain.com/blog/toi-uu-seo-react-vite</loc>
  <priority>0.7</priority>
</url>
```

---

## 13. Tự động generate sitemap từ data

Nếu project/blog lưu trong file data local, agent FE có thể tạo script generate sitemap.

### File đề xuất

```txt
scripts/generate-sitemap.js
```

### Code mẫu

```js
import fs from "node:fs";

const SITE_URL = "https://your-domain.com";

const staticRoutes = [
  "/",
  "/about",
  "/projects",
  "/blog",
  "/contact"
];

const projectSlugs = [
  "docshare",
  "memory-card-app",
  "seo-tool"
];

const blogSlugs = [
  "toi-uu-seo-react-vite",
  "xay-dung-portfolio-ca-nhan"
];

const urls = [
  ...staticRoutes,
  ...projectSlugs.map((slug) => `/projects/${slug}`),
  ...blogSlugs.map((slug) => `/blog/${slug}`)
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `
  <url>
    <loc>${SITE_URL}${url}</loc>
  </url>`
  )
  .join("")}
</urlset>`;

fs.writeFileSync("./public/sitemap.xml", sitemap);
console.log("Sitemap generated successfully.");
```

### Cập nhật package.json

```json
{
  "scripts": {
    "generate:sitemap": "node scripts/generate-sitemap.js",
    "build": "npm run generate:sitemap && vite build"
  }
}
```

---

## 14. Cấu hình React Router

### File thường gặp

```txt
src/App.jsx
```

### Code mẫu

```jsx
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import About from "./pages/About";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:slug" element={<ProjectDetail />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogDetail />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
```

---

## 15. Trang 404

### File cần tạo

```txt
src/pages/NotFound.jsx
```

### Code mẫu

```jsx
import SEO from "../components/SEO";

export default function NotFound() {
  return (
    <>
      <SEO
        title="Không tìm thấy trang - Tên của bạn"
        description="Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển."
        url="https://your-domain.com/404"
        robots="noindex, follow"
      />

      <main>
        <h1>Không tìm thấy trang</h1>
        <p>Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.</p>
        <a href="/">Quay về trang chủ</a>
      </main>
    </>
  );
}
```

Yêu cầu:

- Trang 404 nên có `robots="noindex, follow"`.
- Có link quay về trang chủ.

---

## 16. Cấu hình deploy SPA

## 16.1 Netlify

### File cần tạo

```txt
public/_redirects
```

### Nội dung

```txt
/* /index.html 200
```

## 16.2 Vercel

### File cần tạo

```txt
vercel.json
```

### Nội dung

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 16.3 Nginx

Nếu deploy bằng Nginx:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 17. Semantic HTML checklist

Agent FE cần rà lại các page theo checklist sau:

```txt
Mỗi page có đúng 1 thẻ h1.
Dùng h2 cho section chính.
Dùng h3 cho mục con.
Không nhảy cấp heading lung tung.
Có main bao nội dung chính.
Có nav cho menu.
Có footer cho cuối trang.
Dùng article cho blog detail hoặc project detail.
Dùng section khi chia nhóm nội dung rõ ràng.
Button dùng cho hành động.
Anchor dùng cho điều hướng.
```

Ví dụ tốt:

```jsx
<main>
  <article>
    <h1>Tiêu đề bài viết</h1>

    <section>
      <h2>Phần 1</h2>
      <p>Nội dung...</p>
    </section>

    <section>
      <h2>Phần 2</h2>
      <p>Nội dung...</p>
    </section>
  </article>
</main>
```

---

## 18. Image SEO

Mọi ảnh nội dung cần có `alt`.

Ví dụ:

```jsx
<img
  src="/images/project-docshare.jpg"
  alt="Giao diện dự án DocShare chia sẻ tài liệu trực tuyến"
/>
```

Không nên dùng alt kiểu:

```txt
image
ảnh
banner
project
```

Nên dùng alt mô tả thật nội dung ảnh.

Nếu ảnh chỉ để trang trí:

```jsx
<img src="/decor.svg" alt="" aria-hidden="true" />
```

---

## 19. Internal link

Agent FE cần thêm liên kết nội bộ giữa các trang.

Ví dụ ở Home:

```jsx
<a href="/projects">Xem dự án cá nhân</a>
<a href="/about">Tìm hiểu thêm về tôi</a>
<a href="/contact">Liên hệ</a>
```

Nếu dùng React Router:

```jsx
import { Link } from "react-router-dom";

<Link to="/projects">Xem dự án cá nhân</Link>
```

Yêu cầu:

- Trang Home link đến About, Projects, Blog, Contact.
- Trang About link đến Projects và Contact.
- Trang Project Detail link quay lại Projects.
- Trang Blog Detail link quay lại Blog và có bài viết liên quan nếu có.

---

## 20. Schema JSON-LD cho trang cá nhân

Nếu website là portfolio cá nhân, thêm schema `Person` ở trang Home hoặc About.

### Ví dụ

```jsx
const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Tên của bạn",
  jobTitle: "Frontend Developer",
  url: "https://your-domain.com",
  image: "https://your-domain.com/avatar.jpg",
  sameAs: [
    "https://github.com/your-username",
    "https://www.linkedin.com/in/your-username"
  ],
  knowsAbout: [
    "React",
    "Vite",
    "JavaScript",
    "Frontend Development",
    "UI/UX"
  ]
};
```

Dùng trong page:

```jsx
<SEO
  title="Tên của bạn - Frontend Developer"
  description="Portfolio cá nhân của Tên của bạn, chuyên xây dựng website React, Vite, UI/UX và tối ưu hiệu năng."
  url="https://your-domain.com/"
  jsonLd={personSchema}
/>
```

---

## 21. Schema JSON-LD cho project

Nếu muốn mô tả dự án như software app:

```jsx
const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: project.title,
  description: project.description,
  applicationCategory: "WebApplication",
  operatingSystem: "Web",
  url: `https://your-domain.com/projects/${project.slug}`,
  image: project.image
};
```

---

## 22. Schema JSON-LD cho blog

Dùng `BlogPosting` cho trang bài viết.

```jsx
const blogSchema = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.title,
  description: post.description,
  image: post.image,
  author: {
    "@type": "Person",
    name: "Tên của bạn"
  },
  datePublished: post.publishedAt,
  dateModified: post.updatedAt || post.publishedAt,
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": `https://your-domain.com/blog/${post.slug}`
  }
};
```

---

## 23. URL slug

Yêu cầu slug:

```txt
Dùng chữ thường
Dùng dấu gạch ngang
Không dùng dấu tiếng Việt trong slug
Không dùng khoảng trắng
Không dùng ký tự đặc biệt
```

Ví dụ tốt:

```txt
/toi-uu-seo-react-vite
/du-an-docshare
/xay-dung-portfolio-react
```

Ví dụ không nên:

```txt
/Tối ưu SEO React Vite
/bài_viết_1
/project?id=123
```

---

## 24. Nội dung SEO cho các trang mặc định

Agent FE có thể dùng mẫu dưới đây nếu chưa có nội dung chính thức.

### Home

```txt
Title:
Tên của bạn - Frontend Developer

Description:
Portfolio cá nhân của Tên của bạn, giới thiệu kỹ năng React, Vite, JavaScript, UI/UX và các dự án web đã thực hiện.
```

### About

```txt
Title:
Giới thiệu - Tên của bạn

Description:
Tìm hiểu về kinh nghiệm, kỹ năng, định hướng nghề nghiệp và hành trình phát triển phần mềm của Tên của bạn.
```

### Projects

```txt
Title:
Dự án React và Web App - Tên của bạn

Description:
Tổng hợp các dự án cá nhân sử dụng React, Vite, JavaScript, Supabase và các công nghệ web hiện đại.
```

### Blog

```txt
Title:
Blog lập trình web - Tên của bạn

Description:
Các bài viết về React, Vite, JavaScript, UI/UX, tối ưu hiệu năng và hành trình học lập trình web.
```

### Contact

```txt
Title:
Liên hệ - Tên của bạn

Description:
Liên hệ với Tên của bạn để trao đổi về dự án website, frontend development hoặc cơ hội hợp tác.
```

---

## 25. Kiểm tra sau khi build

Chạy:

```bash
npm run build
npm run preview
```

Mở các route:

```txt
/
 /about
 /projects
 /blog
 /contact
```

Kiểm tra bằng DevTools:

```txt
document.title
document.querySelector('meta[name="description"]')?.content
document.querySelector('link[rel="canonical"]')?.href
```

Hoặc kiểm tra trong tab Elements:

```html
<title>...</title>
<meta name="description" content="..." />
<link rel="canonical" href="..." />
<meta property="og:title" content="..." />
```

---

## 26. Kiểm tra file public sau build

Sau khi build, thư mục `dist` cần có:

```txt
dist/
├── index.html
├── robots.txt
├── sitemap.xml
├── favicon.ico
└── og-image.jpg
```

Nếu thiếu `robots.txt` hoặc `sitemap.xml`, kiểm tra lại thư mục `public`.

---

## 27. Lưu ý quan trọng về SPA SEO

React Vite mặc định là SPA. Bot truy cập ban đầu thường nhận `index.html`, sau đó JavaScript mới render nội dung.

Với portfolio cá nhân ít trang, cách này thường đủ dùng nếu:

```txt
Nội dung rõ ràng
Meta title/description có cập nhật bằng Helmet
Có sitemap
Có internal link
Tốc độ tải tốt
Không chặn bot
```

Nhưng nếu website có blog hoặc nhiều trang cần SEO mạnh, cân nhắc:

```txt
Prerender
SSG
SSR
Astro
Next.js
Vite SSR
```

Agent FE không cần chuyển framework trừ khi có yêu cầu riêng. Tuy nhiên, nên thiết kế code SEO để sau này dễ nâng cấp.

---

## 28. Performance checklist hỗ trợ SEO

Agent FE cần tối ưu:

```txt
Ảnh nén tốt.
Dùng lazy loading cho ảnh dưới fold.
Không import thư viện quá nặng nếu không cần.
Code splitting theo route nếu app lớn.
Font không gây layout shift.
Không để animation làm chậm LCP.
Button/link có kích thước dễ bấm trên mobile.
```

Ví dụ lazy image:

```jsx
<img
  src="/images/project.jpg"
  alt="Giao diện dự án quản lý tài liệu"
  loading="lazy"
/>
```

Hero image quan trọng không nên lazy load nếu là ảnh LCP chính.

---

## 29. Accessibility hỗ trợ SEO

Checklist:

```txt
Có lang="vi" trong index.html.
Ảnh có alt.
Form có label.
Button có text rõ ràng.
Link có nội dung mô tả.
Không dùng div thay button cho hành động bấm.
Có focus state cho keyboard.
```

Ví dụ form contact:

```jsx
<label htmlFor="email">Email</label>
<input id="email" name="email" type="email" />
```

---

## 30. Acceptance Criteria

Agent FE hoàn thành khi đạt các điều kiện sau:

```txt
[ ] Đã cài react-helmet-async.
[ ] App được bọc bằng HelmetProvider.
[ ] Có component SEO dùng chung.
[ ] Mỗi page chính có title riêng.
[ ] Mỗi page chính có meta description riêng.
[ ] Mỗi page chính có canonical URL.
[ ] Có Open Graph meta.
[ ] Có Twitter Card meta.
[ ] Có robots.txt trong public.
[ ] Có sitemap.xml trong public.
[ ] index.html có lang="vi".
[ ] index.html có meta mặc định.
[ ] Mỗi page có đúng 1 h1.
[ ] Ảnh nội dung có alt.
[ ] Có internal link giữa các trang chính.
[ ] Route reload không bị 404 sau deploy.
[ ] Trang 404 có noindex.
[ ] Build thành công.
[ ] Preview hoạt động bình thường.
```

---

## 31. Việc không nên làm

Không làm các việc sau:

```txt
Không nhồi keyword vào title/description.
Không dùng cùng một description cho mọi trang.
Không để tất cả page chỉ có một h1 giống nhau.
Không dùng button để điều hướng URL.
Không dùng a href="#" cho link thật.
Không để ảnh quan trọng thiếu alt.
Không chặn toàn bộ site trong robots.txt.
Không đặt canonical sai domain.
Không dùng URL query cho trang nội dung chính nếu có thể dùng slug.
```

---

## 32. Gợi ý triển khai theo thứ tự

Agent FE nên triển khai theo thứ tự:

```txt
1. Cài react-helmet-async.
2. Bọc HelmetProvider.
3. Tạo site config.
4. Tạo SEO component.
5. Gắn SEO cho Home.
6. Gắn SEO cho About.
7. Gắn SEO cho Projects.
8. Gắn SEO cho Blog nếu có.
9. Gắn SEO cho Contact.
10. Tạo NotFound page.
11. Tạo robots.txt.
12. Tạo sitemap.xml.
13. Cấu hình deploy SPA.
14. Rà heading và alt.
15. Build và kiểm tra.
```

---

## 33. Prompt ngắn cho agent FE

Có thể copy prompt này cho agent FE:

```txt
Hãy triển khai SEO cho dự án React Vite này theo tài liệu SEO Implementation Spec.

Yêu cầu:
- Cài và cấu hình react-helmet-async.
- Tạo component SEO dùng chung.
- Gắn title, description, canonical, Open Graph, Twitter Card cho từng page.
- Tạo robots.txt và sitemap.xml trong public.
- Cập nhật index.html với lang="vi" và meta mặc định.
- Đảm bảo mỗi page có đúng 1 h1, semantic HTML rõ ràng, ảnh có alt.
- Cấu hình fallback route khi deploy SPA nếu cần.
- Tạo trang 404 có robots noindex.
- Không phá vỡ UI hiện tại.
- Sau khi sửa, chạy build và báo các file đã thay đổi.
```

---

## 34. Ghi chú thay biến

Trước khi merge, thay toàn bộ placeholder:

```txt
Tên của bạn
your-domain.com
your-email@example.com
your-username
```

bằng dữ liệu thật của chủ website.

---

## 35. Kết luận

SEO cho React Vite cá nhân nên bắt đầu từ nền móng gọn:

```txt
Meta đúng
URL sạch
Nội dung rõ
Sitemap có
Robots mở
HTML có nghĩa
Ảnh có alt
Build ổn
```

Khi website lớn hơn, đặc biệt có blog hoặc nhiều trang cần lên Google, hãy nâng cấp sang prerender, SSG hoặc SSR.
