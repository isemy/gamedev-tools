"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";

type CellType = "empty" | "wall" | "start" | "end" | "open" | "closed" | "path";

interface Cell {
  row: number;
  col: number;
  type: CellType;
  g: number;
  h: number;
  f: number;
  parent: Cell | null;
}

const ROWS = 20;
const COLS = 30;

function heuristic(a: Cell, b: Cell) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function createGrid(): Cell[][] {
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => ({
      row: r, col: c, type: "empty" as CellType,
      g: 0, h: 0, f: 0, parent: null,
    }))
  );
}

const CELL_COLORS: Record<CellType, string> = {
  empty: "bg-background border-border",
  wall: "bg-foreground",
  start: "bg-green-500",
  end: "bg-red-500",
  open: "bg-blue-300 dark:bg-blue-700",
  closed: "bg-blue-100 dark:bg-blue-900",
  path: "bg-yellow-400",
};

type DrawMode = "wall" | "start" | "end" | "erase";

const MODE_LABELS: Record<DrawMode, string> = {
  wall: "绘制障碍",
  start: "设置起点",
  end: "设置终点",
  erase: "橡皮擦",
};

export default function PathfindingPage() {
  const [grid, setGrid] = useState<Cell[][]>(createGrid);
  const [mode, setMode] = useState<DrawMode>("wall");
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<"idle" | "running" | "found" | "notfound">("idle");
  const [stats, setStats] = useState({ steps: 0, pathLen: 0, time: 0 });
  const isMouseDown = useRef(false);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAnimation = () => {
    if (animRef.current) clearTimeout(animRef.current);
  };

  const reset = useCallback(() => {
    clearAnimation();
    setIsRunning(false);
    setStatus("idle");
    setStats({ steps: 0, pathLen: 0, time: 0 });
    setGrid(createGrid());
  }, []);

  const clearPath = useCallback(() => {
    clearAnimation();
    setIsRunning(false);
    setStatus("idle");
    setStats({ steps: 0, pathLen: 0, time: 0 });
    setGrid((g) =>
      g.map((row) =>
        row.map((cell) => ({
          ...cell,
          type: (cell.type === "open" || cell.type === "closed" || cell.type === "path"
            ? "empty" : cell.type) as CellType,
          g: 0, h: 0, f: 0, parent: null,
        }))
      )
    );
  }, []);

  const applyCell = useCallback((r: number, c: number) => {
    setGrid((prev) => {
      const next = prev.map((row) => row.map((cell) => ({ ...cell })));
      const cell = next[r][c];
      if (mode === "start") {
        // clear previous start
        next.forEach((row) => row.forEach((cl) => { if (cl.type === "start") cl.type = "empty"; }));
        cell.type = "start";
      } else if (mode === "end") {
        next.forEach((row) => row.forEach((cl) => { if (cl.type === "end") cl.type = "empty"; }));
        cell.type = "end";
      } else if (mode === "wall") {
        if (cell.type === "empty" || cell.type === "open" || cell.type === "closed" || cell.type === "path") {
          cell.type = "wall";
        }
      } else if (mode === "erase") {
        if (cell.type !== "start" && cell.type !== "end") cell.type = "empty";
      }
      return next;
    });
  }, [mode]);

  const runAStar = useCallback(() => {
    clearAnimation();
    // reset path cells first
    const baseGrid = grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        type: (cell.type === "open" || cell.type === "closed" || cell.type === "path"
          ? "empty" : cell.type) as CellType,
        g: 0, h: 0, f: 0, parent: null as Cell | null,
      }))
    );

    const allCells = baseGrid.flat();
    const startCell = allCells.find((c) => c.type === "start") ?? null;
    const endCell = allCells.find((c) => c.type === "end") ?? null;

    if (!startCell || !endCell) {
      setStatus("idle");
      return;
    }

    setIsRunning(true);
    setStatus("running");
    const t0 = performance.now();

    // Run full A* synchronously to collect snapshots
    const snapshots: Array<{ open: [number, number][]; closed: [number, number][] }> = [];
    const openSet: Cell[] = [startCell];
    // Map for O(1) openSet lookup: key -> Cell
    const openMap = new Map<string, Cell>();
    const closedSet = new Set<string>();
    const key = (c: Cell) => `${c.row},${c.col}`;

    startCell.g = 0;
    startCell.h = heuristic(startCell, endCell);
    startCell.f = startCell.h;
    openMap.set(key(startCell), startCell);

    let found = false;
    let finalCell: Cell | null = null;

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f || a.h - b.h);
      const current = openSet.shift()!;
      openMap.delete(key(current));
      closedSet.add(key(current));

      if (current.row === endCell.row && current.col === endCell.col) {
        found = true;
        finalCell = current;
        break;
      }

      const neighbors: [number, number][] = [
        [current.row - 1, current.col],
        [current.row + 1, current.col],
        [current.row, current.col - 1],
        [current.row, current.col + 1],
      ];

      for (const [nr, nc] of neighbors) {
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
        const neighbor = baseGrid[nr][nc];
        const nk = key(neighbor);
        if (neighbor.type === "wall" || closedSet.has(nk)) continue;

        const tentativeG = current.g + 1;
        const inOpen = openMap.get(nk);
        if (!inOpen) {
          neighbor.g = tentativeG;
          neighbor.h = heuristic(neighbor, endCell);
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = current;
          openSet.push(neighbor);
          openMap.set(nk, neighbor);
        } else if (tentativeG < inOpen.g) {
          inOpen.g = tentativeG;
          inOpen.f = inOpen.g + inOpen.h;
          inOpen.parent = current;
        }
      }

      snapshots.push({
        open: openSet.map((c) => [c.row, c.col]),
        closed: [...closedSet].map((k) => k.split(",").map(Number) as [number, number]),
      });
    }

    const elapsed = performance.now() - t0;

    // Build path
    const pathCells = new Set<string>();
    if (found && finalCell) {
      let cur: Cell | null = finalCell;
      while (cur) {
        pathCells.add(key(cur));
        cur = cur.parent;
      }
    }

    // Animate snapshots
    let step = 0;
    const animate = () => {
      if (step < snapshots.length) {
        const snap = snapshots[step];
        setGrid((prev) => {
          const next = prev.map((row) => row.map((cell) => ({ ...cell })));
          snap.open.forEach(([r, c]) => {
            if (next[r][c].type === "empty") next[r][c].type = "open";
          });
          snap.closed.forEach(([r, c]) => {
            if (next[r][c].type === "empty" || next[r][c].type === "open") next[r][c].type = "closed";
          });
          return next;
        });
        step++;
        animRef.current = setTimeout(animate, 16);
      } else {
        // Show final path
        setGrid((prev) => {
          const next = prev.map((row) => row.map((cell) => ({ ...cell })));
          pathCells.forEach((k) => {
            const [r, c] = k.split(",").map(Number);
            if (next[r][c].type !== "start" && next[r][c].type !== "end") {
              next[r][c].type = "path";
            }
          });
          return next;
        });
        setIsRunning(false);
        setStatus(found ? "found" : "notfound");
        setStats({
          steps: snapshots.length,
          pathLen: pathCells.size - 2,
          time: Math.round(elapsed * 100) / 100,
        });
      }
    };
    animate();
  }, [grid]);

  // Cleanup on unmount
  useEffect(() => () => clearAnimation(), []);

  const handleMouseDown = (r: number, c: number) => {
    isMouseDown.current = true;
    applyCell(r, c);
  };
  const handleMouseEnter = (r: number, c: number) => {
    if (isMouseDown.current) applyCell(r, c);
  };
  const handleMouseUp = () => { isMouseDown.current = false; };

  return (
    <div
      className="max-w-5xl mx-auto px-4 py-12 select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <h1 className="text-3xl font-bold mb-2">🗺️ A* 寻路可视化</h1>
      <p className="text-muted-foreground mb-6">
        绘制障碍物，设置起点和终点，观察 A* 算法的搜索过程。
      </p>

      {/* 工具栏 */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {(Object.keys(MODE_LABELS) as DrawMode[]).map((m) => (
          <Button
            key={m}
            size="sm"
            variant={mode === m ? "default" : "outline"}
            onClick={() => setMode(m)}
          >
            {MODE_LABELS[m]}
          </Button>
        ))}
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={clearPath} disabled={isRunning}>
          清除路径
        </Button>
        <Button size="sm" variant="outline" onClick={reset} disabled={isRunning}>
          重置
        </Button>
        <Button size="sm" onClick={runAStar} disabled={isRunning}>
          {isRunning ? "搜索中…" : "开始搜索"}
        </Button>
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
        {([
          ["bg-green-500", "起点"],
          ["bg-red-500", "终点"],
          ["bg-foreground", "障碍"],
          ["bg-blue-300", "待探索"],
          ["bg-blue-100", "已探索"],
          ["bg-yellow-400", "最短路径"],
        ] as [string, string][]).map(([cls, label]) => (
          <span key={label} className="flex items-center gap-1">
            <span className={`inline-block w-3 h-3 rounded-sm ${cls} border border-border`} />
            {label}
          </span>
        ))}
      </div>

      {/* 网格 */}
      <div
        className="border rounded-lg overflow-hidden inline-block"
        style={{ lineHeight: 0 }}
      >
        {grid.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => (
              <div
                key={c}
                className={`w-5 h-5 border-r border-b border-border/30 cursor-pointer transition-colors ${CELL_COLORS[cell.type]}`}
                onMouseDown={() => handleMouseDown(r, c)}
                onMouseEnter={() => handleMouseEnter(r, c)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* 状态栏 */}
      <div aria-live="polite" className="mt-4 text-sm text-muted-foreground flex flex-wrap gap-6">
        {status === "found" && (
          <>
            <span className="text-green-600 font-medium">找到路径</span>
            <span>路径长度：{stats.pathLen} 步</span>
            <span>探索节点：{stats.steps}</span>
            <span>耗时：{stats.time} ms</span>
          </>
        )}
        {status === "notfound" && (
          <span className="text-destructive font-medium">无法到达终点</span>
        )}
        {status === "idle" && (
          <span>点击网格绘制障碍，设置起点和终点后点击「开始搜索」</span>
        )}
        {status === "running" && <span>搜索中…</span>}
      </div>
    </div>
  );
}
