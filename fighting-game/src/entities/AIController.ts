import type { ButtonName, RawFrameInput } from "./InputController";
import type { Fighter } from "./Fighter";

export type AIDifficulty = "rookie" | "veteran" | "champion";

interface Held {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  buttons: Record<ButtonName, boolean>;
}

const CONFIG: Record<AIDifficulty, { reaction: number; aggression: number; blockChance: number; specialChance: number }> = {
  rookie: { reaction: 22, aggression: 0.45, blockChance: 0.35, specialChance: 0.04 },
  veteran: { reaction: 12, aggression: 0.65, blockChance: 0.55, specialChance: 0.09 },
  champion: { reaction: 6, aggression: 0.82, blockChance: 0.75, specialChance: 0.16 }
};

/**
 * A lightweight utility AI. It doesn't read frame data; it reacts to spacing,
 * the opponent's state, and randomness tuned by difficulty. It emits a raw
 * input frame each tick, which the Fighter's InputController consumes exactly
 * as if it were keyboard input - including motion inputs for specials, which
 * it "types" over several frames via a scripted input queue.
 */
export class AIController {
  private self: Fighter;
  private opponent: Fighter;
  private cfg: (typeof CONFIG)[AIDifficulty];

  private decisionCooldown = 0;
  private scriptedQueue: Held[] = [];

  constructor(self: Fighter, opponent: Fighter, difficulty: AIDifficulty) {
    this.self = self;
    this.opponent = opponent;
    this.cfg = CONFIG[difficulty];
  }

  produce = (): RawFrameInput => {
    // Play out any scripted motion (e.g. a special input) first.
    const scripted = this.scriptedQueue.shift();
    if (scripted) return this.toFrame(scripted);

    const held = this.neutral();

    if (this.self.state === "ko" || this.self.state === "win") return this.toFrame(held);
    if (this.self.state === "hitstun") {
      // Attempt to hold back to recover into a block.
      this.holdBack(held);
      return this.toFrame(held);
    }

    if (this.decisionCooldown > 0) {
      this.decisionCooldown -= 1;
      // Keep advancing/retreating based on the last posture during cooldown.
      this.maintainSpacing(held);
      return this.toFrame(held);
    }

    const dist = Math.abs(this.self.x - this.opponent.x);
    const oppAttacking = this.opponent.state === "attack";

    // Defensive: block if opponent is attacking and close.
    if (oppAttacking && dist < 130 && Math.random() < this.cfg.blockChance) {
      this.holdBack(held);
      this.decisionCooldown = this.cfg.reaction;
      return this.toFrame(held);
    }

    // Occasionally throw a special.
    if (dist < 360 && Math.random() < this.cfg.specialChance) {
      this.queueSpecial();
      this.decisionCooldown = this.cfg.reaction + 6;
      return this.toFrame(this.scriptedQueue.shift() ?? held);
    }

    if (dist > 150) {
      // Approach, sometimes zone with a projectile at long range.
      if (dist > 300 && Math.random() < this.cfg.specialChance * 1.5) {
        this.queueProjectile();
        this.decisionCooldown = this.cfg.reaction + 4;
        return this.toFrame(this.scriptedQueue.shift() ?? held);
      }
      if (Math.random() < this.cfg.aggression) this.holdForward(held);
      this.decisionCooldown = Math.floor(this.cfg.reaction / 2);
    } else {
      // In range: attack.
      if (Math.random() < this.cfg.aggression) {
        const roll = Math.random();
        const btn: ButtonName = roll < 0.4 ? "LP" : roll < 0.65 ? "LK" : roll < 0.85 ? "HP" : "HK";
        held.buttons[btn] = true;
        if (roll > 0.85 && Math.random() < 0.5) held.down = true; // occasional low
      } else if (Math.random() < 0.4) {
        this.holdBack(held); // spacing back out
      }
      this.decisionCooldown = this.cfg.reaction;
    }

    return this.toFrame(held);
  };

  private maintainSpacing(held: Held): void {
    const dist = Math.abs(this.self.x - this.opponent.x);
    if (dist > 170 && Math.random() < this.cfg.aggression) this.holdForward(held);
  }

  private queueSpecial(): void {
    // Pick a QCB+K special (advancing) as a generic pressure tool.
    const forward = this.forwardKey();
    const back = this.backKey();
    const down = "down" as const;
    // QCB motion = down, down-back, back, then Kick.
    this.scriptedQueue = [
      this.dirFrame([down]),
      this.dirFrame([down, back]),
      this.dirFrame([back]),
      this.btnFrame("LK", [back])
    ];
    void forward;
  }

  private queueProjectile(): void {
    const forward = this.forwardKey();
    const down = "down" as const;
    // QCF motion = down, down-forward, forward, then Punch.
    this.scriptedQueue = [
      this.dirFrame([down]),
      this.dirFrame([down, forward]),
      this.dirFrame([forward]),
      this.btnFrame("LP", [forward])
    ];
  }

  private forwardKey(): "left" | "right" {
    return this.self.facing === 1 ? "right" : "left";
  }
  private backKey(): "left" | "right" {
    return this.self.facing === 1 ? "left" : "right";
  }

  private holdForward(held: Held): void {
    held[this.forwardKey()] = true;
  }
  private holdBack(held: Held): void {
    held[this.backKey()] = true;
  }

  private neutral(): Held {
    return {
      left: false, right: false, up: false, down: false,
      buttons: { LP: false, HP: false, LK: false, HK: false }
    };
  }

  private dirFrame(dirs: ("left" | "right" | "up" | "down")[]): Held {
    const h = this.neutral();
    for (const d of dirs) h[d] = true;
    return h;
  }

  private btnFrame(btn: ButtonName, dirs: ("left" | "right" | "up" | "down")[]): Held {
    const h = this.dirFrame(dirs);
    h.buttons[btn] = true;
    return h;
  }

  private toFrame(held: Held): RawFrameInput {
    return {
      left: held.left,
      right: held.right,
      up: held.up,
      down: held.down,
      buttons: { ...held.buttons }
    };
  }
}
