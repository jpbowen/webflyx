import Phaser from "phaser";
import {
  GRAVITY,
  GROUND_Y,
  MAX_HEALTH,
  MAX_METER,
  PUSH_DISTANCE,
  STAGE_LEFT,
  STAGE_RIGHT
} from "../config/GameConfig";
import type { CharacterDef, NormalMove, SpecialMove } from "../data/CharacterTypes";
import { InputController, type ButtonName } from "./InputController";

export type FighterState =
  | "idle"
  | "walk"
  | "crouch"
  | "jump"
  | "dash"
  | "attack"
  | "hitstun"
  | "blockstun"
  | "ko"
  | "win";

type MovePhase = "startup" | "active" | "recovery";
type ActiveMove =
  | { kind: "normal"; data: NormalMove; buttonHit: ButtonName }
  | { kind: "special"; data: SpecialMove }
  | { kind: "overdrive"; data: SpecialMove };

const FRAME_MS = 1000 / 60;

export interface HitResult {
  damage: number;
  hitstun: number;
  blockstun: number;
  knockback: number;
  isLauncher: boolean;
  isGrab: boolean;
  blocked: boolean;
}

export class Fighter {
  readonly def: CharacterDef;
  readonly side: "p1" | "p2";
  readonly input: InputController;

  x: number;
  footY = GROUND_Y;
  vx = 0;
  vy = 0;
  facing: 1 | -1;
  health = MAX_HEALTH;
  meter = 0;
  state: FighterState = "idle";
  isCrouching = false;
  comboCount = 0;

  private activeMove: ActiveMove | null = null;
  private movePhase: MovePhase = "startup";
  private moveFrame = 0;
  private hitsLandedThisMove = 0;
  private hitLockout = false; // prevents a single-hit move from hitting twice
  private stunFramesLeft = 0;
  private dashFramesLeft = 0;
  private koFallProgress = 0;
  private flashColor: number | null = null;
  private flashFramesLeft = 0;
  private pendingProjectile: SpecialMove | null = null;
  private pendingTeleport = false;

