"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

// ── Types ────────────────────────────────────────────────────────────────────

interface ParticleConfig {
  emitRate: number;       // particles per second
  lifetime: number;       // seconds
  lifetimeVar: number;    // variance
  speed: number;          // px/s
  speedVar: number;
  angle: number;          // degrees, 0 = up
  spread: number;         // degrees half-angle
  gravity: number;        // px/s²
  sizeStart: number;      // px
  sizeEnd: number;
  sizeVar: number;
  colorStart: string;
  colorEnd: string;
  alphaStart: number;
  alphaEnd: number;
  blendMode: GlobalCompositeOperation;
  continuous: boolean;    // continuous vs burst
  burstCount: number;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  sizeStart: number; sizeEnd: number;
  colorStart: [number, number, number];
  colorEnd: [number, number, number];
  alphaStart: number; alphaEnd: number;
}

const VALID_BLEND_MODES = ["source-over", "screen", "lighter", "multiply", "overlay"] as const satisfies GlobalCompositeOperation[];

const PRESETS: Record<string, ParticleConfig> = {
  fire: {
    emitRate: 60, lifetime: 1.2, lifetimeVar: 0.4,
    speed: 80, speedVar: 30, angle: -90, spread: 20,
    gravity: -60, sizeStart: 14, sizeEnd: 2, sizeVar: 4,
    colorStart: "#ff6600", colorEnd: "#ffee00",
    alphaStart: 0.9, alphaEnd: 0,
    blendMode: "screen", continuous: true, burstCount: 30,
  },
  explosion: {
    emitRate: 0, lifetime: 0.8, lifetimeVar: 0.3,
    speed: 220, speedVar: 80, angle: 0, spread: 180,
    gravity: 120, sizeStart: 10, sizeEnd: 1, sizeVar: 5,
    colorStart: "#ff4400", colorEnd: "#ffcc00",
    alphaStart: 1, alphaEnd: 0,
    blendMode: "screen", continuous: false, burstCount: 80,
  },
  snow: {
    emitRate: 40, lifetime: 4, lifetimeVar: 1,
    speed: 40, speedVar: 15, angle: 90, spread: 30,
    gravity: 20, sizeStart: 4, sizeEnd: 3, sizeVar: 2,
    colorStart: "#ffffff", colorEnd: "#aaddff",
    alphaStart: 0.8, alphaEnd: 0.2,
    blendMode: "source-over", continuous: true, burstCount: 30,
  },
  magic: {
    emitRate: 50, lifetime: 1.5, lifetimeVar: 0.5,
    speed: 60, speedVar: 40, angle: -90, spread: 180,
    gravity: -30, sizeStart: 6, sizeEnd: 0, sizeVar: 3,
    colorStart: "#aa44ff", colorEnd: "#00ffff",
    alphaStart: 1, alphaEnd: 0,
    blendMode: "screen", continuous: true, burstCount: 40,
  },
  confetti: {
    emitRate: 30, lifetime: 3, lifetimeVar: 1,
    speed: 150, speedVar: 60, angle: -90, spread: 60,
    gravity: 200, sizeStart: 8, sizeEnd: 6, sizeVar: 3,
    colorStart: "#ff4488", colorEnd: "#44ffaa",
    alphaStart: 1, alphaEnd: 0.5,
    blendMode: "source-over", continuous: true, burstCount: 50,
  },
  smoke: {
    emitRate: 20, lifetime: 3, lifetimeVar: 1,
    speed: 30, speedVar: 10, angle: -90, spread: 15,
    gravity: -15, sizeStart: 8, sizeEnd: 40, sizeVar: 5,
    colorStart: "#888888", colorEnd: "#444444",
    alphaStart: 0.4, alphaEnd: 0,
    blendMode: "source-over", continuous: true, burstCount: 20,
  },
  sparkle: {
    emitRate: 25, lifetime: 1, lifetimeVar: 0.3,
    speed: 100, speedVar: 50, angle: -90, spread: 180,
    gravity: 80, sizeStart: 5, sizeEnd: 0, sizeVar: 2,
    colorStart: "#ffff88", colorEnd: "#ffaa00",
    alphaStart: 1, alphaEnd: 0,
    blendMode: "screen", continuous: true, burstCount: 30,
  },
};

const PRESET_LABELS: Record<string, string> = {
  fire: "🔥 火焰", explosion: "💥 爆炸", snow: "❄️ 雪花",
  magic: "✨ 魔法", confetti: "🎊 彩纸", smoke: "💨 烟雾", sparkle: "⭐ 星光",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): string {
  return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
}

function rand(base: number, variance: number) {
  return base + (Math.random() * 2 - 1) * variance;
}

