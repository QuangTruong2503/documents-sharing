import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BellRing,
  CheckCheck,
  ClipboardCheck,
  Download,
  FilePen,
  FileUp,
  Flag,
  FolderPlus,
  Heart,
  MailCheck,
  Megaphone,
  Shield,
  ThumbsDown,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import notificationsApi from "../../api/notificationsApi";
import { subscribeNotificationRealtime } from "../../api/notificationRealtime";

const PAGE_SIZE = 10;

const notificationTypeConfig = {
  LIKE_DOCUMENT: { icon: Heart, className: "bg-red-50 text-red-600" },
  DISLIKE_DOCUMENT: { icon: ThumbsDown, className: "bg-slate-100 text-slate-600" },
  FOLLOW_USER: { icon: UserPlus, className: "bg-emerald-50 text-emerald-600" },
  REPORT_CREATED: { icon: Flag, className: "bg-amber-50 text-amber-600" },
  REPORT_STATUS_UPDATED: { icon: ClipboardCheck, className: "bg-blue-50 text-blue-600" },
  DOCUMENT_UPLOADED: { icon: FileUp, className: "bg-indigo-50 text-indigo-600" },
  DOCUMENT_PUBLISHED: { icon: Megaphone, className: "bg-violet-50 text-violet-600" },
  DOCUMENT_DOWNLOAD_MILESTONE: { icon: Download, className: "bg-cyan-50 text-cyan-600" },
  DOCUMENT_ADDED_TO_COLLECTION: { icon: FolderPlus, className: "bg-teal-50 text-teal-600" },
  DOCUMENT_UPDATED_BY_ADMIN: { icon: FilePen, className: "bg-orange-50 text-orange-600" },
  DOCUMENT_DELETED_BY_ADMIN: { icon: Trash2, className: "bg-rose-50 text-rose-600" },
  ACCOUNT_UPDATED_BY_ADMIN: { icon: Shield, className: "bg-purple-50 text-purple-600" },
  EMAIL_CHANGED: { icon: MailCheck, className: "bg-green-50 text-green-600" },
};

function formatNotificationTime(value) {
  if (!value) return "";

  const normalizedValue =
    typeof value === "string" && !/(Z|[+-]\d{2}:\d{2})$/.test(value) ? `${value}Z` : value;
  const date = new Date(normalizedValue);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString("vi-VN");
}

