import { createMemo, createSignal, For, Show } from "solid-js";
import { SongGenProvider, useSongGen } from "../context/songGen/SongGenContext";
import { useExportMidi } from "../hooks/songGen/useExportMidi";
import { GENRE_REGISTRY } from "../config/midi/genres";
import type { GenreKey } from "../types/midi/Song";
import { NoteRoll } from "../components/songGen/NoteRoll";
import { EnergyCurve } from "../components/songGen/EnergyCurve";
import { PhraseStrip } from "../components/songGen/PhraseStrip";
import { realizeComposition } from "../utils/midi/realizer";
import { sectionRanges, sliceNotes } from "../utils/midi/performanceView";
import { normalizeCurve } from "../utils/midi/arrangement";

interface Issue {
  severity: string;
  message: string;
}

function SongGen() {
  const { plan, setPlan, isGenerating, setIsGenerating } = useSongGen();
  const { downloadAll, downloadTrack } = useExportMidi();

  const [prompt, setPrompt] = createSignal(
    "Downtempo pop, warm electric piano, strummed guitar, flute answering the vocal line"
  );
  const [selectedGenre, setSelectedGenre] = createSignal<GenreKey>("pop");
  const [activeSectionId, setActiveSectionId] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);
  const [issues, setIssues] = createSignal<Issue[]>([]);

  const genres = Object.keys(GENRE_REGISTRY) as GenreKey[];

  // Realized once per composition — also freezes humanization jitter so the
  // roll doesn't reshuffle on every render.
  const performance = createMemo(() => {
    const song = plan();
    return song ? realizeComposition(song) : null;
  });

  const ranges = createMemo(() => {
    const song = plan();
    const perf = performance();
    return song && perf ? sectionRanges(song, perf) : [];
  });

  const currentSection = () => {
    const song = plan();
    if (!song) return null;
    return song.sections.find((s) => s.id === activeSectionId()) ?? song.sections[0] ?? null;
  };

  const currentRange = () => {
    const section = currentSection();
    return section ? ranges().find((r) => r.sectionId === section.id) ?? null : null;
  };

  const notesFor = (trackId: string) => {
    const perf = performance();
    const range = currentRange();
    if (!perf || !range) return [];
    const track = perf.tracks.find((t) => t.id === trackId);
    return track ? sliceNotes(track.notes, range.startSeconds, range.endSeconds) : [];
  };

  const presenceFor = (trackId: string) => {
    const section = currentSection();
    if (!section) return undefined;
    const arr = section.tracks.find((t) => t.trackId === trackId);
    return arr ? normalizeCurve(arr.presence, section.bars, 0.8) : undefined;
  };

  const warnings = () => issues().filter((i) => i.severity === "warning");

  async function handleGenerate() {
    if (!prompt().trim() || isGenerating()) return;

    setIsGenerating(true);
    setError(null);
    setIssues([]);

    try {
      const res = await fetch("/api/songgen/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt(), genre: selectedGenre() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }
      const data = await res.json();
      setIssues(data._issues ?? []);
      setPlan(data);
      if (data.sections?.[0]) setActiveSectionId(data.sections[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <>
      <header class="sticky top-0 left-0 z-50 w-full box-border flex items-center justify-between gap-6 border-b border-outline-variant bg-background/80 p-4 backdrop-blur-md lg:px-16">
        <div class="flex items-center gap-3">
          <span class="material-symbols-rounded text-on-surface">auto_awesome</span>
          <span class="font-[Sarina] text-on-surface">S/F</span>
        </div>

        <Show when={plan()}>
          <md-outlined-button 
          class="py-2 px-4 flex items-center gap-2 rounded-[2rem]"
          on:click={() => downloadAll()}>
            <span slot="icon" class="material-symbols-rounded">download</span>
            Export MIDI
          </md-outlined-button>
        </Show>
      </header>

      <main class="relative box-border flex w-full flex-col items-center gap-8 p-4 pb-24 lg:px-16">
        {/* ── Composer ─────────────────────────────────────────────── */}
        <section class="relative box-border flex w-full flex-col gap-6 rounded-[1rem] bg-surface-container px-4 py-8 lg:w-3xl">
          <div class="flex flex-col gap-1">
            <h1 class="font-brand text-xl font-semibold text-on-surface">Compose</h1>
            <p class="text-sm text-on-surface-variant">
              Describe the arrangement. Harmony, phrasing and dynamics are planned, then realized as MIDI.
            </p>
          </div>

          <md-outlined-text-field
            {...{ "prop:value": prompt() }}
            on:input={(e: Event) => setPrompt((e.currentTarget as HTMLInputElement).value)}
            type="textarea"
            label="Prompt description"
            placeholder="Downtempo pop, warm electric piano, strummed guitar, flute answering the vocal line..."
            rows={3}
          >
            <span slot="leading-icon" class="material-symbols-rounded">rule_settings</span>
          </md-outlined-text-field>

          <md-outlined-select
            label="Genre"
            {...{ "prop:value": selectedGenre() }}
            on:change={(e: Event) => setSelectedGenre((e.currentTarget as HTMLSelectElement).value as GenreKey)}
          >
            <span slot="leading-icon" class="material-symbols-rounded">genres</span>
            <For each={genres}>
              {(g) => (
                <md-select-option value={g} {...{ "prop:selected": selectedGenre() === g }}>
                  <div slot="headline">{GENRE_REGISTRY[g].name}</div>
                  <div slot="supporting-text">
                    {GENRE_REGISTRY[g].tempoRange[0]}–{GENRE_REGISTRY[g].tempoRange[1]} BPM
                  </div>
                </md-select-option>
              )}
            </For>
          </md-outlined-select>

          <button
            type="button"
            disabled={isGenerating()}
            onClick={handleGenerate}
            class="relative mt-2 box-border flex w-full items-center justify-center gap-2 rounded-[2rem] bg-on-background p-4 text-background disabled:opacity-40"
          >
            <Show
              when={!isGenerating()}
              fallback={<md-circular-progress indeterminate style={{ "--md-circular-progress-size": "20px" }} />}
            >
              <span class="material-symbols-rounded">auto_awesome</span>
            </Show>
            <span>{isGenerating() ? "Composing" : "Generate"}</span>
            <md-ripple />
          </button>

          <Show when={error()}>
            <div class="flex items-center gap-2 rounded-[0.75rem] bg-error-container px-4 py-3 text-sm text-on-error-container">
              <span class="material-symbols-rounded text-base">error</span>
              {error()}
            </div>
          </Show>

          <Show when={issues().length}>
            <details class="rounded-[0.75rem] border border-outline-variant bg-surface-container-low px-4 py-3">
              <summary class="cursor-pointer text-sm text-on-surface-variant">
                {issues().length} validator {issues().length === 1 ? "note" : "notes"}
                <Show when={warnings().length}>
                  <span class="ml-2 rounded-full bg-error-container px-2 py-0.5 text-xs text-on-error-container">
                    {warnings().length} warning
                  </span>
                </Show>
              </summary>
              <ul class="mt-3 flex flex-col gap-1.5">
                <For each={issues()}>
                  {(issue) => (
                    <li class="flex gap-2 text-xs text-on-surface-variant">
                      <span
                        class="material-symbols-rounded text-sm"
                        classList={{
                          "text-error": issue.severity === "warning",
                          "text-on-surface-variant": issue.severity !== "warning",
                        }}
                      >
                        {issue.severity === "warning" ? "warning" : "build"}
                      </span>
                      {issue.message}
                    </li>
                  )}
                </For>
              </ul>
            </details>
          </Show>
        </section>

        {/* ── Empty state ──────────────────────────────────────────── */}
        <Show when={!plan() && !isGenerating()}>
          <section class="relative box-border flex w-full flex-col items-center gap-3 rounded-[1rem] border border-dashed border-outline-variant px-4 py-16 lg:w-3xl">
            <span class="material-symbols-rounded text-3xl text-on-surface-variant">graphic_eq</span>
            <p class="text-sm text-on-surface-variant">No arrangement yet</p>
          </section>
        </Show>

        <Show when={plan()}>
          {(song) => (
            <>
              {/* ── Overview ─────────────────────────────────────── */}
              <section class="relative box-border flex w-full flex-col gap-6 rounded-[1rem] bg-surface-container px-4 py-8 lg:w-3xl">
                <h2 class="font-brand text-lg font-semibold text-on-surface">Overview</h2>

                <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <For
                    each={[
                      { label: "Tempo", value: `${song().tempo} BPM` },
                      { label: "Key", value: song().key },
                      { label: "Metre", value: song().timeSignature?.join("/") ?? "4/4" },
                      { label: "Groove", value: song().grooveProfile?.replace(/_/g, " ") ?? "—" },
                    ]}
                  >
                    {(stat) => (
                      <div class="flex flex-col gap-1 rounded-[0.75rem] border border-outline-variant bg-surface-container-low px-3 py-3">
                        <span class="text-xs text-on-surface-variant">{stat.label}</span>
                        <span class="truncate text-sm font-medium capitalize text-on-surface">{stat.value}</span>
                      </div>
                    )}
                  </For>
                </div>

                <div class="flex flex-col gap-3">
                  <span class="text-xs text-on-surface-variant">Energy</span>
                  <EnergyCurve
                    sections={song().sections}
                    activeId={currentSection()?.id}
                    onSelect={setActiveSectionId}
                  />
                </div>

                <div class="flex flex-col gap-3">
                  <span class="text-xs text-on-surface-variant">Harmonic phrases</span>
                  <PhraseStrip phrases={song().phrases} activeId={currentSection()?.phraseId} />
                </div>
              </section>

              {/* ── Arrangement ──────────────────────────────────── */}
              <section class="relative box-border flex w-full flex-col gap-6 rounded-[1rem] bg-surface-container px-4 py-8 lg:w-3xl">
                <div class="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 class="font-brand text-lg font-semibold text-on-surface">Arrangement</h2>
                  <Show when={currentSection()}>
                    {(sec) => (
                      <span class="text-xs text-on-surface-variant">
                        {sec().bars} bars · phrase {sec().phraseId} · {sec().transposeSemitones} st
                      </span>
                    )}
                  </Show>
                </div>

                <md-tabs
                  {...{ "prop:activeTabIndex": Math.max(0, song().sections.findIndex((s) => s.id === currentSection()?.id)) }}
                  on:change={(e: Event) => {
                    const index = (e.currentTarget as unknown as { activeTabIndex: number }).activeTabIndex;
                    const section = song().sections[index];
                    if (section) setActiveSectionId(section.id);
                  }}
                >
                  <For each={song().sections}>
                    {(section) => <md-primary-tab>{section.name}</md-primary-tab>}
                  </For>
                </md-tabs>

                <Show when={currentSection() && currentRange()}>
                  {(_z) => {
                    const sec = currentSection()!;
                    const range = currentRange()!;
                    const beatsPerBar = song().timeSignature?.[0] ?? 4;

                    return (
                      <div class="flex flex-col gap-4">
                        <NoteRoll
                          notes={notesFor(song().drum.id)}
                          startSeconds={range.startSeconds}
                          endSeconds={range.endSeconds}
                          bars={sec.bars}
                          beatsPerBar={beatsPerBar}
                          isDrum
                          label="Drums"
                          presence={presenceFor(song().drum.id)}
                          onDownload={() => downloadTrack(song().drum.id, "drums")}
                        />

                        <For each={song().tracks}>
                          {(track) => {
                            const arr = sec.tracks.find((t) => t.trackId === track.id);
                            const figure = track.figures?.[arr?.slot ?? "main"] ?? track.figures?.main;
                            return (
                              <NoteRoll
                                notes={notesFor(track.id)}
                                startSeconds={range.startSeconds}
                                endSeconds={range.endSeconds}
                                bars={sec.bars}
                                beatsPerBar={beatsPerBar}
                                label={track.name}
                                sublabel={`${track.role} · ${track.articulation} · ${figure?.replace(/_/g, " ")} · ${track.voiceLimit === 1 ? "mono" : `${track.voiceLimit} voices`}`}
                                presence={presenceFor(track.id)}
                                onDownload={() => downloadTrack(track.id, track.name)}
                              />
                            );
                          }}
                        </For>
                      </div>
                    );
                  }}
                </Show>
              </section>
            </>
          )}
        </Show>
      </main>
    </>
  );
}

const Home = () => (
  <SongGenProvider>
    <SongGen />
  </SongGenProvider>
);

export default Home;