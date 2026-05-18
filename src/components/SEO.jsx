import { Helmet } from "react-helmet-async";
import { buildCanonicalUrl, siteSeo } from "config/siteSeo";

const normalizeTitle = (title) => {
  if (!title) return siteSeo.defaultTitle;
  return title.includes(siteSeo.name) ? title : `${title} - ${siteSeo.name}`;
};

const SEO = ({
  title,
  description = siteSeo.defaultDescription,
  url,
  image = siteSeo.defaultImage,
  type = "website",
  robots = "index, follow",
  siteName = siteSeo.name,
  locale = siteSeo.locale,
  jsonLd,
}) => {
  const finalTitle = normalizeTitle(title);
  const finalDescription = description || siteSeo.defaultDescription;
  const finalUrl = url || buildCanonicalUrl(window.location.pathname);

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
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content={siteSeo.twitterCard} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={image} />

      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Helmet>
  );
};

export default SEO;
