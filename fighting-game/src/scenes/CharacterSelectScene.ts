import Phaser from "phaser";
import { SCREEN_WIDTH } from "../config/GameConfig";
import { ROSTER } from "../data/Characters";
import type { AIDifficulty } from "../entities/AIController";
import type { MatchConfig, MatchMode } from "./MatchConfig";

type Phase = "mode" | "p1" | "p2" | "difficulty";

const DIFFICULTIES: AIDifficulty[] = ["rookie", "veteran", "champion"];

export class CharacterSelectScene extends Phaser.Scene {
  private phase: Phase = "mode";
  private mode: MatchMode = "cpu";
  private modeIndex = 0;
  private p1Index = 0;
  private p2Index = 1;
  private difficultyIndex = 1;

  private p1Pick = -1;
  private p2Pick = -1;

  private title!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private cards: Phaser.GameObjects.Container[] = [];
  private modeText!: Phaser.GameObjects.Text;
  private diffText!: Phaser.GameObjects.Text;

  constructor() {
    super("CharacterSelect");
  }

  create(): void {
    this.phase = "mode";
    this.p1Pick = -1;
    this.p2Pick = -1;
    this.p1Index = 0;
    this.p2Index = 1;

    this.title = this.add.text(SCREEN_WIDTH / 2, 40, "", {
      fontFamily: "monospace", fontSize: "28px", color: "#ffffff"
    }).setOrigin(0.5);

    this.modeText = this.add.text(SCREEN_WIDTH / 2, 150, "", {
      fontFamily: "monospace", fontSize: "22px", color: "#ffd75b", align: "center"
    }).setOrigin(0.5);

    this.diffText = this.add.text(SCREEN_WIDTH / 2, 220, "", {
      fontFamily: "monospace", fontSize: "20px", color: "#8fd0ff", align: "center"
    }).setOrigin(0.5);

    this.buildCards();

    this.hint = this.add.text(SCREEN_WIDTH / 2, 500, "", {
      fontFamily: "monospace", fontSize: "15px", color: "#cfd4dc", align: "center"
    }).setOrigin(0.5);

    this.input.keyboard!.on("keydown-LEFT", () => this.move(-1));
    this.input.keyboard!.on("keydown-RIGHT", () => this.move(1));
    this.input.keyboard!.on("keydown-A", () => this.move(-1));
    this.input.keyboard!.on("keydown-D", () => this.move(1));
    this.input.keyboard!.on("keydown-ENTER", () => this.confirm());
    this.input.keyboard!.on("keydown-SPACE", () => this.confirm());
    this.input.keyboard!.on("keydown-BACKSPACE", () => this.back());

    this.refresh();
  }

  private buildCards(): void {
    const n = ROSTER.length;
    const cardW = 190;
    const gap = 26;
    const totalW = n * cardW + (n - 1) * gap;
    const startX = (SCREEN_WIDTH - totalW) / 2 + cardW / 2;
    const y = 360;

    ROSTER.forEach((char, i) => {
      const x = startX + i * (cardW + gap);
      const container = this.add.container(x, y);

      const bg = this.add.rectangle(0, 0, cardW, 150, 0x1c1c28).setStrokeStyle(3, 0x333344);
      const swatch = this.add.rectangle(0, -30, 46, 70, char.color);
      const head = this.add.circle(0, -74, 12, char.accentColor);
      const name = this.add.text(0, 28, char.name, {
        fontFamily: "monospace", fontSize: "18px", color: "#ffffff"
      }).setOrigin(0.5);
      const title = this.add.text(0, 50, char.title, {
        fontFamily: "monospace", fontSize: "11px", color: "#9aa0aa"
      }).setOrigin(0.5);

      container.add([bg, swatch, head, name, title]);
      container.setData("bg", bg);
      this.cards.push(container);
    });
  }

