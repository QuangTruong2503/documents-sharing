import React from "react";
import PageTitle from "components/PageTitle";
import DocumentCarousel from "components/Carousel/DocumentCarousel.tsx";
import DocumentHistory from "components/Documents/DocumentsHistory.tsx";
import DocumentFeedTabs from "components/Documents/DocumentFeedTabs.tsx";
function Home() {

  return (
    <div>
      <PageTitle title="Trang chủ" description="Nền tảng lưu trữ và chia sẻ tài liệu miễn phí." />
      <section className="py-10 sm:py-14 lg:py-16">
        <div className="max-w-4xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-ink-secondary">
            Community document platform
          </p>
          <h1 className="font-display text-5xl font-bold leading-none tracking-[-0.04em] text-ink sm:text-6xl lg:text-7xl">
            Khám phá, chia sẻ và tải xuống tài liệu thiết kế theo tinh thần{" "}
            <span className="text-secondary">DESIGN.md</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-7 text-ink-secondary">
            Một thư viện tài liệu cộng đồng dành cho học tập và xây dựng sản phẩm:
            rõ ràng, có tổ chức, dễ quét nội dung và đủ yên tĩnh để bạn tập trung.
          </p>
        </div>
      </section>
      <DocumentFeedTabs />
      <DocumentCarousel categoryID={"van-hoc"} title="Tài Liệu Văn Học"/>
      <DocumentCarousel categoryID={"lap-trinh"} title="Tài Liệu Lập Trình"/>
      {/* Tài liệu đã xem */}
      <DocumentHistory />
    </div>
  );
}

export default Home;
