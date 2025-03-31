import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import DocumentCard from '../Documents/DocumentCard.tsx';
import documentApi from '../../api/documentsApi.js'
interface DocumentItem {
  document_id: number;
  title: string;
  thumbnail_url: string;
  full_name: string
}
// Interface cho props
interface DocumentCarouselProps {
    categoryID: number;
  }

  const DocumentCarousel: React.FC<DocumentCarouselProps> = ({ categoryID }) => {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          const response = await documentApi.getDocumentsByCategory(categoryID, 1, 15);
          setDocuments(response.data.documents);
        } catch (error) {
          console.error('Failed to fetch documents:', error);
        }
      };
  
      fetchData();
    }, [categoryID]);
  
    return (
      <div className="w-full">
        <Swiper
          modules={[Navigation]}
          spaceBetween={20}
          slidesPerView={5}
          navigation
          loop
        >
          {documents.map((doc) => (
            <SwiperSlide key={doc.document_id}>
              <DocumentCard document={doc} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    );
  };

export default DocumentCarousel;
