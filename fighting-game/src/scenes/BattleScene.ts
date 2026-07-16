import Phaser from "phaser";
import {
  GROUND_Y,
  MAX_HEALTH,
  MAX_METER,
  ROUNDS_TO_WIN,
  ROUND_TIME_SECONDS,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  STAGE_LEFT,
  STAGE_RIGHT
} from "../config/GameConfig";
import { AIController } from "../entities/AIController";
import { Fighter, type HitResult } from "../entities/Fighter";
import { Projectile } from "../entities/Projectile";
import type { MatchConfig, MatchResult } from "./MatchConfig";

const FIXED_DT = 1000 / 60;

type RoundState = "intro" | "fight" | "roundEnd" | "matchEnd";

export class BattleScene extends Phaser.Scene {
  private cfg!: MatchConfig;
  private p1!: Fighter;
  private p2!: Fighter;
  private ai: AIController | null = null;

  private projectiles: Projectile[] = [];

  private roundState: RoundState = "intro";
  private roundNumber = 1;
  private p1Rounds = 0;
  private p2Rounds = 0;
  private timeLeft = ROUND_TIME_SECONDS;
  private accumulator = 0;
  private stateTimer = 0;

  // HUD
  private p1HealthBar!: Phaser.GameObjects.Rectangle;
  private p2HealthBar!: Phaser.GameObjects.Rectangle;
  private p1MeterBar!: Phaser.GameObjects.Rectangle;
  private p2MeterBar!: Phaser.GameObjects.Rectangle;
  private timerText!: Phaser.GameObjects.Text;
  private centerText!: Phaser.GameObjects.Text;
  private p1RoundPips!: Phaser.GameObjects.Text;
  private p2RoundPips!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;

  private healthBarMaxW = 360;

  constructor() {
    super("Battle");
  }

  create(cfg: MatchConfig): void {
    this.cfg = cfg;
    this.p1Rounds = 0;
    this.p2Rounds = 0;
    this.roundNumber = 1;
    this.projectiles = [];

    this.drawStage();

    this.p1 = new Fighter(this, cfg.p1, "p1", STAGE_LEFT + 200);
    this.p2 = new Fighter(this, cfg.p2, "p2", STAGE_RIGHT - 200);

    if (cfg.mode === "cpu") {
      this.ai = new AIController(this.p2, this.p1, cfg.difficulty);
      this.p2.input.setVirtualSource(this.ai.produce);
    }

    this.buildHud();
    this.startRound();
  }

  private drawStage(): void {
    // Sky gradient backdrop.
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2a2440, 0x2a2440, 0x14121f, 0x14121f, 1);
    bg.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Distant arch structures.
    bg.fillStyle(0x1d1a2e, 1);
    for (let i = 0; i < 6; i++) {
      const x = 40 + i * 160;
      bg.fillRect(x, 180, 40, GROUND_Y - 180);
    }

    // Floor.
    bg.fillStyle(0x3a3550, 1);
    bg.fillRect(0, GROUND_Y, SCREEN_WIDTH, SCREEN_HEIGHT - GROUND_Y);
    bg.fillStyle(0x2c2842, 1);
    bg.fillRect(0, GROUND_Y, SCREEN_WIDTH, 6);

    // Torches.
    [STAGE_LEFT - 20, STAGE_RIGHT + 20].forEach((x) => {
      const flame = this.add.circle(x, GROUND_Y - 120, 10, 0xff9a3c);
      this.tweens.add({ targets: flame, scale: 1.4, alpha: 0.7, duration: 500, yoyo: true, repeat: -1 });
    });

