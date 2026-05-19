"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ── Types ────────────────────────────────────────────────────────────────────

interface I18nRow {
  id: string;
  key: string;
  values: Record<string, string>;
  comment: string;
}

type ExportFormat = "json-flat" | "json-nested" | "csv";

// ── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_LANGS = ["zh-CN", "en-US", "ja-JP"];

const DEFAULT_ROWS: I18nRow[] = [
  { id: "1", key: "ui.start_game", values: { "zh-CN": "开始游戏", "en-US": "Start Game", "ja-JP": "ゲームスタート" }, comment: "" },
  { id: "2", key: "ui.settings", values: { "zh-CN": "设置", "en-US": "Settings", "ja-JP": "設定" }, comment: "" },
  { id: "3", key: "ui.quit", values: { "zh-CN": "退出", "en-US": "Quit", "ja-JP": "終了" }, comment: "" },
  { id: "4", key: "hud.hp", values: { "zh-CN": "生命值", "en-US": "HP", "ja-JP": "HP" }, comment: "血量标签" },
  { id: "5", key: "hud.mp", values: { "zh-CN": "魔法值", "en-US": "MP", "ja-JP": "MP" }, comment: "" },
  { id: "6", key: "dialog.npc_greeting", values: { "zh-CN": "勇者，欢迎来到这个村庄！", "en-US": "Welcome to our village, hero!", "ja-JP": "勇者よ、この村へようこそ！" }, comment: "NPC 开场白" },
  { id: "7", key: "item.sword_name", values: { "zh-CN": "传说之剑", "en-US": "Legendary Sword", "ja-JP": "伝説の剣" }, comment: "" },
  { id: "8", key: "item.potion_name", values: { "zh-CN": "生命药水", "en-US": "Health Potion", "ja-JP": "回復ポーション" }, comment: "" },
];

const INITIAL_NEXT_ID = 9;

// ── Export helpers ────────────────────────────────────────────────────────────

function buildFlatJson(rows: I18nRow[], lang: string): Record<string, string> {
  const out: Record<string, string> = {};
  rows.forEach((r) => { if (r.key) out[r.key] = r.values[lang] ?? ""; });
  return out;
}

function buildNestedJson(rows: I18nRow[], lang: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  rows.forEach((r) => {
    if (!r.key) return;
    const parts = r.key.split(".");
    let cur = out;
    parts.forEach((p, i) => {
      if (i === parts.length - 1) {
        cur[p] = r.values[lang] ?? "";
      } else {
        if (typeof cur[p] !== "object" || cur[p] === null) cur[p] = {};
        cur = cur[p] as Record<string, unknown>;
      }
    });
  });
  return out;
}