function spawnParticle(x: number, y: number, cfg: ParticleConfig): Particle {
  const angleRad = ((cfg.angle + (Math.random() * 2 - 1) * cfg.spread) * Math.PI) / 180;
  const spd = rand(cfg.speed, cfg.speedVar);
  const life = Math.max(0.1, rand(cfg.lifetime, cfg.lifetimeVar));
  return {
    x, y,
    vx: Math.cos(angleRad) * spd,
    vy: Math.sin(angleRad) * spd,
    life, maxLife: life,
    sizeStart: Math.max(1, rand(cfg.sizeStart, cfg.sizeVar)),
    sizeEnd: Math.max(0, rand(cfg.sizeEnd, cfg.sizeVar / 2)),
    colorStart: hexToRgb(cfg.colorStart),
    colorEnd: hexToRgb(cfg.colorEnd),
    alphaStart: cfg.alphaStart,
    alphaEnd: cfg.alphaEnd,
  };
}

// ── Slider ───────────────────────────────────────────────────────────────────

function Slider({ label, value, min, max, step = 1, onChange }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-muted-foreground w-24 shrink-0">{label}</label>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 accent-primary" />
      <span className="text-xs font-mono w-10 text-right">{value}</span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ParticlesPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const configRef = useRef<ParticleConfig>(PRESETS.fire);
  const emitAccRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const emitPosRef = useRef({ x: 300, y: 250 });
  const isEmittingRef = useRef(false);

  const [cfg, setCfg] = useState<ParticleConfig>(PRESETS.fire);
  const [activePreset, setActivePreset] = useState("fire");
  const [particleCount, setParticleCount] = useState(0);
  const [copied, setCopied] = useState(false);

  // Keep ref in sync
  useEffect(() => { configRef.current = cfg; }, [cfg]);

  const set = useCallback(<K extends keyof ParticleConfig>(key: K, val: ParticleConfig[K]) => {
    setCfg((prev) => ({ ...prev, [key]: val }));
  }, []);

  const applyPreset = useCallback((name: string) => {
    setActivePreset(name);
    setCfg(PRESETS[name]);
    particlesRef.current = [];
  }, []);

  const burst = useCallback(() => {
    const { x, y } = emitPosRef.current;
    const c = configRef.current;
    for (let i = 0; i < c.burstCount; i++) {
      particlesRef.current.push(spawnParticle(x, y, c));
    }
  }, []);

  const exportConfig = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(cfg, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [cfg]);

  const downloadConfig = useCallback(() => {
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `particles-${activePreset}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [cfg, activePreset]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const tick = (now: number) => {
      const dt = lastTimeRef.current === null ? 0 : Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      const c = configRef.current;

      // Emit continuous
      if (c.continuous && isEmittingRef.current) {
        emitAccRef.current += c.emitRate * dt;
        while (emitAccRef.current >= 1) {
          particlesRef.current.push(spawnParticle(emitPosRef.current.x, emitPosRef.current.y, c));
          emitAccRef.current -= 1;
        }
      }

      // Update
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
      for (const p of particlesRef.current) {
        p.life -= dt;
        p.vy += c.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = c.blendMode;

      for (const p of particlesRef.current) {
        const t = 1 - p.life / p.maxLife;
        const size = lerp(p.sizeStart, p.sizeEnd, t);
        const alpha = lerp(p.alphaStart, p.alphaEnd, t);
        const color = lerpColor(p.colorStart, p.colorEnd, t);
        if (size <= 0 || alpha <= 0) continue;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      setParticleCount(particlesRef.current.length);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // Canvas interaction
  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    emitPosRef.current = getPos(e);
    isEmittingRef.current = true;
    if (!configRef.current.continuous) burst();
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isEmittingRef.current) emitPosRef.current = getPos(e);
  };
  const handleMouseUp = () => { isEmittingRef.current = false; };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">✨ 粒子系统预览</h1>
      <p className="text-muted-foreground mb-6">
        实时调节粒子参数，点击或拖拽画布发射粒子，导出配置 JSON。
      </p>

      {/* 预设 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(PRESETS).map((name) => (
          <Button key={name} size="sm"
            variant={activePreset === name ? "default" : "outline"}
            onClick={() => applyPreset(name)}>
            {PRESET_LABELS[name]}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas */}
        <div className="lg:col-span-2">
          <div className="relative rounded-lg overflow-hidden border bg-black">
            <canvas
              ref={canvasRef}
              width={600}
              height={400}
              className="w-full cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            <div className="absolute top-2 right-3 text-xs text-white/40 font-mono">
              {particleCount} particles
            </div>
            <div className="absolute bottom-2 left-3 text-xs text-white/40">
              {cfg.continuous ? "按住鼠标持续发射" : "点击鼠标爆发发射"}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            {!cfg.continuous && (
              <Button size="sm" onClick={burst}>爆发一次</Button>
            )}
            <Button size="sm" variant="outline" onClick={() => { particlesRef.current = []; }}>
              清空
            </Button>
            <div className="flex-1" />
            <Button size="sm" variant="outline" onClick={exportConfig}>
              {copied ? "已复制!" : "复制 JSON"}
            </Button>
            <Button size="sm" variant="outline" onClick={downloadConfig}>
              导出 JSON
            </Button>
          </div>
        </div>

        {/* 参数面板 */}
        <div className="flex flex-col gap-4 text-sm">
          {/* 发射 */}
          <div>
            <p className="font-medium mb-2 text-xs uppercase tracking-wide text-muted-foreground">发射</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1">
                <label className="text-xs text-muted-foreground w-24 shrink-0">模式</label>
                <button
                  onClick={() => set("continuous", !cfg.continuous)}
                  className={`text-xs px-3 py-1 rounded border transition-colors ${cfg.continuous ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                >
                  {cfg.continuous ? "持续" : "爆发"}
                </button>
              </div>
              {cfg.continuous
                ? <Slider label="发射速率/s" value={cfg.emitRate} min={1} max={200} onChange={(v) => set("emitRate", v)} />
                : <Slider label="爆发数量" value={cfg.burstCount} min={1} max={200} onChange={(v) => set("burstCount", v)} />
              }
              <Slider label="生命时长(s)" value={cfg.lifetime} min={0.2} max={8} step={0.1} onChange={(v) => set("lifetime", v)} />
              <Slider label="生命随机" value={cfg.lifetimeVar} min={0} max={3} step={0.1} onChange={(v) => set("lifetimeVar", v)} />
            </div>
          </div>

          {/* 运动 */}
          <div>
            <p className="font-medium mb-2 text-xs uppercase tracking-wide text-muted-foreground">运动</p>
            <div className="flex flex-col gap-2">
              <Slider label="速度" value={cfg.speed} min={0} max={500} onChange={(v) => set("speed", v)} />
              <Slider label="速度随机" value={cfg.speedVar} min={0} max={200} onChange={(v) => set("speedVar", v)} />
              <Slider label="角度(°)" value={cfg.angle} min={-180} max={180} onChange={(v) => set("angle", v)} />
              <Slider label="扩散角(°)" value={cfg.spread} min={0} max={180} onChange={(v) => set("spread", v)} />
              <Slider label="重力" value={cfg.gravity} min={-400} max={400} onChange={(v) => set("gravity", v)} />
            </div>
          </div>

          {/* 外观 */}
          <div>
            <p className="font-medium mb-2 text-xs uppercase tracking-wide text-muted-foreground">外观</p>
            <div className="flex flex-col gap-2">
              <Slider label="初始大小" value={cfg.sizeStart} min={1} max={60} onChange={(v) => set("sizeStart", v)} />
              <Slider label="结束大小" value={cfg.sizeEnd} min={0} max={60} onChange={(v) => set("sizeEnd", v)} />
              <Slider label="大小随机" value={cfg.sizeVar} min={0} max={20} onChange={(v) => set("sizeVar", v)} />
              <div className="flex items-center gap-3">
                <label className="text-xs text-muted-foreground w-24 shrink-0">起始颜色</label>
                <input type="color" value={cfg.colorStart}
                  onChange={(e) => set("colorStart", e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border border-border" />
                <span className="text-xs font-mono text-muted-foreground">{cfg.colorStart}</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-muted-foreground w-24 shrink-0">结束颜色</label>
                <input type="color" value={cfg.colorEnd}
                  onChange={(e) => set("colorEnd", e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border border-border" />
                <span className="text-xs font-mono text-muted-foreground">{cfg.colorEnd}</span>
              </div>
              <Slider label="初始透明度" value={cfg.alphaStart} min={0} max={1} step={0.05} onChange={(v) => set("alphaStart", v)} />
              <Slider label="结束透明度" value={cfg.alphaEnd} min={0} max={1} step={0.05} onChange={(v) => set("alphaEnd", v)} />
              <div className="flex items-center gap-3">
                <label className="text-xs text-muted-foreground w-24 shrink-0">混合模式</label>
                <select
                  value={cfg.blendMode}
                  onChange={(e) => {
                    const v = e.target.value;
                    if ((VALID_BLEND_MODES as readonly string[]).includes(v))
                      set("blendMode", v as GlobalCompositeOperation);
                  }}
                  className="text-xs rounded border border-border bg-background px-2 py-1"
                >
                  {VALID_BLEND_MODES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
