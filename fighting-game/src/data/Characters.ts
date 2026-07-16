import { MOTION_QCB, MOTION_QCF, MOTION_DP } from "../entities/InputController";
import type { CharacterDef } from "./CharacterTypes";

const OVERDRIVE_MOTION = [...MOTION_QCF, ...MOTION_QCF];

export const VEX: CharacterDef = {
  id: "vex",
  name: "Vex",
  title: "The Winter Reaper",
  faction: "Order of the Hollow Frost",
  color: 0x4fd6e8,
  accentColor: 0xe8fbff,
  walkSpeed: 210,
  dashSpeed: 520,
  jumpVelocity: -800,
  width: 46,
  height: 128,
  normals: {
    LP: { name: "Quick Jab", startup: 4, active: 3, recovery: 6, damage: 4, hitstun: 10, blockstun: 7, range: 60, height: "high", knockback: 40, meterGain: 4 },
    HP: { name: "Frost Palm", startup: 8, active: 4, recovery: 12, damage: 10, hitstun: 16, blockstun: 11, range: 68, height: "high", knockback: 120, meterGain: 7 },
    LK: { name: "Shin Cutter", startup: 5, active: 3, recovery: 7, damage: 5, hitstun: 10, blockstun: 7, range: 58, height: "low", knockback: 40, meterGain: 4 },
    HK: { name: "Rising Heel", startup: 9, active: 4, recovery: 14, damage: 11, hitstun: 18, blockstun: 12, range: 66, height: "mid", knockback: 160, meterGain: 8, isLauncher: true }
  },
  specials: [
    {
      id: "frost_kunai", name: "Frost Kunai", motion: MOTION_QCF, button: "P",
      startup: 10, active: 40, recovery: 16, damage: 8, hitstun: 14, blockstun: 10,
      meterGain: 8, range: 900, projectile: true, projectileSpeed: 620
    },
    {
      id: "shadow_warp", name: "Shadow Warp", motion: MOTION_QCB, button: "K",
      startup: 12, active: 1, recovery: 18, damage: 0, hitstun: 0, blockstun: 0,
      meterGain: 6, range: 0, teleportBehind: true
    },
    {
      id: "cryo_snap", name: "Cryo Snap", motion: MOTION_QCB, button: "P",
      startup: 8, active: 6, recovery: 20, damage: 16, hitstun: 26, blockstun: 0,
      meterGain: 10, range: 90, isGrab: true, dashDistance: 120
    }
  ],
  overdrive: {
    id: "absolute_zero", name: "Absolute Zero", motion: OVERDRIVE_MOTION, button: "P", isOverdrive: true,
    startup: 6, active: 20, recovery: 24, damage: 32, hitstun: 40, blockstun: 20,
    meterGain: 0, meterCost: 100, range: 140, dashDistance: 160
  }
};

