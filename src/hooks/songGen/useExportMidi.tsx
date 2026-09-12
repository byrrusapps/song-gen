import { Midi } from "@tonejs/midi";
import { useSongGen } from "../../context/songGen/SongGenContext";
import { realizeComposition } from "../../utils/midi/realizer";
import type { SongComposition } from "../../types/midi/Song";

function buildMidi(song: SongComposition, trackIds?: string[]): Midi {
  const performance = realizeComposition(song);
  const midi = new Midi();
  midi.header.setTempo(performance.tempo);

  for (const track of performance.tracks) {
    if (trackIds && !trackIds.includes(track.id)) continue;
    if (!track.notes.length) continue;

    const midiTrack = midi.addTrack();
    midiTrack.name = track.name;
    if (track.isDrum) midiTrack.channel = 9;
    for (const note of track.notes) midiTrack.addNote(note);
  }
  return midi;
}

function triggerDownload(midi: Midi, filename: string) {
  const bytes = midi.toArray();
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const url = URL.createObjectURL(new Blob([buffer], { type: "audio/midi" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function useExportMidi() {
  const { plan } = useSongGen();

  function downloadAll() {
    const song = plan();
    if (song) triggerDownload(buildMidi(song), `${song.genre}_${song.key.replace(/\s+/g, "_")}.mid`);
  }

  function downloadTrack(trackId: string, label: string) {
    const song = plan();
    if (song) triggerDownload(buildMidi(song, [trackId]), `${label.replace(/\s+/g, "_").toLowerCase()}.mid`);
  }

  return { downloadAll, downloadTrack };
}