const rawSiteUrl = process.env.REACT_APP_SITE_URL || window.location.origin || "https://docshare.id.vn";
const siteUrl = rawSiteUrl.replace(/\/$/, "");

export const siteSeo = {
  name: "DocShare",
  url: siteUrl,
  locale: "vi_VN",
  defaultTitle: "DocShare - Nền tảng chia sẻ tài liệu học tập",
  defaultDescription:
    "DocShare là nền tảng lưu trữ, tìm kiếm và chia sẻ tài liệu học tập miễn phí cho học sinh, sinh viên và cộng đồng tự học.",
  defaultImage: `${siteUrl}/og-image.svg`,
  twitterCard: "summary_large_image",
};

export const buildCanonicalUrl = (path = "/") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteSeo.url}${normalizedPath}`;
};