function buildCsv(rows: I18nRow[], langs: string[]): string {
  const header = ["key", ...langs, "comment"].join(",");
  const body = rows.map((r) => {
    const cells = [r.key, ...langs.map((l) => `"${(r.values[l] ?? "").replace(/"/g, '""')}"`), `"${r.comment.replace(/"/g, '""')}"`];
    return cells.join(",");
  });
  return [header, ...body].join("\n");
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function I18nPage() {
  const [langs, setLangs] = useState<string[]>(DEFAULT_LANGS);
  const [rows, setRows] = useState<I18nRow[]>(DEFAULT_ROWS);
  const [newLang, setNewLang] = useState("");
  const [search, setSearch] = useState("");
  const [exportLang, setExportLang] = useState("zh-CN");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json-flat");
  const [missingOnly, setMissingOnly] = useState(false);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nextIdRef = useRef(INITIAL_NEXT_ID);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, {
      id: String(nextIdRef.current++), key: "", values: {}, comment: "",
    }]);
  }, []);

  const deleteRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRow = useCallback((id: string, field: "key" | "comment", val: string) => {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: val } : r));
  }, []);

  const updateValue = useCallback((id: string, lang: string, val: string) => {
    setRows((prev) => prev.map((r) =>
      r.id === id ? { ...r, values: { ...r.values, [lang]: val } } : r
    ));
  }, []);

  const addLang = useCallback(() => {
    const l = newLang.trim();
    if (!l || langs.includes(l)) return;
    setLangs((prev) => [...prev, l]);
    setNewLang("");
  }, [newLang, langs]);

  const removeLang = useCallback((l: string) => {
    if (langs.length <= 1) return;
    setLangs((prev) => prev.filter((x) => x !== l));
    setRows((prev) => prev.map((r) => {
      const v = { ...r.values };
      delete v[l];
      return { ...r, values: v };
    }));
  }, [langs]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string) as Record<string, string>;
        const lang = file.name.replace(/\.json$/, "");
        if (!langs.includes(lang)) setLangs((prev) => [...prev, lang]);
        setRows((prev) => {
          const next = [...prev];
          Object.entries(json).forEach(([key, val]) => {
            const existing = next.find((r) => r.key === key);
            if (existing) {
              existing.values = { ...existing.values, [lang]: val };
            } else {
              next.push({ id: String(nextIdRef.current++), key, values: { [lang]: val }, comment: "" });
            }
          });
          return next;
        });
        setImportError("");
      } catch {
        setImportError("导入失败：文件格式不正确，请确认是有效的 JSON 文件");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [langs]);

  const doExport = useCallback(() => {
    if (exportFormat === "csv") {
      download(buildCsv(rows, langs), "i18n.csv", "text/csv");
    } else {
      const data = exportFormat === "json-nested"
        ? buildNestedJson(rows, exportLang)
        : buildFlatJson(rows, exportLang);
      download(JSON.stringify(data, null, 2), `${exportLang}.json`, "application/json");
    }
  }, [rows, langs, exportLang, exportFormat]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (search && !r.key.includes(search) && !Object.values(r.values).some((v) => v.includes(search))) return false;
    if (missingOnly && langs.every((l) => r.values[l])) return false;
    return true;
  }), [rows, search, missingOnly, langs]);

  const missingCount = useMemo(
    () => rows.filter((r) => langs.some((l) => !r.values[l])).length,
    [rows, langs]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">🌐 本地化管理工具</h1>
      <p className="text-muted-foreground mb-6">管理游戏多语言文本，支持导入 JSON，导出 i18n JSON / CSV。</p>

      {/* 工具栏 */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        {/* 搜索 */}
        <div className="flex-1 min-w-48">
          <Input placeholder="搜索 key 或文本…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* 缺失过滤 */}
        <button
          onClick={() => setMissingOnly((v) => !v)}
          className={`text-sm px-3 py-2 rounded border transition-colors ${missingOnly ? "bg-destructive/10 border-destructive text-destructive" : "border-border hover:bg-muted"}`}
        >
          仅显示缺失 {missingCount > 0 && <span className="ml-1 font-bold">{missingCount}</span>}
        </button>

        {/* 导入 */}
        <Button variant="outline" size="sm" onClick={() => { setImportError(""); fileInputRef.current?.click(); }}>
          导入 JSON
        </Button>
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        {importError && <p className="text-xs text-destructive w-full mt-1">{importError}</p>}

        {/* 新增行 */}
        <Button size="sm" onClick={addRow}>+ 新增条目</Button>
      </div>

      {/* 语言管理 */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <span className="text-sm text-muted-foreground">语言：</span>
        {langs.map((l) => (
          <span key={l} className="flex items-center gap-1 text-xs px-2 py-1 rounded border bg-muted">
            {l}
            {langs.length > 1 && (
              <button onClick={() => removeLang(l)} className="text-muted-foreground hover:text-destructive ml-1">×</button>
            )}
          </span>
        ))}
        <div className="flex gap-1">
          <Input
            value={newLang}
            onChange={(e) => setNewLang(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLang()}
            placeholder="添加语言 (如 ko-KR)"
            className="h-7 text-xs w-36"
          />
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addLang}>添加</Button>
        </div>
      </div>

      {/* 表格 */}
      <div className="rounded-lg border overflow-x-auto mb-6">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium w-48">Key</th>
              {langs.map((l) => (
                <th key={l} className="px-3 py-2 text-left font-medium min-w-36">{l}</th>
              ))}
              <th className="px-3 py-2 text-left font-medium w-32">备注</th>
              <th className="px-3 py-2 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && (
              <tr><td colSpan={langs.length + 3} className="px-3 py-6 text-center text-muted-foreground">无匹配条目</td></tr>
            )}
            {filtered.map((row) => {
              const hasMissing = langs.some((l) => !row.values[l]);
              return (
                <tr key={row.id} className={`hover:bg-muted/30 ${hasMissing ? "bg-destructive/5" : ""}`}>
                  <td className="px-2 py-1">
                    <input
                      value={row.key}
                      onChange={(e) => updateRow(row.id, "key", e.target.value)}
                      className="w-full bg-transparent font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring rounded px-1 py-0.5"
                      placeholder="ui.key_name"
                    />
                  </td>
                  {langs.map((l) => (
                    <td key={l} className="px-2 py-1">
                      <input
                        value={row.values[l] ?? ""}
                        onChange={(e) => updateValue(row.id, l, e.target.value)}
                        className={`w-full bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-ring rounded px-1 py-0.5 ${!row.values[l] ? "placeholder:text-destructive/50" : ""}`}
                        placeholder="(缺失)"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1">
                    <input
                      value={row.comment}
                      onChange={(e) => updateRow(row.id, "comment", e.target.value)}
                      className="w-full bg-transparent text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring rounded px-1 py-0.5"
                      placeholder="备注"
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <button onClick={() => deleteRow(row.id)} className="text-muted-foreground hover:text-destructive text-xs">×</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 统计 */}
      <div className="flex gap-6 text-sm text-muted-foreground mb-6">
        <span>共 {rows.length} 条</span>
        <span>缺失翻译：<span className={missingCount > 0 ? "text-destructive font-medium" : ""}>{missingCount} 条</span></span>
        <span>完成率：{rows.length > 0 ? Math.round(((rows.length - missingCount) / rows.length) * 100) : 100}%</span>
      </div>

      {/* 导出 */}
      <div className="rounded-lg border p-4 flex flex-wrap gap-4 items-end">
        <div>
          <p className="text-sm font-medium mb-2">导出格式</p>
          <div className="flex gap-2">
            {([
              ["json-flat", "JSON 扁平"],
              ["json-nested", "JSON 嵌套"],
              ["csv", "CSV（全语言）"],
            ] as [ExportFormat, string][]).map(([fmt, label]) => (
              <button key={fmt} onClick={() => setExportFormat(fmt)}
                className={`text-xs px-3 py-1.5 rounded border transition-colors ${exportFormat === fmt ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {exportFormat !== "csv" && (
          <div>
            <p className="text-sm font-medium mb-2">导出语言</p>
            <div className="flex gap-2 flex-wrap">
              {langs.map((l) => (
                <button key={l} onClick={() => setExportLang(l)}
                  className={`text-xs px-3 py-1.5 rounded border transition-colors ${exportLang === l ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}
        <Button onClick={doExport}>
          导出 {exportFormat === "csv" ? "CSV" : `${exportLang}.json`}
        </Button>
      </div>
    </div>
  );
}
