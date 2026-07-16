import Phaser from "phaser";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "./config/GameConfig";
import { BootScene } from "./scenes/BootScene";
import { CharacterSelectScene } from "./scenes/CharacterSelectScene";
import { BattleScene } from "./scenes/BattleScene";
import { ResultsScene } from "./scenes/ResultsScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-root",
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  backgroundColor: "#12121a",
  pixelArt: false,
  physics: { default: "arcade" },
  fps: { target: 60, forceSetTimeOut: true },
  scene: [BootScene, CharacterSelectScene, BattleScene, ResultsScene]
};

new Phaser.Game(config);
