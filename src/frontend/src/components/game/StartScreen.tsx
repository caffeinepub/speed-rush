import { useHighScore } from "@/hooks/useQueries";
import { useEffect, useRef } from "react";

interface StartScreenProps {
  onStart: () => void;
}

export default function StartScreen({ onStart }: StartScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const scrollRef = useRef(0);
  const { data: hiScore } = useHighScore();
  const localHi = Number(localStorage.getItem("speedrush_hi") ?? 0);
  const displayHi = Math.max(localHi, Number(hiScore ?? 0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function drawPreview(ts: number) {
      scrollRef.current = ts * 0.15;
      const w = canvas!.width;
      const h = canvas!.height;

      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, w, h);

      const roadW = Math.min(w * 0.55, 280);
      const roadX = (w - roadW) / 2;
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(roadX, 0, roadW, h);

      ctx.strokeStyle = "#ffdd0040";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(roadX, 0);
      ctx.lineTo(roadX, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(roadX + roadW, 0);
      ctx.lineTo(roadX + roadW, h);
      ctx.stroke();

      const laneW = roadW / 4;
      ctx.strokeStyle = "#ffffff30";
      ctx.lineWidth = 2;
      ctx.setLineDash([30, 20]);
      for (let i = 1; i < 4; i++) {
        const x = roadX + laneW * i;
        ctx.lineDashOffset = -(scrollRef.current % 50);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      ctx.strokeStyle = "#ffffff08";
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const sx = roadX + (i + 0.5) * (roadW / 8);
        const offset = (scrollRef.current * 2 + i * 37) % (h + 80);
        ctx.beginPath();
        ctx.moveTo(sx, offset - 80);
        ctx.lineTo(sx, offset);
        ctx.stroke();
      }

      const previewCars = [
        { lane: 0, color: "#ef4444", offset: 0.2 },
        { lane: 2, color: "#f59e0b", offset: 0.5 },
        { lane: 1, color: "#e2e8f0", offset: 0.75 },
        { lane: 3, color: "#f97316", offset: 0.1 },
      ];
      for (const car of previewCars) {
        const carH = 60;
        const carW = laneW * 0.7;
        const cx = roadX + car.lane * laneW + (laneW - carW) / 2;
        const cy =
          ((car.offset * h + scrollRef.current * 0.8) % (h + carH)) - carH;
        drawCar(ctx, cx, cy, carW, carH, car.color);
      }

      animRef.current = requestAnimationFrame(drawPreview);
    }

    animRef.current = requestAnimationFrame(drawPreview);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-40"
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6">
        <div className="flex flex-col items-center gap-1">
          <div
            className="text-[clamp(3rem,12vw,7rem)] font-display font-extrabold tracking-tighter leading-none title-flicker"
            style={{
              color: "#00ffee",
              textShadow:
                "0 0 20px #00ffee99, 0 0 60px #00ffee44, 0 0 100px #00ffee22",
            }}
          >
            SPEED
          </div>
          <div
            className="text-[clamp(3rem,12vw,7rem)] font-display font-extrabold tracking-tighter leading-none"
            style={{
              color: "#ffd700",
              textShadow: "0 0 20px #ffd70099, 0 0 60px #ffd70044",
              marginTop: "-0.15em",
            }}
          >
            RUSH
          </div>
        </div>

        <p
          className="text-[clamp(0.9rem,3vw,1.25rem)] font-body tracking-[0.25em] uppercase"
          style={{ color: "#ffffff88" }}
        >
          Dodge the traffic!
        </p>

        {displayHi > 0 && (
          <div
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-body font-semibold"
            style={{
              background: "#ffd70015",
              border: "1px solid #ffd70040",
              color: "#ffd700",
            }}
          >
            <span>🏆</span>
            <span>BEST: {displayHi.toLocaleString()}</span>
          </div>
        )}

        <button
          type="button"
          data-ocid="game.start_button"
          onClick={onStart}
          className="relative mt-2 px-12 py-4 font-display font-bold text-xl tracking-widest uppercase rounded-lg transition-all duration-200 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #00ffee22, #00ffee11)",
            border: "2px solid #00ffee",
            color: "#00ffee",
            boxShadow: "0 0 20px #00ffee55, 0 0 40px #00ffee22",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 30px #00ffee88, 0 0 60px #00ffee44";
            (e.currentTarget as HTMLButtonElement).style.background =
              "linear-gradient(135deg, #00ffee33, #00ffee18)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 20px #00ffee55, 0 0 40px #00ffee22";
            (e.currentTarget as HTMLButtonElement).style.background =
              "linear-gradient(135deg, #00ffee22, #00ffee11)";
          }}
        >
          ▶ START
        </button>

        <div className="flex gap-6 mt-2">
          <div
            className="flex items-center gap-2 text-sm"
            style={{ color: "#ffffff55" }}
          >
            <kbd
              className="px-2 py-1 rounded text-xs"
              style={{
                background: "#ffffff15",
                border: "1px solid #ffffff25",
              }}
            >
              ←
            </kbd>
            <kbd
              className="px-2 py-1 rounded text-xs"
              style={{
                background: "#ffffff15",
                border: "1px solid #ffffff25",
              }}
            >
              →
            </kbd>
            <span>Move</span>
          </div>
          <div
            className="flex items-center gap-2 text-sm"
            style={{ color: "#ffffff55" }}
          >
            <kbd
              className="px-2 py-1 rounded text-xs"
              style={{
                background: "#ffffff15",
                border: "1px solid #ffffff25",
              }}
            >
              A
            </kbd>
            <kbd
              className="px-2 py-1 rounded text-xs"
              style={{
                background: "#ffffff15",
                border: "1px solid #ffffff25",
              }}
            >
              D
            </kbd>
            <span>Or use buttons</span>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-4 text-xs font-body"
        style={{ color: "#ffffff30" }}
      >
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#ffffff50" }}
        >
          caffeine.ai
        </a>
      </div>
    </div>
  );
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  const r = 5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();

  const wsY = y + h * 0.65;
  const wsH = h * 0.22;
  ctx.fillStyle = "#93c5fd66";
  ctx.beginPath();
  ctx.roundRect(x + w * 0.15, wsY, w * 0.7, wsH, 3);
  ctx.fill();

  ctx.fillStyle = "#f87171";
  ctx.beginPath();
  ctx.roundRect(x + 4, y + 4, w * 0.25, 5, 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x + w - w * 0.25 - 4, y + 4, w * 0.25, 5, 2);
  ctx.fill();
}
