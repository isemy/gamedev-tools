"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface GddForm {
  title: string;
  genre: string;
  platform: string;
  audience: string;
  coreMechanic: string;
  coreLoop: string;
  artStyle: string;
  competitors: string;
  milestone1: string;
  milestone2: string;
  milestone3: string;
}

const EMPTY: GddForm = {
  title: "", genre: "", platform: "", audience: "",
  coreMechanic: "", coreLoop: "", artStyle: "",
  competitors: "", milestone1: "", milestone2: "", milestone3: "",
};

const GENRE_PRESETS = ["平台跳跃", "RPG", "Roguelike", "策略", "解谜", "射击", "模拟经营", "动作冒险"];
const PLATFORM_PRESETS = ["PC (Steam)", "移动端 (iOS/Android)", "Web", "主机 (Switch)", "全平台"];

function buildMarkdown(f: GddForm): string {
  const today = new Date().toISOString().slice(0, 10);
  return `# ${f.title || "未命名游戏"} — 游戏设计文档

> 版本：v0.1 · 日期：${today}

---

## 一、游戏概述

| 字段 | 内容 |
|------|------|
| 游戏名称 | ${f.title || "—"} |
| 游戏类型 | ${f.genre || "—"} |
| 目标平台 | ${f.platform || "—"} |
| 目标受众 | ${f.audience || "—"} |

---

## 二、核心玩法

${f.coreMechanic || "（待填写）"}

---

## 三、核心游戏循环

${f.coreLoop || "（待填写）"}

\`\`\`
[示例循环图]
探索 → 战斗 → 获得奖励 → 成长 → 探索
\`\`\`

---

## 四、美术风格参考

${f.artStyle || "（待填写）"}

---

## 五、竞品分析

${f.competitors || "（待填写）"}

---

## 六、里程碑计划

| 阶段 | 目标 |
|------|------|
| 里程碑 1 | ${f.milestone1 || "—"} |
| 里程碑 2 | ${f.milestone2 || "—"} |
| 里程碑 3 | ${f.milestone3 || "—"} |

---

## 七、待定事项

- [ ] 确定核心数值框架
- [ ] 完成美术风格原画
- [ ] 制作可玩原型
- [ ] 用户测试与反馈

---

*本文档由 GameDev Tools GDD 生成器生成*
`;
}

export default function GddPage() {
  const [form, setForm] = useState<GddForm>(EMPTY);
  const [preview, setPreview] = useState(false);
  const [md, setMd] = useState("");

  const set = (key: keyof GddForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const generate = () => {
    setMd(buildMarkdown(form));
    setPreview(true);
  };

  const download = () => {
    const content = md || buildMarkdown(form);
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.title || "gdd"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = () => navigator.clipboard.writeText(md || buildMarkdown(form));

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">📄 GDD 文档生成器</h1>
      <p className="text-muted-foreground mb-8">填写基本信息，自动生成结构化游戏设计文档，支持导出 Markdown。</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 表单 */}
        <div className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-medium block mb-1">游戏名称</label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="我的游戏" />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">游戏类型</label>
            <Input value={form.genre} onChange={(e) => set("genre", e.target.value)} placeholder="RPG、平台跳跃..." className="mb-2" />
            <div className="flex flex-wrap gap-1.5">
              {GENRE_PRESETS.map((g) => (
                <button key={g} onClick={() => set("genre", g)}
                  className="text-xs px-2 py-1 rounded border hover:bg-muted transition-colors">
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">目标平台</label>
            <Input value={form.platform} onChange={(e) => set("platform", e.target.value)} placeholder="PC、移动端..." className="mb-2" />
            <div className="flex flex-wrap gap-1.5">
              {PLATFORM_PRESETS.map((p) => (
                <button key={p} onClick={() => set("platform", p)}
                  className="text-xs px-2 py-1 rounded border hover:bg-muted transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">目标受众</label>
            <Input value={form.audience} onChange={(e) => set("audience", e.target.value)} placeholder="18-35 岁休闲玩家..." />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">核心玩法</label>
            <textarea value={form.coreMechanic} onChange={(e) => set("coreMechanic", e.target.value)}
              placeholder="描述游戏最核心的互动机制..."
              className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px] resize-y bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">核心游戏循环</label>
            <textarea value={form.coreLoop} onChange={(e) => set("coreLoop", e.target.value)}
              placeholder="探索 → 战斗 → 获得奖励 → 成长..."
              className="w-full rounded-md border px-3 py-2 text-sm min-h-[60px] resize-y bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">美术风格参考</label>
            <Input value={form.artStyle} onChange={(e) => set("artStyle", e.target.value)} placeholder="像素风，参考《Celeste》..." />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">竞品参考</label>
            <Input value={form.competitors} onChange={(e) => set("competitors", e.target.value)} placeholder="《Hollow Knight》、《Dead Cells》..." />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">里程碑计划</label>
            <div className="flex flex-col gap-2">
              <Input value={form.milestone1} onChange={(e) => set("milestone1", e.target.value)} placeholder="里程碑 1：完成核心原型" />
              <Input value={form.milestone2} onChange={(e) => set("milestone2", e.target.value)} placeholder="里程碑 2：Alpha 版本" />
              <Input value={form.milestone3} onChange={(e) => set("milestone3", e.target.value)} placeholder="里程碑 3：正式发布" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={generate}>生成文档</Button>
            <Button variant="outline" onClick={download}>导出 .md</Button>
            {md && <Button variant="outline" onClick={copy}>复制</Button>}
          </div>
        </div>

        {/* 预览 */}
        <div>
          <p className="text-sm font-medium mb-2">预览</p>
          <pre className="rounded-lg border p-4 text-xs font-mono whitespace-pre-wrap bg-muted/30 min-h-[400px] max-h-[700px] overflow-y-auto leading-relaxed">
            {preview ? md : "点击「生成文档」查看预览..."}
          </pre>
        </div>
      </div>
    </div>
  );
}
