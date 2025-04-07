import React from "react";
import PageTitle from "../Component/PageTitle";
import DocumentCarousel from "../Component/Courasel/DocumentCourasel.tsx";
import DocumentHistory from "../Component/Documents/DocumentsHistory.tsx";
function Home() {

  return (
    <div className="">
      <PageTitle title="Trang chủ" description="Nền tảng lưu trữ và chia sẻ tài liệu miễn phí." />
      <DocumentCarousel categoryID={"van-hoc"} title="Tài Liệu Văn Học"/>
      <DocumentCarousel categoryID={"lap-trinh"} title="Tài Liệu Lập Trình"/>
      {/* Tài liệu đã xem */}
      <DocumentHistory />
    </div>
  );
}

export default Home;
