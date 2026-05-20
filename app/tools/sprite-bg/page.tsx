"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { removeByColor, exportAsBlob } from "@/lib/sprite-bg";

type Mode = "color" | "ai";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SpriteBgPage() {
  const [mode, setMode] = useState<Mode>("color");
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultImageData, setResultImageData] = useState<ImageData | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [tolerance, setTolerance] = useState(30);
  const [apiKey, setApiKey] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const originalImgRef = useRef<HTMLImageElement | null>(null);

  const loadFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      setOriginalUrl(url);
      setResultImageData(null);
      setResultUrl(null);
      setAiError(null);
      originalImgRef.current = img;
    };
    img.src = url;
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) loadFile(file);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== "color" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = removeByColor(imageData, x, y, tolerance);
    setResultImageData(result);

    const offscreen = document.createElement("canvas");
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    offscreen.getContext("2d")!.putImageData(result, 0, 0);
    setResultUrl(offscreen.toDataURL("image/png"));
  };

  const handleAiRemove = async () => {
    if (!fileRef.current?.files?.[0] || !apiKey.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const formData = new FormData();
      formData.append("image_file", fileRef.current.files[0]);
      formData.append("size", "auto");
      const res = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": apiKey.trim() },
        body: formData,
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`remove.bg 错误 ${res.status}: ${msg}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // decode blob into ImageData for export
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        setResultImageData(ctx.getImageData(0, 0, c.width, c.height));
        setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
        setResultUrl(url);
      };
      img.src = url;
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setAiLoading(false);
    }
  };

  const handleDownload = async (format: "image/png" | "image/webp") => {
    if (!resultImageData) return;
    const blob = await exportAsBlob(resultImageData, imgSize.w, imgSize.h, format);
    const ext = format === "image/png" ? "png" : "webp";
    download(blob, `sprite-transparent.${ext}`);
  };

  const hasImage = !!originalUrl;
  const hasResult = !!resultUrl;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">✂️ Sprite 去背景</h1>
      <p className="text-muted-foreground mb-2">
        去除 AI 生成图片的背景，导出 Unity 可用的透明 PNG / WebP Sprite。
      </p>
      <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2.5 mb-8">
        💡 效果提示：背景色应与人物颜色差异明显（如白底、绿底），避免人物身上出现与背景相近的颜色，否则去背景时该部分也会被误删。
      </p>

      {/* 上传区 */}
      <div
        className="border-2 border-dashed rounded-xl p-8 text-center mb-6 cursor-pointer hover:border-primary transition-colors"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
      >
        {hasImage ? (
          <p className="text-sm text-muted-foreground">已加载图片，点击或拖拽可替换</p>
        ) : (
          <p className="text-muted-foreground">点击或拖拽图片到此处上传</p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* 隐藏 canvas 用于读取像素 */}
      <canvas ref={canvasRef} className="hidden" />

      {hasImage && (
        <>
          {/* 模式切换 */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={mode === "color" ? "default" : "outline"}
              onClick={() => setMode("color")}
            >
              颜色采样
            </Button>
            <Button
              variant={mode === "ai" ? "default" : "outline"}
              onClick={() => setMode("ai")}
            >
              AI 自动抠图
            </Button>
          </div>

          {/* 颜色采样模式 */}
          {mode === "color" && (
            <div className="mb-6 rounded-lg border p-4">
              <p className="text-sm text-muted-foreground mb-3">
                点击下方原图中的背景区域来采样颜色并去除背景。
              </p>
              <div className="flex items-center gap-4 mb-4">
                <label className="text-sm font-medium whitespace-nowrap">
                  容差：{tolerance}
                </label>
                <input
                  type="range"
                  min={0}
                  max={150}
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  className="flex-1"
                  aria-label="容差"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                容差越大，去除的颜色范围越广。调整后需重新点击图片。
              </p>
            </div>
          )}

          {/* AI 模式 */}
          {mode === "ai" && (
            <div className="mb-6 rounded-lg border p-4">
              <p className="text-sm text-muted-foreground mb-3">
                使用{" "}
                <span className="font-mono text-foreground">remove.bg</span>{" "}
                API 自动识别并去除背景。API Key 仅在本地使用，不会上传到任何服务器。
              </p>
              <div className="flex gap-3 items-center">
                <Input
                  type="password"
                  placeholder="输入 remove.bg API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 font-mono"
                  aria-label="remove.bg API Key"
                />
                <Button
                  onClick={handleAiRemove}
                  disabled={aiLoading || !apiKey.trim()}
                >
                  {aiLoading ? "处理中…" : "开始抠图"}
                </Button>
              </div>
              {aiError && (
                <p className="text-sm text-destructive mt-2">{aiError}</p>
              )}
            </div>
          )}

          {/* 对比预览 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-lg border overflow-hidden">
              <p className="text-xs text-muted-foreground px-3 py-2 border-b">原图</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={originalUrl}
                alt="原图"
                className={`w-full object-contain max-h-64 ${mode === "color" ? "cursor-crosshair" : ""}`}
                onClick={
                  mode === "color"
                    ? (e) => {
                        // map click on <img> to canvas coords
                        const img = e.currentTarget;
                        const canvas = canvasRef.current!;
                        const rect = img.getBoundingClientRect();
                        const scaleX = canvas.width / rect.width;
                        const scaleY = canvas.height / rect.height;
                        const x = Math.floor((e.clientX - rect.left) * scaleX);
                        const y = Math.floor((e.clientY - rect.top) * scaleY);
                        const ctx = canvas.getContext("2d")!;
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const result = removeByColor(imageData, x, y, tolerance);
                        setResultImageData(result);
                        const offscreen = document.createElement("canvas");
                        offscreen.width = canvas.width;
                        offscreen.height = canvas.height;
                        offscreen.getContext("2d")!.putImageData(result, 0, 0);
                        setResultUrl(offscreen.toDataURL("image/png"));
                      }
                    : undefined
                }
              />
            </div>
            <div className="rounded-lg border overflow-hidden">
              <p className="text-xs text-muted-foreground px-3 py-2 border-b">处理后</p>
              <div
                className="w-full max-h-64 flex items-center justify-center"
                style={{
                  backgroundImage:
                    "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%)",
                  backgroundSize: "16px 16px",
                  minHeight: "8rem",
                }}
              >
                {hasResult ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resultUrl!}
                    alt="处理后"
                    className="w-full object-contain max-h-64"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {mode === "color" ? "点击原图背景区域" : "点击开始抠图"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 导出 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              disabled={!hasResult}
              onClick={() => handleDownload("image/png")}
            >
              下载 PNG
            </Button>
            <Button
              variant="outline"
              disabled={!hasResult}
              onClick={() => handleDownload("image/webp")}
            >
              下载 WebP
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
