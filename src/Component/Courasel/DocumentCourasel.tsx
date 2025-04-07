import React, { useEffect, useState, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import DocumentCard from "../Documents/DocumentCard.tsx";
import documentApi from "../../api/documentsApi.js";
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
      <div className="w-full relative py-2">
        <div className="w-full text-center p-6">
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
                <div className="relative overflow-hidden bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group h-full flex flex-col">
                  <div className="relative h-48 flex justify-center overflow-hidden">
                    <div className="w-3/4 h-full bg-gray-200 animate-pulse rounded-md"></div>
                  </div>
                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div className="space-y-2">
                      <div className="w-3/4 h-6 bg-gray-200 animate-pulse rounded-md"></div>
                      <div className="w-1/2 h-5 bg-gray-200 animate-pulse rounded-md"></div>
                    </div>
                    <div className="mt-3 flex justify-between items-center text-sm">
                      <div className="w-24 h-8 bg-gray-200 animate-pulse rounded-md"></div>
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
    return <div className="w-full text-center py-8 text-red-500">{error}</div>;
  }
  if (documents.length === 0) {
    return <div className="w-full text-center py-8"></div>;
  }

  return (
    <div className="w-full relative p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-2xl font-semibold mb-5">{title}</p>
        <NavLink className="text-blue-500 font-semibold hover:text-blue-600 hover:underline" to={`category/${categoryID}`} >Xem tất cả</NavLink>
      </div>
      <div className="relative">
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
                  w-10 h-10 bg-white text-gray-600 rounded-full shadow-lg flex items-center justify-center
                  hover:bg-gray-50 hover:text-blue-600 transition-all duration-300 ease-in-out
                  border border-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="custom-swiper-button-next absolute top-1/2 right-2 transform -translate-y-1/2 z-10
                  w-10 h-10 bg-white text-gray-600 rounded-full shadow-lg flex items-center justify-center
                  hover:bg-gray-50 hover:text-blue-600 transition-all duration-300 ease-in-out
                  border border-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </Swiper>
      </div>
    </div>
  );
};

export default DocumentCarousel;