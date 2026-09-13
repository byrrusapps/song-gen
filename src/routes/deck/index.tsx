import { clientOnly } from "@solidjs/start";

// Tone.js needs a browser AudioContext, so the deck never renders on the server.
const Deck = clientOnly(() => import("../../components/deck/Deck"));

export default function DeckRoute() {
  return <Deck />;
}
