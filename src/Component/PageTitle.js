// src/components/PageTitle.js
import { Helmet } from "react-helmet";

const PageTitle = ({ title }) => {
  return (
    <Helmet>
      <title>{title} | DocShare</title>
    </Helmet>
  );
};

export default PageTitle;