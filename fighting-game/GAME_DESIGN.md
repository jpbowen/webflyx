# Crossed Fates: Tournament of Champions

An original 2D fighting game inspired by the mechanics and tone of classic
tournament fighters (Mortal Kombat, Killer Instinct, Street Fighter) —
**no characters, names, art, or worlds from those games are used.** Every
fighter, faction, move name, and stage here is original IP, designed to hit
the same archetypes (ice ninja, cyborg soldier, martial arts master, beast
warrior, etc.) without copying anyone's copyrighted content.

## Premise

Every generation, a hidden council opens **The Crossing** — a tournament
that pulls the greatest fighters from isolated warrior traditions into one
arena to settle a single question: whose discipline is strongest? Win, and
your order's teachings are preserved for another generation. Lose, and your
tradition fades into myth.

## Core mechanics (applies to all characters)

- **Rounds**: best of 3, first to 2 round wins takes the match.
- **Timer**: 99 seconds per round; lower health wins on timeout, draw if tied.
- **Health**: 100 per fighter per round.
- **Movement**: walk forward/back, crouch, jump (neutral/forward/back), dash
  forward/back (double-tap direction).
- **Buttons**: Light Punch (LP), Heavy Punch (HP), Light Kick (LK), Heavy
  Kick (HK).
- **Block**: hold back (away from opponent); crouch-block covers low
  attacks, standing block covers high/mid.
- **Combos**: light normals chain into heavy normals chain into specials
  (light → heavy → special); launching hits allow a juggle special/finisher.
- **Meter**: builds on landing hits, blocked hits, and taking damage. At
  100%, spend it on an **Overdrive Break** — a character-unique enhanced
  special with a damage boost and a short hit-freeze for impact.
- **Motion inputs** (numpad notation, mirrors automatically with facing):
  - `QCF` (2,3,6) + Punch: forward projectile
  - `QCB` (2,1,4) + Kick: advancing/repositioning special
  - `DP` (6,2,3) + Punch: anti-air uppercut, invincible on startup

## Vertical-slice roster (build target: 3 fighters, 1 stage)

### Vex — "The Winter Reaper" (ice ninja assassin, Order of the Hollow Frost)
Fast rushdown character built around mobility and chip pressure.
- Normals: quick, short-range, low startup.
- `Frost Kunai` (QCF+P): thrown ice dagger projectile, low damage, good for
  zoning and combo extension.
- `Shadow Warp` (QCB+K): short teleport that repositions behind or in front
  of the opponent — no damage, pure mixup tool.
- `Cryo Snap` (QCB+P): dashing command grab; freezes the opponent on hit for
  a free follow-up.
- Overdrive Break: `Absolute Zero` — a rapid multi-hit dash-through combo
  ending in a freeze shatter.

### Ryoken — "The Even Hand" (martial arts master, Ryoken Dojo)
Balanced all-rounder, the "learn fighting-game fundamentals" character.
- Normals: mid-range, mid-speed, no major weaknesses.
- `Ki Wave` (QCF+P): mid-speed fireball, standard zoning tool.
- `Rising Talon` (DP+P): anti-air uppercut, fully invincible startup.
- `Cyclone Step` (QCB+K): two-hit advancing spin kick, safe pressure tool.
- Overdrive Break: `Even Hand Reckoning` — enhanced Rising Talon that juggles
  into a second uppercut.

### Titan-7 — "The Prototype" (cybernetic soldier, Forge Directive)
Heavy rushdown/zoner hybrid with armored moves.
- Normals: slower startup, higher damage and range than Vex or Ryoken.
- `Pulse Cannon` (QCF+P): fast, low-damage laser projectile (faster than
  Ki Wave, spammable at low meter cost).
- `Piston Drill` (DP+P): multi-hit anti-air uppercut.
- `Overload Dash` (QCB+K): forward-dashing punch with armor — absorbs one
  hit on the way in.
- Overdrive Break: `Core Overload` — armored dash grab into a point-blank
  cannon blast.

## Stage (vertical slice)

**The Proving Grounds** — a neutral stone arena ringed by torches, used for
the tournament's opening bouts before fighters are sent to their faction's
home stage. Plain, symmetrical, no gimmicks — a fair testing ground for
tuning the core engine.

## Post-slice roster plan (not built yet, design targets for expansion)

| Archetype (inspired by) | Working name | Faction |
|---|---|---|
| Beast warrior (Sabrewulf-like) | Kessek | The Wildwood Pact |
| Military striker (Jax/Cammy-like) | Sgt. Reyna Cole | Forge Directive |
| Fire mystic (Liu Kang-like) | Brother Ashen | Order of the Ember Sun |
| Giant grappler (Zangief-like) | Ursk the Unmoved | The Wildwood Pact |
| Masked trickster luchador | El Espejo | Independent |

Each gets its own home stage tied to its faction once the vertical slice
mechanics are validated.

## Tournament structure (full game target)

- **Exhibition**: P1 vs P2 (local) or P1 vs CPU, single match, any stage.
- **The Crossing (ladder mode)**: single-elimination 8-fighter bracket vs
  increasingly difficult CPU, ending in a boss-tier final bout against the
  council's champion (a 9th, unlockable secret fighter — design TBD).

## Art plan

The vertical slice ships with **procedural placeholder art** (generated
rectangle/circle rigs, no external files needed) so the engine is playable
immediately without asset licensing questions blocking progress.

To reskin with real sprites later, recommended CC0/open-license sources
(verify license terms on each page before use, they occasionally change):
- itch.io tag [`cc0`](https://itch.io/game-assets/tag-cc0) + search
  "fighter" / "brawler" / "martial arts sprite" — several free 2D fighting
  character sheets with idle/walk/punch/kick/hit/KO frames already split.
- OpenGameArt.org, filtered to CC0 license, "fighter" or "martial arts"
  tags — a long-running library of free sprite sheets.
- Kenney.nl (CC0 by default) — has stylized character packs suitable for a
  simplified, non-photoreal fighting game look.

The `Fighter` class in code (`src/entities/Fighter.ts`) isolates rendering
in one method so swapping procedural graphics for a real `Phaser.Sprite` +
animation frames is a contained change, not a rewrite.
