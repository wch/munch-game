// Sanity checks for MUNCH! level geometry.
const fs = require("fs");
const html = fs.readFileSync("/Users/winston/temp/joel/index.html", "utf8");
const m = html.match(/\/\/ LEVELS-START([\s\S]*?)\/\/ LEVELS-END/);
if (!m) { console.error("LEVELS markers not found"); process.exit(1); }
const LEVELS = eval("(" + m[1].replace(/^\s*const LEVELS =/, "").trim().replace(/;$/, "") + ")");

const FOOD = "acdpt";
const MAX_PIT = 4;        // max jump ~4.7 tiles
let failures = 0;
const fail = (msg) => { failures++; console.log("  FAIL: " + msg); };

for (const lvl of LEVELS) {
  const h = lvl.map.length;
  const w = Math.max(...lvl.map.map(r => r.length));
  const at = (x, y) => (lvl.map[y] && lvl.map[y][x]) || " ";
  const solid = (x, y) => at(x, y) === "#" || at(x, y) === "=";
  console.log(`\n=== ${lvl.name} (${w}x${h}) ===`);

  // exactly one S and one F
  const count = (ch) => lvl.map.join("").split(ch).length - 1;
  if (count("S") !== 1) fail(`expected 1 'S', found ${count("S")}`);
  if (count("F") !== 1) fail(`expected 1 'F', found ${count("F")}`);

  // S and F must stand on solid ground
  for (const ch of ["S", "F"]) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (at(x, y) !== ch) continue;
      if (!solid(x, y + 1)) fail(`'${ch}' at col ${x} has no ground beneath it`);
    }
  }

  // food must not be inside a solid tile, and should be reachable-ish (not buried)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (FOOD.includes(at(x, y)) && solid(x, y)) fail(`food overlaps solid at ${x},${y}`);
  }

  // pit check: columns with no solid tile anywhere; runs must be <= MAX_PIT
  const empty = [];
  for (let x = 0; x < w; x++) {
    let any = false;
    for (let y = 0; y < h; y++) if (solid(x, y)) any = true;
    empty.push(!any);
  }
  let run = 0;
  for (let x = 0; x <= w; x++) {
    if (x < w && empty[x]) run++;
    else {
      if (run > MAX_PIT) fail(`pit of width ${run} ending at col ${x - 1} (max ${MAX_PIT})`);
      if (run > 0) console.log(`  pit: cols ${x - run}-${x - 1} (width ${run})`);
      run = 0;
    }
  }

  // bottom two rows must match (pit edges aligned)
  const pad = (s) => (s + " ".repeat(w)).slice(0, w);
  if (pad(lvl.map[h - 1]) !== pad(lvl.map[h - 2]))
    fail("bottom two ground rows are not identical");

  // rendered map with a tens ruler for eyeballing
  let ruler = "";
  for (let x = 0; x < w; x++) ruler += x % 10 === 0 ? String((x / 10) % 10) : ".";
  console.log("  " + ruler);
  for (let y = 0; y < h; y++) console.log("  " + pad(lvl.map[y]));
}

console.log(failures ? `\n${failures} FAILURE(S)` : "\nAll levels OK");
process.exit(failures ? 1 : 0);
