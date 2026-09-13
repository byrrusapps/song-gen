import type { DrumHit, Pack, PatternNote } from "../../types/deck/Pack";

// Hardcoded pack for build step 1 (spec §12): no AI, no auth. Written as
// data with tiny helpers so it stays readable; the shape is what the
// generator will eventually emit.

const hits = (note: number, steps: number[], v: number, offset = 0): DrumHit[] =>
  steps.map((s) => ({ step: s + offset, note, v }));

const notes = (list: [step: number, dur: number, deg: number, v: number][]): PatternNote[] =>
  list.map(([step, dur, deg, v]) => ({ step, dur, deg, v }));

const chord = (step: number, dur: number, degs: number[], v: number): PatternNote[] =>
  degs.map((deg) => ({ step, dur, deg, v }));

/** Repeat a one-bar builder across `bars`, passing each bar's step offset. */
const eachBar = <T>(bars: number, build: (o: number, bar: number) => T[]): T[] =>
  Array.from({ length: bars }, (_, bar) => build(bar * 16, bar)).flat();

const KICK = 36, RIM = 37, SNARE = 38, CLAP = 39, HAT = 42, OPEN_HAT = 46, CRASH = 49;
const TOM_LO = 45, TOM_MID = 47, TOM_HI = 50;
const TAMB = 54, COWBELL = 56, CONGA_HI = 62, CONGA_OPEN = 63, CONGA_LO = 64, SHAKER = 70;

const EIGHTHS = [0, 2, 4, 6, 8, 10, 12, 14];
const SIXTEENTHS = Array.from({ length: 16 }, (_, i) => i);

