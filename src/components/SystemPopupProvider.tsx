"use client";

import { useEffect, useState } from "react";

type NoticeKind = "success" | "error" | "offline";

type Notice = {
  kind: NoticeKind;
  title: string;
  message: string;
};

const artwork: Record<NoticeKind, string> = {
  success: "/assets/mascot-success.png",
  error: "/assets/mascot-error.png",
  offline: "/assets/mascot-offline.png",
};

const defaults: Record<NoticeKind, Pick<Notice, "title">> = {
  success: { title: "Berhasil, Uni!" },
  error: { title: "Ada yang perlu diperbaiki" },
  offline: { title: "Koneksi sedang offline" },
};

function classify(message: string): NoticeKind {
  return /gagal|error|kesalahan|tidak dapat|tidak berhasil|perlu perhatian/i.test(message)
    ? "error"
    : "success";
}

/** Replaces browser alerts with a consistent mascot modal for every page. */
export default function SystemPopupProvider({ children }: { children: React.ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const nativeAlert = window.alert;
    window.alert = (value?: unknown) => {
      const message = String(value ?? "");
      const kind = classify(message);
      setNotice({ kind, title: defaults[kind].title, message });
    };

    const onOffline = () => setNotice({
      kind: "offline",
      title: defaults.offline.title,
      message: "Periksa Wi-Fi atau data seluler, lalu coba lagi saat koneksi kembali stabil.",
    });
    const onNotice = (event: Event) => {
      const detail = (event as CustomEvent<Partial<Notice>>).detail;
      const kind = detail?.kind || "success";
      setNotice({ kind, title: detail?.title || defaults[kind].title, message: detail?.message || "" });
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("umkita:notice", onNotice);
    return () => {
      window.alert = nativeAlert;
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("umkita:notice", onNotice);
    };
  }, []);

  return <>
    {children}
    {notice && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true">
        <div className="w-full max-w-sm overflow-hidden rounded-[28px] border border-white bg-white p-6 text-center shadow-2xl">
          <img src={artwork[notice.kind]} alt="Maskot UMKita" className="mx-auto h-36 w-36 object-contain" />
          <h2 className={`mt-2 text-lg font-black ${notice.kind === "error" ? "text-rose-700" : notice.kind === "offline" ? "text-slate-700" : "text-[#1E2A5E]"}`}>{notice.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{notice.message}</p>
          <button type="button" onClick={() => setNotice(null)} className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-extrabold text-white ${notice.kind === "error" ? "bg-rose-600 hover:bg-rose-700" : notice.kind === "offline" ? "bg-slate-700 hover:bg-slate-800" : "bg-[#2563EB] hover:bg-[#1D4ED8]"}`}>Mengerti</button>
        </div>
      </div>
    )}
  </>;
}
