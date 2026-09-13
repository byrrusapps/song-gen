# LoopDeck — Product & Technical Spec

Merged product: LoopDeck (looper) + song-gen (AI MIDI generation).

**Positioning:** a place to preview a song and arrangement, then hand off to a DAW. Not a professional DAW. This framing resolves most feature-scope arguments — when in doubt, the answer is "that's the DAW's job."

---

## 1. Core model

A **pack** is locked to one genre, one key, one BPM. It contains 6–8 instrument rows × 4 columns.

**Column index = energy level.** Column 1 is sparse, column 4 is full. This was chosen over a global energy fader: authored columns can change *material* (a pad that only exists in the breakdown, drums dropping out entirely), which no amount of transformation can produce. Intra-section dynamics come from launching/stopping rows vertically, as in BandLab.

Two cell types:

| Type | Source | WAV export | MIDI export |
|---|---|---|---|
| `pattern` | LLM-generated MIDI + instrument config | Yes | Yes |
| `audio` | Sounds Library (vocals, fx, one-shots, Lyria output) | Yes | No — skipped with a note |

### Harmonic spine

Generated first, shared by the whole pack. Every melodic pattern stores **degrees against the spine**, not absolute pitches. Consequences:

- Instruments agree harmonically by construction
- Packs re-key and re-tempo losslessly
- Library patterns are portable between packs of any key/BPM

---

## 2. Timing

- **Pack cycle** = longest cell in the pack. Default 4 bars.
- Cells are **1, 2, or 4 bars**. A 1-bar cell plays 4× per cycle, 2-bar 2×, 4-bar 1×.
- **Transport always loops at the pack cycle**, regardless of what's playing. Recording grid and MIDI bar numbers stay stable.
- **Launch quantization: next 25% of the cycle.** With a 4-bar cycle that's every bar; with an 8-bar cycle it's every 2 bars, which is the right musical behaviour.
- **Free phase (Ableton-style):** a launched cell starts from its own bar 1 and stays offset from the cycle. Chosen for low learning curve and standard implementation.
- **Sustained notes in flight at entry** start from their remaining duration with a ~10ms ramp, so pads and held bass don't leave holes. MIDI export writes the same shortened note.
- **Stop:** tap-off quantizes to the next 25% slot. Long-press stops the row immediately (needed for drops).
- **One-shots** quantize to land at the *end* of the current cycle, then auto-revert to the previously active cell or silence.

### Length constraints by role

Enforced at generation, not suggested:

| Role | Allowed lengths |
|---|---|
| Percussion, hats, fx | 1, 2, 4 |
| Bass, arps | 2, 4 |
| Chords, keys, guitar, pads, leads | 2, 4 |

Column 4 biased toward 4 bars so peaks don't feel looped to death.

---

## 3. Instruments & sound

- **`Tone.Sampler` first.** Synth voices only where deliberately chosen per instrument.
- Sample every ~minor third; 3–5 samples covers an instrument's used range cleanly. Pitch-shifting stays clean within ~±3 semitones, audibly artificial past ~5. **Seed the used range, not all 88 keys.**
- **Octave carousel scoped per role** — bass 1–3, lead 4–6. Fewer swipes, fewer bad choices.
- LLM emits **sampler config + FX chain** per instrument (sample selection, ADSR, filter, saturation), not just notes. Without this every pack sounds like the same eight instruments.

### Drums

One row in the schema — a single GM-mapped pattern. Expansion into per-drum rows is a **render toggle, not a generation choice or a schema change**: expanded rows are the same pattern filtered by note number.

- Default: 4×4 drum machine pads, slot = fixed GM note, sample swappable, user labels cosmetic
- Drill-in from the drum row label swaps the grid to drum-only rows and back. Not a mode that permanently eats 4–6 of the 6–8 row budget.
- In expanded view each drum row keeps its own 4 energy columns — hats on column 4 over a kick on column 1 works, and it's still just note filtering

### Vocals

