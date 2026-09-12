// scripts/probe-schema.mjs — run with: node scripts/probe-schema.mjs
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const probe = async (label, schema) => {
  try {
    await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: "Return a minimal valid object.",
      config: { responseMimeType: "application/json", responseSchema: schema },
    });
    console.log(`✅ ${label}`);
  } catch (e) {
    console.log(`❌ ${label} — ${e.message?.slice(0, 120)}`);
  }
};

await probe("bare object", {
  type: Type.OBJECT,
  properties: { a: { type: Type.STRING } },
  required: ["a"],
});

await probe("number with min/max", {
  type: Type.OBJECT,
  properties: { a: { type: Type.NUMBER, minimum: 0, maximum: 6 } },
  required: ["a"],
});

await probe("array with minItems/maxItems", {
  type: Type.OBJECT,
  properties: { a: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 8 } },
  required: ["a"],
});

await probe("string enum", {
  type: Type.OBJECT,
  properties: { a: { type: Type.STRING, enum: ["x", "y", "z"] } },
  required: ["a"],
});