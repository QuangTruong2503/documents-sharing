import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import documentsApi from '../../../api/documentsApi';
import { checkNotSigned } from '../../../Helpers/CheckSigned';

// Định nghĩa interface
interface DocumentData {
  document_id: number;
  user_id: string;
  title: string;
  description: string;
  file_url: string;
  is_public: boolean;
  download_count: number;
  uploaded_at: string;
  full_name: string;
}

const PdfViewer: React.FC = () => {
  const { documentID } = useParams<{ documentID: string }>();
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  //Hàm tải xuống tài liệu
  const handleDownloadDocument = async () =>{
    checkNotSigned()
    const response = await documentsApi.downloadDocumentByID(documentID)
    if(response.data.success)
    {
      const downloadURL = response.data.downloadURL;
      const link = document.createElement("a");
      link.href = downloadURL;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(downloadURL);
    }
    
  }

  useEffect(() => {
    const fetchDocumentData = async () => {
      if (!documentID) {
        setError('Document ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await documentsApi.getDocumentByID(documentID);
        setDocumentData(response.data);
      } catch (err) {
        console.error('Error fetching document:', err);
        setError(err.response.data);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentData();
  }, [documentID]);

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  if (!documentData) {
    return <div className="text-center p-4">No document data available</div>;
  }

  return (
      <div className="w-full flex flex-col md:flex-row gap-4">
        {/* Left Sidebar with Interaction Buttons */}
        <div className="w-full md:w-1/4 bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-4">
            <div className="flex items-center space-x-2">
              <span>{documentData.download_count} lượt tải</span>
            </div>
          </div>

          <button
            onClick={handleDownloadDocument}
            className="w-full bg-blue-500 text-white py-2 rounded-lg mb-4 text-center hover:bg-blue-600"
          >
            Download
          </button>
        </div>

        {/* Main Content Area */}
        <div className="w-full md:w-3/4 bg-white p-6 rounded-lg shadow-md">
          {/* Title */}
          <h1 className="text-3xl font-bold mb-4 text-gray-800">
            {documentData.title}
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-4">
            {documentData.description}
          </p>

          {/* Author and Date */}
          <p className="text-gray-500 text-sm mb-4">
            Uploaded by {documentData.full_name} on{' '}
            {new Date(documentData.uploaded_at).toLocaleDateString()}
          </p>

          {/* PDF Viewer */}
          <div className="w-full h-[600px] border border-gray-300 rounded-lg">
            <iframe
              src={'https://docs.google.com/gview?url=' + documentData.file_url + '&embedded=true'}
              className="w-full h-full rounded-lg"
              title="PDF Viewer"
            />
          </div>
        </div>
      </div>
  );
};

export default PdfViewer;