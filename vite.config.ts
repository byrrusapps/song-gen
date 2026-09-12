import { defineConfig, loadEnv } from "vite";
import { solidStart } from "@solidjs/start/config";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";

const env = loadEnv("", process.cwd(), "");

export default defineConfig({
  plugins: [
    solidStart({
      devOverlay: false,
    }),
    nitro({
      preset: "firebase_app_hosting",
      firebase: {
        appHosting: {
          cpu: 1,
          memoryMiB: 512,
          minInstances: 0,
          maxInstances: 100,
          concurrency: 80,
        },
      },
      node: true,
    }),
    tailwindcss(),
  ],
  server: { host: true },
  ssr: {
    external: [
      "firebase-admin",
      "firebase-admin/app",
      "firebase-admin/firestore",
      "firebase-admin/storage",
    ],
  },
  define: {
    "process.env.PROJECT_ID": JSON.stringify(env.PROJECT_ID),
    "process.env.PRIVATE_KEY": JSON.stringify(env.PRIVATE_KEY),
    "process.env.CLIENT_EMAIL": JSON.stringify(env.CLIENT_EMAIL),
  },
});