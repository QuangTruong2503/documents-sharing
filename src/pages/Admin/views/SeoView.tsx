import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import adminApi from "../../../api/adminApi";
import { apiMessage } from "../../../utils/apiMessage";
import { useAdminAction } from "../components/AdminShared";
import type { SeoSettings } from "../types";

type Section = "settings" | "robots" | "routes";
type LoadState = "loading" | "ok" | "error";
export function robotsContent(value: unknown): string {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    "content" in value &&
    typeof value.content === "string"
  )
    return value.content;
  throw new Error("Nội dung robots.txt không hợp lệ.");
}
export const httpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};
const emptyForm: SeoSettings = {
  siteName: "",
  siteUrl: "",
  defaultTitle: "",
  defaultDescription: "",
  defaultImage: "",
  locale: "vi_VN",
};
const suggestedRobots =
  "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nDisallow: /library\nDisallow: /s/\nDisallow: /upload-document\nDisallow: /my-reports\n";
export default function SeoView() {
  const [form, setForm] = useState(emptyForm);
  const [robots, setRobots] = useState("");
  const [routes, setRoutes] = useState("");
  const [state, setState] = useState<Record<Section, LoadState>>({
    settings: "loading",
    robots: "loading",
    routes: "loading",
  });
  const [errors, setErrors] = useState<Partial<Record<Section, string>>>({});
  const settingsAction = useAdminAction();
  const robotsAction = useAdminAction();
  const routesAction = useAdminAction();
  const request = useRef({ settings: 0, robots: 0, routes: 0 });
  const load = useCallback(async (section: Section) => {
    const id = ++request.current[section];
    setState((x) => ({ ...x, [section]: "loading" }));
    try {
      if (section === "settings") {
        const x = await adminApi.getSeoSettings();
        if (
          !x ||
          !Object.keys(emptyForm).every(
            (key) => typeof x[key as keyof SeoSettings] === "string",
          )
        )
          throw new Error("Cấu hình SEO không hợp lệ.");
        if (id === request.current[section]) setForm(x);
      }
      if (section === "robots") {
        const content = robotsContent(await adminApi.getRobotsTxt());
        if (id === request.current[section]) setRobots(content);
      }
      if (section === "routes") {
        const x = await adminApi.getSitemapRoutes();
        if (
          !Array.isArray(x) ||
          !x.every((route) => typeof route.path === "string")
        )
          throw new Error("Danh sách route không hợp lệ.");
        if (id === request.current[section])
          setRoutes(x.map((route) => route.path).join("\n"));
      }
      if (id === request.current[section])
        setState((x) => ({ ...x, [section]: "ok" }));
    } catch (error) {
      if (id !== request.current[section]) return;
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      setErrors((x) => ({
        ...x,
        [section]:
          status === 404 || status === 501
            ? "Backend chưa hỗ trợ phần cấu hình này."
            : apiMessage(error, "Không tải được cấu hình hiện tại."),
      }));
      setState((x) => ({ ...x, [section]: "error" }));
    }
  }, []);
  useEffect(() => {
    const current = request.current;
    void Promise.all([load("settings"), load("robots"), load("routes")]);
    return () => {
      for (const key of Object.keys(current) as Section[]) current[key]++;
    };
  }, [load]);
  const banner = (section: Section) =>
    state[section] !== "ok" && (
      <div
        role="status"
        className="rounded border border-line bg-canvas p-3 text-sm"
      >
        {state[section] === "loading" ? (
          "Đang tải cấu hình…"
        ) : (
          <>
            {errors[section]} Không thể lưu cho tới khi tải thành công.{" "}
            <button
              className="text-primary underline"
              onClick={() => load(section)}
              type="button"
            >
              Thử lại
            </button>
          </>
        )}
      </div>
    );
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (state.settings !== "ok") return;
    if (!httpsUrl(form.siteUrl) || !httpsUrl(form.defaultImage)) {
      toast.error("Địa chỉ website và ảnh phải là URL HTTPS hợp lệ.");
      return;
    }
    await settingsAction.run(
      () => adminApi.updateSeoSettings(form),
      "Đã lưu cấu hình SEO.",
    );
  };
  const generate = async () => {
    if (state.routes !== "ok") return;
    const list = routes
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
    if (
      list.some(
        (x) => !x.startsWith("/") || x.startsWith("//") || /[\s?#]/.test(x),
      )
    ) {
      toast.error(
        "Mỗi route phải bắt đầu bằng / và không chứa query, dấu # hoặc khoảng trắng.",
      );
      return;
    }
    let saved = false;
    await routesAction.run(async () => {
      await adminApi.updateSitemapRoutes(list);
      saved = true;
      try {
        await adminApi.generateSitemap();
      } catch (error) {
        throw new Error(
          `Đã lưu danh sách route, nhưng chưa tạo được sitemap: ${apiMessage(error, "Lỗi máy chủ.")}`,
        );
      }
    }, "Đã lưu route và tạo sitemap.");
    if (saved) void load("routes");
  };
  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-2">
      <form className="surface-card space-y-4 p-4" onSubmit={save}>
        <h2 className="text-lg font-semibold">Cấu hình SEO mặc định</h2>
        {banner("settings")}
        {(
          Object.entries({
            siteName: "Tên website",
            siteUrl: "Địa chỉ website",
            defaultTitle: "Tiêu đề mặc định",
            defaultDescription: "Mô tả mặc định",
            defaultImage: "URL ảnh chia sẻ",
            locale: "Ngôn ngữ",
          }) as [keyof SeoSettings, string][]
        ).map(([key, label]) => (
          <label className="block" key={key}>
            {label}
            <input
              required
              className="input-field mt-2"
              disabled={state.settings !== "ok"}
              maxLength={
                key === "defaultTitle"
                  ? 70
                  : key === "defaultDescription"
                    ? 180
                    : undefined
              }
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </label>
        ))}
        <button
          className="btn-primary"
          disabled={state.settings !== "ok" || settingsAction.busy}
        >
          Lưu cấu hình
        </button>
      </form>
      <section className="surface-card space-y-4 p-4">
        <h2 className="text-lg font-semibold">Xem trước khi chia sẻ</h2>
        {state.settings === "ok" && (
          <>
            <img
              src={form.defaultImage}
              alt="Ảnh xem trước khi chia sẻ"
              className="h-48 w-full rounded object-cover"
            />
            <p className="text-sm text-ink-secondary break-all">
              {form.siteUrl}
            </p>
            <h3 className="font-semibold">{form.defaultTitle}</h3>
            <p>{form.defaultDescription}</p>
          </>
        )}
      </section>
      <section className="surface-card space-y-4 p-4">
        <h2 className="text-lg font-semibold">robots.txt</h2>
        {banner("robots")}
        <textarea
          aria-label="Nội dung robots.txt"
          className="input-field min-h-64 font-mono text-sm"
          disabled={state.robots !== "ok"}
          value={robots}
          onChange={(e) => setRobots(e.target.value)}
        />
        <details>
          <summary className="cursor-pointer text-sm text-primary">
            Mẫu gợi ý theo route hiện tại
          </summary>
          <pre className="mt-3 whitespace-pre-wrap text-xs">
            {suggestedRobots}
          </pre>
        </details>
        <button
          className="btn-secondary"
          disabled={state.robots !== "ok" || robotsAction.busy}
          onClick={() =>
            robotsAction.run(
              () => adminApi.updateRobotsTxt(robots),
              "Đã lưu robots.txt.",
            )
          }
        >
          Lưu robots.txt
        </button>
      </section>
      <section className="surface-card space-y-4 p-4">
        <h2 className="text-lg font-semibold">Danh sách route sitemap</h2>
        {banner("routes")}
        <textarea
          aria-label="Danh sách route sitemap"
          className="input-field min-h-64 font-mono text-sm"
          disabled={state.routes !== "ok"}
          value={routes}
          onChange={(e) => setRoutes(e.target.value)}
        />
        <button
          className="btn-primary"
          disabled={state.routes !== "ok" || routesAction.busy}
          onClick={generate}
        >
          Tạo sitemap
        </button>
      </section>
    </div>
  );
}
