import React, { useEffect, useState } from "react";
import documentsApi from "../../api/documentsApi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import { Dropdown } from "flowbite-react";
import DeleteModal from "../../Component/Modal/DeleteModal";


interface Document {
  document_id: number;
  title: string;
  description: string | null;
  thumbnail_url: string;
  like_count: number;
  uploaded_at: string;
  is_public: boolean;
}

const MyDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);



  const handleClose = () => {
    setOpenModal(false)
  };

  const handleDelete = () => {
    // Thực hiện logic xóa ở đây
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await documentsApi.getMyUploadedDocument();
        setDocuments(response.data.data);
      } catch (err) {
        setError("Failed to load documents");
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">
        My Uploaded Documents
      </h2>
      {documents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {documents.map((doc) => (
            <div
              key={doc.document_id}
              className=" bg-white shadow-lg rounded-lg overflow-hidden transition-all hover:shadow-gray-400 duration-200 ease-in relative"
            >
              <img
                src={doc.thumbnail_url}
                alt={doc.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 relative">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg truncate">
                    {doc.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mt-1 truncate">
                  {doc.description ? doc.description : "Không có mô tả..."}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                </p>
                <div className="flex justify-between gap-2 items-center mt-3 relative">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-md ${
                      doc.is_public
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {doc.is_public ? "Public" : "Private"}
                  </span>

                    <Dropdown
                      label={<FontAwesomeIcon icon={faGear} />}
                      inline
                      className="w-44 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5"
                      arrowIcon={false}
                      placement="bottom-end"
                    >
                      <Dropdown.Item>
                        <button className="block w-full text-left text-sm text-gray-700">
                          Edit
                        </button>
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setOpenModal(true)}>
                      <button  className="block w-full text-left text-sm text-gray-700">
                          Xóa
                      </button>
                      </Dropdown.Item>
                      <Dropdown.Item>
                        <button className="block w-full text-left text-sm text-gray-700">
                          Share
                        </button>
                      </Dropdown.Item>
                    </Dropdown>
                  </div>
                </div>
              </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No documents uploaded yet.</p>
      )}
      {openModal && <DeleteModal
        onClose={handleClose}
        onAction={handleDelete}/>}
    </div>
  );
};

export default MyDocuments;
