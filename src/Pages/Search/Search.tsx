import React, { useEffect, useState } from 'react';
import DocumentList from '../../Component/Documents/DocumentList.tsx';
import { useParams } from 'react-router-dom';
import documentsApi from '../../api/documentsApi';

interface Document {
  document_id: number;
  full_name: string;
  title: string;
  thumbnail_url: string;
  is_public: boolean;
}

function Search() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const { search } = useParams();

  useEffect(() => {
    if (!search) return; // Kiểm tra nếu không có giá trị search thì không gọi API

    const handleGetDocuments = async () => {
      try {
        const response = await documentsApi.getSearchDocuments(search);
        setDocuments(response.data);
      } catch (error) {
        console.error("Lỗi khi tìm kiếm tài liệu:", error);
      }
    };

    handleGetDocuments();
  }, [search]);

  return (
    <div>
      <DocumentList documents={documents} />
    </div>
  );
}

export default Search;
