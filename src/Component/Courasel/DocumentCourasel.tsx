import React, { useEffect, useState, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import DocumentCard from "../Documents/DocumentCard.tsx";
import documentApi from "../../api/documentsApi.js";

interface DocumentItem {
  document_id: number;
  title: string;
  thumbnail_url: string;
  full_name: string;
}

interface DocumentCarouselProps {
  categoryID: number;
}

const DocumentCarousel: React.FC<DocumentCarouselProps> = ({ categoryID }) => {
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
    640: { slidesPerView: 2 },
    768: { slidesPerView: 3 },
    1024: { slidesPerView: 4 },
    1280: { slidesPerView: 5 },
  };

  if (isLoading) {
    return <div className="w-full text-center py-8">Loading documents...</div>;
  }

  if (error) {
    return <div className="w-full text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="w-full relative px-12 py-2"> {/* Added padding for button spacing */}
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
      </Swiper>

      {/* Modern Navigation Buttons */}
      {documents.length > 5 && (
        <>
          <button
            className="custom-swiper-button-prev absolute top-1/2 left-0 transform -translate-y-1/2 z-10 
              w-12 h-12 bg-white text-gray-600 rounded-full shadow-lg flex items-center justify-center
              hover:bg-gray-50 hover:text-blue-600 transition-all duration-300 ease-in-out
              border border-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            className="custom-swiper-button-next absolute top-1/2 right-0 transform -translate-y-1/2 z-10
              w-12 h-12 bg-white text-gray-600 rounded-full shadow-lg flex items-center justify-center
              hover:bg-gray-50 hover:text-blue-600 transition-all duration-300 ease-in-out
              border border-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

export default DocumentCarousel;