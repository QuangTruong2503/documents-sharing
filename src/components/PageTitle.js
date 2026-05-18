import SEO from "components/SEO";

const PageTitle = ({ title, description, url, image, type, robots, jsonLd }) => (
  <SEO
    title={title}
    description={description}
    url={url}
    image={image}
    type={type}
    robots={robots}
    jsonLd={jsonLd}
  />
);

export default PageTitle;
