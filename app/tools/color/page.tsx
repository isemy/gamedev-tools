"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { generatePalettes, exportAsCss, exportAsJson, type ColorPalette } from "@/lib/color";

const PRESETS = [
  { label: "像素风", hex: "#e63946" },
  { label: "赛博朋克", hex: "#00f5ff" },
  { label: "奇幻", hex: "#7b2d8b" },
  { label: "极简", hex: "#2d3436" },
];

function ColorSwatch({ hex, label }: { hex: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      onClick={copy}
      className="flex flex-col items-center gap-1 group"
      title={`点击复制 ${hex}`}
    >
      <div
        className="w-14 h-14 rounded-lg border shadow-sm transition-transform group-hover:scale-105"
        style={{ backgroundColor: hex }}
      />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-mono">{copied ? "已复制!" : hex}</span>
    </button>
  );
}

function PaletteCard({ palette }: { palette: ColorPalette }) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-medium mb-4">{palette.name}</h3>
      <div className="flex flex-wrap gap-4">
        {palette.colors.map((c) => (
          <ColorSwatch key={c.label} hex={c.hex} label={c.label} />
        ))}
      </div>
    </div>
  );
}

export default function ColorPage() {
  const [hex, setHex] = useState("#6366f1");
  const [inputVal, setInputVal] = useState("#6366f1");
  const [palettes, setPalettes] = useState<ColorPalette[]>(() => generatePalettes("#6366f1"));

  const apply = useCallback((value: string) => {
    const clean = value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(clean)) {
      setHex(clean);
      setPalettes(generatePalettes(clean));
    }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
    apply(e.target.value);
  };

  const handleColorPicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
    setHex(e.target.value);
    setPalettes(generatePalettes(e.target.value));
  };

  const downloadCss = () => {
    const blob = new Blob([exportAsCss(palettes)], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "palette.css";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJson = () => {
    const blob = new Blob([exportAsJson(palettes)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "palette.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">🎨 调色板生成器</h1>
      <p className="text-muted-foreground mb-8">输入主色，自动生成游戏 UI 推荐配色方案。点击色块可复制 Hex 值。</p>

      {/* 输入区 */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="color"
          value={hex}
          onChange={handleColorPicker}
          className="w-12 h-10 rounded cursor-pointer border"
          aria-label="颜色选择器"
        />
        <Input
          value={inputVal}
          onChange={handleInput}
          placeholder="#6366f1"
          className="w-36 font-mono"
          aria-label="Hex 颜色值"
        />
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map((p) => (
            <Badge
              key={p.label}
              variant="outline"
              className="cursor-pointer hover:bg-accent"
              onClick={() => {
                setInputVal(p.hex);
                apply(p.hex);
              }}
            >
              <span
                className="inline-block w-3 h-3 rounded-full mr-1.5"
                style={{ backgroundColor: p.hex }}
              />
              {p.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* 配色方案 */}
      <div className="flex flex-col gap-4 mb-8">
        {palettes.map((p) => (
          <PaletteCard key={p.name} palette={p} />
        ))}
      </div>

      {/* 导出 */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={downloadCss}>导出 CSS 变量</Button>
        <Button variant="outline" onClick={downloadJson}>导出 JSON</Button>
      </div>
    </div>
  );
}
