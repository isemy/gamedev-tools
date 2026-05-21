"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  computeFrames,
  exportFramesAsZip,
  exportAsSpriteSheet,
  type SliceConfig,
  type FrameInfo,
} from "@/lib/sprite-sheet";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SpriteSheetPage() {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [cfg, setCfg] = useState<SliceConfig>({
    cols: 4, rows: 2, offsetX: 0, offsetY: 0, spacingX: 0, spacingY: 0,
  });
  const [frames, setFrames] = useState<FrameInfo[]>([]);
  const [selectedFrames, setSelectedFrames] = useState<Set<number>>(new Set());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = canvasRef.current!;
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext("2d")!.drawImage(img, 0, 0);
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      setImgUrl(url);
      setSelectedFrames(new Set());
    };
    img.src = url;
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) loadFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f?.type.startsWith("image/")) loadFile(f);
  };

  const slice = useCallback(() => {
    const f = computeFrames(imgSize.w, imgSize.h, cfg);
    setFrames(f);
    setSelectedFrames(new Set(f.map((fr) => fr.index)));
  }, [imgSize, cfg]);

  const toggleFrame = (idx: number) => {
    setSelectedFrames((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const activeFrames = frames.filter((f) => selectedFrames.has(f.index));

  const handleExportZip = async () => {
    const blob = await exportFramesAsZip(canvasRef.current!, activeFrames);
    download(blob, "frames.zip");
  };

  const handleExportSheet = async () => {
    const blob = await exportAsSpriteSheet(canvasRef.current!, activeFrames, cfg.cols);
    download(blob, "spritesheet.png");
  };

  const num = (key: keyof SliceConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(key === "cols" || key === "rows" ? 1 : 0, parseInt(e.target.value) || 0);
    setCfg((c) => ({ ...c, [key]: v }));
  };

  const frameW = imgSize.w > 0
    ? Math.floor((imgSize.w - cfg.offsetX - cfg.spacingX * (cfg.cols - 1)) / cfg.cols)
    : 0;
  const frameH = imgSize.h > 0
    ? Math.floor((imgSize.h - cfg.offsetY - cfg.spacingY * (cfg.rows - 1)) / cfg.rows)
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">🗂️ Sprite Sheet 分割</h1>
      <p className="text-muted-foreground mb-8">
        上传 Sprite Sheet 大图，按行列切割成单帧，导出 ZIP 或重新排列的新 Sheet。
      </p>

      {/* 上传 */}
      <div
        className="border-2 border-dashed rounded-xl p-8 text-center mb-6 cursor-pointer hover:border-primary transition-colors"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
      >
        <p className="text-muted-foreground">
          {imgUrl ? "已加载图片，点击或拖拽可替换" : "点击或拖拽 Sprite Sheet 图片到此处"}
        </p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {imgUrl && (
        <>
          {/* 参数 */}
          <div className="rounded-lg border p-4 mb-6">
            <p className="text-sm font-medium mb-3">切割参数</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(["cols", "rows", "offsetX", "offsetY", "spacingX", "spacingY"] as (keyof SliceConfig)[]).map((k) => (
                <label key={k} className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    {{ cols: "列数", rows: "行数", offsetX: "左偏移(px)", offsetY: "上偏移(px)", spacingX: "水平间距(px)", spacingY: "垂直间距(px)" }[k]}
                  </span>
                  <Input type="number" min={k === "cols" || k === "rows" ? 1 : 0} value={cfg[k]} onChange={num(k)} className="h-8" />
                </label>
              ))}
            </div>
            {imgSize.w > 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                图片：{imgSize.w}×{imgSize.h}px　每帧：{frameW}×{frameH}px　共 {cfg.cols * cfg.rows} 帧
              </p>
            )}
            <Button className="mt-3" onClick={slice}>切割预览</Button>
          </div>

          {/* 帧预览 */}
          {frames.length > 0 && (
            <div className="rounded-lg border p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">帧预览（点击取消选中）</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedFrames(new Set(frames.map((f) => f.index)))}>全选</Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedFrames(new Set())}>全不选</Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {frames.map((f) => {
                  const selected = selectedFrames.has(f.index);
                  return (
                    <button
                      key={f.index}
                      onClick={() => toggleFrame(f.index)}
                      className={`relative border-2 rounded overflow-hidden transition-all ${selected ? "border-primary" : "border-transparent opacity-40"}`}
                      title={`帧 ${f.index}（${f.w}×${f.h}）`}
                    >
                      <FrameCanvas source={canvasRef.current!} frame={f} maxSize={64} />
                      <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] bg-black/50 text-white leading-4">
                        {f.index}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 导出 */}
          {frames.length > 0 && (
            <div className="flex gap-3">
              <Button variant="outline" disabled={activeFrames.length === 0} onClick={handleExportZip}>
                导出单帧 ZIP（{activeFrames.length} 帧）
              </Button>
              <Button variant="outline" disabled={activeFrames.length === 0} onClick={handleExportSheet}>
                导出新 Sprite Sheet
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FrameCanvas({ source, frame, maxSize }: { source: HTMLCanvasElement; frame: FrameInfo; maxSize: number }) {
  const scale = Math.min(maxSize / frame.w, maxSize / frame.h, 1);
  const dw = Math.round(frame.w * scale);
  const dh = Math.round(frame.h * scale);

  const draw = (canvas: HTMLCanvasElement | null) => {
    if (!canvas || !source) return;
    canvas.width = dw;
    canvas.height = dh;
    canvas.getContext("2d")!.drawImage(source, frame.x, frame.y, frame.w, frame.h, 0, 0, dw, dh);
  };

  return <canvas ref={draw} width={dw} height={dh} />;
}
