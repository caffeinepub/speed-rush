import { useMutation, useQuery } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useHighScore() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["highScore"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getHighScore();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLeaderboard() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveScore() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (score: number) => {
      if (!actor) throw new Error("No actor");
      await actor.saveScore(BigInt(score));
    },
  });
}
