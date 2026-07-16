import Phaser from "phaser";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../config/GameConfig";
import type { MatchResult } from "./MatchConfig";

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super("Results");
  }

  create(result: MatchResult): void {
    const cx = SCREEN_WIDTH / 2;
    const winner = result.winnerSide === "p1" ? result.p1 : result.p2;
    const loser = result.winnerSide === "p1" ? result.p2 : result.p1;

    this.add.rectangle(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, 0x0d0d14).setOrigin(0);

    this.add.text(cx, 90, "VICTORY", {
      fontFamily: "monospace", fontSize: "52px", color: "#ffd75b", fontStyle: "bold"
    }).setOrigin(0.5);

    // Winner effigy.
    this.add.rectangle(cx, 250, 70, 120, winner.color);
    this.add.circle(cx, 174, 20, winner.accentColor);

    this.add.text(cx, 330, winner.name.toUpperCase(), {
      fontFamily: "monospace", fontSize: "30px", color: "#ffffff"
    }).setOrigin(0.5);
    this.add.text(cx, 362, `"${winner.title}"`, {
      fontFamily: "monospace", fontSize: "16px", color: "#8fd0ff"
    }).setOrigin(0.5);
    this.add.text(cx, 392, `${winner.faction}`, {
      fontFamily: "monospace", fontSize: "13px", color: "#9aa0aa"
    }).setOrigin(0.5);

    this.add.text(cx, 430, `defeats ${loser.name}   —   ${result.p1Rounds} : ${result.p2Rounds}`, {
      fontFamily: "monospace", fontSize: "16px", color: "#cfd4dc"
    }).setOrigin(0.5);

    const prompt = this.add.text(cx, SCREEN_HEIGHT - 50, "ENTER: rematch setup    ESC: title", {
      fontFamily: "monospace", fontSize: "16px", color: "#ffffff"
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    this.input.keyboard!.once("keydown-ENTER", () => this.scene.start("CharacterSelect"));
    this.input.keyboard!.once("keydown-ESC", () => this.scene.start("Boot"));
  }
}
