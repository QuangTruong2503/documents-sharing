import React, { useEffect, useState } from "react";
import documentsApi from "../../api/documentsApi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";

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

                  {/* Dropdown Menu với Headless UI */}
                  <Menu as="div" className="inline-block text-left">
                    <div>
                      <Menu.Button className="text-sm p-2 rounded-lg hover:bg-slate-300 transition-all duration-300">
                        <FontAwesomeIcon icon={faGear} />
                      </Menu.Button>
                    </div>

                    {/* Hiệu ứng xuất hiện */}
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items anchor="right end" className="absolute right-0 mt-2 w-44 bg-white divide-y divide-gray-100 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-2 text-sm text-gray-700">    
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                className={`block w-full text-left px-4 py-2 ${
                                  active ? "bg-gray-100" : ""
                                }`}
                              >
                                Edit
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                className={`block w-full text-left px-4 py-2 ${
                                  active ? "bg-gray-100" : ""
                                }`}
                              >
                                Delete
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                className={`block w-full text-left px-4 py-2 ${
                                  active ? "bg-gray-100" : ""
                                }`}
                              >
                                Share
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No documents uploaded yet.</p>
      )}
    </div>
  );
};

export default MyDocuments;
