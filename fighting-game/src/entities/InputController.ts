import Phaser from "phaser";
import type { PlayerSide } from "../config/GameConfig";

/** Numpad notation: 7 8 9 / 4 5 6 / 1 2 3. Always expressed relative to
 * the fighter's current facing (6 = forward, 4 = back) so motion
 * definitions don't need a mirrored copy per side. */
export type NumpadDir = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const MOTION_QCF: NumpadDir[] = [2, 3, 6];
export const MOTION_QCB: NumpadDir[] = [2, 1, 4];
export const MOTION_DP: NumpadDir[] = [6, 2, 3];

const MIRROR: Record<NumpadDir, NumpadDir> = {
  1: 3, 2: 2, 3: 1,
  4: 6, 5: 5, 6: 4,
  7: 9, 8: 8, 9: 7
};

const BUFFER_LENGTH = 30; // ~0.5s at 60fps

export type ButtonName = "LP" | "HP" | "LK" | "HK";

/** Raw per-frame input, in absolute screen terms (not facing-relative).
 * Produced either by reading the keyboard or by the AI controller. */
export interface RawFrameInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  buttons: Record<ButtonName, boolean>;
}

interface KeyMap {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  LP: Phaser.Input.Keyboard.Key;
  HP: Phaser.Input.Keyboard.Key;
  LK: Phaser.Input.Keyboard.Key;
  HK: Phaser.Input.Keyboard.Key;
}

const EMPTY_FRAME = (): RawFrameInput => ({
  left: false, right: false, up: false, down: false,
  buttons: { LP: false, HP: false, LK: false, HK: false }
});

export class InputController {
  public facing: "left" | "right" = "right";

  /** When set, input is read from here instead of the keyboard (CPU control). */
  private virtualSource: (() => RawFrameInput) | null = null;

  private keys: KeyMap | null = null;
  private rawBuffer: NumpadDir[] = [];
  private prevButtonState: Record<ButtonName, boolean> = {
    LP: false, HP: false, LK: false, HK: false
  };
  private justPressed: Record<ButtonName, boolean> = {
    LP: false, HP: false, LK: false, HK: false
  };
  private held: RawFrameInput = EMPTY_FRAME();
  private upWasHeld = false;
  public jumpPressed = false;

  private forwardHeldPrev = false;
  private backHeldPrev = false;
  private lastForwardPress = -Infinity;
  private lastBackPress = -Infinity;
  public dashForward = false;
  public dashBack = false;

  constructor(scene: Phaser.Scene, side: PlayerSide) {
    const KC = Phaser.Input.Keyboard.KeyCodes;
    const kb = scene.input.keyboard!;
    if (side === "p1") {
      this.keys = {
        left: kb.addKey(KC.A),
        right: kb.addKey(KC.D),
        up: kb.addKey(KC.W),
        down: kb.addKey(KC.S),
        LP: kb.addKey(KC.U),
        HP: kb.addKey(KC.I),
        LK: kb.addKey(KC.J),
        HK: kb.addKey(KC.K)
      };
    } else {
      this.keys = {
        left: kb.addKey(KC.LEFT),
        right: kb.addKey(KC.RIGHT),
        up: kb.addKey(KC.UP),
        down: kb.addKey(KC.DOWN),
        LP: kb.addKey(KC.NUMPAD_FOUR),
        HP: kb.addKey(KC.NUMPAD_FIVE),
        LK: kb.addKey(KC.NUMPAD_ONE),
        HK: kb.addKey(KC.NUMPAD_TWO)
      };
    }
  }

  /** Switch this controller to CPU control, driven by the given source. */
  setVirtualSource(source: () => RawFrameInput): void {
    this.virtualSource = source;
  }

  private readRaw(): RawFrameInput {
    if (this.virtualSource) return this.virtualSource();
    const k = this.keys!;
    return {
      left: k.left.isDown,
      right: k.right.isDown,
      up: k.up.isDown,
      down: k.down.isDown,
      buttons: {
        LP: k.LP.isDown,
        HP: k.HP.isDown,
        LK: k.LK.isDown,
        HK: k.HK.isDown
      }
    };
  }

  /** Sample current input state. Call once per fixed-update tick. */
  update(): void {
    const frame = this.readRaw();
    this.held = frame;
    const { left, right, up, down } = frame;

    this.jumpPressed = up && !this.upWasHeld;
    this.upWasHeld = up;

    let absDir: NumpadDir = 5;
    if (up && left) absDir = 7;
    else if (up && right) absDir = 9;
    else if (down && left) absDir = 1;
    else if (down && right) absDir = 3;
    else if (up) absDir = 8;
    else if (down) absDir = 2;
    else if (left) absDir = 4;
    else if (right) absDir = 6;

    const relDir = this.facing === "left" ? MIRROR[absDir] : absDir;
    this.rawBuffer.push(relDir);
    if (this.rawBuffer.length > BUFFER_LENGTH) this.rawBuffer.shift();

    (Object.keys(this.prevButtonState) as ButtonName[]).forEach((name) => {
      const isDown = frame.buttons[name];
      this.justPressed[name] = isDown && !this.prevButtonState[name];
      this.prevButtonState[name] = isDown;
    });

    const forwardHeld = this.facing === "right" ? right : left;
    const backHeld = this.facing === "right" ? left : right;
    this.dashForward = false;
    this.dashBack = false;
    const now = performance.now();
    if (forwardHeld && !this.forwardHeldPrev) {
      if (now - this.lastForwardPress < 280) this.dashForward = true;
      this.lastForwardPress = now;
    }
    if (backHeld && !this.backHeldPrev) {
      if (now - this.lastBackPress < 280) this.dashBack = true;
      this.lastBackPress = now;
    }
    this.forwardHeldPrev = forwardHeld;
    this.backHeldPrev = backHeld;
  }

  isButtonJustPressed(name: ButtonName): boolean {
    return this.justPressed[name];
  }

  isLeftHeld(): boolean {
    return this.held.left;
  }

  isRightHeld(): boolean {
    return this.held.right;
  }

  isDownHeld(): boolean {
    return this.held.down;
  }

  /** True if `back` (away from opponent) is currently held - used for blocking. */
  isBackHeld(): boolean {
    return this.facing === "right" ? this.isLeftHeld() : this.isRightHeld();
  }

  isForwardHeld(): boolean {
    return this.facing === "right" ? this.isRightHeld() : this.isLeftHeld();
  }

  currentRelativeDir(): NumpadDir {
    return this.rawBuffer[this.rawBuffer.length - 1] ?? 5;
  }

  /** Checks whether the recent direction buffer ends with the given motion. */
  matchesMotion(motion: NumpadDir[]): boolean {
    const compressed: NumpadDir[] = [];
    for (const d of this.rawBuffer) {
      if (d !== 5 && compressed[compressed.length - 1] !== d) {
        compressed.push(d);
      }
    }
    if (compressed.length < motion.length) return false;
    const tail = compressed.slice(-motion.length);
    return tail.every((v, i) => v === motion[i]);
  }
}