export const DEMO_PACK: Pack = {
  id: "demo-night-drive",
  title: "Night Drive",
  genre: "pop",
  key: "A minor",
  bpm: 96,
  spine: [
    { degree: 0, quality: "min7" }, // Am7
    { degree: 5, quality: "maj7" }, // Fmaj7
    { degree: 2, quality: "maj7" }, // Cmaj7
    { degree: 6, quality: "dom7" }, // G7
  ],
  rows: [
    {
      kind: "drums", id: "drums", name: "Drums", role: "drums",
      cells: [
        { id: "drums-1", type: "pattern", bars: 1, hits: [...hits(KICK, [0], 0.8), ...hits(RIM, [12], 0.5), ...hits(HAT, [0, 4, 8, 12], 0.3)] },
        {
          id: "drums-2", type: "pattern", bars: 2,
          hits: eachBar(2, (o, bar) => [
            ...hits(KICK, bar === 0 ? [0, 10] : [0, 6, 10], 0.85, o),
            ...hits(SNARE, [4, 12], 0.75, o),
            ...hits(HAT, EIGHTHS, 0.35, o),
          ]),
        },
        {
          id: "drums-3", type: "pattern", bars: 2,
          hits: eachBar(2, (o, bar) => [
            ...hits(KICK, bar === 0 ? [0, 7, 10] : [0, 3, 10], 0.9, o),
            ...hits(SNARE, [4, 12], 0.8, o),
            ...hits(CLAP, [12], 0.5, o),
            ...SIXTEENTHS.filter((s) => s !== 14).flatMap((s) => hits(HAT, [s], s % 2 ? 0.2 : 0.4, o)),
            ...hits(OPEN_HAT, [14], 0.4, o),
          ]),
        },
        {
          id: "drums-4", type: "pattern", bars: 4,
          hits: [
            ...hits(CRASH, [0], 0.7),
            ...eachBar(4, (o, bar) => [
              ...hits(KICK, bar % 2 ? [0, 3, 8, 10] : [0, 7, 10], 0.95, o),
              ...(bar === 3 ? hits(SNARE, [4], 0.85, o) : hits(SNARE, [4, 12], 0.85, o)),
              ...hits(CLAP, bar === 3 ? [] : [12], 0.55, o),
              ...(bar === 3 ? hits(HAT, [0, 2, 4, 6], 0.35, o) : SIXTEENTHS.flatMap((s) => hits(HAT, [s], s % 2 ? 0.22 : 0.42, o))),
            ]),
            // Bar 4 fill
            ...hits(SNARE, [56, 57], 0.6),
            ...hits(TOM_HI, [58, 59], 0.75),
            ...hits(TOM_MID, [60, 61], 0.8),
            ...hits(TOM_LO, [62, 63], 0.85),
          ],
        },
      ],
    },
    {
      kind: "drums", id: "perc", name: "Percussion", role: "percussion",
      cells: [
        { id: "perc-1", type: "pattern", bars: 1, hits: hits(SHAKER, [2, 6, 10, 14], 0.4) },
        { id: "perc-2", type: "pattern", bars: 1, hits: [...SIXTEENTHS.flatMap((s) => hits(SHAKER, [s], s % 2 ? 0.25 : 0.45)), ...hits(TAMB, [4, 12], 0.5)] },
        {
          id: "perc-3", type: "pattern", bars: 2,
          hits: eachBar(2, (o, bar) => [
            ...hits(CONGA_HI, [0, 6], 0.6, o),
            ...hits(CONGA_OPEN, bar === 0 ? [3, 10] : [3, 10, 14], 0.7, o),
            ...hits(CONGA_LO, [8], 0.65, o),
            ...hits(SHAKER, EIGHTHS.map((s) => s + 1), 0.3, o),
          ]),
        },
        {
          id: "perc-4", type: "pattern", bars: 2,
          hits: eachBar(2, (o) => [
            ...hits(CONGA_HI, [0, 4, 6, 12], 0.65, o),
            ...hits(CONGA_OPEN, [3, 10, 14], 0.75, o),
            ...hits(CONGA_LO, [8, 11], 0.7, o),
            ...hits(TAMB, [4, 12], 0.5, o),
            ...hits(COWBELL, [0, 6, 10], 0.35, o),
            ...SIXTEENTHS.flatMap((s) => hits(SHAKER, [s], s % 2 ? 0.2 : 0.35, o)),
          ]),
        },
      ],
    },
    {
      kind: "pitched", id: "bass", name: "Bass", role: "bass", harmony: "chord", octave: 1,
      cells: [
        { id: "bass-1", type: "pattern", bars: 2, notes: eachBar(2, (o) => notes([[o, 14, 0, 0.8]])) },
        { id: "bass-2", type: "pattern", bars: 2, notes: eachBar(2, (o) => notes([[o, 6, 0, 0.85], [o + 6, 4, 0, 0.7], [o + 10, 2, 7, 0.75], [o + 12, 4, 0, 0.7]])) },
        {
          id: "bass-3", type: "pattern", bars: 2,
          notes: eachBar(2, (o) => notes([[o, 3, 0, 0.9], [o + 3, 3, 0, 0.7], [o + 6, 2, 7, 0.8], [o + 8, 2, 0, 0.75], [o + 10, 2, 4, 0.7], [o + 12, 2, 0, 0.75], [o + 14, 2, 7, 0.65]])),
        },
        {
          id: "bass-4", type: "pattern", bars: 4,
          notes: eachBar(4, (o, bar) => notes([
            [o, 3, 0, 0.95], [o + 3, 3, 0, 0.75], [o + 6, 2, 7, 0.85], [o + 8, 2, 0, 0.8],
            [o + 10, 2, 4, 0.75], [o + 12, 2, 5, 0.7], [o + 14, 2, bar === 3 ? 6 : 4, 0.7],
          ])),
        },
      ],
    },
    {
      kind: "pitched", id: "keys", name: "Keys", role: "keys", harmony: "chord", octave: 3,
      cells: [
        { id: "keys-1", type: "pattern", bars: 2, notes: eachBar(2, (o) => chord(o, 16, [0, 2, 4], 0.45)) },
        { id: "keys-2", type: "pattern", bars: 2, notes: eachBar(2, (o) => [...chord(o, 3, [0, 2, 4, 6], 0.6), ...chord(o + 6, 3, [0, 2, 4, 6], 0.5), ...chord(o + 12, 2, [0, 2, 4, 6], 0.55)]) },
        {
          id: "keys-3", type: "pattern", bars: 4,
          notes: eachBar(4, (o) => [...chord(o, 2, [0, 2, 4, 6], 0.65), ...chord(o + 3, 2, [0, 2, 4, 6], 0.5), ...chord(o + 6, 2, [0, 2, 4, 6], 0.55), ...chord(o + 10, 4, [0, 2, 4, 6], 0.6)]),
        },
        {
          id: "keys-4", type: "pattern", bars: 4,
          notes: eachBar(4, (o) => EIGHTHS.flatMap((s) => chord(o + s, 1, s % 4 ? [2, 4, 6, 8] : [0, 2, 4, 6, 8], s % 4 ? 0.45 : 0.65))),
        },
      ],
    },
    {
      kind: "pitched", id: "pad", name: "Pad", role: "pad", harmony: "chord", octave: 3,
      cells: [
        { id: "pad-1", type: "pattern", bars: 4, notes: eachBar(4, (o) => chord(o, 16, [0, 4], 0.4)) },
        { id: "pad-2", type: "pattern", bars: 4, notes: eachBar(4, (o) => chord(o, 16, [0, 2, 4], 0.45)) },
        { id: "pad-3", type: "pattern", bars: 2, notes: eachBar(2, (o) => chord(o, 16, [0, 2, 4, 6], 0.5)) },
        { id: "pad-4", type: "pattern", bars: 4, notes: eachBar(4, (o) => chord(o, 16, [0, 2, 4, 6, 9], 0.55)) },
      ],
    },
    {
      kind: "pitched", id: "lead", name: "Lead", role: "lead", harmony: "key", octave: 4,
      cells: [
        { id: "lead-1", type: "pattern", bars: 2, notes: notes([[0, 6, 4, 0.7], [8, 6, 2, 0.6], [16, 4, 7, 0.7], [22, 8, 3, 0.6]]) },
        {
          id: "lead-2", type: "pattern", bars: 2,
          notes: notes([[0, 2, 4, 0.75], [2, 2, 3, 0.6], [4, 4, 2, 0.7], [10, 2, 0, 0.6], [12, 4, 2, 0.65], [16, 3, 7, 0.75], [19, 3, 6, 0.6], [22, 2, 4, 0.65], [24, 6, 3, 0.6]]),
        },
        {
          id: "lead-3", type: "pattern", bars: 4,
          notes: notes([
            [0, 4, 4, 0.75], [4, 2, 3, 0.6], [6, 6, 2, 0.7], [14, 2, 0, 0.55],
            [16, 4, 2, 0.7], [20, 2, 0, 0.6], [22, 8, 5, 0.7],
            [32, 4, 4, 0.75], [36, 4, 6, 0.7], [40, 8, 4, 0.65],
            [48, 4, 3, 0.7], [52, 4, 1, 0.6], [56, 8, -1, 0.65],
          ]),
        },
        {
          id: "lead-4", type: "pattern", bars: 4,
          notes: notes([
            [0, 2, 7, 0.8], [2, 2, 6, 0.65], [4, 2, 4, 0.7], [6, 2, 3, 0.6], [8, 4, 4, 0.75], [12, 2, 2, 0.6], [14, 2, 0, 0.6],
            [16, 2, 5, 0.75], [18, 2, 4, 0.6], [20, 2, 2, 0.65], [22, 2, 0, 0.6], [24, 6, 2, 0.7], [30, 2, 4, 0.6],
            [32, 2, 6, 0.8], [34, 2, 7, 0.7], [36, 4, 9, 0.8], [40, 2, 7, 0.65], [42, 2, 6, 0.6], [44, 4, 4, 0.7],
            [48, 2, 3, 0.75], [50, 2, 4, 0.65], [52, 2, 3, 0.6], [54, 2, 1, 0.6], [56, 8, 6, 0.75],
          ]),
        },
      ],
    },
  ],
};
