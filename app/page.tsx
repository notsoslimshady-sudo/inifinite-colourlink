"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** ---------- Types ---------- */
type Cell = { row: number; col: number }; // row = y, col = x
type Point = [number, number]; // [x, y]
type Board = { w: number; h: number; pairs: [Point, Point][] };

/** ---------- UI constants ---------- */
const CELL = 52;
const GAP = 4;

// You can tweak these colors, but keep 7 for A..G
const COLORS = [
  "#facc15", // A - yellow
  "#f97316", // B - orange
  "#22c55e", // C - green
  "#3b82f6", // D - blue
  "#a855f7", // E - purple
  "#ec4899", // F - pink
  "#ef4444", // G - red
  "#14b8a6", // H - teal (NEW)
];

function cellKey(c: Cell) {
  return `${c.row},${c.col}`;
}

function isAdjacent(a: Cell, b: Cell) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

function sameCell(a: Cell, b: Cell) {
  return a.row === b.row && a.col === b.col;
}

function neighbors(w: number, h: number, cell: Cell): Cell[] {
  const res: Cell[] = [];
  if (cell.row > 0) res.push({ row: cell.row - 1, col: cell.col });
  if (cell.row < h - 1) res.push({ row: cell.row + 1, col: cell.col });
  if (cell.col > 0) res.push({ row: cell.row, col: cell.col - 1 });
  if (cell.col < w - 1) res.push({ row: cell.row, col: cell.col + 1 });
  return res;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** ---------- Board library (YOUR board) ---------- */
const BASE_BOARDS: Board[] = [
  // Your earlier board (7x11, A-G)
  {
    w: 7,
    h: 11,
    pairs: [
      [[0, 1], [6, 1]],   // A
      [[2, 0], [6, 0]],   // B
      [[1, 7], [6, 6]],   // C
      [[4, 9], [6, 5]],   // D
      [[0, 9], [4, 6]],   // E
      [[3, 6], [6, 10]],  // F
      [[0, 0], [5, 1]],   // G
    ],
  },

  // Board 1: 7x10 (A-H)
  {
    w: 7,
    h: 10,
    pairs: [
      [[1, 3], [6, 0]], // A
      [[1, 8], [3, 9]], // B
      [[2, 2], [5, 2]], // C
      [[4, 2], [5, 0]], // D
      [[0, 1], [2, 0]], // E
      [[3, 2], [4, 0]], // F
      [[5, 8], [2, 1]], // G
      [[1, 5], [2, 9]], // H
    ],
  },

  // Board 2: 7x9 (A-F)
  {
    w: 7,
    h: 9,
    pairs: [
      [[1, 1], [5, 6]], // A
      [[3, 4], [6, 6]], // B
      [[5, 2], [5, 8]], // C
      [[0, 2], [6, 0]], // D
      [[1, 7], [6, 8]], // E
      [[1, 4], [4, 6]], // F
    ],
  },

  // Board 3: 7x11 (A-G)
  {
    w: 7,
    h: 11,
    pairs: [
      [[0, 0], [2, 4]],  // A
      [[1, 1], [2, 0]],  // B
      [[0, 3], [3, 2]],  // C
      [[5, 6], [6, 9]],  // D
      [[1, 5], [6, 4]],  // E
      [[4, 1], [2, 9]],  // F
      [[0, 10], [3, 7]], // G
    ],
  },

  // Board 4: 7x10 (A-H)
  {
    w: 7,
    h: 10,
    pairs: [
      [[2, 3], [6, 0]], // A
      [[4, 3], [2, 7]], // B
      [[2, 2], [6, 1]], // C
      [[0, 6], [5, 8]], // D
      [[1, 9], [4, 7]], // E
      [[0, 0], [5, 4]], // F
      [[1, 8], [3, 9]], // G
      [[3, 3], [6, 2]], // H
    ],
  },

  // Board 5: 7x9 (A-F)
  {
    w: 7,
    h: 9,
    pairs: [
      [[5, 1], [2, 7]], // A
      [[1, 7], [5, 7]], // B
      [[4, 2], [6, 5]], // C
      [[2, 2], [5, 4]], // D
      [[1, 4], [6, 2]], // E
      [[2, 5], [2, 8]], // F
    ],
  },

  // Board 6: 7x11 (A-G)
  {
    w: 7,
    h: 11,
    pairs: [
      [[1, 6], [3, 1]],  // A
      [[1, 0], [3, 3]],  // B
      [[1, 8], [5, 8]],  // C
      [[1, 9], [4, 8]],  // D
      [[1, 2], [3, 7]],  // E
      [[2, 2], [2, 6]],  // F
      [[0, 8], [1, 10]], // G
    ],
  },

  // Board 7: 7x10 (A-H)
  {
    w: 7,
    h: 10,
    pairs: [
      [[2, 7], [5, 9]], // A
      [[0, 8], [5, 8]], // B
      [[0, 5], [5, 4]], // C
      [[0, 0], [4, 4]], // D
      [[1, 0], [2, 2]], // E
      [[3, 3], [1, 6]], // F
      [[0, 6], [3, 8]], // G
      [[5, 1], [2, 3]], // H
    ],
  },

  // Board 8: 7x9 (A-F)
  {
    w: 7,
    h: 9,
    pairs: [
      [[0, 3], [2, 4]], // A
      [[1, 1], [1, 8]], // B
      [[4, 2], [4, 6]], // C
      [[1, 7], [6, 5]], // D
      [[1, 3], [3, 3]], // E
      [[1, 6], [5, 6]], // F
    ],
  },
];

function mirrorH(b: Board): Board {
  // x -> w-1-x
  return {
    ...b,
    pairs: b.pairs.map(([p1, p2]) => [
      [b.w - 1 - p1[0], p1[1]],
      [b.w - 1 - p2[0], p2[1]],
    ]),
  };
}

function mirrorV(b: Board): Board {
  // y -> h-1-y
  return {
    ...b,
    pairs: b.pairs.map(([p1, p2]) => [
      [p1[0], b.h - 1 - p1[1]],
      [p2[0], b.h - 1 - p2[1]],
    ]),
  };
}

function mirrorHV(b: Board): Board {
  return mirrorV(mirrorH(b));
}

function expandBoards(base: Board[]) {
  const out: Board[] = [];
  for (const b of base) out.push(b, mirrorH(b), mirrorV(b), mirrorHV(b));
  return out;
}

const ALL_BOARDS = expandBoards(BASE_BOARDS);

/** ---------- Geometry helpers for SVG ---------- */
function cellCenter(row: number, col: number) {
  return {
    x: col * (CELL + GAP) + CELL / 2,
    y: row * (CELL + GAP) + CELL / 2,
  };
}

function pathPoints(path: Cell[]) {
  return path
    .map((c) => {
      const { x, y } = cellCenter(c.row, c.col);
      return `${x},${y}`;
    })
    .join(" ");
}

/** ---------- Player board validity (solve detection) ---------- */
function validatePlayerBoard(
  w: number,
  h: number,
  player: Record<number, Cell[]>,
  endpointMap: Map<string, number>,
  endpointsByColor: Record<number, [Cell, Cell]>,
  colorsCount: number
) {
  const used = new Set<string>();

  for (let cid = 0; cid < colorsCount; cid++) {
    const path = player[cid];
    if (!path || path.length < 2) return { ok: false as const, reason: `color ${cid} missing` };

    const ep = endpointsByColor[cid];
    if (!ep) return { ok: false as const, reason: `color ${cid} endpoints missing` };
    const [a, b] = ep;

    // Must start/end on its endpoints (either direction)
    const start = path[0];
    const end = path[path.length - 1];
    const startsOk = (sameCell(start, a) && sameCell(end, b)) || (sameCell(start, b) && sameCell(end, a));
    if (!startsOk) return { ok: false as const, reason: `color ${cid} not connected to endpoints` };

    // Adjacent continuity + no overlaps + in bounds
    for (let i = 0; i < path.length; i++) {
      const c = path[i];
      if (c.row < 0 || c.row >= h || c.col < 0 || c.col >= w) {
        return { ok: false as const, reason: `out of bounds in color ${cid}` };
      }
      const k = cellKey(c);
      if (used.has(k)) return { ok: false as const, reason: `overlap at ${k}` };
      used.add(k);

      if (i > 0 && !isAdjacent(path[i - 1], c)) {
        return { ok: false as const, reason: `non-adjacent step in color ${cid}` };
      }
    }

    // Start/end cells must be endpoints of the right color
    if (endpointMap.get(cellKey(start)) !== cid) return { ok: false as const, reason: `color ${cid} start not endpoint` };
    if (endpointMap.get(cellKey(end)) !== cid) return { ok: false as const, reason: `color ${cid} end not endpoint` };
  }

  // Full fill (Elevate-style)
  if (used.size !== w * h) return { ok: false as const, reason: `grid not filled (${used.size}/${w * h})` };

  return { ok: true as const, reason: "ok" };
}

/** ---------- Hint: BFS for one valid next step ---------- */


/** ---------- Main Component ---------- */
export default function Home() {
  const [boardIndex, setBoardIndex] = useState(0);
useEffect(() => {
  setBoardIndex(Math.floor(Math.random() * ALL_BOARDS.length));
}, []);
  const board = useMemo(() => {
  return ALL_BOARDS[boardIndex];
}, [boardIndex]);

  const w = board.w;
  const h = board.h;
  const colorsCount = board.pairs.length;

  // endpointsByColor[cid] = [CellA, CellB]
  const endpointsByColor = useMemo(() => {
    const out: Record<number, [Cell, Cell]> = {};
    board.pairs.forEach(([p1, p2], cid) => {
      const a: Cell = { col: p1[0], row: p1[1] };
      const b: Cell = { col: p2[0], row: p2[1] };
      out[cid] = [a, b];
    });
    return out;
  }, [board]);

  // endpoint map: "r,c" -> cid
  const endpointMap = useMemo(() => {
    const m = new Map<string, number>();
    for (let cid = 0; cid < colorsCount; cid++) {
      const ep = endpointsByColor[cid];
      if (!ep) continue;
      m.set(cellKey(ep[0]), cid);
      m.set(cellKey(ep[1]), cid);
    }
    return m;
  }, [endpointsByColor, colorsCount]);

  const [paths, setPaths] = useState<Record<number, Cell[]>>({});
  const [activeColor, setActiveColor] = useState<number | null>(null);

  const activeRef = useRef<number | null>(null);
  const drawingRef = useRef(false);
  useEffect(() => {
    activeRef.current = activeColor;
  }, [activeColor]);

  // stop drawing on pointer up anywhere
  useEffect(() => {
    const stop = () => {
      drawingRef.current = false;
      setActiveColor(null);
    };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, []);

  const occupied = useMemo(() => {
    const occ = new Map<string, number>();
    for (const [cidStr, path] of Object.entries(paths)) {
      const cid = Number(cidStr);
      for (const cell of path) occ.set(cellKey(cell), cid);
    }
    return occ;
  }, [paths]);

  function otherEndpoint(cid: number, start: Cell): Cell {
    const [a, b] = endpointsByColor[cid];
    return sameCell(start, a) ? b : a;
  }

  const handleDown = (r: number, c: number) => {
    const key = `${r},${c}`;
    const dotColor = endpointMap.get(key);

    // Click a dot: restart & start drawing that color
    if (dotColor !== undefined) {
      drawingRef.current = true;
      setActiveColor(dotColor);
      setPaths((p) => ({ ...p, [dotColor]: [{ row: r, col: c }] }));
      return;
    }

    // Click on a line cell: clear that entire color
    const occ = occupied.get(key);
    if (occ !== undefined) {
      setPaths((p) => {
        const n = { ...p };
        delete n[occ];
        return n;
      });
    }
  };

  const handleEnter = (r: number, c: number) => {
    if (!drawingRef.current) return;
    const cid = activeRef.current;
    if (cid === null) return;

    setPaths((prev) => {
      const cur = prev[cid] ?? [];
      if (cur.length === 0) return prev;

      const last = cur[cur.length - 1];
      const next: Cell = { row: r, col: c };
      if (!isAdjacent(last, next)) return prev;

      // determine destination for this color based on start endpoint
      const start = cur[0];
      const dest = otherEndpoint(cid, start);

      // if already reached destination, do not extend
      if (sameCell(last, dest)) return prev;

      // Build occupied from prev (stable)
      const occNow = new Map<string, number>();
      for (const [cidStr2, path2] of Object.entries(prev)) {
        const cc = Number(cidStr2);
        for (const cell2 of path2) occNow.set(cellKey(cell2), cc);
      }

      const occ = occNow.get(cellKey(next));
      if (occ !== undefined && occ !== cid) return prev;

      // allow backtrack one step
      if (cur.length >= 2) {
        const secondLast = cur[cur.length - 2];
        if (sameCell(secondLast, next)) {
          return { ...prev, [cid]: cur.slice(0, -1) };
        }
      }

      // prevent walking onto other colors' endpoints
      const epOwner = endpointMap.get(cellKey(next));
      if (epOwner !== undefined && epOwner !== cid) return prev;

      // prevent self-looping into earlier part of own path (except backtrack handled above)
      for (let i = 0; i < cur.length - 1; i++) {
        if (sameCell(cur[i], next)) return prev;
      }

      const newPath = [...cur, next];

      // if reached destination, stop drawing
      if (sameCell(next, dest)) {
        drawingRef.current = false;
        setActiveColor(null);
      }

      return { ...prev, [cid]: newPath };
    });
  };

  const clearAll = () => {
    drawingRef.current = false;
    setActiveColor(null);
    setPaths({});
  };

  

  const solveCheck = useMemo(() => {
    return validatePlayerBoard(w, h, paths, endpointMap, endpointsByColor, colorsCount);
  }, [w, h, paths, endpointMap, endpointsByColor, colorsCount]);

  const isSolved = solveCheck.ok;
import { useEffect, useMemo, useRef, useState } from "react";
  // Confetti on solve (optional — works only if you installed canvas-confetti)
  const solvedOnceRef = useRef(false);
  useEffect(() => {
    if (!isSolved) {
      solvedOnceRef.current = false;
      return;
    }
    if (solvedOnceRef.current) return;
    solvedOnceRef.current = true;

    // dynamic import avoids module format issues
    import("canvas-confetti")
      .then((mod) => {
        const confetti = (mod as any).default ?? mod;
        confetti({
          particleCount: 160,
          spread: 70,
          origin: { y: 0.6 },
        });
      })
      .catch(() => {});
  }, [isSolved]);

  const boardPxW = w * CELL + (w - 1) * GAP;
  const boardPxH = h * CELL + (h - 1) * GAP;

  return (
<main className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 bg-gradient-to-br from-rose-50 via-sky-50 to-indigo-50">
  <div className="w-full max-w-3xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl px-6 py-6 sm:px-10 sm:py-8">
    {/* Header */}
    <div className="text-center mb-4">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
        Infinite Color Link
      </h1>
      <p
        className={`mt-1 text-sm font-medium ${
          isSolved ? "text-green-600" : "text-red-600"
        }`}
      >
        {isSolved ? "Solved ✅" : "Not solved ❌"}
      </p>
      <p className="mt-1 text-xs text-gray-600">
        Board: {w}×{h} • Variants: {ALL_BOARDS.length}
      </p>
    </div>

    {/* Centering wrapper */}
    <div className="flex justify-center">
      {/* Board frame */}
      <div
        className={`rounded-2xl p-3 transition-all duration-300 ${
          isSolved
            ? "ring-4 ring-green-300 shadow-xl shadow-green-200/50"
            : "ring-1 ring-gray-200"
        }`}
      >
        {/* ===== BOARD ===== */}
        <div className="relative" style={{ width: boardPxW, height: boardPxH }}>
          {/* SVG overlay (visual only) */}
          <svg
            className="absolute inset-0 z-10"
            width={boardPxW}
            height={boardPxH}
            style={{ pointerEvents: "none" }}
          >
            {/* Player lines */}
            {Object.entries(paths).map(([cidStr, path]) => {
              const cid = Number(cidStr);
              if (!path || path.length < 2) return null;
              return (
                <polyline
                  key={`line-${cid}`}
                  points={pathPoints(path)}
                  stroke={COLORS[cid % COLORS.length]}
                  strokeWidth={14}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              );
            })}

            {/* Endpoints */}
            {Object.entries(endpointsByColor).map(([cidStr, pair]) => {
              const cid = Number(cidStr);
              const [a, b] = pair;

              const drawDot = (p: Cell, idx: number) => {
                const { x, y } = cellCenter(p.row, p.col);
                return (
                  <g key={`dot-${cid}-${idx}`}>
                    <circle
                      cx={x}
                      cy={y}
                      r={10}
                      fill="white"
                      stroke="rgba(0,0,0,0.25)"
                      strokeWidth={2}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={7}
                      fill={COLORS[cid % COLORS.length]}
                    />
                  </g>
                );
              };

              return (
                <g key={`dots-${cid}`}>
                  {drawDot(a, 0)}
                  {drawDot(b, 1)}
                </g>
              );
            })}
          </svg>

          {/* Clickable grid */}
          <div
            className="grid absolute inset-0 z-0"
            style={{
              gridTemplateColumns: `repeat(${w}, ${CELL}px)`,
              gridTemplateRows: `repeat(${h}, ${CELL}px)`,
              gap: GAP,
              userSelect: "none",
              touchAction: "none",
            }}
          >
            {Array.from({ length: h }).map((_, r) =>
              Array.from({ length: w }).map((_, c) => {
                const key = `${r},${c}`;
                const hasDot = endpointMap.has(key);
                const hasLine = occupied.has(key);

                return (
                  <div
                    key={`${r}-${c}`}
                    onPointerDown={() => handleDown(r, c)}
                    onPointerEnter={() => handleEnter(r, c)}
                    onPointerMove={() => handleEnter(r, c)}
                    className="rounded-md bg-white border border-gray-200 shadow-sm hover:shadow-md"
                    style={{
                      width: CELL,
                      height: CELL,
                      cursor: hasDot || hasLine ? "pointer" : "default",
                    }}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>

    {/* ===== BUTTONS ===== */}
    <div className="flex flex-wrap gap-3 justify-center mt-5">
      <button
        onClick={() => {
          clearAll();
          setBoardIndex((prev) => {
            let next = prev;
            while (next === prev && ALL_BOARDS.length > 1) {
              next = Math.floor(Math.random() * ALL_BOARDS.length);
            }
            return next;
          });
        }}
        className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 active:scale-[0.98] transition"
      >
        New Puzzle
      </button>

      <button
        onClick={clearAll}
        className="px-5 py-2.5 rounded-xl bg-white text-gray-900 font-semibold border border-gray-200 shadow hover:bg-gray-50 active:scale-[0.98] transition"
      >
        Clear
      </button>
    </div>

    <p className="mt-4 text-sm text-gray-700 text-center max-w-md mx-auto">
      Click a dot to restart that color. Drag orthogonally to draw. Click any
      line cell to clear that color. Full fill required to win.
    </p>

    <p className="mt-2 text-xs text-gray-500 text-center">
      Made with ❤️ for my little baby so she can play colourlink anytime she wants.
    </p>
  </div>
</main>
  );
}