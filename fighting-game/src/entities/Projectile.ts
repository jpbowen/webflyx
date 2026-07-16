import Phaser from "phaser";
import { GROUND_Y } from "../config/GameConfig";

export class Projectile {
  x: number;
  y: number;
  vx: number;
  owner: "p1" | "p2";
  damage: number;
  hitstun: number;
  blockstun: number;
  alive = true;
  readonly width = 26;
  readonly height = 20;
  graphics: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    facing: 1 | -1,
    owner: "p1" | "p2",
    speed: number,
    damage: number,
    hitstun: number,
    blockstun: number,
    color: number
  ) {
    this.x = x;
    this.y = GROUND_Y - 64;
    this.vx = speed * facing;
    this.owner = owner;
    this.damage = damage;
    this.hitstun = hitstun;
    this.blockstun = blockstun;
    this.graphics = scene.add.graphics();
    this.graphics.fillStyle(color, 1);
    this.graphics.fillEllipse(0, 0, this.width, this.height);
    this.graphics.lineStyle(2, 0xffffff, 0.8);
    this.graphics.strokeEllipse(0, 0, this.width, this.height);
  }

  update(dt: number): void {
    this.x += this.vx * (dt / 1000);
    this.graphics.setPosition(this.x, this.y);
  }

  getHitbox(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );
  }

  destroy(): void {
    this.alive = false;
    this.graphics.destroy();
  }
}