export const RYOKEN: CharacterDef = {
  id: "ryoken",
  name: "Ryoken",
  title: "The Even Hand",
  faction: "Ryoken Dojo",
  color: 0xe8b04f,
  accentColor: 0xfff3df,
  walkSpeed: 180,
  dashSpeed: 460,
  jumpVelocity: -820,
  width: 48,
  height: 132,
  normals: {
    LP: { name: "Straight", startup: 5, active: 3, recovery: 7, damage: 5, hitstun: 11, blockstun: 8, range: 64, height: "high", knockback: 45, meterGain: 4 },
    HP: { name: "Palm Thrust", startup: 9, active: 4, recovery: 13, damage: 11, hitstun: 17, blockstun: 12, range: 72, height: "high", knockback: 130, meterGain: 7 },
    LK: { name: "Low Sweep", startup: 6, active: 3, recovery: 9, damage: 6, hitstun: 12, blockstun: 8, range: 66, height: "low", knockback: 60, meterGain: 5 },
    HK: { name: "Axe Kick", startup: 10, active: 4, recovery: 15, damage: 12, hitstun: 19, blockstun: 13, range: 70, height: "mid", knockback: 170, meterGain: 8, isLauncher: true }
  },
  specials: [
    {
      id: "ki_wave", name: "Ki Wave", motion: MOTION_QCF, button: "P",
      startup: 14, active: 40, recovery: 18, damage: 10, hitstun: 16, blockstun: 12,
      meterGain: 8, range: 900, projectile: true, projectileSpeed: 460
    },
    {
      id: "rising_talon", name: "Rising Talon", motion: MOTION_DP, button: "P",
      startup: 4, active: 10, recovery: 24, damage: 18, hitstun: 28, blockstun: 14,
      meterGain: 10, range: 80, invincibleStartup: true
    },
    {
      id: "cyclone_step", name: "Cyclone Step", motion: MOTION_QCB, button: "K",
      startup: 10, active: 14, recovery: 18, damage: 14, hitstun: 20, blockstun: 14,
      meterGain: 9, range: 110, multiHit: 2, dashDistance: 90
    }
  ],
  overdrive: {
    id: "even_hand_reckoning", name: "Even Hand Reckoning", motion: OVERDRIVE_MOTION, button: "P", isOverdrive: true,
    startup: 4, active: 24, recovery: 22, damage: 34, hitstun: 40, blockstun: 20,
    meterGain: 0, meterCost: 100, range: 90, invincibleStartup: true
  }
};

export const TITAN7: CharacterDef = {
  id: "titan7",
  name: "Titan-7",
  title: "The Prototype",
  faction: "Forge Directive",
  color: 0xd64f5c,
  accentColor: 0xffe0e2,
  walkSpeed: 160,
  dashSpeed: 440,
  jumpVelocity: -780,
  width: 54,
  height: 140,
  normals: {
    LP: { name: "Servo Jab", startup: 6, active: 3, recovery: 8, damage: 6, hitstun: 11, blockstun: 8, range: 66, height: "high", knockback: 50, meterGain: 4 },
    HP: { name: "Piston Cross", startup: 11, active: 5, recovery: 16, damage: 14, hitstun: 19, blockstun: 13, range: 76, height: "high", knockback: 150, meterGain: 8 },
    LK: { name: "Heel Stomp", startup: 7, active: 3, recovery: 10, damage: 7, hitstun: 12, blockstun: 9, range: 68, height: "low", knockback: 55, meterGain: 5 },
    HK: { name: "Cleave Kick", startup: 12, active: 5, recovery: 18, damage: 15, hitstun: 20, blockstun: 14, range: 74, height: "mid", knockback: 180, meterGain: 9, isLauncher: true }
  },
  specials: [
    {
      id: "pulse_cannon", name: "Pulse Cannon", motion: MOTION_QCF, button: "P",
      startup: 8, active: 40, recovery: 14, damage: 7, hitstun: 12, blockstun: 9,
      meterGain: 6, range: 900, projectile: true, projectileSpeed: 760
    },
    {
      id: "piston_drill", name: "Piston Drill", motion: MOTION_DP, button: "P",
      startup: 5, active: 14, recovery: 26, damage: 20, hitstun: 30, blockstun: 16,
      meterGain: 11, range: 84, multiHit: 3
    },
    {
      id: "overload_dash", name: "Overload Dash", motion: MOTION_QCB, button: "K",
      startup: 9, active: 10, recovery: 20, damage: 16, hitstun: 22, blockstun: 15,
      meterGain: 9, range: 100, armor: true, dashDistance: 180
    }
  ],
  overdrive: {
    id: "core_overload", name: "Core Overload", motion: OVERDRIVE_MOTION, button: "P", isOverdrive: true,
    startup: 8, active: 18, recovery: 26, damage: 36, hitstun: 42, blockstun: 20,
    meterGain: 0, meterCost: 100, range: 110, isGrab: true, armor: true, dashDistance: 140
  }
};

export const ROSTER: CharacterDef[] = [VEX, RYOKEN, TITAN7];
