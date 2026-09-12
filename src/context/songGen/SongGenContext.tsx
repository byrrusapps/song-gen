import { createContext, useContext, createSignal, type JSX } from "solid-js";
import type { SongComposition } from "../../types/midi/Song";

interface SongGenState {
  plan: () => SongComposition | null;
  setPlan: (p: SongComposition | null) => void;
  isGenerating: () => boolean;
  setIsGenerating: (v: boolean) => void;
  error: () => string | null;
  setError: (e: string | null) => void;
  activeSectionId: () => string | null;
  setActiveSectionId: (id: string | null) => void;
}

const SongGenContext = createContext<SongGenState>();

export function SongGenProvider(props: { children: JSX.Element }) {
  const [plan, setPlan] = createSignal<SongComposition | null>(null);
  const [isGenerating, setIsGenerating] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [activeSectionId, setActiveSectionId] = createSignal<string | null>(null);

  return (
    <SongGenContext.Provider
      value={{ plan, setPlan, isGenerating, setIsGenerating, error, setError, activeSectionId, setActiveSectionId }}
    >
      {props.children}
    </SongGenContext.Provider>
  );
}

export function useSongGen() {
  const ctx = useContext(SongGenContext);
  if (!ctx) throw new Error("useSongGen must be used within SongGenProvider");
  return ctx;
}