function normalizeTargetUrl(targetUrl) {
  if (!targetUrl) return null;

  return targetUrl
    .replace(/^\/documents\//, "/document/")
    .replace(/^\/collections\//, "/collection/")
    .replace(/^\/users\//, "/public-profile/")
    .replace(/^\/reports\//, "/my-reports/")
    .replace(/^\/admin\/reports\/\d+/, "/admin")
    .replace(/^\/profile$/, "/account/profile");
}

function getNotificationId(notification) {
  return notification?.notification_id ?? notification?.notificationId;
}

function getUnreadCountValue(responseData) {
  return responseData?.unread_count ?? responseData?.unreadCount ?? 0;
}

const NotificationIcon = ({ type }) => {
  const config = notificationTypeConfig[type] || { icon: Bell, className: "bg-primary-soft text-primary" };
  const Icon = config.icon;

  return (
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${config.className}`}>
      <Icon className="h-4 w-4" />
    </span>
  );
};

const NotificationDropdown = ({ compact = false, onNavigate }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const isOpenRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const hasMore = useMemo(() => {
    if (!pagination) return false;
    return pagination.currentPage < pagination.totalPages;
  }, [pagination]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationsApi.getUnreadCount();
      setUnreadCount(getUnreadCountValue(response.data));
    } catch (error) {
      console.error("Cannot fetch unread notification count:", error);
    }
  }, []);

  const fetchNotifications = useCallback(async (pageNumber = 1) => {
    const isFirstPage = pageNumber === 1;
    if (isFirstPage) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await notificationsApi.getNotifications({
        PageNumber: pageNumber,
        PageSize: PAGE_SIZE,
      });
      const nextNotifications = response.data?.data || [];
      setNotifications((current) => (isFirstPage ? nextNotifications : [...current, ...nextNotifications]));
      setPagination(response.data?.pagination || null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không tải được thông báo.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    return subscribeNotificationRealtime({
      onNotification: (notification) => {
        setNotifications((current) => {
          const notificationId = getNotificationId(notification);
          if (!notificationId || current.some((item) => getNotificationId(item) === notificationId)) {
            return current;
          }

          return [notification, ...current].slice(0, PAGE_SIZE);
        });
        setPagination((current) =>
          current ? { ...current, totalCount: (current.totalCount || 0) + 1 } : current
        );
      },
      onUnreadCountChanged: (count) => {
        setUnreadCount(count);
      },
      onReconnected: () => {
        fetchUnreadCount();
        if (isOpenRef.current) {
          fetchNotifications(1);
        }
      },
    });
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1);
      fetchUnreadCount();
    }
  }, [fetchNotifications, fetchUnreadCount, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((current) => !current);
  };

  const handleNotificationClick = async (notification) => {
    const notificationId = getNotificationId(notification);

    if (!notification.is_read && notificationId) {
      try {
        await notificationsApi.markAsRead(notificationId);
        setNotifications((current) =>
          current.map((item) =>
            getNotificationId(item) === notificationId ? { ...item, is_read: true } : item
          )
        );
        setUnreadCount((current) => Math.max(current - 1, 0));
      } catch (error) {
        toast.error(error?.response?.data?.message || "Không thể đánh dấu đã đọc.");
        return;
      }
    }

    const targetUrl = normalizeTargetUrl(notification.target_url);
    setIsOpen(false);
    if (targetUrl) {
      navigate(targetUrl);
      if (onNavigate) onNavigate();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
      toast.success("Đã đánh dấu tất cả thông báo là đã đọc.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể đánh dấu tất cả đã đọc.");
    }
  };

  const handleDelete = async (event, notificationId) => {
    event.stopPropagation();
    if (!notificationId) return;

    try {
      await notificationsApi.deleteNotification(notificationId);
      setNotifications((current) => {
        const deletedItem = current.find((item) => getNotificationId(item) === notificationId);
        if (deletedItem && !deletedItem.is_read) {
          setUnreadCount((count) => Math.max(count - 1, 0));
        }
        return current.filter((item) => getNotificationId(item) !== notificationId);
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể xóa thông báo.");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={`relative inline-flex items-center justify-center rounded-md border border-line bg-surface text-ink-secondary transition hover:border-primary hover:text-primary focus:outline-none focus:shadow-focus ${
          compact ? "h-10 w-full justify-start gap-3 px-4" : "h-10 w-10"
        }`}
        title="Thông báo"
      >
        {unreadCount > 0 ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        {compact && <span className="text-sm font-medium">Thông báo</span>}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-danger px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-line bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">Thông báo</p>
              <p className="text-xs text-ink-secondary">{unreadCount} thông báo chưa đọc</p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-secondary transition hover:bg-canvas hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              title="Đánh dấu tất cả đã đọc"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[440px] overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-ink-secondary">Đang tải thông báo...</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-ink-secondary">Chưa có thông báo nào.</div>
            ) : (
              notifications.map((notification) => {
                const notificationId = getNotificationId(notification);

                return (
                  <button
                    key={notificationId}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`group flex w-full gap-3 border-b border-line px-4 py-3 text-left transition last:border-b-0 hover:bg-canvas ${
                      notification.is_read ? "bg-surface" : "bg-primary-soft/60"
                    }`}
                  >
                    <NotificationIcon type={notification.type} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="line-clamp-2 text-sm font-semibold text-ink">
                          {notification.title || "Thông báo mới"}
                        </span>
                        <span
                          aria-hidden="true"
                          className={`mt-1 h-2 w-2 shrink-0 rounded-full bg-primary ${
                            notification.is_read ? "opacity-0" : "opacity-100"
                          }`}
                        />
                      </span>
                      <span className="mt-1 line-clamp-2 text-xs leading-5 text-ink-secondary">
                        {notification.message}
                      </span>
                      <span className="mt-2 flex items-center justify-between gap-2 text-xs text-neutral">
                        <span>{formatNotificationTime(notification.created_at)}</span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(event) => handleDelete(event, notificationId)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              handleDelete(event, notificationId);
                            }
                          }}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-secondary opacity-0 transition hover:bg-red-50 hover:text-danger group-hover:opacity-100"
                          title="Xóa thông báo"
                        >
                          <X className="h-4 w-4" />
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {hasMore && (
            <button
              type="button"
              onClick={() => fetchNotifications((pagination?.currentPage || 1) + 1)}
              disabled={isLoadingMore}
              className="w-full border-t border-line px-4 py-3 text-sm font-medium text-primary transition hover:bg-canvas disabled:text-ink-secondary"
            >
              {isLoadingMore ? "Đang tải..." : "Xem thêm"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
