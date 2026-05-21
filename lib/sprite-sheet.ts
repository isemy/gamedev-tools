import { zipSync } from "fflate";

export interface SliceConfig {
  cols: number;
  rows: number;
  offsetX: number;
  offsetY: number;
  spacingX: number;
  spacingY: number;
}

export interface FrameInfo {
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function computeFrames(
  imgW: number,
  imgH: number,
  cfg: SliceConfig
): FrameInfo[] {
  const frameW = Math.floor((imgW - cfg.offsetX - cfg.spacingX * (cfg.cols - 1)) / cfg.cols);
  const frameH = Math.floor((imgH - cfg.offsetY - cfg.spacingY * (cfg.rows - 1)) / cfg.rows);
  const frames: FrameInfo[] = [];
  for (let r = 0; r < cfg.rows; r++) {
    for (let c = 0; c < cfg.cols; c++) {
      frames.push({
        index: r * cfg.cols + c,
        x: cfg.offsetX + c * (frameW + cfg.spacingX),
        y: cfg.offsetY + r * (frameH + cfg.spacingY),
        w: frameW,
        h: frameH,
      });
    }
  }
  return frames;
}

export async function exportFramesAsZip(
  source: HTMLCanvasElement,
  frames: FrameInfo[]
): Promise<Blob> {
  const files: Record<string, Uint8Array> = {};

  for (const f of frames) {
    const c = document.createElement("canvas");
    c.width = f.w;
    c.height = f.h;
    c.getContext("2d")!.drawImage(source, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
    const blob = await new Promise<Blob>((res, rej) =>
      c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png")
    );
    const buf = await blob.arrayBuffer();
    files[`frame_${String(f.index).padStart(3, "0")}.png`] = new Uint8Array(buf);
  }

  const zipped = zipSync(files);
  return new Blob([zipped], { type: "application/zip" });
}

export async function exportAsSpriteSheet(
  source: HTMLCanvasElement,
  frames: FrameInfo[],
  cols: number
): Promise<Blob> {
  if (frames.length === 0) throw new Error("No frames");
  const fw = frames[0].w;
  const fh = frames[0].h;
  const outCols = Math.min(cols, frames.length);
  const outRows = Math.ceil(frames.length / outCols);
  const c = document.createElement("canvas");
  c.width = fw * outCols;
  c.height = fh * outRows;
  const ctx = c.getContext("2d")!;
  frames.forEach((f, i) => {
    const col = i % outCols;
    const row = Math.floor(i / outCols);
    ctx.drawImage(source, f.x, f.y, f.w, f.h, col * fw, row * fh, fw, fh);
  });
  return new Promise<Blob>((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png")
  );
}