    this.add.text(SCREEN_WIDTH / 2, 96, "THE PROVING GROUNDS", {
      fontFamily: "monospace", fontSize: "13px", color: "#5b5470"
    }).setOrigin(0.5);
  }

  private buildHud(): void {
    // Health bars (P1 left, P2 right mirrored).
    this.add.rectangle(20, 30, this.healthBarMaxW, 24, 0x000000).setOrigin(0, 0.5).setStrokeStyle(2, 0x555566);
    this.p1HealthBar = this.add.rectangle(20, 30, this.healthBarMaxW, 24, 0x4ee36b).setOrigin(0, 0.5);

    this.add.rectangle(SCREEN_WIDTH - 20, 30, this.healthBarMaxW, 24, 0x000000).setOrigin(1, 0.5).setStrokeStyle(2, 0x555566);
    this.p2HealthBar = this.add.rectangle(SCREEN_WIDTH - 20, 30, this.healthBarMaxW, 24, 0x4ee36b).setOrigin(1, 0.5);

    // Names.
    this.add.text(22, 50, `${this.cfg.p1.name}`, { fontFamily: "monospace", fontSize: "14px", color: "#ffffff" }).setOrigin(0, 0);
    this.add.text(SCREEN_WIDTH - 22, 50, `${this.cfg.p2.name}`, { fontFamily: "monospace", fontSize: "14px", color: "#ffffff" }).setOrigin(1, 0);

    // Meter bars.
    this.add.rectangle(20, 72, this.healthBarMaxW, 10, 0x000000).setOrigin(0, 0.5).setStrokeStyle(1, 0x555566);
    this.p1MeterBar = this.add.rectangle(20, 72, 0, 10, 0xffd75b).setOrigin(0, 0.5);
    this.add.rectangle(SCREEN_WIDTH - 20, 72, this.healthBarMaxW, 10, 0x000000).setOrigin(1, 0.5).setStrokeStyle(1, 0x555566);
    this.p2MeterBar = this.add.rectangle(SCREEN_WIDTH - 20, 72, 0, 10, 0xffd75b).setOrigin(1, 0.5);

    // Timer.
    this.timerText = this.add.text(SCREEN_WIDTH / 2, 34, `${this.timeLeft}`, {
      fontFamily: "monospace", fontSize: "34px", color: "#ffffff"
    }).setOrigin(0.5);

    // Round pips.
    this.p1RoundPips = this.add.text(20, 88, "", { fontFamily: "monospace", fontSize: "16px", color: "#ffd75b" }).setOrigin(0, 0);
    this.p2RoundPips = this.add.text(SCREEN_WIDTH - 20, 88, "", { fontFamily: "monospace", fontSize: "16px", color: "#ffd75b" }).setOrigin(1, 0);

    this.comboText = this.add.text(SCREEN_WIDTH / 2, 140, "", {
      fontFamily: "monospace", fontSize: "20px", color: "#ff8f4f"
    }).setOrigin(0.5);

    this.centerText = this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 40, "", {
      fontFamily: "monospace", fontSize: "48px", color: "#ffffff", fontStyle: "bold"
    }).setOrigin(0.5);
  }

  private startRound(): void {
    this.p1.resetForNewRound(STAGE_LEFT + 200);
    this.p2.resetForNewRound(STAGE_RIGHT - 200);
    this.timeLeft = ROUND_TIME_SECONDS;
    this.roundState = "intro";
    this.stateTimer = 1600;
    this.centerText.setText(`ROUND ${this.roundNumber}`).setAlpha(1);
    this.clearProjectiles();
    this.updateHud();
  }

  private clearProjectiles(): void {
    this.projectiles.forEach((p) => p.destroy());
    this.projectiles = [];
  }

  update(_time: number, delta: number): void {
    this.accumulator += delta;
    // Fixed timestep for deterministic combat.
    let steps = 0;
    while (this.accumulator >= FIXED_DT && steps < 5) {
      this.step(FIXED_DT);
      this.accumulator -= FIXED_DT;
      steps += 1;
    }
    this.p1.render();
    this.p2.render();
    this.projectiles.forEach((p) => p.update(0)); // render sync
  }

  private step(dt: number): void {
    if (this.roundState === "intro") {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.roundState = "fight";
        this.centerText.setText("FIGHT!");
        this.stateTimer = 700;
        this.tweens.add({ targets: this.centerText, alpha: 0, delay: 400, duration: 300 });
      }
      return;
    }

    if (this.roundState === "roundEnd") {
      this.stateTimer -= dt;
      // Let fighters keep falling / KO animate.
      this.p1.tick(dt, this.p2);
      this.p2.tick(dt, this.p1);
      if (this.stateTimer <= 0) this.advanceAfterRound();
      return;
    }

    if (this.roundState === "matchEnd") return;

    // FIGHT state.
    this.timeLeft = Math.max(0, this.timeLeft - dt / 1000);

    this.p1.handleInput(this.p2);
    this.p2.handleInput(this.p1);

    this.p1.tick(dt, this.p2);
    this.p2.tick(dt, this.p1);

    this.handleTeleports();
    this.handleSpawnedProjectiles();
    this.updateProjectiles(dt);

    this.resolveCombat();
    this.resolvePushback();

    this.updateHud();
    this.checkRoundEnd();
  }

  private handleTeleports(): void {
    [this.p1, this.p2].forEach((f, i) => {
      const other = i === 0 ? this.p2 : this.p1;
      if (f.consumePendingTeleport()) {
        // Warp to the far side of the opponent.
        const behindX = other.x + (f.x < other.x ? 60 : -60);
        f.x = Phaser.Math.Clamp(behindX, STAGE_LEFT, STAGE_RIGHT);
      }
    });
  }

  private handleSpawnedProjectiles(): void {
    [this.p1, this.p2].forEach((f) => {
      const move = f.consumePendingProjectile();
      if (move) {
        const proj = new Projectile(
          this,
          f.x + f.facing * (f.def.width / 2 + 12),
          f.facing,
          f.side,
          move.projectileSpeed ?? 500,
          move.damage,
          move.hitstun,
          move.blockstun,
          f.def.color
        );
        this.projectiles.push(proj);
      }
    });
  }

  private updateProjectiles(dt: number): void {
    for (const p of this.projectiles) {
      p.update(dt);
      if (p.x < STAGE_LEFT - 60 || p.x > STAGE_RIGHT + 60) p.destroy();
    }
    // Projectile vs fighter.
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      const target = p.owner === "p1" ? this.p2 : this.p1;
      const attacker = p.owner === "p1" ? this.p1 : this.p2;
      if (target.state === "ko" || target.state === "win") continue;
      if (target.isProjectileImmuneCurrently()) continue;
      if (Phaser.Geom.Rectangle.Overlaps(p.getHitbox(), target.getHurtbox())) {
        const blocked = this.isBlocking(target, attacker, "mid");
        const result: HitResult = {
          damage: p.damage,
          hitstun: p.hitstun,
          blockstun: p.blockstun,
          knockback: 160,
          isLauncher: false,
          isGrab: false,
          blocked
        };
        target.applyHit(result, attacker);
        if (!blocked) this.registerCombo(attacker);
        p.destroy();
      }
    }
    // Projectile vs projectile (they cancel).
    for (let i = 0; i < this.projectiles.length; i++) {
      for (let j = i + 1; j < this.projectiles.length; j++) {
        const a = this.projectiles[i];
        const b = this.projectiles[j];
        if (a.alive && b.alive && a.owner !== b.owner &&
          Phaser.Geom.Rectangle.Overlaps(a.getHitbox(), b.getHitbox())) {
          a.destroy();
          b.destroy();
        }
      }
    }
    this.projectiles = this.projectiles.filter((p) => p.alive);
  }

  private resolveCombat(): void {
    this.tryMeleeHit(this.p1, this.p2);
    this.tryMeleeHit(this.p2, this.p1);
  }

  private tryMeleeHit(attacker: Fighter, defender: Fighter): void {
    if (defender.state === "ko" || defender.state === "win") return;
    const hitbox = attacker.getActiveHitbox();
    if (!hitbox) return;
    if (!Phaser.Geom.Rectangle.Overlaps(hitbox, defender.getHurtbox())) return;

    const meta = attacker.getPendingMoveMeta();
    if (!meta) return;

    // Grabs beat blocking; can't grab airborne opponents.
    if (meta.isGrab) {
      if (defender.isAirborne()) return;
      attacker.markHitLanded();
      defender.applyHit({ ...meta, blocked: false }, attacker);
      this.registerCombo(attacker);
      return;
    }

    const heightTag = this.moveHeight(attacker);
    const blocked = this.isBlocking(defender, attacker, heightTag);
    attacker.markHitLanded();
    defender.applyHit({ ...meta, blocked }, attacker);
    if (!blocked) this.registerCombo(attacker);
    else this.comboText.setText("");
  }

  private moveHeight(f: Fighter): "high" | "mid" | "low" {
    const box = f.getActiveHitbox();
    if (!box) return "mid";
    // Infer from box vertical center relative to ground.
    const centerY = box.y + box.height / 2;
    if (centerY > GROUND_Y - 40) return "low";
    if (centerY < GROUND_Y - f.def.height * 0.7) return "high";
    return "mid";
  }

  private isBlocking(defender: Fighter, attacker: Fighter, height: "high" | "mid" | "low"): boolean {
    if (defender.isAirborne()) return false; // no air block in this slice
    if (defender.state === "attack" || defender.state === "hitstun") return false;
    const holdingBack = defender.input.isBackHeld();
    if (!holdingBack) return false;
    // Must be facing the attacker to block.
    const facingAttacker = (attacker.x - defender.x) * defender.facing > 0;
    if (!facingAttacker) return false;
    const crouching = defender.isCrouching;
    if (height === "low") return crouching;   // lows must be crouch-blocked
    if (height === "high") return !crouching;  // overheads must be stand-blocked
    return true;                               // mids block either way
  }

  private registerCombo(attacker: Fighter): void {
    attacker.comboCount += 1;
    if (attacker.comboCount >= 2) {
      this.comboText.setText(`${attacker.comboCount} HIT COMBO`);
      this.comboText.setColor(attacker.side === "p1" ? "#8fd0ff" : "#ff8f4f");
    }
  }

  private resolvePushback(): void {
    const minGap = 44;
    const gap = Math.abs(this.p1.x - this.p2.x);
    if (gap < minGap) {
      const mid = (this.p1.x + this.p2.x) / 2;
      const left = this.p1.x <= this.p2.x ? this.p1 : this.p2;
      const right = left === this.p1 ? this.p2 : this.p1;
      left.x = Phaser.Math.Clamp(mid - minGap / 2, STAGE_LEFT, STAGE_RIGHT);
      right.x = Phaser.Math.Clamp(mid + minGap / 2, STAGE_LEFT, STAGE_RIGHT);
    }
  }

  private checkRoundEnd(): void {
    // Reset combo counters when the attacker returns to neutral.
    if (this.p1.state !== "attack" && this.p1.comboCount > 0 && this.p2.state !== "hitstun" && this.p2.state !== "blockstun") {
      this.p1.comboCount = 0;
    }
    if (this.p2.state !== "attack" && this.p2.comboCount > 0 && this.p1.state !== "hitstun" && this.p1.state !== "blockstun") {
      this.p2.comboCount = 0;
    }

    const p1Dead = this.p1.health <= 0;
    const p2Dead = this.p2.health <= 0;
    const timeUp = this.timeLeft <= 0;

    if (p1Dead || p2Dead || timeUp) {
      let winner: "p1" | "p2" | "draw";
      if (p1Dead && p2Dead) winner = "draw";
      else if (p1Dead) winner = "p2";
      else if (p2Dead) winner = "p1";
      else winner = this.p1.health > this.p2.health ? "p1" : this.p1.health < this.p2.health ? "p2" : "draw";

      this.endRound(winner);
    }
  }

  private endRound(winner: "p1" | "p2" | "draw"): void {
    this.roundState = "roundEnd";
    this.stateTimer = 2200;
    this.comboText.setText("");

    if (winner === "p1") {
      this.p1Rounds += 1;
      this.p1.setWin();
      this.centerText.setText(`${this.cfg.p1.name} WINS THE ROUND`);
    } else if (winner === "p2") {
      this.p2Rounds += 1;
      this.p2.setWin();
      this.centerText.setText(`${this.cfg.p2.name} WINS THE ROUND`);
    } else {
      this.centerText.setText("DOUBLE KO — DRAW");
    }
    this.centerText.setAlpha(1);
    this.centerText.setFontSize(32);
    this.updateHud();
  }

  private advanceAfterRound(): void {
    if (this.p1Rounds >= ROUNDS_TO_WIN || this.p2Rounds >= ROUNDS_TO_WIN) {
      this.finishMatch();
      return;
    }
    this.roundNumber += 1;
    this.centerText.setFontSize(48);
    this.startRound();
  }

  private finishMatch(): void {
    this.roundState = "matchEnd";
    const winnerSide: "p1" | "p2" = this.p1Rounds > this.p2Rounds ? "p1" : "p2";
    const result: MatchResult = {
      ...this.cfg,
      winnerSide,
      p1Rounds: this.p1Rounds,
      p2Rounds: this.p2Rounds
    };
    this.time.delayedCall(500, () => {
      this.scene.start("Results", result);
    });
  }

  private updateHud(): void {
    this.p1HealthBar.width = (Math.max(0, this.p1.health) / MAX_HEALTH) * this.healthBarMaxW;
    this.p2HealthBar.width = (Math.max(0, this.p2.health) / MAX_HEALTH) * this.healthBarMaxW;
    this.tintHealth(this.p1HealthBar, this.p1.health);
    this.tintHealth(this.p2HealthBar, this.p2.health);

    this.p1MeterBar.width = (this.p1.meter / MAX_METER) * this.healthBarMaxW;
    this.p2MeterBar.width = (this.p2.meter / MAX_METER) * this.healthBarMaxW;

    this.timerText.setText(`${Math.ceil(this.timeLeft)}`);
    this.p1RoundPips.setText("●".repeat(this.p1Rounds) + "○".repeat(ROUNDS_TO_WIN - this.p1Rounds));
    this.p2RoundPips.setText("●".repeat(this.p2Rounds) + "○".repeat(ROUNDS_TO_WIN - this.p2Rounds));
  }

  private tintHealth(bar: Phaser.GameObjects.Rectangle, hp: number): void {
    const ratio = hp / MAX_HEALTH;
    const color = ratio > 0.5 ? 0x4ee36b : ratio > 0.25 ? 0xffd75b : 0xff5b5b;
    bar.fillColor = color;
  }
}
