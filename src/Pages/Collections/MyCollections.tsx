// MyCollections.tsx
import React, { useEffect, useState } from 'react';
import collectionsApi from '../../api/collectionsApi.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faShare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { NavLink } from 'react-router-dom';
import PageTitle from '../../Component/PageTitle.js';

interface Collection {
  collection_id: number;
  user_id: string;
  name: string;
  description: string;
  is_public: boolean;
  created_at: string;
  documentCount: number;
}

const MyCollections: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    is_public: true
  });
  const [editCollection, setEditCollection] = useState({
    name: '',
    description: '',
    is_public: true
  });
  const [reload, setReload] = useState(false);

  // Fetch collections
  useEffect(() => {
    const handleGetCollections = async () => {
      try {
        const response = await collectionsApi.getMyCollection();
        setCollections(response.data);
      } catch (err) {
        console.error(err.message);
      }
    };
    handleGetCollections();
  }, [reload]);

  // Add new collection
  const handleAddCollection = async () => {
    try {
      const response = await collectionsApi.postCreateCollection(newCollection);
      toast.success(response.data);
    } catch (err) {
      console.error(err.message);
    } finally {
      setIsModalOpen(false);
      setNewCollection({ name: '', description: '', is_public: true });
      setReload(!reload);
    }
  };

  // Delete collection
const handleDeleteCollection = async () => {
  if (!selectedCollection) return;
  setIsDeleteModalOpen(false);
  await toast.promise(
    collectionsApi.deleteCollection(selectedCollection.collection_id),
    {
      pending: 'Đang xóa bộ sưu tập...',
      success: {
        render({ data }) {
          setReload(!reload);
          return data.data; // Hiển thị thông báo từ API
        },
      },
      error: {
        render({ data }) {
          console.error((data as { message: string }).message);
          return 'Xóa thất bại';
        },
      },
    }
  );
  setSelectedCollection(null);
};

// Edit collection
const handleEditCollection = async () => {
  if (!selectedCollection) return;
  setIsEditModalOpen(false);
  await toast.promise(
    collectionsApi.updateCollection(selectedCollection.collection_id, editCollection),
    {
      pending: 'Đang cập nhật bộ sưu tập...',
      success: 'Đã cập nhật bộ sưu tập',
      error: {
        render({ data }) {
          console.error((data as { message: string }).message);
          return 'Cập nhật thất bại';
        },
      },
    }
  );
  setReload(!reload);
  setSelectedCollection(null);
};

  return (
   <>
    <PageTitle title="Bộ sưu tập tài liệu" description="Quản lý bộ sưu tập của bạn tại đây." />
    <div className="container mx-auto p-4 max-w-screen-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bộ Sưu Tập</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className=" text-blue-500 font-bold py-2 px-4 rounded"
        >
          Tạo bộ sưu tập
        </button>
      </div>
      {collections.length === 0 && (
        <p className="text-gray-500">Hiện chưa có bộ sưu tập.</p>
      )}

      {/* Collection List */}
      {collections.length > 0 && (
        <div className="grid max-h-[500px] overflow-y-auto shadow">
          {collections.map((collection) => (
            <div
              key={collection.collection_id}
              className="bg-white p-4 shadow-md flex justify-between hover:bg-gray-200 transition-all duration-300 ease-in-out"
            >
              <div>
                <NavLink to={`/collection/${collection.collection_id}`} className="text-xl font-semibold hover:text-blue-500">{collection.name}</NavLink>
                <p className="text-gray-600 line-clamp-1 text-sm">{collection.description? collection.description : "Không có mô tả..."}</p>
                <div className="mt-2 text-sm text-gray-500">
                  <p>{collection.is_public ? 'Công khai' : 'Riêng tư'}</p>
                  <p>Gồm {collection.documentCount} tài liệu</p>
                </div>
              </div>
              <div className="flex gap-1 items-center">
                <button
                  onClick={() => {
                    setSelectedCollection(collection);
                    setEditCollection({
                      name: collection.name,
                      description: collection.description,
                      is_public: collection.is_public
                    });
                    setIsEditModalOpen(true);
                  }}
                  className="hover:bg-gray-300 py-1 px-2 rounded-full w-fit h-fit"
                  title="Chỉnh sửa"
                >
                  <FontAwesomeIcon icon={faPen} />
                </button>
                <button
                  onClick={() => {
                    setSelectedCollection(collection);
                    setIsDeleteModalOpen(true);
                  }}
                  className="hover:bg-gray-300 py-1 px-2 rounded-full w-fit h-fit"
                  title="Xóa"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
                <button
                  className="hover:bg-gray-300 py-1 px-2 rounded-full w-fit h-fit"
                  title="Chia sẻ"
                >
                  <FontAwesomeIcon icon={faShare} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-bold mb-4">Tạo Mới Bộ Sưu Tập</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={newCollection.name}
                onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newCollection.description}
                onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                rows={3}
              />
            </div>
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newCollection.is_public}
                  onChange={(e) => setNewCollection({ ...newCollection, is_public: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                />
                <span className="ml-2 text-sm text-gray-700">Công khai</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCollection}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-bold mb-4">Xác nhận xóa</h2>
            <p className="mb-4">Bạn có chắc muốn xóa bộ sưu tập "{selectedCollection?.name}" không?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteCollection}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-bold mb-4">Chỉnh sửa Bộ Sưu Tập</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={editCollection.name}
                onChange={(e) => setEditCollection({ ...editCollection, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={editCollection.description}
                onChange={(e) => setEditCollection({ ...editCollection, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                rows={3}
              />
            </div>
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editCollection.is_public}
                  onChange={(e) => setEditCollection({ ...editCollection, is_public: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                />
                <span className="ml-2 text-sm text-gray-700">Công khai</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleEditCollection}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
   </>
  );
};

export default MyCollections;