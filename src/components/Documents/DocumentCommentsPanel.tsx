import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { MessageCircle, Pencil, RefreshCw, Reply, Send, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import featureUpgradesApi from "api/featureUpgradesApi.ts";
import { formatDateToVN } from "utils/formatDateToVN";

interface CommentAuthor {
  userId?: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
}

interface DocumentComment {
  id: number;
  parentCommentId?: number | null;
  content: string;
  author?: CommentAuthor;
  canEdit?: boolean;
  createdAt?: string;
  updatedAt?: string;
  replies?: DocumentComment[];
}

const authorName = (author?: CommentAuthor) => author?.fullName || author?.username || "Người dùng DocShare";
const mentionLabel = (author?: CommentAuthor) => author?.username || author?.fullName?.replace(/\s+/g, "");

const normalizeAuthor = (raw: any): CommentAuthor => ({
  userId: raw?.userId ?? raw?.user_id ?? raw?.id,
  username: raw?.username,
  fullName: raw?.fullName ?? raw?.full_name ?? raw?.name,
  avatarUrl: raw?.avatarUrl ?? raw?.avatar_url,
});

const normalizeComment = (raw: any): DocumentComment => ({
  id: raw?.id ?? raw?.commentId ?? raw?.comment_id,
  parentCommentId: raw?.parentCommentId ?? raw?.parent_comment_id ?? null,
  content: raw?.content ?? raw?.body ?? raw?.message ?? "",
  author: normalizeAuthor(raw?.author ?? raw?.user ?? raw),
  canEdit: Boolean(raw?.canEdit ?? raw?.can_edit ?? raw?.permissions?.canEdit),
  createdAt: raw?.createdAt ?? raw?.created_at,
  updatedAt: raw?.updatedAt ?? raw?.updated_at,
  replies: (raw?.replies ?? raw?.children ?? []).map(normalizeComment),
});

const normalizeCommentsResponse = (response: any): DocumentComment[] => {
  const list = response?.comments ?? response?.items ?? response?.data?.comments ?? response?.data ?? [];
  return Array.isArray(list) ? list.map(normalizeComment).filter((comment) => comment.id) : [];
};

const collectMentionableUsers = (comments: DocumentComment[]): CommentAuthor[] => {
  const users = new Map<string, CommentAuthor>();

  const visit = (comment: DocumentComment) => {
    const username = mentionLabel(comment.author);
    const userKey = comment.author?.userId || username;
    if (username && userKey && !users.has(userKey)) {
      users.set(userKey, comment.author || {});
    }
    (comment.replies || []).forEach(visit);
  };

  comments.forEach(visit);
  return Array.from(users.values());
};

function renderCommentContent(content: string) {
  const parts = content.split(/(@[A-Za-z0-9_.-]{2,50})/g);
  return parts.map((part, index) =>
    /^@[A-Za-z0-9_.-]{2,50}$/.test(part) ? (
      <span key={`${part}-${index}`} className="font-semibold text-primary">
        {part}
      </span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    )
  );
}

function CommentComposer({
  placeholder,
  buttonLabel,
  loading,
  mentionableUsers = [],
  initialContent = "",
  onSubmit,
  onCancel,
}: {
  placeholder: string;
  buttonLabel: string;
  loading: boolean;
  mentionableUsers?: CommentAuthor[];
  initialContent?: string;
  onSubmit: (content: string) => Promise<boolean>;
  onCancel?: () => void;
}) {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const mentionMatch = content.match(/(?:^|\s)@([A-Za-z0-9_.-]{0,50})$/);
  const mentionQuery = mentionMatch?.[1]?.toLowerCase();
  const mentionSuggestions =
    mentionMatch && mentionableUsers.length > 0
      ? mentionableUsers
          .filter((user) => {
            const username = mentionLabel(user);
            return username && username.toLowerCase().includes(mentionQuery || "");
          })
          .slice(0, 5)
      : [];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextContent = content.trim();
    if (!nextContent) return;
    const submitted = await onSubmit(nextContent);
    if (submitted) setContent("");
  };

  const insertMention = (user: CommentAuthor) => {
    const username = mentionLabel(user);
    if (!username) return;
    setContent((current) => current.replace(/(^|\s)@([A-Za-z0-9_.-]{0,50})$/, `$1@${username} `));
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-line bg-canvas p-3">
      <div className="relative">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="input-field min-h-24 resize-none bg-surface"
          placeholder={placeholder}
        />
        {mentionSuggestions.length > 0 && (
          <div className="absolute bottom-2 left-2 z-10 w-64 overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
            {mentionSuggestions.map((user) => {
              const username = mentionLabel(user);
              return (
                <button
                  key={user.userId || username}
                  type="button"
                  onClick={() => insertMention(user)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-primary-soft"
                >
                  <img src={user.avatarUrl || "/logo.ico"} alt="" className="h-7 w-7 rounded-full object-cover" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{authorName(user)}</span>
                    <span className="block truncate text-xs text-ink-secondary">@{username}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="mt-3 flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary px-3 py-2">
            <X className="mr-2 h-4 w-4" />
            Hủy
          </button>
        )}
        <button type="submit" disabled={loading || !content.trim()} className="btn-primary px-3 py-2">
          {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          {buttonLabel}
        </button>
      </div>
    </form>
  );
}

function CommentItem({
  comment,
  depth = 0,
  mentionableUsers,
  posting,
  onReply,
  onEdit,
  onDelete,
}: {
  comment: DocumentComment;
  depth?: number;
  mentionableUsers: CommentAuthor[];
  posting: boolean;
  onReply: (parentId: number, content: string) => Promise<boolean>;
  onEdit: (commentId: number, content: string) => Promise<boolean>;
  onDelete: (commentId: number) => Promise<void>;
}) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const saveEdit = async () => {
    const nextContent = editContent.trim();
    if (!nextContent) return;
    const saved = await onEdit(comment.id, nextContent);
    if (saved) setEditing(false);
  };

  const replyInitialContent = depth > 0 && mentionLabel(comment.author) ? `@${mentionLabel(comment.author)} ` : "";

  return (
    <div className={`${depth > 0 ? "ml-8 border-l border-line pl-4" : ""}`}>
      <article className="rounded-lg border border-line bg-surface p-4">
        <div className="flex items-start gap-3">
          <img src={comment.author?.avatarUrl || "/logo.ico"} alt="" className="h-9 w-9 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-ink">{authorName(comment.author)}</p>
              <span className="text-xs text-neutral">{comment.createdAt ? formatDateToVN(comment.createdAt) : ""}</span>
            </div>
            {editing ? (
              <div className="mt-3">
                <textarea value={editContent} onChange={(event) => setEditContent(event.target.value)} className="input-field min-h-24 resize-none" />
                <div className="mt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setEditing(false)} className="btn-secondary px-3 py-2">Hủy</button>
                  <button type="button" onClick={saveEdit} disabled={posting || !editContent.trim()} className="btn-primary px-3 py-2">Lưu</button>
                </div>
              </div>
            ) : (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-secondary">{renderCommentContent(comment.content)}</p>
            )}
            {!editing && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => setReplying((current) => !current)} className="btn-secondary px-3 py-2 text-xs">
                  <Reply className="mr-2 h-3.5 w-3.5" />
                  Trả lời
                </button>
                {comment.canEdit && (
                  <>
                    <button type="button" onClick={() => setEditing(true)} className="btn-secondary px-3 py-2 text-xs">
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Sửa
                    </button>
                    <button type="button" onClick={() => onDelete(comment.id)} className="btn-secondary px-3 py-2 text-xs text-danger">
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Xóa
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </article>
      {replying && (
        <div className="mt-3">
          <CommentComposer
            placeholder="Viết phản hồi..."
            buttonLabel="Gửi trả lời"
            loading={posting}
            mentionableUsers={mentionableUsers}
            initialContent={replyInitialContent}
            onSubmit={async (content) => {
              const submitted = await onReply(comment.id, content);
              if (submitted) setReplying(false);
              return submitted;
            }}
            onCancel={() => setReplying(false)}
          />
        </div>
      )}
      {(comment.replies || []).length > 0 && (
        <div className="mt-3 space-y-3">
          {(comment.replies || []).map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              mentionableUsers={mentionableUsers}
              posting={posting}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DocumentCommentsPanel({ documentId }: { documentId: number | string }) {
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const isSignedIn = Boolean(Cookies.get("token"));
  const mentionableUsers = collectMentionableUsers(comments);

  const loadComments = async () => {
    setLoading(true);
    try {
      const response = await featureUpgradesApi.getComments(documentId, { PageNumber: 1, PageSize: 50 });
      setComments(normalizeCommentsResponse(response));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không tải được bình luận.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const submitComment = async (content: string, parentCommentId?: number): Promise<boolean> => {
    if (!isSignedIn) {
      toast.info("Bạn cần đăng nhập để bình luận.");
      return false;
    }
    setPosting(true);
    try {
      await featureUpgradesApi.createComment(documentId, { content, parentCommentId });
      await loadComments();
      toast.success(parentCommentId ? "Đã gửi trả lời." : "Đã gửi bình luận.");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không gửi được bình luận.");
      return false;
    } finally {
      setPosting(false);
    }
  };

  const editComment = async (commentId: number, content: string): Promise<boolean> => {
    setPosting(true);
    try {
      await featureUpgradesApi.updateComment(commentId, { content });
      await loadComments();
      toast.success("Đã cập nhật bình luận.");
      return true;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không sửa được bình luận.");
      return false;
    } finally {
      setPosting(false);
    }
  };

  const deleteComment = async (commentId: number) => {
    if (!window.confirm("Xóa bình luận này?")) return;
    setPosting(true);
    try {
      await featureUpgradesApi.deleteComment(commentId);
      await loadComments();
      toast.success("Đã xóa bình luận.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không xóa được bình luận.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="surface-card p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-ink">
            <MessageCircle className="h-5 w-5 text-primary" />
            Bình luận
          </h2>
          <p className="mt-1 text-sm text-ink-secondary">{comments.length} thảo luận về tài liệu này</p>
        </div>
        <button type="button" onClick={loadComments} className="btn-secondary px-3 py-2" title="Tải lại bình luận">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {isSignedIn ? (
        <CommentComposer
          placeholder="Chia sẻ nhận xét của bạn..."
          buttonLabel="Gửi bình luận"
          loading={posting}
          mentionableUsers={mentionableUsers}
          onSubmit={(content) => submitComment(content)}
        />
      ) : (
        <div className="rounded-lg border border-line bg-canvas p-4 text-sm text-ink-secondary">
          Đăng nhập để tham gia bình luận.
        </div>
      )}

      <div className="mt-5 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-sm text-ink-secondary">Đang tải bình luận...</div>
        ) : comments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-canvas p-8 text-center text-sm text-ink-secondary">
            Chưa có bình luận nào.
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              mentionableUsers={mentionableUsers}
              posting={posting}
              onReply={(parentId, content) => submitComment(content, parentId)}
              onEdit={editComment}
              onDelete={deleteComment}
            />
          ))
        )}
      </div>
    </section>
  );
}
