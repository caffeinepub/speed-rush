import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useSaveScore } from "@/hooks/useQueries";
import { useCallback, useEffect, useRef } from "react";

interface RacingGameProps {
  onGameOver: (score: number) => void;
}

interface Car {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  lane: number;
  speed: number;
}

interface SpeedLine {
  x: number;
  y: number;
  len: number;
  alpha: number;
}

interface Tree {
  x: number;
  y: number;
  side: "left" | "right";
}

interface GameState {
  playerLane: number;
  playerX: number;
  playerY: number;
  playerW: number;
  playerH: number;
  lives: number;
  score: number;
  speed: number;
  scrollOffset: number;
  traffic: Car[];
  speedLines: SpeedLine[];
  trees: Tree[];
  spawnTimer: number;
  treeTimer: number;
  invincible: number;
  crashFlash: number;
  shake: number;
  running: boolean;
  keys: Set<string>;
  lastTime: number;
  scoreAccum: number;
  roadX: number;
  roadW: number;
  laneW: number;
  canvasW: number;
  canvasH: number;
}

const TRAFFIC_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#f97316",
  "#e2e8f0",
  "#9ca3af",
  "#84cc16",
];
const NUM_LANES = 4;
const INITIAL_SPEED = 220;
const MAX_SPEED = 600;
const SPEED_ACCEL = 12;
const INVINCIBLE_MS = 2000;
const CRASH_FLASH_MS = 300;
const SHAKE_MS = 400;

function drawCarShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  isPlayer: boolean,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 5);
  ctx.fill();

  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, "rgba(255,255,255,0)");
  grad.addColorStop(0.3, "rgba(255,255,255,0.25)");
  grad.addColorStop(0.6, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 5);
  ctx.fill();

  const wsY = isPlayer ? y + h * 0.08 : y + h * 0.62;
  const wsH = h * 0.22;
  ctx.fillStyle = isPlayer ? "#93c5fdcc" : "#93c5fd55";
  ctx.beginPath();
  ctx.roundRect(x + w * 0.12, wsY, w * 0.76, wsH, 3);
  ctx.fill();

  if (isPlayer) {
    ctx.fillStyle = "#93c5fd88";
    ctx.beginPath();
    ctx.roundRect(x + w * 0.15, y + h * 0.7, w * 0.7, h * 0.15, 3);
    ctx.fill();
  }

  if (isPlayer) {
    ctx.fillStyle = "#fef08a";
    ctx.shadowColor = "#fef08a";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(x + 4, y + h - 9, w * 0.28, 6, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + w - w * 0.28 - 4, y + h - 9, w * 0.28, 6, 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = "#ef4444";
    ctx.shadowColor = "#ef4444";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 3, w * 0.25, 5, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x + w - w * 0.25 - 3, y + 3, w * 0.25, 5, 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#5c3d1e";
  ctx.fillRect(x + 5, y + 20, 6, 18);
  ctx.fillStyle = "#166534";
  ctx.beginPath();
  ctx.arc(x + 8, y + 18, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#15803d";
  ctx.beginPath();
  ctx.arc(x + 8, y + 10, 8, 0, Math.PI * 2);
  ctx.fill();
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  hudScoreRef: React.RefObject<HTMLDivElement | null>,
  hudLivesRef: React.RefObject<HTMLDivElement | null>,
  hudSpeedRef: React.RefObject<HTMLDivElement | null>,
) {
  const { canvasW: w, canvasH: h, roadX, roadW, laneW, scrollOffset } = state;

  let shakeX = 0;
  let shakeY = 0;
  if (state.shake > 0) {
    const mag = (state.shake / SHAKE_MS) * 8;
    shakeX = (Math.random() - 0.5) * mag;
    shakeY = (Math.random() - 0.5) * mag;
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);

  ctx.fillStyle = "#1a2e1a";
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#1e1e30";
  ctx.fillRect(roadX, 0, roadW, h);

  ctx.fillStyle = "#ffd70030";
  ctx.fillRect(roadX - 4, 0, 4, h);
  ctx.fillRect(roadX + roadW, 0, 4, h);

  for (const sl of state.speedLines) {
    ctx.globalAlpha = sl.alpha;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sl.x, sl.y);
    ctx.lineTo(sl.x, sl.y + sl.len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "#ffffff25";
  ctx.lineWidth = 2;
  ctx.setLineDash([28, 22]);
  ctx.lineDashOffset = -(scrollOffset % 50);
  for (let i = 1; i < NUM_LANES; i++) {
    const x = roadX + i * laneW;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;

  for (const tree of state.trees) {
    const ty = ((tree.y + scrollOffset * 0.3) % (h + 60)) - 60;
    drawTree(ctx, tree.x, ty);
  }

  for (const car of state.traffic) {
    drawCarShape(ctx, car.x, car.y, car.w, car.h, car.color, false);
  }

  const { playerX: px, playerY: py, playerW: pw, playerH: ph } = state;
  const flashing =
    state.invincible > 0 && Math.floor(state.invincible / 100) % 2 === 0;

  if (!flashing) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    const grd = ctx.createRadialGradient(
      px + pw / 2,
      py + ph,
      0,
      px + pw / 2,
      py + ph,
      80,
    );
    grd.addColorStop(0, "#00ffee");
    grd.addColorStop(1, "transparent");
    ctx.fillStyle = grd;
    ctx.fillRect(px - 40, py, pw + 80, 80);
    ctx.restore();
    drawCarShape(ctx, px, py, pw, ph, "#00aaff", true);
  }

  if (state.crashFlash > 0) {
    ctx.globalAlpha = (state.crashFlash / CRASH_FLASH_MS) * 0.55;
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  if (hudScoreRef.current) {
    hudScoreRef.current.textContent = Math.floor(state.score).toLocaleString();
  }
  if (hudLivesRef.current) {
    hudLivesRef.current.textContent =
      "❤️".repeat(state.lives) + "🖤".repeat(3 - state.lives);
  }
  if (hudSpeedRef.current) {
    const speedKmh = Math.floor((state.speed / INITIAL_SPEED) * 80 + 40);
    hudSpeedRef.current.textContent = `${speedKmh} km/h`;
  }
}

export default function RacingGame({ onGameOver }: RacingGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudScoreRef = useRef<HTMLDivElement>(null);
  const hudLivesRef = useRef<HTMLDivElement>(null);
  const hudSpeedRef = useRef<HTMLDivElement>(null);
  const gs = useRef<GameState | null>(null);
  const rafRef = useRef<number>(0);
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;
  const { mutate: saveScore } = useSaveScore();
  const saveScoreRef = useRef(saveScore);
  saveScoreRef.current = saveScore;
  const { identity } = useInternetIdentity();
  const identityRef = useRef(identity);
  identityRef.current = identity;

  const initState = useCallback((canvas: HTMLCanvasElement): GameState => {
    const w = canvas.width;
    const h = canvas.height;
    const roadW = Math.min(w * 0.6, 320);
    const roadX = (w - roadW) / 2;
    const laneW = roadW / NUM_LANES;
    const playerW = laneW * 0.62;
    const playerH = playerW * 1.8;
    const startLane = 1;
    const playerX = roadX + startLane * laneW + (laneW - playerW) / 2;
    const playerY = h - playerH - 60;

    const trees: Tree[] = [];
    for (let i = 0; i < 12; i++) {
      trees.push({
        x: Math.random() * Math.max(roadX - 30, 10),
        y: Math.random() * h,
        side: "left",
      });
      trees.push({
        x: roadX + roadW + Math.random() * Math.max(w - roadX - roadW - 30, 10),
        y: Math.random() * h,
        side: "right",
      });
    }

    return {
      playerLane: startLane,
      playerX,
      playerY,
      playerW,
      playerH,
      lives: 3,
      score: 0,
      speed: INITIAL_SPEED,
      scrollOffset: 0,
      traffic: [],
      speedLines: [],
      trees,
      spawnTimer: 0,
      treeTimer: 0,
      invincible: 0,
      crashFlash: 0,
      shake: 0,
      running: true,
      keys: new Set(),
      lastTime: 0,
      scoreAccum: 0,
      roadX,
      roadW,
      laneW,
      canvasW: w,
      canvasH: h,
    };
  }, []);

  const updateState = useCallback((dt: number, state: GameState): boolean => {
    if (!state.running) return false;

    const dtSec = dt / 1000;

    state.speed = Math.min(state.speed + SPEED_ACCEL * dtSec, MAX_SPEED);
    state.scrollOffset += state.speed * dtSec;

    const targetX =
      state.roadX +
      state.playerLane * state.laneW +
      (state.laneW - state.playerW) / 2;
    state.playerX += (targetX - state.playerX) * Math.min(1, dtSec * 12);

    for (const car of state.traffic) {
      car.y += state.speed * dtSec * 0.85;
    }
    state.traffic = state.traffic.filter((c) => c.y < state.canvasH + 100);

    const spawnInterval = Math.max(
      600,
      1400 - (state.speed - INITIAL_SPEED) * 1.5,
    );
    state.spawnTimer += dt;
    if (state.spawnTimer > spawnInterval) {
      state.spawnTimer = 0;
      const count = Math.random() < 0.3 ? 2 : 1;
      const usedLanes = new Set<number>();
      for (let i = 0; i < count; i++) {
        let lane: number;
        do {
          lane = Math.floor(Math.random() * NUM_LANES);
        } while (usedLanes.has(lane));
        usedLanes.add(lane);
        const cW = state.laneW * 0.62;
        const cH = cW * 1.75;
        state.traffic.push({
          x: state.roadX + lane * state.laneW + (state.laneW - cW) / 2,
          y: -cH - Math.random() * 40,
          w: cW,
          h: cH,
          color:
            TRAFFIC_COLORS[Math.floor(Math.random() * TRAFFIC_COLORS.length)],
          lane,
          speed: state.speed,
        });
      }
    }

    if (Math.random() < 0.3) {
      state.speedLines.push({
        x: state.roadX + Math.random() * state.roadW,
        y: -20,
        len: 20 + Math.random() * 40,
        alpha: 0.05 + Math.random() * 0.08,
      });
    }
    for (const sl of state.speedLines) {
      sl.y += state.speed * dtSec * 1.2;
    }
    state.speedLines = state.speedLines.filter(
      (sl) => sl.y < state.canvasH + 80,
    );

    if (state.invincible > 0) state.invincible -= dt;
    if (state.crashFlash > 0) state.crashFlash -= dt;
    if (state.shake > 0) state.shake -= dt;

    state.scoreAccum += dtSec * (state.speed / 100);
    if (state.scoreAccum >= 1) {
      state.score += Math.floor(state.scoreAccum);
      state.scoreAccum -= Math.floor(state.scoreAccum);
    }

    if (state.invincible <= 0) {
      const { playerX: px, playerY: py, playerW: pw, playerH: ph } = state;
      const margin = 6;
      for (const car of state.traffic) {
        if (
          px + margin < car.x + car.w - margin &&
          px + pw - margin > car.x + margin &&
          py + margin < car.y + car.h - margin &&
          py + ph - margin > car.y + margin
        ) {
          state.lives -= 1;
          state.invincible = INVINCIBLE_MS;
          state.crashFlash = CRASH_FLASH_MS;
          state.shake = SHAKE_MS;
          state.traffic = state.traffic.filter((c) => c !== car);
          if (state.lives <= 0) {
            state.running = false;
            return false;
          }
          break;
        }
      }
    }

    return true;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      gs.current = initState(canvas);
    }

    resize();
    window.addEventListener("resize", resize);

    function onKey(e: KeyboardEvent, down: boolean) {
      if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D"].includes(e.key)) {
        e.preventDefault();
      }
      if (down) {
        gs.current?.keys.add(e.key);
      } else {
        gs.current?.keys.delete(e.key);
      }
    }

    const onKeyDown = (e: KeyboardEvent) => onKey(e, true);
    const onKeyUp = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let lastTime = 0;
    let gameEnded = false;

    function loop(ts: number) {
      const state = gs.current;
      if (!state) return;

      const dt = lastTime === 0 ? 16 : Math.min(ts - lastTime, 50);
      lastTime = ts;

      const { keys } = state;
      if (
        (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) &&
        state.playerLane > 0
      ) {
        state.playerLane = Math.max(0, state.playerLane - 1);
        keys.delete("ArrowLeft");
        keys.delete("a");
        keys.delete("A");
      }
      if (
        (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) &&
        state.playerLane < NUM_LANES - 1
      ) {
        state.playerLane = Math.min(NUM_LANES - 1, state.playerLane + 1);
        keys.delete("ArrowRight");
        keys.delete("d");
        keys.delete("D");
      }

      const alive = updateState(dt, state);
      drawScene(ctx, state, hudScoreRef, hudLivesRef, hudSpeedRef);

      if (!alive && !gameEnded) {
        gameEnded = true;
        const finalScore = Math.floor(state.score);
        const prev = Number(localStorage.getItem("speedrush_hi") ?? 0);
        if (finalScore > prev) {
          localStorage.setItem("speedrush_hi", String(finalScore));
        }
        if (identityRef.current) {
          try {
            saveScoreRef.current(finalScore);
          } catch (_) {
            // silent
          }
        }
        setTimeout(() => onGameOverRef.current(finalScore), 400);
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", resize);
    };
  }, [initState, updateState]);

  function moveLeft() {
    const state = gs.current;
    if (state && state.playerLane > 0) state.playerLane--;
  }

  function moveRight() {
    const state = gs.current;
    if (state && state.playerLane < NUM_LANES - 1) state.playerLane++;
  }

  const localHi = Number(localStorage.getItem("speedrush_hi") ?? 0);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        data-ocid="game.canvas_target"
        className="w-full h-full block"
        tabIndex={0}
        style={{ outline: "none" }}
      />

      <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-3 gap-2 pointer-events-none">
        <div
          data-ocid="hud.score_panel"
          className="flex flex-col items-center px-3 py-2 rounded-lg min-w-[80px]"
          style={{
            background: "rgba(0,0,0,0.65)",
            border: "1px solid #00ffee40",
            backdropFilter: "blur(4px)",
          }}
        >
          <span
            className="text-[9px] font-body font-semibold tracking-widest uppercase"
            style={{ color: "#00ffee99" }}
          >
            Score
          </span>
          <span
            ref={hudScoreRef}
            className="text-xl font-display font-bold leading-tight"
            style={{ color: "#00ffee" }}
          >
            0
          </span>
        </div>

        <div
          data-ocid="hud.lives_panel"
          className="flex flex-col items-center px-3 py-2 rounded-lg"
          style={{
            background: "rgba(0,0,0,0.65)",
            border: "1px solid #ff444440",
            backdropFilter: "blur(4px)",
          }}
        >
          <span
            className="text-[9px] font-body font-semibold tracking-widest uppercase"
            style={{ color: "#ff444499" }}
          >
            Lives
          </span>
          <span ref={hudLivesRef} className="text-base leading-tight">
            ❤️❤️❤️
          </span>
        </div>

        <div
          className="flex flex-col items-center px-3 py-2 rounded-lg min-w-[80px]"
          style={{
            background: "rgba(0,0,0,0.65)",
            border: "1px solid #ffd70040",
            backdropFilter: "blur(4px)",
          }}
        >
          <span
            className="text-[9px] font-body font-semibold tracking-widest uppercase"
            style={{ color: "#ffd70099" }}
          >
            Best
          </span>
          <span
            className="text-xl font-display font-bold leading-tight"
            style={{ color: "#ffd700" }}
          >
            {localHi.toLocaleString()}
          </span>
          <span
            ref={hudSpeedRef}
            className="text-[10px] font-body mt-0.5"
            style={{ color: "#ffffff60" }}
          >
            80 km/h
          </span>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex justify-between px-6 pointer-events-none">
        <button
          type="button"
          data-ocid="controls.left_button"
          onPointerDown={moveLeft}
          className="pointer-events-auto w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold select-none active:scale-90 transition-transform"
          style={{
            background: "rgba(0,255,238,0.12)",
            border: "2px solid rgba(0,255,238,0.4)",
            color: "#00ffee",
            boxShadow: "0 0 15px rgba(0,255,238,0.2)",
          }}
        >
          ◀
        </button>
        <button
          type="button"
          data-ocid="controls.right_button"
          onPointerDown={moveRight}
          className="pointer-events-auto w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold select-none active:scale-90 transition-transform"
          style={{
            background: "rgba(0,255,238,0.12)",
            border: "2px solid rgba(0,255,238,0.4)",
            color: "#00ffee",
            boxShadow: "0 0 15px rgba(0,255,238,0.2)",
          }}
        >
          ▶
        </button>
      </div>
    </div>
  );
}
