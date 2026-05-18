import React, { useEffect, useState, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import DocumentCard from "../Documents/DocumentCard.tsx";
import documentApi from "api/documentsApi.js";
import { NavLink } from "react-router-dom";

interface DocumentItem {
  document_id: number;
  title: string;
  thumbnail_url: string;
  full_name: string;
}

interface DocumentCarouselProps {
  categoryID: number;
  title: string;
}

const DocumentCarousel: React.FC<DocumentCarouselProps> = ({ categoryID, title }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await documentApi.getDocumentsByCategory(categoryID, 1, 15);
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      setError("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, [categoryID]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const swiperBreakpoints = {
    320: { slidesPerView: 2 },
    768: { slidesPerView: 3 },
    1024: { slidesPerView: 4 },
    1280: { slidesPerView: 5 },
  };

  if (isLoading) {
    return (
      <div className="relative w-full py-2">
        <div className="w-full p-6 text-center">
          <Swiper
            modules={[Navigation]}
            spaceBetween={5}
            slidesPerView={5}
            navigation={{
              nextEl: ".custom-swiper-button-next",
              prevEl: ".custom-swiper-button-prev",
            }}
            breakpoints={swiperBreakpoints}
            loop={false}
          >
            {Array(5).fill(null).map((_, index) => (
              <SwiperSlide key={index}>
                <div className="surface-card relative flex h-full cursor-pointer flex-col overflow-hidden">
                  <div className="relative flex h-[200px] justify-center overflow-hidden bg-canvas">
                    <div className="h-full w-3/4 animate-pulse rounded-md bg-gray-200"></div>
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div className="space-y-2">
                      <div className="h-6 w-3/4 animate-pulse rounded-md bg-gray-200"></div>
                      <div className="h-5 w-1/2 animate-pulse rounded-md bg-gray-200"></div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <div className="h-8 w-24 animate-pulse rounded-md bg-gray-200"></div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="w-full text-center py-8 text-red-500"></div>;
  }
  if (documents.length === 0) {
    return <div className="w-full text-center py-8"></div>;
  }

  return (
    <section className="relative w-full py-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold tracking-[-0.03em] text-ink">{title}</h2>
        <NavLink className="rounded-md px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary-soft hover:text-primary-hover" to={`category/${categoryID}`} >Xem tất cả</NavLink>
      </div>
      <div className="relative">
        <Swiper
          modules={[Navigation]}
          spaceBetween={20}
          slidesPerView={5}
          navigation={{
            nextEl: ".custom-swiper-button-next",
            prevEl: ".custom-swiper-button-prev",
          }}
          breakpoints={swiperBreakpoints}
          loop={false}
        >
          {documents.map((doc) => (
            <SwiperSlide key={doc.document_id}>
              <DocumentCard document={doc} />
            </SwiperSlide>
          ))}
          {/* Di chuyển nút vào trong Swiper */}
          {documents.length > 5 && (
            <>
              <button
                className="custom-swiper-button-prev absolute top-1/2 left-2 transform -translate-y-1/2 z-10 
                  flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink-secondary shadow-lg
                  transition-all duration-300 ease-in-out hover:-translate-y-px hover:bg-canvas hover:text-primary"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="custom-swiper-button-next absolute top-1/2 right-2 transform -translate-y-1/2 z-10
                  flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink-secondary shadow-lg
                  transition-all duration-300 ease-in-out hover:-translate-y-px hover:bg-canvas hover:text-primary"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </Swiper>
      </div>
    </section>
  );
};

export default DocumentCarousel;
