"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resizeImage, packAsZip, getOutputName, type ExportFormat } from "@/lib/image-batch";

interface FileItem {
  file: File;
  previewUrl: string;
  status: "pending" | "processing" | "done" | "error";
  resultBlob?: Blob;
  outputName?: string;
}

const SIZE_PRESETS = [
  { label: "64×64", w: 64, h: 64 },
  { label: "128×128", w: 128, h: 128 },
  { label: "256×256", w: 256, h: 256 },
  { label: "512×512", w: 512, h: 512 },
];

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImageBatchPage() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [targetW, setTargetW] = useState(128);
  const [targetH, setTargetH] = useState(128);
  const [format, setFormat] = useState<ExportFormat>("image/png");
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setItems((prev) => [
      ...prev,
      ...arr.map((f) => ({
        file: f,
        previewUrl: URL.createObjectURL(f),
        status: "pending" as const,
      })),
    ]);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const applyPreset = (w: number, h: number) => {
    setTargetW(w);
    setTargetH(h);
  };

  const processAll = async () => {
    setProcessing(true);
    const updated = [...items];
    for (let i = 0; i < updated.length; i++) {
      updated[i] = { ...updated[i], status: "processing" };
      setItems([...updated]);
      try {
        const blob = await resizeImage(updated[i].file, targetW, targetH, format);
        const outputName = getOutputName(updated[i].file.name, format);
        updated[i] = { ...updated[i], status: "done", resultBlob: blob, outputName };
      } catch {
        updated[i] = { ...updated[i], status: "error" };
      }
      setItems([...updated]);
    }
    setProcessing(false);
  };

  const downloadAll = async () => {
    const done = items.filter((it) => it.status === "done" && it.resultBlob);
    if (done.length === 1) {
      download(done[0].resultBlob!, done[0].outputName!);
      return;
    }
    const blob = await packAsZip(done.map((it) => ({ name: it.outputName!, blob: it.resultBlob! })));
    download(blob, "images.zip");
  };

  const doneCount = items.filter((it) => it.status === "done").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">🖼️ 图片批量处理</h1>
      <p className="text-muted-foreground mb-8">
        批量缩放 AI 生成素材到统一尺寸，转换为 PNG 或 WebP，打包 ZIP 下载。
      </p>

      {/* 上传区 */}
      <div
        className="border-2 border-dashed rounded-xl p-8 text-center mb-6 cursor-pointer hover:border-primary transition-colors"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
      >
        <p className="text-muted-foreground">点击或拖拽图片到此处（支持多选）</p>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
      </div>

      {items.length > 0 && (
        <>
          {/* 参数 */}
          <div className="rounded-lg border p-4 mb-6">
            <p className="text-sm font-medium mb-3">输出设置</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {SIZE_PRESETS.map((p) => (
                <Button
                  key={p.label}
                  variant={targetW === p.w && targetH === p.h ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyPreset(p.w, p.h)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3 mb-3">
              <label className="flex items-center gap-2 text-sm">
                宽
                <Input type="number" min={1} value={targetW} onChange={(e) => setTargetW(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 h-8" />
              </label>
              <span className="text-muted-foreground">×</span>
              <label className="flex items-center gap-2 text-sm">
                高
                <Input type="number" min={1} value={targetH} onChange={(e) => setTargetH(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 h-8" />
              </label>
            </div>
            <div className="flex gap-2">
              {(["image/png", "image/webp"] as ExportFormat[]).map((f) => (
                <Button
                  key={f}
                  variant={format === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormat(f)}
                >
                  {f === "image/png" ? "PNG" : "WebP"}
                </Button>
              ))}
            </div>
          </div>

          {/* 文件列表 */}
          <div className="rounded-lg border divide-y mb-6">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.previewUrl} alt="" className="w-10 h-10 object-cover rounded border" />
                <span className="flex-1 text-sm truncate">{item.file.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  item.status === "done" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                  item.status === "error" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                  item.status === "processing" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {{ pending: "待处理", processing: "处理中…", done: "完成", error: "失败" }[item.status]}
                </span>
                <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive text-lg leading-none">×</button>
              </div>
            ))}
          </div>

          {/* 操作 */}
          <div className="flex gap-3">
            <Button onClick={processAll} disabled={processing}>
              {processing ? "处理中…" : `开始处理（${items.length} 张）`}
            </Button>
            <Button variant="outline" disabled={doneCount === 0} onClick={downloadAll}>
              下载结果（{doneCount} 张）
            </Button>
            <Button variant="ghost" onClick={() => setItems([])}>清空</Button>
          </div>
        </>
      )}
    </div>
  );
}
