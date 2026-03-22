import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHighScore, useLeaderboard } from "@/hooks/useQueries";
import { useEffect, useRef } from "react";

interface GameOverProps {
  score: number;
  onRestart: () => void;
}

export default function GameOverScreen({ score, onRestart }: GameOverProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const scrollRef = useRef(0);
  const { data: hiScoreRaw } = useHighScore();
  const { data: leaderboard } = useLeaderboard();

  const localHi = Number(localStorage.getItem("speedrush_hi") ?? 0);
  const chainHi = Number(hiScoreRaw ?? 0);
  const hiScore = Math.max(localHi, chainHi);
  const isNewRecord = score >= hiScore && score > 0;

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

    let last = 0;
    function loop(ts: number) {
      const dt = last === 0 ? 16 : ts - last;
      last = ts;
      scrollRef.current += dt * 0.12;

      const w = canvas!.width;
      const h = canvas!.height;
      const scroll = scrollRef.current;

      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, w, h);

      const roadW = Math.min(w * 0.55, 280);
      const roadX = (w - roadW) / 2;
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(roadX, 0, roadW, h);

      ctx.strokeStyle = "#ff333320";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(roadX, 0);
      ctx.lineTo(roadX, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(roadX + roadW, 0);
      ctx.lineTo(roadX + roadW, h);
      ctx.stroke();

      ctx.strokeStyle = "#ffffff15";
      ctx.lineWidth = 2;
      ctx.setLineDash([28, 22]);
      ctx.lineDashOffset = -(scroll % 50);
      const laneW = roadW / 4;
      for (let i = 1; i < 4; i++) {
        const x = roadX + laneW * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-30"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.9) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-5 px-6 w-full max-w-sm">
        {/* Game Over title */}
        <div className="flex flex-col items-center">
          <div
            className="text-[clamp(2.5rem,10vw,5rem)] font-display font-extrabold tracking-tight leading-none"
            style={{
              color: "#ef4444",
              textShadow: "0 0 20px #ef444499, 0 0 50px #ef444433",
            }}
          >
            GAME
          </div>
          <div
            className="text-[clamp(2.5rem,10vw,5rem)] font-display font-extrabold tracking-tight leading-none"
            style={{
              color: "#ef4444",
              textShadow: "0 0 20px #ef444499",
              marginTop: "-0.1em",
            }}
          >
            OVER
          </div>
        </div>

        {/* Score display */}
        <div
          className="w-full rounded-xl p-4 flex flex-col items-center gap-2"
          style={{
            background: "rgba(0,0,0,0.7)",
            border: "1px solid #ef444440",
          }}
        >
          {isNewRecord && (
            <div
              className="text-sm font-display font-bold tracking-widest uppercase px-3 py-1 rounded-full"
              style={{
                background: "#ffd70020",
                border: "1px solid #ffd70060",
                color: "#ffd700",
              }}
            >
              🏆 NEW RECORD!
            </div>
          )}
          <div
            className="text-5xl font-display font-extrabold"
            style={{ color: "#00ffee" }}
          >
            {score.toLocaleString()}
          </div>
          <div
            className="text-xs font-body tracking-widest uppercase"
            style={{ color: "#ffffff50" }}
          >
            Your Score
          </div>
          {hiScore > 0 && (
            <div className="text-sm font-body" style={{ color: "#ffd70099" }}>
              Best: {hiScore.toLocaleString()}
            </div>
          )}
        </div>

        {/* Leaderboard tab */}
        {leaderboard && leaderboard.length > 0 && (
          <Tabs defaultValue="leaderboard" className="w-full">
            <TabsList
              className="w-full"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              <TabsTrigger
                value="leaderboard"
                className="flex-1"
                data-ocid="leaderboard.tab"
              >
                🏆 Leaderboard
              </TabsTrigger>
            </TabsList>
            <TabsContent value="leaderboard">
              <div
                className="rounded-lg overflow-hidden"
                style={{
                  background: "rgba(0,0,0,0.6)",
                  border: "1px solid #ffffff15",
                }}
              >
                {leaderboard.slice(0, 5).map((entry, rank) => (
                  <div
                    key={entry.userId.toString()}
                    data-ocid={`leaderboard.item.${rank + 1}` as string}
                    className="flex items-center justify-between px-4 py-2.5 border-b last:border-b-0"
                    style={{ borderColor: "#ffffff10" }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background:
                            rank === 0
                              ? "#ffd70030"
                              : rank === 1
                                ? "#9ca3af20"
                                : "#cd7f3220",
                          color:
                            rank === 0
                              ? "#ffd700"
                              : rank === 1
                                ? "#9ca3af"
                                : "#cd7f32",
                          border: `1px solid ${
                            rank === 0
                              ? "#ffd70060"
                              : rank === 1
                                ? "#9ca3af40"
                                : "#cd7f3240"
                          }`,
                        }}
                      >
                        {rank + 1}
                      </span>
                      <span
                        className="text-xs font-body"
                        style={{ color: "#ffffff60" }}
                      >
                        {entry.userId.toString().slice(0, 8)}...
                      </span>
                    </div>
                    <span
                      className="font-display font-bold text-sm"
                      style={{ color: "#00ffee" }}
                    >
                      {Number(entry.score).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Restart button */}
        <button
          type="button"
          data-ocid="game.restart_button"
          onClick={onRestart}
          className="w-full py-4 font-display font-bold text-lg tracking-widest uppercase rounded-lg transition-all duration-200 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #00ffee22, #00ffee11)",
            border: "2px solid #00ffee",
            color: "#00ffee",
            boxShadow: "0 0 20px #00ffee55",
          }}
        >
          ▶ PLAY AGAIN
        </button>
      </div>
    </div>
  );
}
