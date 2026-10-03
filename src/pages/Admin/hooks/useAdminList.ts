import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { apiMessage } from "../../../utils/apiMessage";
import type { ListResponse, Params } from "../types";

export function useAdminQuery() {
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState<{ base: string; value: string } | null>(
    null,
  );
  const currentQuery = params.toString();
  const visibleParams = new URLSearchParams(params);
  if (draft?.base === currentQuery) {
    draft.value
      ? visibleParams.set("search", draft.value)
      : visibleParams.delete("search");
    visibleParams.delete("page");
  }
  useEffect(() => {
    if (!draft || draft.base !== currentQuery) return;
    const timer = window.setTimeout(() => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          draft.value ? next.set("search", draft.value) : next.delete("search");
          next.delete("page");
          return next;
        },
        { replace: true },
      );
      setDraft(null);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draft, currentQuery, setParams]);
  const setFilter = useCallback(
    (key: string, value: string) => {
      if (key === "search") {
        setDraft({ base: currentQuery, value });
        return;
      }
      setDraft(null);
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (draft?.base === current.toString())
            draft.value
              ? next.set("search", draft.value)
              : next.delete("search");
          value ? next.set(key, value) : next.delete(key);
          if (key !== "page") next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [setParams, currentQuery, draft],
  );
  return { params: visibleParams, setFilter };
}
export function useAdminList<T>(
  fetcher: (p: Params) => Promise<ListResponse<T>>,
  defaultSize = 20,
) {
  const { params, setFilter } = useAdminQuery();
  const [result, setResult] = useState<ListResponse<T>>({
    data: [],
    pagination: {
      currentPage: 1,
      pageSize: defaultSize,
      totalCount: 0,
      totalPages: 0,
    },
  });
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const requestId = useRef(0);
  const query = params.toString();
  useEffect(() => {
    const id = ++requestId.current;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      const p = Object.fromEntries(new URLSearchParams(query));
      const page = Math.max(1, Number(p.page) || 1);
      const size = [20, 50, 100].includes(Number(p.pageSize))
        ? Number(p.pageSize)
        : defaultSize;
      delete p.page;
      delete p.pageSize;
      delete p.reportId;
      fetcher({ ...p, PageNumber: page, PageSize: size })
        .then((response) => {
          if (id === requestId.current) setResult(response);
        })
        .catch((error) => {
          if (id === requestId.current)
            toast.error(apiMessage(error, "Không tải được danh sách."));
        })
        .finally(() => {
          if (id === requestId.current) setLoading(false);
        });
    }, 300);
    const invalidate = () => {
      requestId.current++;
    };
    return () => {
      window.clearTimeout(timeout);
      invalidate();
    };
  }, [fetcher, query, revision, defaultSize]);
  return {
    ...result,
    loading,
    params,
    setFilter,
    reload: () => setRevision((x) => x + 1),
  };
}
