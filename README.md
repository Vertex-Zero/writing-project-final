# DOLCE

A multiplayer browser social-deduction game built around *the Still Moment*.

Jackbox-style: one host screen, every other player on a phone. 2–20 players
(1 Distraction per ~5 players).

## Run

```bash
npm install
npm start
```

Open `http://localhost:3000` on the host machine → **Host on this screen**.
You'll get a 4-letter room code. Other players open the same URL on their
phones (same LAN — use your laptop's IP, e.g. `http://192.168.x.x:3000`),
type the code, pick a name, and wait. When 2+ have joined, host presses **Begin**.

## The map — Skeld-inspired decks + corridors

```
[ARCHIVE] [LIBRARY] [CAFETERIA] [ARCADE] [WORKSHOP]
    |        |          |          |         |
   ╶─────────────── corridors ────────────────╴
    |        |          |          |         |
  [LAB]   [CAFÉ]    [STORAGE]   [LOUNGE]  [TRANSIT]
                        |
                      [PARK]
```

Two decks of rooms joined by short corridors and three vertical spurs
(left, center, right) plus a south spur from STORAGE down to PARK. Each
Seeker is dealt **four personal tasks** at game start — walking into a
room you don't have a task for shows "no task here for you." That means
you actually have to traverse the map.

Task types include: **hold · reaction · statement · sequence · pour ·
rhythm · swipe card · fix wires · unlock safe · align engine.**

## The concept

One or more players are secretly **The Distraction** (1 per ~5 players).
Everyone else is a **Seeker**.

The **Calm** bar is the crew's task progress: it fills as Seekers complete
their personal task lists. The Distraction can't do tasks but has four
sabotages on a 15s cooldown:

- **INTRUDE** — resets one Seeker's task mid-completion
- **FRAGMENT** — all task timers warp for 12s
- **REDIRECT** — silently swaps the locations of two random Seekers
- **BLACKOUT** — every Seeker's screen goes dark for 7s

Fill **Calm** → Seekers win. Fill **Chaos** (sabotages + failed tasks +
wrong votes) → Distraction wins. The Distraction can also win by surviving
voting.

## The Still Moment

Every ~90 seconds, without warning, the world freezes. Tasks pause. The
host screen dims. A single question appears on every player's phone. 10
seconds to type a one-word answer.

**The Distraction gets a different question** — an off-key variation of the
one Seekers see ("What are you most afraid of right now?" vs "What's the
most impressive thing about you?"). Nobody is told the questions diverged.

All answers are revealed anonymously on the host screen. Sharp Seekers
catch The Distraction by reading the tonal mismatch.

## Meetings

Any player can call one from their phone. Max 2 per game. A situation card
appears ("The person next to you hasn't moved in three minutes."). 60 s of
chat, 30 s of voting. Majority ejects — ties skip. Role is revealed.

*The Distraction cannot lie in meetings — but they can misdirect.* (This is a
social rule; the code doesn't enforce it.)

## End screen

Reveals who The Distraction was, plus every Still Moment that happened —
labeled by player, with the mismatched answers highlighted in amber:
**"This is what didn't fit."**

## Vents

Every themed room has a vent. The Distraction can step onto a vent and tap
**VENT** to teleport to any other room's vent — Among Us-style fast travel
that Seekers can't use.

## Kill & report

The Distraction has a **KILL** ability with a 25-second cooldown (and a
12-second opening grace at game start). When a Seeker walks into close
range, the ACT button on the Distraction's phone flips into red **KILL**
— tap to eliminate the Seeker and leave a body behind.

Anyone (Seeker or Distraction) can find a body. When you walk close to
one, ACT flips into orange **REPORT** — tapping triggers a free meeting
that doesn't consume the emergency button. Bodies clear when a meeting
starts.

## Controls

- **Phone**: D-pad or WASD to move. ACT is context-aware:
  - On a vent (Distraction) → **VENT**
  - In range of a Seeker (Distraction) → **KILL**
  - Near a body → **REPORT**
  - Otherwise, in a room with an assigned task → starts the task
- **Lobby**: pick your crewmate color from the palette.
- **Host**: just watches the map and bars.

## Meetings

When someone calls a meeting, the screen takes over with a big
**EMERGENCY MEETING** banner, the caller's name in their crew color, and
a grid of crewmate avatars. Click a crewmate during VOTE to vote them
out, or skip.

## Notes

- All visuals are drawn procedurally on a `<canvas>` in a clean
  cartoon-vector style — no external image bundle. Each room has a
  bespoke set of hero props (bookshelves, lab bench, arcade cabinets,
  trees, espresso bar, train, fountain). Sound effects are synthesized
  via Web Audio.
- State is in-memory. Restarting the server resets all rooms.
- Default port is 3000; override with `PORT=8080 npm start`.
- `STILL_INTERVAL_MS=1500 npm start` shortens the Still Moment interval for
  dev / testing.
