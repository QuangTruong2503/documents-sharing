import { faCircleExclamation, faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

export function DeleteModal({onClose, onAction }) {



  // Hàm xử lý đóng modal
  const handleClose = () => {
      onClose(); // Gọi callback onClose nếu được truyền vào
  };

  // Hàm xử lý khi xác nhận xóa
  const handleAction = () => {
    if (onAction) {
      onAction(); // Gọi callback onAction nếu được truyền vào
    }
  };

  return (
    <>
      {/* Nút để mở modal - bạn có thể đặt ở component cha */}
      {/* <button onClick={handleOpen}>Open Delete Modal</button> */}

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
            <button 
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-3xl"
              onClick={handleClose}
            >
              <FontAwesomeIcon icon={faClose}/>
            </button>
            <div className="flex justify-center mb-4">
              <div className="text-gray-400 text-5xl">
                <FontAwesomeIcon icon={faCircleExclamation}/>
              </div>
            </div>
            <p className="text-center text-gray-700 text-lg mb-6">
              Bạn có chắc muốn xóa dữ liệu này?
            </p>
            <div className="flex justify-center space-x-4">
              <button 
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={handleAction}
              >
                Có, chắc chắn
              </button>
              <button 
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                onClick={handleClose}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
    </>
  );
}

export default DeleteModal;