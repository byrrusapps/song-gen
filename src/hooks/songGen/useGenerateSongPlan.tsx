import { useSongGen } from "../../context/songGen/SongGenContext";

let controller: AbortController | null = null;
let requestId = 0;

export function useGenerateSongPlan() {
  const { setPlan, setIsGenerating, setError } = useSongGen();

  async function generate(brief: string) {
    controller?.abort();
    controller = new AbortController();
    const thisRequest = ++requestId;

    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/songgen/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: brief }),
        signal: controller.signal,
      });
      if (thisRequest !== requestId) return; // superseded — drop it
      if (!res.ok) throw new Error(`Generation failed (${res.status})`);
      const plan = await res.json();
      if (thisRequest !== requestId) return;
      setPlan(plan);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return; // expected — not a real failure
      if (thisRequest !== requestId) return;
      setError(err instanceof Error ? err.message : "Unknown generation error");
    } finally {
      if (thisRequest === requestId) setIsGenerating(false);
    }
  }

  return { generate };
}