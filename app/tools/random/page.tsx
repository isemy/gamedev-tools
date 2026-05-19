"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  generate, STYLES, CATEGORIES, STYLE_LABELS, CATEGORY_LABELS,
  type Style, type Category,
} from "@/lib/random-data";

export default function RandomPage() {
  const [style, setStyle] = useState<Style>("ancient-cn");
  const [category, setCategory] = useState<Category>("npc");
  const [count, setCount] = useState(10);
  const [results, setResults] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const run = () => setResults(generate(style, category, count));

  const copyAll = () => {
    navigator.clipboard.writeText(results.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${CATEGORY_LABELS[category]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTxt = () => {
    const blob = new Blob([results.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${CATEGORY_LABELS[category]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">🎲 随机内容生成器</h1>
      <p className="text-muted-foreground mb-8">生成 NPC 名字、物品、地点、任务等游戏内容，支持多种风格。</p>

      {/* 风格 */}
      <div className="mb-5">
        <p className="text-sm font-medium mb-2">风格</p>
        <div className="flex flex-wrap gap-2">
          {STYLES.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={style === s ? "default" : "outline"}
              onClick={() => setStyle(s)}
            >
              {STYLE_LABELS[s]}
            </Button>
          ))}
        </div>
      </div>

      {/* 类型 */}
      <div className="mb-5">
        <p className="text-sm font-medium mb-2">内容类型</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? "default" : "outline"}
              onClick={() => setCategory(c)}
            >
              {CATEGORY_LABELS[c]}
            </Button>
          ))}
        </div>
      </div>

      {/* 数量 */}
      <div className="mb-6 flex items-center gap-3">
        <p className="text-sm font-medium">数量</p>
        {[5, 10, 20, 50].map((n) => (
          <Badge
            key={n}
            variant={count === n ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setCount(n)}
          >
            {n}
          </Badge>
        ))}
      </div>

      <Button onClick={run} className="mb-6">生成</Button>

      {/* 结果 */}
      {results.length > 0 && (
        <div>
          <div className="rounded-lg border divide-y mb-4 max-h-96 overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className="px-4 py-2 text-sm hover:bg-muted/50 flex justify-between items-center">
                <span>{r}</span>
                <button
                  className="text-xs text-muted-foreground hover:text-foreground ml-4 shrink-0"
                  onClick={() => navigator.clipboard.writeText(r)}
                >
                  复制
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={copyAll}>
              {copied ? "已复制!" : "复制全部"}
            </Button>
            <Button variant="outline" size="sm" onClick={downloadJson}>导出 JSON</Button>
            <Button variant="outline" size="sm" onClick={downloadTxt}>导出 TXT</Button>
          </div>
        </div>
      )}
    </div>
  );
}