  private move(dir: number): void {
    if (this.phase === "mode") {
      this.modeIndex = (this.modeIndex + dir + 2) % 2;
      this.mode = this.modeIndex === 0 ? "cpu" : "versus";
    } else if (this.phase === "difficulty") {
      this.difficultyIndex = (this.difficultyIndex + dir + DIFFICULTIES.length) % DIFFICULTIES.length;
    } else if (this.phase === "p1") {
      this.p1Index = (this.p1Index + dir + ROSTER.length) % ROSTER.length;
    } else if (this.phase === "p2") {
      this.p2Index = (this.p2Index + dir + ROSTER.length) % ROSTER.length;
    }
    this.refresh();
  }

  private confirm(): void {
    if (this.phase === "mode") {
      this.phase = this.mode === "cpu" ? "difficulty" : "p1";
    } else if (this.phase === "difficulty") {
      this.phase = "p1";
    } else if (this.phase === "p1") {
      this.p1Pick = this.p1Index;
      if (this.mode === "cpu") {
        // CPU auto-picks a different character; player still gets to pick p2? No:
        // in CPU mode P1 is human, P2 is CPU chosen next by the same picker.
        this.phase = "p2";
      } else {
        this.phase = "p2";
      }
    } else if (this.phase === "p2") {
      this.p2Pick = this.p2Index;
      this.startMatch();
      return;
    }
    this.refresh();
  }

  private back(): void {
    if (this.phase === "p2") this.phase = "p1";
    else if (this.phase === "p1") this.phase = this.mode === "cpu" ? "difficulty" : "mode";
    else if (this.phase === "difficulty") this.phase = "mode";
    this.refresh();
  }

  private refresh(): void {
    const modeLabel = this.mode === "cpu" ? "ARCADE (vs CPU)" : "VERSUS (2 players)";
    if (this.phase === "mode") {
      this.title.setText("SELECT MODE");
      this.modeText.setText(`◄  ${modeLabel}  ►`);
      this.diffText.setText("");
      this.hint.setText("←/→ change mode   ENTER confirm");
      this.setCardsVisible(false);
    } else if (this.phase === "difficulty") {
      this.title.setText("SELECT DIFFICULTY");
      this.modeText.setText(modeLabel);
      this.diffText.setText(`◄  ${DIFFICULTIES[this.difficultyIndex].toUpperCase()}  ►`);
      this.hint.setText("←/→ change   ENTER confirm   BACKSPACE back");
      this.setCardsVisible(false);
    } else {
      const who = this.phase === "p1" ? "PLAYER 1" : this.mode === "cpu" ? "CPU OPPONENT" : "PLAYER 2";
      this.title.setText(`${who}: CHOOSE YOUR FIGHTER`);
      this.modeText.setText("");
      this.diffText.setText("");
      this.hint.setText("←/→ move   ENTER select   BACKSPACE back");
      this.setCardsVisible(true);
      const active = this.phase === "p1" ? this.p1Index : this.p2Index;
      this.cards.forEach((c, i) => {
        const bg = c.getData("bg") as Phaser.GameObjects.Rectangle;
        const selected = i === active;
        const lockedByP1 = this.phase === "p2" && i === this.p1Pick;
        bg.setStrokeStyle(3, selected ? 0xffd75b : lockedByP1 ? 0xff6b6b : 0x333344);
        c.setScale(selected ? 1.06 : 1);
      });
    }
  }

  private setCardsVisible(v: boolean): void {
    this.cards.forEach((c) => c.setVisible(v));
  }

  private startMatch(): void {
    const cfg: MatchConfig = {
      mode: this.mode,
      p1: ROSTER[this.p1Pick],
      p2: ROSTER[this.p2Pick],
      difficulty: DIFFICULTIES[this.difficultyIndex]
    };
    this.cleanup();
    this.scene.start("Battle", cfg);
  }

  private cleanup(): void {
    this.input.keyboard!.removeAllListeners();
    this.cards.forEach((c) => c.destroy());
    this.cards = [];
  }
}