- **`Tone.Sampler` loaded with sung syllables** (ooh, aah, doo) — architecturally just another instrument, exports to MIDI perfectly. Covers chops, pads, stacked layers.
- Will **not** sing lyrics. That needs formant modelling with phoneme input, which is its own project. Label the row "Vocal (synth)" to set expectations.
- Anything with words comes from the Sounds Library as an `audio` cell.

---

## 4. Audio cells

- **One-shots play immediately.**
- **Loops quantize by seeking** to the current cycle position — `(cyclePos mod loopBars) / loopBars × duration`. Audio can't be time-shifted without artifacts, so seeking is the only option that doesn't land drums on offbeats. This means audio loops are phase-locked while pattern cells are free-phase; that inconsistency is correct.
- Library assets tagged with **bar length**, not just duration.
- **BPM filtering is load-bearing, not a convenience.** `Tone.Player.playbackRate` corrects tempo but pitch-shifts with it — fine for ±3–4 BPM, audible beyond. `Tone.GrainPlayer` avoids pitch shift but sounds grainy on transients. Filter by BPM first, use playbackRate as small correction only.

---

## 5. Recording & export

**The launch timeline is the single source of truth.**

```
{ bar, instrumentId, cellId, mode: "loop" | "oneShot" }
```

Both exports consume it, so they cannot drift.

- **WAV:** replay the timeline through `Tone.Offline`. Faster than real time, clean output. Not MediaRecorder.
- **Per-instrument stems:** same path, render once per instrument with others muted. Nearly free.
- **MIDI:** Type 1 multi-track, named tracks, GM program numbers. **Drums on channel 10** with GM note numbers so they land on the right lanes in any DAW. Per-instrument MIDI files also available.
- Offline render must wait for full sample load.
- Export dialog states plainly that MIDI is an arrangement sketch — per-cell FX, filter moves and gain automation don't survive the handoff.
- Count-in and optional metronome for recording.

---

## 6. Generation

### Credits are cell-denominated

| Unit | Cost |
|---|---|
| Full pack | ~30 credits (6–8 rows × 4) |
| Row | 4 |
| Cell | 1 |

Free tier ~40/day: one pack plus refinement, or fork a library pack and spend credits fixing rows. Pro gets a larger bucket.

Whole-pack regeneration is bad UX — you lose the parts you liked to fix the one you didn't. **Users pick which individual cell gets replaced.**

### Regeneration context

A cell regen sees: the harmonic spine, the other 3 cells in that row, and every other instrument at that energy level. Small prompt, fast response, fits by construction.

### Keep the replaced version

Store the previous cell alongside the new one and let users A/B before committing. It's JSON; cost is nothing, and it removes the main reason people hesitate to regenerate.

### Row count

LLM's call within 6–8, justified in pack metadata. Genre decides it — trap at 6, afrobeats wants more percussion and guitar. Most packs should land at 6.

### Validator / repair pass

Deterministic, runs after generation, triggers regeneration on failure.

- **Same-pitch overlap on one instrument** — data error, not musical layering. The second note-on retriggers the sampler voice and the first note-off truncates it, producing a click. Merge into one note or truncate the first. *Octave stacking, chord voicings, and harmony layers are different pitches and are correct.*
- **Range clamp per role** — hard reject, not a prompt hint
- **Max simultaneous voices per instrument** — bass 2 (root + octave/sub), lead 1–2, keys/pads 4–5. Anything above is padding, and it's also the mobile CPU budget.
- **Columns must differ in density.** Models emit four near-identical variations unless forced. Assert column 4 carries meaningfully more note-weight than column 1.
- In key, in instrument range, no silent patterns
- Prompt guidance on not overdoing density (taste, not a rule)

---

## 7. Libraries

Two distinct browsers. The affordances genuinely differ.

### Looper Library (pattern cells)

Patterns are degrees + steps, so they transpose and re-tempo losslessly into any pack.

