export interface ColorSwatch {
  label: string;
  hex: string;
}

export interface ColorPalette {
  name: string;
  colors: ColorSwatch[];
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}

export function generatePalettes(hex: string): ColorPalette[] {
  const [h, s, l] = hexToHsl(hex);

  return [
    {
      name: "互补色",
      colors: [
        { label: "主色", hex },
        { label: "互补", hex: hslToHex(h + 180, s, l) },
        { label: "浅主色", hex: hslToHex(h, s, Math.min(l + 20, 90)) },
        { label: "深主色", hex: hslToHex(h, s, Math.max(l - 20, 10)) },
        { label: "浅互补", hex: hslToHex(h + 180, s, Math.min(l + 20, 90)) },
      ],
    },
    {
      name: "三角配色",
      colors: [
        { label: "主色", hex },
        { label: "三角 1", hex: hslToHex(h + 120, s, l) },
        { label: "三角 2", hex: hslToHex(h + 240, s, l) },
        { label: "浅三角 1", hex: hslToHex(h + 120, s, Math.min(l + 15, 90)) },
        { label: "浅三角 2", hex: hslToHex(h + 240, s, Math.min(l + 15, 90)) },
      ],
    },
    {
      name: "类比色",
      colors: [
        { label: "-30°", hex: hslToHex(h - 30, s, l) },
        { label: "-15°", hex: hslToHex(h - 15, s, l) },
        { label: "主色", hex },
        { label: "+15°", hex: hslToHex(h + 15, s, l) },
        { label: "+30°", hex: hslToHex(h + 30, s, l) },
      ],
    },
    {
      name: "游戏 UI 推荐",
      colors: [
        { label: "主色调", hex },
        { label: "高亮", hex: hslToHex(h, Math.min(s + 10, 100), Math.min(l + 25, 90)) },
        { label: "阴影", hex: hslToHex(h, s, Math.max(l - 30, 5)) },
        { label: "背景", hex: hslToHex(h, Math.max(s - 40, 5), Math.max(l - 45, 8)) },
        { label: "文字", hex: hslToHex(h, 10, l > 50 ? 15 : 90) },
      ],
    },
  ];
}

export function exportAsCss(palettes: ColorPalette[]): string {
  const lines = [":root {"];
  palettes.forEach((palette) => {
    lines.push(`  /* ${palette.name} */`);
    palette.colors.forEach((c, i) => {
      const key = `--color-${palette.name.replace(/[\s°]/g, "-").toLowerCase()}-${i + 1}`;
      lines.push(`  ${key}: ${c.hex};`);
    });
  });
  lines.push("}");
  return lines.join("\n");
}

export function exportAsJson(palettes: ColorPalette[]): string {
  const obj: Record<string, string[]> = {};
  palettes.forEach((p) => {
    obj[p.name] = p.colors.map((c) => c.hex);
  });
  return JSON.stringify(obj, null, 2);
}