  readonly graphics: Phaser.GameObjects.Graphics;
  readonly nameText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, def: CharacterDef, side: "p1" | "p2", startX: number) {
    this.def = def;
    this.side = side;
    this.x = startX;
    this.facing = side === "p1" ? 1 : -1;
    this.input = new InputController(scene, side);
    this.graphics = scene.add.graphics();
    this.nameText = scene.add.text(startX, GROUND_Y - def.height - 26, def.name, {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#ffffff"
    }).setOrigin(0.5);
  }

  get currentHeight(): number {
    return this.isCrouching ? this.def.height * 0.62 : this.def.height;
  }

  isActionLocked(): boolean {
    return this.state === "attack" || this.state === "hitstun" || this.state === "blockstun" || this.state === "ko" || this.state === "win";
  }

  isAirborne(): boolean {
    return this.state === "jump";
  }

  /** Reads input and decides on state transitions. Movement application happens in tick(). */
  handleInput(opponent: Fighter): void {
    this.input.facing = this.facing === 1 ? "right" : "left";
    this.input.update();

    if (this.state === "ko" || this.state === "win") return;

    // Facing updates freely while both are grounded/neutral.
    if (!this.isActionLocked() && this.state !== "dash") {
      this.facing = this.x <= opponent.x ? 1 : -1;
    }

    if (this.stunFramesLeft > 0) {
      this.stunFramesLeft -= 1;
      if (this.stunFramesLeft <= 0) {
        this.state = this.vy !== 0 || this.footY < GROUND_Y ? "jump" : "idle";
      }
      return;
    }

    if (this.state === "attack") {
      this.advanceMove(opponent);
      return;
    }

    if (this.state === "dash") {
      this.dashFramesLeft -= 1;
      if (this.dashFramesLeft <= 0) this.state = "idle";
      return;
    }

    // Try to start an action from a neutral/cancelable state.
    const canAct = this.state === "idle" || this.state === "walk" || this.state === "crouch" || this.state === "jump";
    if (canAct) {
      if (this.tryStartSpecial(opponent)) return;
      if (this.tryStartNormal()) return;
    }

    if (this.state === "jump") return; // airborne movement handled in tick via vx already set on jump start

    if ((this.state === "idle" || this.state === "walk") && (this.input.dashForward || this.input.dashBack)) {
      const dir: 1 | -1 = this.input.dashForward ? this.facing : (-this.facing as 1 | -1);
      this.startDash(dir, this.def.dashSpeed, 14);
      return;
    }

    // Grounded movement / stance. (Airborne case already returned above.)
    this.isCrouching = this.input.isDownHeld();
    if (this.isCrouching) {
      this.state = "crouch";
      this.vx = 0;
      return;
    }

    if (this.input.jumpPressed) {
      this.vy = this.def.jumpVelocity;
      this.state = "jump";
      const fwd = this.input.isForwardHeld();
      const back = this.input.isBackHeld();
      this.vx = fwd ? this.def.walkSpeed * this.facing : back ? -this.def.walkSpeed * this.facing : 0;
      return;
    }

    const left = this.input.isLeftHeld();
    const right = this.input.isRightHeld();
    if (left === right) {
      this.vx = 0;
      this.state = "idle";
    } else {
      this.vx = (right ? 1 : -1) * this.def.walkSpeed;
      this.state = "walk";
    }
  }

  private tryStartNormal(): boolean {
    const map: [ButtonName, keyof CharacterDef["normals"]][] = [
      ["LP", "LP"], ["HP", "HP"], ["LK", "LK"], ["HK", "HK"]
    ];
    for (const [btn, key] of map) {
      if (this.input.isButtonJustPressed(btn)) {
        this.startNormal(this.def.normals[key], btn);
        return true;
      }
    }
    return false;
  }

  private tryStartSpecial(_opponent: Fighter): boolean {
    // Overdrive first (longer, more specific motion), then regular specials.
    if (this.meter >= (this.def.overdrive.meterCost ?? 100)) {
      for (const btn of ["LP", "HP", "LK", "HK"] as ButtonName[]) {
        const group = btn.endsWith("P") ? "P" : "K";
        if (group === this.def.overdrive.button && this.input.isButtonJustPressed(btn) && this.input.matchesMotion(this.def.overdrive.motion)) {
          this.startSpecial(this.def.overdrive, "overdrive");
          return true;
        }
      }
    }
    for (const special of this.def.specials) {
      for (const btn of ["LP", "HP", "LK", "HK"] as ButtonName[]) {
        const group = btn.endsWith("P") ? "P" : "K";
        if (group === special.button && this.input.isButtonJustPressed(btn) && this.input.matchesMotion(special.motion)) {
          this.startSpecial(special, "special");
          return true;
        }
      }
    }
    return false;
  }

  private startNormal(move: NormalMove, btn: ButtonName): void {
    this.activeMove = { kind: "normal", data: move, buttonHit: btn };
    this.beginMove();
  }

  private startSpecial(move: SpecialMove, kind: "special" | "overdrive"): void {
    this.activeMove = kind === "overdrive" ? { kind: "overdrive", data: move } : { kind: "special", data: move };
    if (move.meterCost) this.meter = Math.max(0, this.meter - move.meterCost);
    this.beginMove();
  }

  private beginMove(): void {
    this.state = "attack";
    this.movePhase = "startup";
    this.moveFrame = 0;
    this.hitsLandedThisMove = 0;
    this.hitLockout = false;
    this.vx = 0;
  }

  private advanceMove(opponent: Fighter): void {
    if (!this.activeMove) {
      this.state = "idle";
      return;
    }
    const move = this.activeMove.data;
    this.moveFrame += 1;

    if (this.movePhase === "startup" && this.moveFrame >= move.startup) {
      this.movePhase = "active";
      this.moveFrame = 0;
      this.onMoveActiveStart(opponent);
    } else if (this.movePhase === "active" && this.moveFrame >= move.active) {
      this.movePhase = "recovery";
      this.moveFrame = 0;
    } else if (this.movePhase === "recovery" && this.moveFrame >= move.recovery) {
      this.activeMove = null;
      this.state = "idle";
    }
  }

  private onMoveActiveStart(_opponent: Fighter): void {
    if (!this.activeMove) return;
    const move = this.activeMove.data;
    if ("projectile" in move && move.projectile) {
      this.pendingProjectile = move;
    }
    if ("teleportBehind" in move && move.teleportBehind) {
      this.pendingTeleport = true;
    }
    if ("dashDistance" in move && move.dashDistance && !move.projectile) {
      const dir = this.facing;
      const target = Phaser.Math.Clamp(this.x + dir * move.dashDistance, STAGE_LEFT, STAGE_RIGHT);
      this.x = target;
    }
  }

  /** Called by BattleScene once per tick after handleInput, for physics + timers. */
  tick(dt: number, _opponent: Fighter): void {
    if (this.flashFramesLeft > 0) {
      this.flashFramesLeft -= 1;
      if (this.flashFramesLeft <= 0) this.flashColor = null;
    }

    if (this.state === "ko") {
      this.koFallProgress = Math.min(1, this.koFallProgress + dt / 500);
      return;
    }
    if (this.state === "win") return;

    // Gravity & vertical motion.
    if (this.state === "jump") {
      this.vy += GRAVITY * (dt / 1000);
      this.footY += this.vy * (dt / 1000);
      if (this.footY >= GROUND_Y) {
        this.footY = GROUND_Y;
        this.vy = 0;
        this.state = this.stunFramesLeft > 0 ? this.state : "idle";
      }
    }

    // Horizontal motion for walk/jump/dash/hit-reaction states.
    if (this.state === "walk" || this.state === "jump" || this.state === "dash" || this.state === "hitstun" || this.state === "blockstun") {
      this.x += this.vx * (dt / 1000);
    }

    this.x = Phaser.Math.Clamp(this.x, STAGE_LEFT, STAGE_RIGHT);
  }

  startDash(dir: 1 | -1, speed: number, durationFrames: number): void {
    this.state = "dash";
    this.dashFramesLeft = durationFrames;
    this.vx = speed * dir;
  }

  consumePendingProjectile(): SpecialMove | null {
    const p = this.pendingProjectile;
    this.pendingProjectile = null;
    return p;
  }

  consumePendingTeleport(): boolean {
    const t = this.pendingTeleport;
    this.pendingTeleport = false;
    return t;
  }

  getHurtbox(): Phaser.Geom.Rectangle {
    const h = this.currentHeight;
    return new Phaser.Geom.Rectangle(this.x - this.def.width / 2, this.footY - h, this.def.width, h);
  }

  /** Returns the active strike hitbox for the current move, or null if not in an active hit window. */
  getActiveHitbox(): Phaser.Geom.Rectangle | null {
    if (this.state !== "attack" || !this.activeMove || this.movePhase !== "active") return null;
    if (this.hitLockout) return null;
    const move = this.activeMove.data;
    if ("projectile" in move && move.projectile) return null; // projectiles hit via their own entity

    const range = move.range;
    const bandHeight = 44;
    let centerY: number;
    const heightTag = "height" in move ? move.height : "mid";
    if (heightTag === "high") centerY = this.footY - this.currentHeight - 6;
    else if (heightTag === "low") centerY = this.footY - 16;
    else centerY = this.footY - this.currentHeight * 0.5;

    const startX = this.x + this.facing * (this.def.width / 2);
    const rectX = this.facing === 1 ? startX : startX - range;
    return new Phaser.Geom.Rectangle(rectX, centerY - bandHeight / 2, range, bandHeight);
  }

  isCurrentMoveGrab(): boolean {
    if (!this.activeMove) return false;
    const m = this.activeMove.data as SpecialMove;
    return !!m.isGrab;
  }

  markHitLanded(): void {
    this.hitsLandedThisMove += 1;
    const move = this.activeMove?.data;
    const multiHit = move && "multiHit" in move ? move.multiHit ?? 1 : 1;
    if (this.hitsLandedThisMove >= multiHit) this.hitLockout = true;
    const gain = move
      ? "meterGain" in move
        ? move.meterGain
        : 0
      : 0;
    this.meter = Math.min(MAX_METER, this.meter + gain);
  }

  getPendingMoveMeta(): { damage: number; hitstun: number; blockstun: number; knockback: number; isLauncher: boolean; isGrab: boolean } | null {
    if (!this.activeMove) return null;
    const m = this.activeMove.data;
    const isLauncher = "isLauncher" in m ? !!m.isLauncher : false;
    const isGrab = "isGrab" in m ? !!m.isGrab : false;
    const knockback = "knockback" in m ? m.knockback : 200;
    return { damage: m.damage, hitstun: m.hitstun, blockstun: m.blockstun, knockback, isLauncher, isGrab };
  }

  isProjectileImmuneCurrently(): boolean {
    const move = this.activeMove?.data as SpecialMove | undefined;
    if (this.state === "attack" && move?.invincibleStartup && this.movePhase === "startup") return true;
    if (this.state === "attack" && move?.armor) return true;
    return false;
  }

  applyHit(result: HitResult, attacker: Fighter): void {
    if (result.blocked) {
      this.state = "blockstun";
      this.stunFramesLeft = result.blockstun;
      this.vx = -attacker.facing * 80;
      this.health = Math.max(0, this.health - Math.max(1, Math.floor(result.damage * 0.15)));
      this.meter = Math.min(MAX_METER, this.meter + 3);
      this.setFlash(0x6fa8ff, 6);
      return;
    }

    this.health = Math.max(0, this.health - result.damage);
    this.meter = Math.min(MAX_METER, this.meter + Math.floor(result.damage / 2));
    this.setFlash(0xff5b5b, 8);
    this.isCrouching = false;

    if (this.health <= 0) {
      this.state = "ko";
      this.koFallProgress = 0;
      this.vx = 0;
      this.vy = 0;
      return;
    }

    if (result.isLauncher) {
      this.state = "jump";
      this.vy = -560;
      this.stunFramesLeft = result.hitstun;
    } else {
      this.state = "hitstun";
      this.stunFramesLeft = result.hitstun;
    }
    this.vx = -attacker.facing * (result.knockback / (result.hitstun * FRAME_MS / 1000));
  }

  private setFlash(color: number, frames: number): void {
    this.flashColor = color;
    this.flashFramesLeft = frames;
  }

  applyPushback(otherX: number): void {
    if (this.isActionLocked() && this.state !== "attack") return;
    const dist = Math.abs(this.x - otherX);
    if (dist < PUSH_DISTANCE) {
      const dir = this.x < otherX ? -1 : 1;
      this.x = Phaser.Math.Clamp(otherX + dir * PUSH_DISTANCE, STAGE_LEFT, STAGE_RIGHT);
    }
  }

  setWin(): void {
    this.state = "win";
  }

  resetForNewRound(startX: number): void {
    this.x = startX;
    this.footY = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.health = MAX_HEALTH;
    this.state = "idle";
    this.activeMove = null;
    this.koFallProgress = 0;
  }

  render(): void {
    const g = this.graphics;
    g.clear();

    const h = this.currentHeight;
    const w = this.def.width;
    const bodyColor = this.flashColor ?? this.def.color;

    g.save();
    g.translateCanvas(this.x, this.footY);

    if (this.state === "ko") {
      g.rotateCanvas((Math.PI / 2) * this.koFallProgress * (this.facing as number));
    }

    // Legs
    g.fillStyle(this.def.accentColor, 1);
    g.fillRect(-w / 2 + 4, -h * 0.15, w / 2 - 6, h * 0.15);
    g.fillRect(2, -h * 0.15, w / 2 - 6, h * 0.15);

    // Torso
    g.fillStyle(bodyColor, 1);
    g.fillRoundedRect(-w / 2, -h, w, h * 0.85, 6);

    // Head
    g.fillStyle(this.def.accentColor, 1);
    g.fillCircle(0, -h - 12, 12);

    // Active-move limb indicator
    const hitbox = this.getActiveHitbox();
    if (hitbox) {
      g.fillStyle(0xffffff, 0.85);
      g.fillRect(hitbox.x - this.x, hitbox.y - this.footY, hitbox.width, hitbox.height);
    } else if (this.state === "attack" && this.movePhase === "startup") {
      g.fillStyle(0xffffff, 0.35);
      g.fillCircle(this.facing * (w / 2 + 8), -h * 0.5, 6);
    }

    g.restore();

    this.nameText.setPosition(this.x, this.footY - this.def.height - 26);
  }

  destroy(): void {
    this.graphics.destroy();
    this.nameText.destroy();
  }
}
