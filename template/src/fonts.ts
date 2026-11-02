// Font disimpan lokal di public/fonts agar render tidak bergantung jaringan (Chrome render tidak mempercayai proxy).
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

const FONT: [string, string, string][] = [
  ["Caveat", "600", "Caveat-600.woff2"],
  ["Caveat", "700", "Caveat-700.woff2"],
  ["Bricolage Grotesque", "800", "BricolageGrotesque-800.woff2"],
  ["Plus Jakarta Sans", "700", "PlusJakartaSans-700.woff2"],
  ["Plus Jakarta Sans", "800", "PlusJakartaSans-800.woff2"],
];

for (const [family, weight, file] of FONT) {
  loadFont({ family, weight, url: staticFile(`fonts/${file}`), format: "woff2" });
}
