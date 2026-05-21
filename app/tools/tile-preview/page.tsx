"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createGrid,
  drawGrid,
  exportCanvas,
  type TileEntry,
  type GridCell,
} from "@/lib/tile-preview";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TilePreviewPage() {
  const [tiles, setTiles] = useState<Map<string, TileEntry>>(new Map());
  const [tileList, setTileList] = useState<TileEntry[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [cols, setCols] = useState(8);
  const [rows, setRows] = useState(6);
  const [tileSize, setTileSize] = useState(64);
  const [showGrid, setShowGrid] = useState(true);
  const [grid, setGrid] = useState<GridCell[][]>(() => createGrid(8, 6));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isPainting = useRef(false);

  const redraw = useCallback(() => {
    if (canvasRef.current) {
      drawGrid(canvasRef.current, grid, tiles, tileSize, showGrid);
    }
  }, [grid, tiles, tileSize, showGrid]);

  useEffect(() => { redraw(); }, [redraw]);

  const loadTiles = (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    arr.forEach((file) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const entry: TileEntry = { id: url, name: file.name, img, url };
        setTiles((prev) => new Map(prev).set(url, entry));
        setTileList((prev) => [...prev, entry]);
        if (!selectedTileId) setSelectedTileId(url);
      };
      img.src = url;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) loadTiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    loadTiles(e.dataTransfer.files);
  };

  const applyGrid = () => {
    setGrid(createGrid(cols, rows));
  };

  const getCellFromEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const c = Math.floor(x / tileSize);
    const r = Math.floor(y / tileSize);
    return { r, c };
  };

  const paintCell = useCallback((r: number, c: number) => {
    if (r < 0 || r >= grid.length || c < 0 || c >= (grid[0]?.length ?? 0)) return;
    setGrid((prev) => {
      const next = prev.map((row) => row.map((cell) => ({ ...cell })));
      next[r][c].tileId = selectedTileId;
      return next;
    });
  }, [grid, selectedTileId]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isPainting.current = true;
    const { r, c } = getCellFromEvent(e);
    paintCell(r, c);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPainting.current) return;
    const { r, c } = getCellFromEvent(e);
    paintCell(r, c);
  };

  const handleMouseUp = () => { isPainting.current = false; };

  const clearGrid = () => setGrid(createGrid(cols, rows));

  const handleExport = async () => {
    if (!canvasRef.current) return;
    const blob = await exportCanvas(canvasRef.current);
    download(blob, "tilemap.png");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">🧩 Tile 拼接预览器</h1>
      <p className="text-muted-foreground mb-8">
        上传 Tile 素材，拖拽到网格上拼接，验证边缘是否无缝，导出拼接图。
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* 左侧：素材库 + 参数 */}
        <div className="flex flex-col gap-4">
          {/* 上传 */}
          <div
            className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-primary transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
          >
            <p className="text-xs text-muted-foreground">点击或拖拽 Tile 图片</p>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
          </div>

          {/* Tile 列表 */}
          {tileList.length > 0 && (
            <div className="rounded-lg border p-2">
              <p className="text-xs text-muted-foreground mb-2 px-1">素材库（点击选中）</p>
              <div className="flex flex-wrap gap-1.5">
                {tileList.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTileId(t.id)}
                    className={`border-2 rounded overflow-hidden transition-all ${selectedTileId === t.id ? "border-primary" : "border-transparent"}`}
                    title={t.name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.url} alt={t.name} className="w-12 h-12 object-cover" />
                  </button>
                ))}
                <button
                  onClick={() => setSelectedTileId(null)}
                  className={`border-2 rounded w-12 h-12 text-xs text-muted-foreground transition-all ${selectedTileId === null ? "border-primary bg-muted" : "border-transparent bg-muted/50"}`}
                  title="橡皮擦"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* 网格参数 */}
          <div className="rounded-lg border p-3 flex flex-col gap-2">
            <p className="text-xs font-medium">网格设置</p>
            <label className="flex items-center gap-2 text-xs">
              列 <Input type="number" min={1} max={32} value={cols} onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))} className="h-7 w-16" />
            </label>
            <label className="flex items-center gap-2 text-xs">
              行 <Input type="number" min={1} max={32} value={rows} onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))} className="h-7 w-16" />
            </label>
            <label className="flex items-center gap-2 text-xs">
              格子(px) <Input type="number" min={8} max={256} value={tileSize} onChange={(e) => setTileSize(Math.max(8, parseInt(e.target.value) || 64))} className="h-7 w-16" />
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
              显示网格线
            </label>
            <Button size="sm" onClick={applyGrid}>应用（清空画布）</Button>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={clearGrid}>清空画布</Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={tileList.length === 0}>导出 PNG</Button>
          </div>
        </div>

        {/* 右侧：画布 */}
        <div className="rounded-lg border overflow-auto bg-muted/30 p-2">
          {tileList.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              先上传 Tile 素材，再在画布上绘制
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="cursor-crosshair"
              style={{ imageRendering: "pixelated", maxWidth: "100%" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          )}
        </div>
      </div>
    </div>
  );
}
