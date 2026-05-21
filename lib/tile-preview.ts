export interface TileEntry {
  id: string;
  name: string;
  img: HTMLImageElement;
  url: string;
}

export interface GridCell {
  tileId: string | null;
}

export function createGrid(cols: number, rows: number): GridCell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ tileId: null }))
  );
}

export function drawGrid(
  canvas: HTMLCanvasElement,
  grid: GridCell[][],
  tiles: Map<string, TileEntry>,
  tileSize: number,
  showGrid: boolean
) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (canvas.width !== cols * tileSize) canvas.width = cols * tileSize;
  if (canvas.height !== rows * tileSize) canvas.height = rows * tileSize;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // checkerboard background
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? "#e5e5e5" : "#f5f5f5";
      ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
    }
  }

  // tiles
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (cell.tileId) {
        const tile = tiles.get(cell.tileId);
        if (tile) {
          ctx.drawImage(tile.img, c * tileSize, r * tileSize, tileSize, tileSize);
        }
      }
    }
  }

  // grid lines
  if (showGrid) {
    ctx.strokeStyle = "rgba(100,100,100,0.3)";
    ctx.lineWidth = 1;
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * tileSize, 0);
      ctx.lineTo(c * tileSize, rows * tileSize);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * tileSize);
      ctx.lineTo(cols * tileSize, r * tileSize);
      ctx.stroke();
    }
  }
}

export function exportCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png")
  );
}
