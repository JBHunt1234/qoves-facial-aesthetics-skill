// Copies the MediaPipe WASM runtime into /public so the app serves it itself (no CDN dependency).
import { cpSync, mkdirSync, existsSync } from "node:fs";
const src = "node_modules/@mediapipe/tasks-vision/wasm";
const dest = "public/mediapipe";
if (existsSync(src)) {
  mkdirSync(dest, { recursive: true });
  for (const f of ["vision_wasm_internal.js", "vision_wasm_internal.wasm"]) cpSync(`${src}/${f}`, `${dest}/${f}`);
  console.log("mediapipe wasm copied to", dest);
}
