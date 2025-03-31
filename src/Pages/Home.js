import React from "react";
import PageTitle from "../Component/PageTitle";
import DocumentCarousel from "../Component/Courasel/DocumentCourasel.tsx";
function Home() {

  return (
    <div className="">
      <PageTitle title="Trang chủ" description="Nền tảng lưu trữ và chia sẻ tài liệu miễn phí." />
      <DocumentCarousel categoryID={"van-hoc"}/>
    </div>
  );
}

export default Home;
