"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type ToolMode = "none" | "laser" | "pen";
type ViewerKind = "pdf" | "office";

interface AccessPayload {
  id: string;
  title: string;
  pageCount: number;
  signedUrl: string;
  viewerKind?: ViewerKind;
  officeEmbedUrl?: string | null;
}

export function PresentationViewer({ presentationId }: { presentationId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<{ numPages: number; getPage: (n: number) => Promise<unknown> } | null>(
    null,
  );
  const hideTimerRef = useRef<number | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("Sunum");
  const [viewerKind, setViewerKind] = useState<ViewerKind>("pdf");
  const [officeEmbedUrl, setOfficeEmbedUrl] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tool, setTool] = useState<ToolMode>("none");
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);

  const isOffice = viewerKind === "office";

  const bumpControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = window.setTimeout(() => setControlsVisible(false), 2800);
  }, []);

  const clearDrawing = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const syncOverlaySize = useCallback(() => {
    const container = containerRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!container || !drawCanvas) return;
    const width = Math.max(1, Math.floor(container.clientWidth));
    const height = Math.max(1, Math.floor(container.clientHeight));
    if (drawCanvas.width !== width || drawCanvas.height !== height) {
      drawCanvas.width = width;
      drawCanvas.height = height;
    }
  }, []);

  const renderPage = useCallback(async (pageNumber: number) => {
    const doc = pdfDocRef.current;
    const canvas = canvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!doc || !canvas) return;

    const pdfPage = (await doc.getPage(pageNumber)) as {
      getViewport: (opts: { scale: number }) => { width: number; height: number };
      render: (opts: {
        canvasContext: CanvasRenderingContext2D;
        viewport: { width: number; height: number };
      }) => { promise: Promise<void> };
    };

    const container = containerRef.current;
    const maxWidth = container?.clientWidth || window.innerWidth;
    const maxHeight = container?.clientHeight || window.innerHeight;
    const unscaled = pdfPage.getViewport({ scale: 1 });
    const scale = Math.min(maxWidth / unscaled.width, maxHeight / unscaled.height) * 0.98;
    const viewport = pdfPage.getViewport({ scale: Math.max(scale, 0.5) });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    await pdfPage.render({ canvasContext: ctx, viewport }).promise;

    if (drawCanvas) {
      drawCanvas.width = canvas.width;
      drawCanvas.height = canvas.height;
      const dctx = drawCanvas.getContext("2d");
      dctx?.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/v1/instructor/presentations/${presentationId}/access`, {
          cache: "no-store",
        });
        const json = (await response.json()) as { data?: AccessPayload; error?: string };
        if (!response.ok || !json.data) {
          throw new Error(json.error ?? "Sunum açılamadı.");
        }
        if (cancelled) return;

        setTitle(json.data.title);
        const kind: ViewerKind = json.data.viewerKind === "office" ? "office" : "pdf";
        setViewerKind(kind);

        if (kind === "office") {
          if (!json.data.officeEmbedUrl) {
            throw new Error("PowerPoint görüntüleyici adresi oluşturulamadı.");
          }
          setOfficeEmbedUrl(json.data.officeEmbedUrl);
          setPageCount(0);
          setPage(1);
          requestAnimationFrame(() => syncOverlaySize());
        } else {
          const pdfjs = await import("pdfjs-dist");
          pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
          const loadingTask = pdfjs.getDocument({ url: json.data.signedUrl });
          const doc = await loadingTask.promise;
          if (cancelled) {
            await doc.destroy();
            return;
          }
          pdfDocRef.current = doc as unknown as {
            numPages: number;
            getPage: (n: number) => Promise<unknown>;
          };
          setPageCount(doc.numPages);
          setPage(1);
          await renderPage(1);
        }

        try {
          if (containerRef.current && !document.fullscreenElement) {
            await containerRef.current.requestFullscreen();
          }
        } catch {
          /* toolbar still has Tam ekran */
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Sunum yüklenemedi.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [presentationId, renderPage, syncOverlaySize]);

  useEffect(() => {
    if (isOffice || !pdfDocRef.current || loading) return;
    void renderPage(page);
    clearDrawing();
  }, [page, loading, renderPage, clearDrawing, isOffice]);

  useEffect(() => {
    function onResize() {
      if (isOffice) {
        syncOverlaySize();
        return;
      }
      if (pdfDocRef.current) void renderPage(page);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [page, renderPage, isOffice, syncOverlaySize]);

  const goNext = useCallback(() => {
    if (isOffice) return;
    setPage((current) => {
      const max = pageCount > 0 ? pageCount : current + 1;
      return Math.min(max, current + 1);
    });
    bumpControls();
  }, [pageCount, bumpControls, isOffice]);

  const goPrev = useCallback(() => {
    if (isOffice) return;
    setPage((current) => Math.max(1, current - 1));
    bumpControls();
  }, [bumpControls, isOffice]);

  const enterFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      }
    } catch {
      /* ignore */
    }
    bumpControls();
  }, [bumpControls]);

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
      bumpControls();
      if (isOffice) syncOverlaySize();
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [bumpControls, isOffice, syncOverlaySize]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isOffice) {
        if (event.key === "Escape") void exitFullscreen();
        if ((event.ctrlKey || event.metaKey) && (event.key === "p" || event.key === "s")) {
          event.preventDefault();
        }
        return;
      }
      if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "Escape") {
        void exitFullscreen();
      } else if ((event.ctrlKey || event.metaKey) && (event.key === "p" || event.key === "s")) {
        event.preventDefault();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, exitFullscreen, isOffice]);

  function pointerToCanvas(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = drawCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    bumpControls();
    if (tool === "laser") {
      const point = pointerToCanvas(event);
      setLaserPos(point);
      return;
    }
    if (tool === "pen" && drawingRef.current) {
      const canvas = drawCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      const point = pointerToCanvas(event);
      if (!ctx || !point || !lastPointRef.current) return;
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      lastPointRef.current = point;
    }
  }

  if (loading) {
    return (
      <div className="rounded-[1.75rem] border border-border-surface bg-white p-10 text-sm text-muted">
        Sunum hazırlanıyor…
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 rounded-[1.75rem] border border-rose-200 bg-rose-50 p-8 text-sm text-rose-800">
        <p>{error}</p>
        <Link href="/instructor/presentations" className="font-semibold underline">
          Sunumlarıma dön
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden rounded-[1.75rem] bg-black text-white"
      onContextMenu={(event) => event.preventDefault()}
      onMouseMove={bumpControls}
      onClick={(event) => {
        if (isOffice || tool !== "none") return;
        const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
        const x = event.clientX - rect.left;
        if (x > rect.width / 2) goNext();
        else goPrev();
      }}
    >
      <div className={`relative ${isOffice ? "h-full min-h-[70vh] w-full" : "max-h-full max-w-full"}`}>
        {isOffice && officeEmbedUrl ? (
          <iframe
            title={title}
            src={officeEmbedUrl}
            className="h-[min(100dvh,900px)] min-h-[70vh] w-full border-0 bg-white"
            allow="fullscreen"
          />
        ) : (
          <canvas ref={canvasRef} className="max-h-[100dvh] max-w-full object-contain" />
        )}
        <canvas
          ref={drawCanvasRef}
          className={`absolute inset-0 h-full w-full ${
            tool === "none" ? "pointer-events-none" : "pointer-events-auto"
          }`}
          style={{ touchAction: "none" }}
          onPointerDown={(event) => {
            if (tool !== "pen") return;
            drawingRef.current = true;
            lastPointRef.current = pointerToCanvas(event);
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerUp={() => {
            drawingRef.current = false;
            lastPointRef.current = null;
          }}
          onPointerLeave={() => {
            if (tool === "laser") setLaserPos(null);
          }}
          onPointerMove={onPointerMove}
        />
        {tool === "laser" && laserPos ? (
          <span
            className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-[0_0_18px_6px_rgba(239,68,68,0.65)]"
            style={{
              left: `${(laserPos.x / (drawCanvasRef.current?.width || 1)) * 100}%`,
              top: `${(laserPos.y / (drawCanvasRef.current?.height || 1)) * 100}%`,
            }}
          />
        ) : null}
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-10 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-black/55 px-4 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            {!isOffice ? (
              <>
                <button
                  type="button"
                  className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"
                  onClick={goPrev}
                >
                  Önceki
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"
                  onClick={goNext}
                >
                  Sonraki
                </button>
                <span className="px-2 text-sm text-white/80">
                  Sayfa {page} / {pageCount || "—"}
                </span>
              </>
            ) : (
              <span className="px-2 text-sm text-white/80">
                PowerPoint · slayt geçişi sunum içinde
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                tool === "laser" ? "bg-red-500 text-white" : "bg-white/10 hover:bg-white/20"
              }`}
              onClick={() => setTool((current) => (current === "laser" ? "none" : "laser"))}
            >
              Lazer
            </button>
            <button
              type="button"
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                tool === "pen" ? "bg-amber-500 text-black" : "bg-white/10 hover:bg-white/20"
              }`}
              onClick={() => setTool((current) => (current === "pen" ? "none" : "pen"))}
            >
              Kalem
            </button>
            <button
              type="button"
              className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"
              onClick={clearDrawing}
            >
              Temizle
            </button>
            {isFullscreen ? (
              <button
                type="button"
                className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"
                onClick={() => void exitFullscreen()}
              >
                Tam ekrandan çık
              </button>
            ) : (
              <button
                type="button"
                className="rounded-xl bg-document-primary px-3 py-2 text-sm font-semibold text-white hover:bg-document-primary-hover"
                onClick={() => void enterFullscreen()}
              >
                Tam ekran
              </button>
            )}
            <Link
              href="/instructor/presentations"
              className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"
            >
              Kapat
            </Link>
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-white/50">{title}</p>
      </div>
    </div>
  );
}
