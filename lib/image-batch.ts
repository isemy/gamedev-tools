import { zipSync } from "fflate";

export type ExportFormat = "image/png" | "image/webp";

export async function resizeImage(
  file: File,
  targetW: number,
  targetH: number,
  format: ExportFormat
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const c = document.createElement("canvas");
  c.width = targetW;
  c.height = targetH;
  c.getContext("2d")!.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();
  const quality = format === "image/webp" ? 0.95 : undefined;
  return new Promise<Blob>((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), format, quality)
  );
}

export async function packAsZip(
  items: { name: string; blob: Blob }[]
): Promise<Blob> {
  const files: Record<string, Uint8Array> = {};
  for (const item of items) {
    const buf = await item.blob.arrayBuffer();
    files[item.name] = new Uint8Array(buf);
  }
  const zipped = zipSync(files);
  return new Blob([zipped], { type: "application/zip" });
}

export function getOutputName(originalName: string, format: ExportFormat): string {
  const base = originalName.replace(/\.[^.]+$/, "");
  const ext = format === "image/png" ? "png" : "webp";
  return `${base}.${ext}`;
}
