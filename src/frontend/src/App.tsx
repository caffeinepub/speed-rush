import GameOverScreen from "@/components/game/GameOverScreen";
import RacingGame from "@/components/game/RacingGame";
import StartScreen from "@/components/game/StartScreen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export type GameScreen = "start" | "playing" | "gameover";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GameApp />
    </QueryClientProvider>
  );
}

function GameApp() {
  const [screen, setScreen] = useState<GameScreen>("start");
  const [finalScore, setFinalScore] = useState(0);

  function handleStart() {
    setScreen("playing");
  }

  function handleGameOver(score: number) {
    setFinalScore(score);
    setScreen("gameover");
  }

  function handleRestart() {
    setScreen("playing");
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {screen === "start" && <StartScreen onStart={handleStart} />}
      {screen === "playing" && <RacingGame onGameOver={handleGameOver} />}
      {screen === "gameover" && (
        <GameOverScreen score={finalScore} onRestart={handleRestart} />
      )}
    </div>
  );
}
