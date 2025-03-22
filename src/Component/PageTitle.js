// src/components/PageTitle.js
import { Helmet } from "react-helmet";

const PageTitle = ({ title, description }) => {
  return (
    <Helmet>
      <title>{title} | DocShare</title>
      <meta name="description" content={description} />
    </Helmet>
  );
};

export default PageTitle;