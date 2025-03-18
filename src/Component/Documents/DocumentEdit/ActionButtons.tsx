import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faInfoCircle, faTrash, faSave } from "@fortawesome/free-solid-svg-icons";

interface ActionButtonsProps {
  onInfo?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSave?: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onInfo,
  onEdit,
  onDelete,
  onSave,
}) => {
  return (
    <>
      {onInfo && (
        <button
          onClick={onInfo}
          className="text-gray-700 hover:text-yellow-500 transition-colors duration-200"
          title="Thông tin"
        >
          <FontAwesomeIcon icon={faInfoCircle} size="lg" />
        </button>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          className="text-gray-700 hover:text-green-500 transition-colors duration-200"
          title="Chỉnh sửa"
        >
          <FontAwesomeIcon icon={faEdit} size="lg" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="text-gray-700 hover:text-red-500 transition-colors duration-200"
          title="Xóa"
        >
          <FontAwesomeIcon icon={faTrash} size="lg" />
        </button>
      )}
      {onSave && (
        <button
          onClick={onSave}
          className="text-gray-700 hover:text-blue-500 transition-colors duration-200"
          title="Lưu"
        >
          <FontAwesomeIcon icon={faSave} size="lg" />
        </button>
      )}
    </>
  );
};

export default ActionButtons;