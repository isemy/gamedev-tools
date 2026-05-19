"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { playSfx, exportWav, PRESETS, type SfxParams, type WaveType } from "@/lib/sfx";

const PRESET_LABELS: Record<string, string> = {
  jump: "跳跃",
  explosion: "爆炸",
  pickup: "拾取道具",
  hurt: "受伤",
  levelup: "升级",
  shoot: "射击",
  coin: "金币",
};

const WAVE_LABELS: Record<WaveType, string> = {
  sine: "正弦波",
  square: "方波",
  sawtooth: "锯齿波",
  triangle: "三角波",
  noise: "噪声",
};

function Slider({
  label, value, min, max, step, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-xs">{value}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

export default function SfxPage() {
  const [params, setParams] = useState<SfxParams>(PRESETS.jump);
  const [activePreset, setActivePreset] = useState("jump");

  const set = (key: keyof SfxParams, value: number | string) =>
    setParams((p) => ({ ...p, [key]: value }));

  const loadPreset = (key: string) => {
    setActivePreset(key);
    setParams(PRESETS[key]);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">🔊 音效生成器</h1>
      <p className="text-muted-foreground mb-8">程序化生成游戏音效，实时预览，导出 WAV 文件。</p>

      {/* 预设 */}
      <div className="mb-8">
        <p className="text-sm font-medium mb-3">预设音效</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRESET_LABELS).map(([key, label]) => (
            <Button
              key={key}
              variant={activePreset === key ? "default" : "outline"}
              size="sm"
              onClick={() => loadPreset(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* 参数 */}
      <div className="rounded-lg border p-6 mb-6">
        <p className="text-sm font-medium mb-4">参数调节</p>

        {/* 波形选择 */}
        <div className="mb-5">
          <p className="text-sm text-muted-foreground mb-2">波形</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(WAVE_LABELS) as WaveType[]).map((w) => (
              <Button
                key={w}
                variant={params.waveType === w ? "default" : "outline"}
                size="sm"
                onClick={() => set("waveType", w)}
              >
                {WAVE_LABELS[w]}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Slider label="起始频率 (Hz)" value={params.frequency} min={20} max={2000} step={10} onChange={(v) => set("frequency", v)} />
          <Slider label="结束频率 (Hz)" value={params.frequencyEnd} min={20} max={2000} step={10} onChange={(v) => set("frequencyEnd", v)} />
          <Slider label="起音 (s)" value={params.attack} min={0.001} max={0.5} step={0.001} onChange={(v) => set("attack", v)} />
          <Slider label="持续 (s)" value={params.sustain} min={0.01} max={1} step={0.01} onChange={(v) => set("sustain", v)} />
          <Slider label="衰减 (s)" value={params.decay} min={0.01} max={2} step={0.01} onChange={(v) => set("decay", v)} />
          <Slider label="音量" value={params.volume} min={0.1} max={1} step={0.05} onChange={(v) => set("volume", v)} />
          <Slider label="颤音频率 (Hz)" value={params.vibrato} min={0} max={20} step={0.5} onChange={(v) => set("vibrato", v)} />
          <Slider label="颤音深度" value={params.vibratoDepth} min={0} max={3} step={0.1} onChange={(v) => set("vibratoDepth", v)} />
          <Slider label="失真" value={params.distortion} min={0} max={1} step={0.05} onChange={(v) => set("distortion", v)} />
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <Button onClick={() => playSfx(params)}>▶ 播放预览</Button>
        <Button variant="outline" onClick={() => exportWav(params)}>导出 WAV</Button>
      </div>
    </div>
  );
}
