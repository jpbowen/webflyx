# Crossed Fates: Tournament of Champions

An **original** 2D fighting game built with Phaser 3 + TypeScript. It's a
tournament-fighter in the spirit of the classics of the genre — special-move
motions, chain combos, a super meter, best-of-three rounds — but every
character, name, world, move, and piece of art here is **original**. No
copyrighted characters or assets from any commercial game are used or
required. See [`GAME_DESIGN.md`](./GAME_DESIGN.md) for the full spec.

## Status: playable vertical slice

- 3 original fighters, each a distinct archetype and playstyle
- 1 stage (The Proving Grounds)
- Core combat: normals, chain combos, special moves via motion inputs,
  a super meter + Overdrive Break, blocking (high/low/mid), projectiles,
  best-of-3 rounds with a round timer
- **Arcade** mode (vs CPU, 3 difficulty tiers) and **Versus** mode (local 2P)

## Run it

```bash
cd fighting-game
npm install
npm run dev      # open the printed http://localhost:5173 URL
```

Build a static bundle with `npm run build` (output in `dist/`).

## Controls

| | Player 1 | Player 2 |
|---|---|---|
| Move / crouch | `A` `D` / `S` | `←` `→` / `↓` |
| Jump | `W` | `↑` |
| Light / Heavy Punch | `U` / `I` | `Num4` / `Num5` |
| Light / Heavy Kick | `J` / `K` | `Num1` / `Num2` |

Menus: `←/→` to move, `Enter` to confirm, `Backspace` to go back.

### Motion inputs (relative to facing)

- **QCF + Punch** — quarter-circle forward (down, down-forward, forward):
  projectile / fireball-type special
- **QCB + Kick** — quarter-circle back: advancing / repositioning special
- **DP + Punch** — dragon-punch (forward, down, down-forward): invincible
  anti-air uppercut
- **Overdrive Break** — double QCF + Punch at full meter: character's
  enhanced super

Each fighter maps these to their own moves — see `GAME_DESIGN.md` for the
per-character move list.

## The roster (all original characters)

| Fighter | Archetype | Faction | Playstyle |
|---|---|---|---|
| **Vex** — "The Winter Reaper" | Ice ninja assassin | Order of the Hollow Frost | Fast rushdown, teleport mixups, freezes |
| **Ryoken** — "The Even Hand" | Martial-arts master | Ryoken Dojo | Balanced all-rounder, fireball + invincible uppercut |
| **Titan-7** — "The Prototype" | Cybernetic soldier | Forge Directive | Heavy hitter, armored dashes, fast laser |

## Project layout

```
fighting-game/
├── GAME_DESIGN.md          # full design spec + expansion roadmap
├── index.html
├── src/
│   ├── main.ts             # Phaser game bootstrap
│   ├── config/GameConfig.ts
│   ├── data/               # character definitions & types (all original)
│   ├── entities/
│   │   ├── Fighter.ts         # state machine, moves, hit/hurtboxes, rendering
│   │   ├── InputController.ts # keyboard + virtual (AI) input, motion detection
│   │   ├── AIController.ts     # CPU opponent
│   │   └── Projectile.ts
│   └── scenes/             # Boot, CharacterSelect, Battle, Results
```

## Art

The slice ships with **procedural placeholder art** (drawn with Phaser
graphics — no external asset files), so it runs immediately with no asset
licensing to sort out. Rendering is isolated to `Fighter.render()`, so
swapping in real sprite sheets later is a contained change. Recommended
CC0 / open-license sprite sources are listed at the bottom of
`GAME_DESIGN.md`.

## Roadmap

The design doc details the next steps: expand to the full 8+ fighter roster
with faction home stages, add the single-elimination **The Crossing** ladder
mode with a boss fight, and (once the feel is locked in) reskin the
procedural fighters with real animated sprites.
