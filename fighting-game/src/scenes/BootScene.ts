import Phaser from "phaser";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../config/GameConfig";

/** Title screen. Explains controls and starts the flow. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    const cx = SCREEN_WIDTH / 2;

    this.add.text(cx, 90, "CROSSED FATES", {
      fontFamily: "monospace",
      fontSize: "56px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(cx, 140, "Tournament of Champions", {
      fontFamily: "monospace",
      fontSize: "22px",
      color: "#8fd0ff"
    }).setOrigin(0.5);

    const controls = [
      "P1  move: A/D   jump: W   crouch: S",
      "P1  attacks: U=LP  I=HP  J=LK  K=HK",
      "",
      "P2  move: ←/→   jump: ↑   crouch: ↓",
      "P2  attacks: Num4=LP Num5=HP Num1=LK Num2=HK",
      "",
      "Specials: e.g. QCF+P (down, down-fwd, fwd + punch)",
      "Overdrive: double-QCF + P at full meter"
    ];
    this.add.text(cx, 250, controls.join("\n"), {
      fontFamily: "monospace",
      fontSize: "15px",
      color: "#cfd4dc",
      align: "center",
      lineSpacing: 6
    }).setOrigin(0.5, 0);

    const prompt = this.add.text(cx, SCREEN_HEIGHT - 60, "Press ENTER to begin", {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#ffd75b"
    }).setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.2,
      duration: 700,
      yoyo: true,
      repeat: -1
    });

    this.input.keyboard!.once("keydown-ENTER", () => {
      this.scene.start("CharacterSelect");
    });
  }
}
