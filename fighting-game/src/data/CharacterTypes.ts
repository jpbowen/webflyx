import type { NumpadDir } from "../entities/InputController";

export type MoveHeight = "high" | "mid" | "low";
export type ButtonGroup = "P" | "K";

export interface NormalMove {
  name: string;
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  hitstun: number;
  blockstun: number;
  range: number;
  height: MoveHeight;
  knockback: number;
  meterGain: number;
  isLauncher?: boolean;
}

export interface SpecialMove {
  id: string;
  name: string;
  motion: NumpadDir[];
  button: ButtonGroup;
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  hitstun: number;
  blockstun: number;
  meterGain: number;
  meterCost?: number;
  range: number;
  projectile?: boolean;
  projectileSpeed?: number;
  invincibleStartup?: boolean;
  armor?: boolean;
  dashDistance?: number;
  teleportBehind?: boolean;
  isGrab?: boolean;
  multiHit?: number;
  isOverdrive?: boolean;
}

export interface CharacterDef {
  id: string;
  name: string;
  title: string;
  faction: string;
  color: number;
  accentColor: number;
  walkSpeed: number;
  dashSpeed: number;
  jumpVelocity: number;
  height: number;
  width: number;
  normals: {
    LP: NormalMove;
    HP: NormalMove;
    LK: NormalMove;
    HK: NormalMove;
  };
  specials: SpecialMove[];
  overdrive: SpecialMove;
}