- Filter by **genre, instrument, energy, feel**
- **No key or BPM filter** — irrelevant here
- Save units: **pack**, **row** (one instrument, all 4 columns), **cell**
- Row-level is where the library gets sticky. "My drums are perfect but this guitar is wrong" is the most common complaint in this kind of tool, and it's a two-tap fix.
- Public or private. Free users can publish.
- **Forking copies**, doesn't reference — simpler, and doesn't break on delete.

### Sounds Library (audio)

- Platform sounds + Lyria output + (phase 2) user uploads
- Filter by **genre, instrument, key, BPM** — mandatory, see §4
- FX live here now; the dedicated FX row is dropped

### Preview rendering

Browsing can't mean booting the engine and loading 40 samples per card. On publish, render a 20–30s demo through a default energy curve via `Tone.Offline`, store the MP3, stream that. Also serves share links and social previews.

### Moderation

Public publishing is a UGC surface even without uploads: pack titles, descriptions, and user prompts. **Prompts get filtered.** Needs an explicit stance on "in the style of [artist]" prompts — every user will reach for it.

**Seeding:** 20–30 packs across 5–6 genres to not feel empty. A real content task, not an afternoon.

---

## 8. Projects

Distinct object from packs:

```
project = pack reference (copied on fork)
        + saved launch timeline
        + placed audio cells
```

Autosave required — browser tabs die.

---

## 9. Tiering

| | Free | Pro |
|---|---|---|
| Generations | 1–3 packs/day (~40 credits) | Higher daily bucket |
| Looper Library | Full access | Full access |
| Sounds Library | Platform sounds | Larger library |
| Publishing | Yes | Yes |
| Lyria | — | In-house tool, or Pro feature |

Packs are now KB of JSON instead of MB of audio. No Storage cost per pack, no generation latency worth a spinner, instant delivery — which is what makes a generous free tier affordable and makes sharing/forking trivial.

**Lyria** is better used in-house: generate once, tag by genre/key/BPM/instrument, whole library benefits. Versus per-user generation where you pay repeatedly for assets nobody else sees. Lyria output is always an `audio` cell, never a pattern cell.

---

## 10. Input layer

Drag-to-launch across the grid — running a finger over a row, not tapping seven cells.

- Pointer events with `setPointerCapture` + `pointerenter` on cells
- `touch-action: none` on the grid, or mobile scroll fights you
- Debounce: last cell entered in a row within ~80ms wins, so a fast swipe doesn't launch and immediately replace four times

---

## 11. Known risks

| Risk | Mitigation |
|---|---|
| **Mobile CPU** — 6–8 samplers + FX in mobile Safari | Benchmark before committing to 8 rows. Voice caps (§6) are part of the budget. |
| **iOS silent switch** kills Web Audio in some contexts | Test explicitly; users will report it as "app broken" |
| **Audio unlock** | `Tone.start()` on first user gesture |
| **Sample preload** — 20–40 files before playback | Load per-row, enable rows progressively rather than blocking the whole grid |
| **Free-phase harmony clash** on 4-bar melodic cells launched mid-cycle | Accepted. Most launches are at 0% and most cells are 1–2 bars. |
| **Key/BPM change breaks audio cells** | Pattern cells transpose free. Decide: silently drop incompatible audio cells, flag them, or block the change once audio is placed. **Open.** |

---

## 12. Build order

Generation is the easiest part to get right and the easiest to fake during development. It goes last.

1. **Scheduler + grid with hardcoded JSON.** No AI, no auth. If launch/phase/one-shot behaviour doesn't feel good under your thumb, nothing downstream matters.
2. `Tone.Sampler` + sample library
3. Timeline recording
4. WAV export (`Tone.Offline`) and MIDI export
5. Gemini generation + validator
6. Libraries, publishing, tiering

---

## 13. Open decisions

1. Key/BPM change behaviour when audio cells are placed (§11)
2. Exact free-tier credit number after measuring real generation cost
3. Artist-name prompt policy
4. Mobile row ceiling — pending benchmark
