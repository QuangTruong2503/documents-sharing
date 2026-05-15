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
  const baseButtonClass =
    "inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-surface text-ink-secondary transition-all duration-200 hover:-translate-y-px focus:outline-none focus:shadow-focus";

  return (
    <div className="flex items-center gap-2">
      {onInfo && (
        <button
          type="button"
          onClick={onInfo}
          className={`${baseButtonClass} hover:border-warning hover:bg-warning/10 hover:text-warning`}
          title="Thông tin"
        >
          <FontAwesomeIcon icon={faInfoCircle} />
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className={`${baseButtonClass} hover:border-success hover:bg-success/10 hover:text-success`}
          title="Chỉnh sửa"
        >
          <FontAwesomeIcon icon={faEdit} />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className={`${baseButtonClass} hover:border-danger hover:bg-danger/10 hover:text-danger`}
          title="Xóa"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      )}
      {onSave && (
        <button
          type="button"
          onClick={onSave}
          className={`${baseButtonClass} hover:border-primary hover:bg-primary-soft hover:text-primary`}
          title="Lưu"
        >
          <FontAwesomeIcon icon={faSave} />
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
