"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { evaluate } from "mathjs";
import dynamic from "next/dynamic";

const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const Legend = dynamic(() => import("recharts").then((m) => m.Legend), { ssr: false });

// ── Easing ──────────────────────────────────────────────────────────────────

type EasingFn = (t: number) => number;

const EASINGS: Record<string, EasingFn> = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInElastic: (t) => t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * (2 * Math.PI) / 3),
  easeOutElastic: (t) => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1,
  easeOutBounce: (t) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};

const EASING_SNIPPETS: Record<string, string> = {
  linear: "t",
  easeInQuad: "t * t",
  easeOutQuad: "t * (2 - t)",
  easeInOutQuad: "t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t",
  easeInCubic: "t * t * t",
  easeOutCubic: "(--t) * t * t + 1",
  easeInOutCubic: "t < 0.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1",
  easeInElastic: "see MDN easing functions",
  easeOutElastic: "see MDN easing functions",
  easeOutBounce: "see MDN easing functions",
};

function EasingSection() {
  const [selected, setSelected] = useState<string[]>(["linear", "easeOutQuad", "easeOutBounce"]);
  const [copied, setCopied] = useState("");

  const chartData = useMemo(() => {
    const points = 60;
    return Array.from({ length: points + 1 }, (_, i) => {
      const t = i / points;
      const row: Record<string, number> = { t: Math.round(t * 100) / 100 };
      selected.forEach((name) => { row[name] = Math.round(EASINGS[name](t) * 1000) / 1000; });
      return row;
    });
  }, [selected]);

  const toggle = (name: string) =>
    setSelected((s) => s.includes(name) ? s.filter((x) => x !== name) : [...s, name]);

  const copy = (name: string) => {
    navigator.clipboard.writeText(EASING_SNIPPETS[name]);
    setCopied(name);
    setTimeout(() => setCopied(""), 1200);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">缓动函数可视化</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.keys(EASINGS).map((name) => (
          <button
            key={name}
            onClick={() => toggle(name)}
            className={`text-xs px-2 py-1 rounded border transition-colors ${
              selected.includes(name) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
            }`}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="rounded-lg border p-4 mb-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="t" label={{ value: "t", position: "insideRight", offset: -5 }} />
            <YAxis domain={[-0.5, 1.5]} />
            <Tooltip />
            <Legend />
            {selected.map((name, i) => (
              <Line key={name} type="monotone" dataKey={name} dot={false}
                stroke={`hsl(${i * 60}, 70%, 50%)`} strokeWidth={2} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-2">
        {selected.map((name) => (
          <button key={name} onClick={() => copy(name)}
            className="text-xs px-3 py-1.5 rounded border hover:bg-muted font-mono">
            {copied === name ? "已复制!" : `复制 ${name}`}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 伤害公式 ─────────────────────────────────────────────────────────────────

function DamageSection() {
  const [formula, setFormula] = useState("atk * 2 - def * 0.5");
  const [atkMin, setAtkMin] = useState(10);
  const [atkMax, setAtkMax] = useState(100);
  const [def, setDef] = useState(20);
  const [error, setError] = useState("");

  const rows = useMemo(() => {
    try {
      setError("");
      const step = Math.max(1, Math.floor((atkMax - atkMin) / 10));
      return Array.from({ length: 11 }, (_, i) => {
        const atk = atkMin + i * step;
        const dmg = evaluate(formula, { atk, def }) as number;
        return { atk, dmg: Math.round(dmg * 10) / 10 };
      });
    } catch {
      setError("公式错误，请检查语法（可用变量：atk, def）");
      return [];
    }
  }, [formula, atkMin, atkMax, def]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">伤害公式计算器</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm text-muted-foreground block mb-1">公式（变量：atk, def）</label>
          <Input value={formula} onChange={(e) => setFormula(e.target.value)} className="font-mono" />
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm text-muted-foreground block mb-1">ATK 最小值</label>
            <Input type="number" value={atkMin} onChange={(e) => setAtkMin(Number(e.target.value))} />
          </div>
          <div className="flex-1">
            <label className="text-sm text-muted-foreground block mb-1">ATK 最大值</label>
            <Input type="number" value={atkMax} onChange={(e) => setAtkMax(Number(e.target.value))} />
          </div>
          <div className="flex-1">
            <label className="text-sm text-muted-foreground block mb-1">DEF 固定值</label>
            <Input type="number" value={def} onChange={(e) => setDef(Number(e.target.value))} />
          </div>
        </div>
      </div>
      {rows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left">ATK</th>
                  <th className="px-4 py-2 text-left">伤害</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.atk} className="hover:bg-muted/50">
                    <td className="px-4 py-1.5 font-mono">{r.atk}</td>
                    <td className="px-4 py-1.5 font-mono">{r.dmg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-lg border p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="atk" label={{ value: "ATK", position: "insideRight", offset: -5 }} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="dmg" name="伤害" dot={false} stroke="hsl(220,70%,50%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 概率模拟 ─────────────────────────────────────────────────────────────────

function ProbSection() {
  const [rate, setRate] = useState(5);
  const [trials, setTrials] = useState(100);
  const [result, setResult] = useState<{ hits: number; miss: number } | null>(null);

  const simulate = () => {
    let hits = 0;
    for (let i = 0; i < trials; i++) {
      if (Math.random() * 100 < rate) hits++;
    }
    setResult({ hits, miss: trials - hits });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">掉落率模拟器</h2>
      <div className="flex flex-wrap gap-4 items-end mb-4">
        <div>
          <label className="text-sm text-muted-foreground block mb-1">掉落率 (%)</label>
          <Input type="number" value={rate} min={0.01} max={100} step={0.01}
            onChange={(e) => setRate(Number(e.target.value))} className="w-28" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground block mb-1">模拟次数</label>
          <Input type="number" value={trials} min={1} max={100000} step={100}
            onChange={(e) => setTrials(Number(e.target.value))} className="w-32" />
        </div>
        <Button onClick={simulate}>模拟</Button>
      </div>
      {result && (
        <div className="rounded-lg border p-4 flex gap-8 text-sm">
          <div>
            <p className="text-muted-foreground">掉落次数</p>
            <p className="text-2xl font-bold">{result.hits}</p>
          </div>
          <div>
            <p className="text-muted-foreground">未掉落</p>
            <p className="text-2xl font-bold">{result.miss}</p>
          </div>
          <div>
            <p className="text-muted-foreground">实际概率</p>
            <p className="text-2xl font-bold">{((result.hits / trials) * 100).toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">期望概率</p>
            <p className="text-2xl font-bold">{rate}%</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 页面 ─────────────────────────────────────────────────────────────────────

type Tab = "easing" | "damage" | "prob";
const TABS: { key: Tab; label: string }[] = [
  { key: "easing", label: "缓动函数" },
  { key: "damage", label: "伤害公式" },
  { key: "prob", label: "掉落率模拟" },
];

export default function MathPage() {
  const [tab, setTab] = useState<Tab>("easing");

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">📊 游戏数值计算器</h1>
      <p className="text-muted-foreground mb-8">缓动函数可视化、伤害公式模拟、掉落率概率分布。</p>

      <div className="flex gap-2 mb-8 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "easing" && <EasingSection />}
      {tab === "damage" && <DamageSection />}
      {tab === "prob" && <ProbSection />}
    </div>
  );
}
