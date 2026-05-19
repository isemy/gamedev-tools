"use client";

import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";

const PREVIEW_SIZES = [8, 12, 16, 24, 32, 48, 64];

const SAMPLE_TEXTS = [
  "勇者已击败魔王！",
  "获得道具：传说之剑 ×1",
  "HP 128 / 256   MP 64 / 64",
  "任务：寻找失落的神器",
  "GAME OVER",
  "Press START to continue",
  "Level Up! ATK +5  DEF +3",
  "0123456789 !@#$%^&*()",
];

interface FontInfo {
  name: string;
  family: string;
  size: number;
}

const UI_PREVIEWS = [
  {
    label: "对话框",
    render: (family: string, color: string, bg: string) => (
      <div className="rounded-lg border-2 p-4 max-w-sm" style={{ borderColor: color, backgroundColor: bg }}>
        <p className="text-xs mb-1 opacity-60" style={{ fontFamily: family, color }}>村长</p>
        <p className="text-sm leading-relaxed" style={{ fontFamily: family, color }}>
          勇者啊，魔王已经占领了北方的城堡。请你去拯救被俘虏的村民们！
        </p>
        <div className="flex justify-end mt-3 gap-2">
          <span className="text-xs px-3 py-1 rounded border" style={{ fontFamily: family, color, borderColor: color }}>接受</span>
          <span className="text-xs px-3 py-1 rounded border opacity-50" style={{ fontFamily: family, color, borderColor: color }}>拒绝</span>
        </div>
      </div>
    ),
  },
  {
    label: "HUD",
    render: (family: string, color: string, bg: string) => (
      <div className="rounded p-3 max-w-xs" style={{ backgroundColor: bg }}>
        <div className="flex justify-between mb-2">
          <span style={{ fontFamily: family, color, fontSize: 14 }}>勇者</span>
          <span style={{ fontFamily: family, color, fontSize: 14 }}>Lv.42</span>
        </div>
        <div className="mb-1">
          <div className="flex justify-between text-xs mb-0.5" style={{ fontFamily: family, color }}>
            <span>HP</span><span>128 / 256</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${color}33` }}>
            <div className="h-full rounded-full bg-green-500" style={{ width: "50%" }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-0.5" style={{ fontFamily: family, color }}>
            <span>MP</span><span>64 / 64</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${color}33` }}>
            <div className="h-full rounded-full bg-blue-500" style={{ width: "100%" }} />
          </div>
        </div>
      </div>
    ),
  },
  {
    label: "物品栏",
    render: (family: string, color: string, bg: string) => (
      <div className="rounded-lg border p-3 max-w-xs" style={{ borderColor: color, backgroundColor: bg }}>
        <p className="text-sm font-bold mb-2" style={{ fontFamily: family, color }}>背包</p>
        {[
          { name: "传说之剑", qty: 1, type: "武器" },
          { name: "生命药水", qty: 5, type: "道具" },
          { name: "魔法卷轴", qty: 2, type: "消耗" },
        ].map((item) => (
          <div key={item.name} className="flex justify-between items-center py-1 border-b last:border-0 text-xs" style={{ borderColor: `${color}33`, fontFamily: family, color }}>
            <span>{item.name}</span>
            <span className="opacity-60">{item.type}</span>
            <span>×{item.qty}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    label: "战斗日志",
    render: (family: string, color: string, bg: string) => (
      <div className="rounded p-3 max-w-xs font-mono text-xs space-y-1" style={{ backgroundColor: bg, fontFamily: family }}>
        {[
          { text: "勇者 对 魔王 造成 128 点伤害！", col: "#4ade80" },
          { text: "魔王 使用了 暗黑火焰！", col: "#f87171" },
          { text: "勇者 受到 64 点伤害。", col: "#fbbf24" },
          { text: "勇者 使用了 生命药水。", col: color },
          { text: "HP 恢复 50 点。", col: "#4ade80" },
        ].map((line, i) => (
          <p key={i} style={{ color: line.col }}>{line.text}</p>
        ))}
      </div>
    ),
  },
];

const MAX_FONT_SIZE_MB = 10;

export default function FontPage() {
  const [fontInfo, setFontInfo] = useState<FontInfo | null>(null);
  const [customText, setCustomText] = useState("勇者已击败魔王！The quick brown fox.");
  const [textColor, setTextColor] = useState("#e2e8f0");
  const [bgColor, setBgColor] = useState("#1e293b");
  const [activeSize, setActiveSize] = useState(24);
  const [activeUi, setActiveUi] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fontCountRef = useRef(0);
  const prevFaceRef = useRef<FontFace | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  const loadFont = useCallback(async (file: File) => {
    if (isLoading) return;
    setError("");

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["ttf", "otf", "woff", "woff2"].includes(ext ?? "")) {
      setError("仅支持 .ttf / .otf / .woff / .woff2 格式");
      return;
    }
    if (file.size > MAX_FONT_SIZE_MB * 1024 * 1024) {
      setError(`字体文件不能超过 ${MAX_FONT_SIZE_MB} MB`);
      return;
    }

    setIsLoading(true);
    const familyName = `preview-font-${++fontCountRef.current}`;
    const url = URL.createObjectURL(file);
    try {
      const face = new FontFace(familyName, `url(${url})`);
      await face.load();

      // Remove previous font to avoid accumulation
      if (prevFaceRef.current) document.fonts.delete(prevFaceRef.current);
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);

      document.fonts.add(face);
      prevFaceRef.current = face;
      prevUrlRef.current = url;
      setFontInfo({ name: file.name, family: familyName, size: Math.round(file.size / 1024) });
    } catch {
      URL.revokeObjectURL(url);
      setError("字体加载失败，请检查文件是否损坏");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleFile = (file: File) => loadFont(file);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const fontFamily = fontInfo?.family ?? "inherit";

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">🔤 像素字体预览器</h1>
      <p className="text-muted-foreground mb-8">上传字体文件，预览在游戏 UI 场景中的实际效果。</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧控制面板 */}
        <div className="flex flex-col gap-5">
          {/* 上传区 */}
          <div>
            <p className="text-sm font-medium mb-2">字体文件</p>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <p className="text-2xl mb-2">🔤</p>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "加载中…" : fontInfo ? fontInfo.name : "拖拽或点击上传字体"}
              </p>
              {fontInfo && !isLoading && (
                <p className="text-xs text-muted-foreground mt-1">{fontInfo.size} KB</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">支持 TTF / OTF / WOFF / WOFF2，最大 10 MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>

          {/* 预览文本 */}
          <div>
            <label className="text-sm font-medium block mb-2">预览文本</label>
            <Input
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="输入预览文字..."
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SAMPLE_TEXTS.map((t) => (
                <button
                  key={t}
                  onClick={() => setCustomText(t)}
                  className="text-xs px-2 py-1 rounded border hover:bg-muted transition-colors truncate max-w-full"
                >
                  {t.length > 12 ? t.slice(0, 12) + "…" : t}
                </button>
              ))}
            </div>
          </div>

          {/* 颜色 */}
          <div className="flex gap-4">
            <div>
              <label className="text-sm font-medium block mb-2">文字颜色</label>
              <div className="flex items-center gap-2">
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-border" />
                <span className="text-xs font-mono text-muted-foreground">{textColor}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">背景颜色</label>
              <div className="flex items-center gap-2">
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-border" />
                <span className="text-xs font-mono text-muted-foreground">{bgColor}</span>
              </div>
            </div>
          </div>

          {/* 快捷配色 */}
          <div>
            <p className="text-sm font-medium mb-2">快捷配色</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "暗黑", text: "#e2e8f0", bg: "#1e293b" },
                { label: "像素绿", text: "#00ff41", bg: "#0d0d0d" },
                { label: "复古橙", text: "#ff6b35", bg: "#1a0a00" },
                { label: "纸张", text: "#2d1b00", bg: "#f5e6c8" },
                { label: "赛博", text: "#00f5ff", bg: "#0a0a1a" },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => { setTextColor(preset.text); setBgColor(preset.bg); }}
                  className="text-xs px-2 py-1 rounded border hover:bg-muted transition-colors flex items-center gap-1.5"
                >
                  <span className="inline-block w-3 h-3 rounded-sm border border-border"
                    style={{ backgroundColor: preset.bg }} />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧预览区 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* 字号预览 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">字号预览</p>
              <div className="flex gap-1">
                {PREVIEW_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setActiveSize(s)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      activeSize === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div
              className="rounded-lg border p-6 min-h-24 flex items-center overflow-hidden"
              style={{ backgroundColor: bgColor }}
            >
              <p
                style={{
                  fontFamily: fontFamily,
                  fontSize: activeSize,
                  color: textColor,
                  lineHeight: 1.4,
                  wordBreak: "break-all",
                }}
              >
                {customText || "输入预览文字"}
              </p>
            </div>
            {/* 所有字号一览 */}
            <div className="rounded-lg border mt-3 overflow-hidden" style={{ backgroundColor: bgColor }}>
              {PREVIEW_SIZES.map((s) => (
                <div key={s} className="flex items-baseline gap-4 px-4 py-2 border-b last:border-0"
                  style={{ borderColor: `${textColor}22` }}>
                  <span className="text-xs w-8 shrink-0" style={{ color: `${textColor}66`, fontFamily: "monospace" }}>{s}px</span>
                  <span style={{ fontFamily: fontFamily, fontSize: s, color: textColor, lineHeight: 1.3 }}>
                    {customText || "预览文字"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* UI 场景预览 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm font-medium">UI 场景预览</p>
              <div className="flex gap-1">
                {UI_PREVIEWS.map((ui, i) => (
                  <button
                    key={ui.label}
                    onClick={() => setActiveUi(i)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      activeUi === i ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                    }`}
                  >
                    {ui.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border p-6 flex justify-center" style={{ backgroundColor: bgColor }}>
              {UI_PREVIEWS[activeUi].render(fontFamily, textColor, bgColor)}
            </div>
          </div>

          {!fontInfo && (
            <p className="text-sm text-muted-foreground text-center py-4">
              上传字体文件后，预览将使用该字体渲染。当前使用系统默认字体。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
