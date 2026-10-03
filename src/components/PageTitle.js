import SEO from "components/SEO";

const PageTitle = ({ title, description, url = undefined, image = undefined, type = undefined, robots = undefined, jsonLd = undefined }) => (
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
