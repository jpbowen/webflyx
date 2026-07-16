import type { CharacterDef } from "../data/CharacterTypes";
import type { AIDifficulty } from "../entities/AIController";

export type MatchMode = "versus" | "cpu";

export interface MatchConfig {
  mode: MatchMode;
  p1: CharacterDef;
  p2: CharacterDef;
  difficulty: AIDifficulty;
}

export interface MatchResult extends MatchConfig {
  winnerSide: "p1" | "p2";
  p1Rounds: number;
  p2Rounds: number;
}
