// Generates the half-width project cards in assets/, matching the style of the
// hand-made cards (project-phonemarket.svg): dark gradient, animated border,
// one accent colour, three bullets, tech pills and a small animated motif.
// Run: node tools/cards.js
const fs = require("fs");
const path = require("path");

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Approximate width of 12px bold Segoe UI text, for sizing the pills.
const pillWidth = label => Math.round(label.length * 7.1 + 24);

const PILL_COLORS = {
  Kotlin: "#a78bfa", Java: "#fb923c", "Spring Boot": "#4ade80", PostgreSQL: "#60a5fa", Docker: "#38bdf8",
  "Jetpack Compose": "#4ade80", Retrofit: "#fbbf24", TypeScript: "#60a5fa", React: "#38bdf8", Vite: "#a78bfa",
  "Node.js": "#4ade80", "Vanilla JS": "#fbbf24", Canvas: "#f472b6", Thymeleaf: "#4ade80", "Spring Security": "#2dd4bf",
  Maven: "#f87171", Swing: "#fb923c", OOP: "#a78bfa", "C++": "#60a5fa", Vitest: "#fbbf24", "GitHub Pages": "#cbd5e1", Ktor: "#a78bfa", Room: "#2dd4bf", CRDT: "#fbbf24", "Kotlin Multiplatform": "#f472b6", "Kotlin/JS": "#fbbf24", BM25: "#60a5fa",
};
const lighten = { "#a78bfa": "#c4b5fd", "#fb923c": "#fdba74", "#4ade80": "#86efac", "#60a5fa": "#93c5fd", "#38bdf8": "#7dd3fc",
  "#fbbf24": "#fcd34d", "#f472b6": "#f9a8d4", "#2dd4bf": "#5eead4", "#f87171": "#fca5a5", "#cbd5e1": "#e2e8f0" };

function pills(list, y) {
  let x = 28;
  return list.map(label => {
    const c = PILL_COLORS[label] ?? "#cbd5e1";
    const w = pillWidth(label);
    const out = `<rect x="${x}" y="${y}" width="${w}" height="24" rx="12" fill="${c}" fill-opacity=".15" stroke="${c}" stroke-opacity=".55"/><text x="${x + w / 2}" y="${y + 16}" fill="${lighten[c] ?? c}" text-anchor="middle">${esc(label)}</text>`;
    x += w + 6;
    return out;
  }).join("\n    ");
}

// Small animated illustrations, drawn in the card's accent colour in a 90x60 box.
const MOTIFS = {
  // Seats filling up, one stays free: "never oversells".
  seats: a => `<g fill="${a}">${[0, 1, 2, 3].map(r => [0, 1, 2, 3, 4].map(c =>
    `<rect x="${c * 18}" y="${r * 14}" width="13" height="10" rx="3" opacity="${r === 3 && c === 4 ? ".2" : ".85"}"><animate attributeName="opacity" values=".2;${r === 3 && c === 4 ? ".2" : ".85"}" dur="2.4s" begin="${(r * 5 + c) * 0.08}s" fill="freeze"/></rect>`).join("")).join("")}</g>`,
  // A phone with a countdown ring.
  phone: a => `<rect x="20" y="0" width="44" height="62" rx="8" fill="none" stroke="${a}" stroke-width="2"/><circle cx="42" cy="28" r="12" fill="none" stroke="${a}" stroke-opacity=".25" stroke-width="3"/><circle cx="42" cy="28" r="12" fill="none" stroke="${a}" stroke-width="3" stroke-dasharray="75.4" stroke-linecap="round" transform="rotate(-90 42 28)"><animate attributeName="stroke-dashoffset" values="0;75.4" dur="6s" repeatCount="indefinite"/></circle><rect x="30" y="48" width="24" height="6" rx="3" fill="${a}" opacity=".7"/>`,
  // A blinking cursor after a prompt.
  code: a => `<text x="0" y="22" fill="${a}" font-family="Consolas,monospace" font-size="15" font-weight="700">&gt; fn</text><text x="0" y="46" fill="${a}" opacity=".6" font-family="Consolas,monospace" font-size="15">|&gt; map</text><rect x="72" y="34" width="3" height="16" fill="${a}"><animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/></rect>`,
  // Three balances settling to zero.
  bars: a => `<g fill="${a}">${[[0, 40], [22, 26], [44, 50], [66, 18]].map(([x, h], i) => `<rect x="${x}" y="${60 - h}" width="16" height="${h}" rx="3" opacity="${0.45 + i * 0.15}"><animate attributeName="height" values="${h};6;${h}" dur="4s" begin="${i * 0.2}s" repeatCount="indefinite"/><animate attributeName="y" values="${60 - h};54;${60 - h}" dur="4s" begin="${i * 0.2}s" repeatCount="indefinite"/></rect>`).join("")}</g>`,
  // Key-value blocks with a pulse.
  kv: a => `<g fill="none" stroke="${a}" stroke-width="2">${[0, 1, 2].map(i => `<rect x="${i * 30}" y="${i % 2 ? 22 : 10}" width="24" height="24" rx="5" opacity=".9"><animate attributeName="opacity" values=".3;1;.3" dur="1.8s" begin="${i * 0.3}s" repeatCount="indefinite"/></rect>`).join("")}</g><text x="0" y="62" fill="${a}" font-family="Consolas,monospace" font-size="11" opacity=".8">+PONG</text>`,
  // Keys being pressed.
  keys: a => `<g fill="${a}">${[0, 1, 2, 3].map(i => `<rect x="${i * 22}" y="20" width="18" height="18" rx="4" opacity=".5"><animate attributeName="opacity" values=".5;1;.5" dur="1.2s" begin="${i * 0.25}s" repeatCount="indefinite"/></rect>`).join("")}<rect x="0" y="44" width="84" height="12" rx="4" opacity=".35"/></g>`,
  // Coins stacking.
  coins: a => `<g fill="${a}">${[0, 1, 2, 3].map(i => `<ellipse cx="40" cy="${54 - i * 10}" rx="22" ry="6" opacity="${0.4 + i * 0.18}"><animate attributeName="opacity" values="0;${0.4 + i * 0.18}" dur="1.6s" begin="${i * 0.25}s" fill="freeze"/></ellipse>`).join("")}</g>`,
  // Two phones exchanging changes through a cloud.
  sync: a => `<g fill="none" stroke="${a}" stroke-width="2"><rect x="0" y="14" width="24" height="40" rx="5"/><rect x="66" y="14" width="24" height="40" rx="5"/><path d="M28 26h34M62 42h-34" stroke-dasharray="4 4"><animate attributeName="stroke-dashoffset" values="16;0" dur="1s" repeatCount="indefinite"/></path></g><g fill="${a}"><rect x="6" y="24" width="12" height="3" rx="1.5"/><rect x="6" y="32" width="9" height="3" rx="1.5"/><rect x="72" y="24" width="12" height="3" rx="1.5"/><rect x="72" y="32" width="9" height="3" rx="1.5"><animate attributeName="opacity" values="0;1" dur="2s" repeatCount="indefinite"/></rect></g>`,
  // A magnifying glass sweeping over lines of text, one line highlighted.
  search: a => `<g fill="${a}">${[0, 1, 2, 3].map(i => `<rect x="0" y="${4 + i * 13}" width="${[70, 56, 64, 44][i]}" height="5" rx="2.5" opacity="${i === 1 ? ".95" : ".3"}"/>`).join("")}</g><g fill="none" stroke="${a}" stroke-width="3"><circle cx="58" cy="26" r="13"/><path d="M68 36l12 12" stroke-linecap="round"/><animateTransform attributeName="transform" type="translate" values="-30 0;0 0;-30 0" dur="4s" repeatCount="indefinite"/></g>`,
  // Stacked books.
  books: a => `<g fill="${a}"><rect x="10" y="40" width="64" height="12" rx="3" opacity=".9"/><rect x="16" y="26" width="56" height="12" rx="3" opacity=".7"/><rect x="6" y="12" width="60" height="12" rx="3" opacity=".5"><animateTransform attributeName="transform" type="translate" values="0 -6;0 0" dur="1.2s" fill="freeze"/></rect></g>`,
};

const cards = [
  { file: "project-sift.svg", title: "Sift", emoji: "🔎", label: "SEARCH ENGINE · FROM SCRATCH", accent: "#f472b6", edge2: "#fbbf24", bg0: "#1c0a16",
    desc: "A full-text search engine written from scratch in Kotlin Multiplatform: BM25 ranking, Porter stemming, typo tolerance, phrases and search-as-you-type. Runs on the JVM as a REST API and in the browser as a live demo.",
    bullets: ["BM25, Porter stemmer, phrases, snippets", "Typo tolerance via trie + edit distance", "Same engine on JVM + in-browser · ~0.4 ms p50"],
    pills: ["Kotlin Multiplatform", "Kotlin/JS", "Ktor", "BM25"], motif: "search" },
  { file: "project-tandem.svg", title: "Tandem", emoji: "🔁", label: "ANDROID · OFFLINE SYNC", accent: "#2dd4bf", edge2: "#a78bfa", bg0: "#061a18",
    desc: "Shared lists that work offline and merge without conflicts: an Android app in Kotlin, Compose, Room and WorkManager plus a Ktor and PostgreSQL sync server, built on a CRDT with hybrid logical clocks.",
    bullets: ["Edit offline on two phones, merge with no conflicts", "CRDT + hybrid logical clocks + fractional index", "Convergence property tests · Postgres CI · APK"],
    pills: ["Kotlin", "Jetpack Compose", "Room", "Ktor", "CRDT"], motif: "sync" },
  { file: "project-seatlock.svg", title: "SeatLock", emoji: "🎟️", label: "BACKEND · CONCURRENCY", accent: "#4ade80", edge2: "#2dd4bf", bg0: "#07190f",
    desc: "Ticket booking REST API in Kotlin, Spring Boot and PostgreSQL that never oversells under concurrent load: atomic seat reservation, expiring holds, idempotency keys, and race-condition tests run on real PostgreSQL.",
    bullets: ["Never oversells: atomic SQL + CHECK constraints", "Expiring holds, idempotency keys, problem+json", "Race tests on real PostgreSQL · ~1,500 holds/s"],
    pills: ["Kotlin", "Spring Boot", "PostgreSQL", "Docker"], motif: "seats" },
  { file: "project-seatlock-android.svg", title: "SeatLock Android", emoji: "📲", label: "ANDROID · JETPACK COMPOSE", accent: "#2dd4bf", edge2: "#60a5fa", bg0: "#06171a",
    desc: "Android app in Kotlin and Jetpack Compose for booking event tickets with live seat holds and a countdown. Client for the SeatLock API with an offline demo mode; MVVM, Retrofit, DataStore and Robolectric UI tests.",
    bullets: ["Live hold countdown, confirm, my tickets", "Safe retries with idempotency keys", "MVVM + StateFlow · Robolectric UI tests · APK"],
    pills: ["Kotlin", "Jetpack Compose", "Retrofit"], motif: "phone" },
  { file: "project-quill.svg", title: "Quill", emoji: "🪶", label: "LANGUAGE · INTERPRETER", accent: "#a78bfa", edge2: "#f472b6", bg0: "#130b24",
    desc: "A small scripting language with closures, pipes and compiler-quality error messages: lexer, Pratt parser, static resolver and tree-walking interpreter in strict TypeScript, with a browser playground.",
    bullets: ["Lexer → Pratt parser → resolver → interpreter", "Closures, pipes |>, try/catch, 47 builtins", "Browser playground in a Web Worker · 112 tests"],
    pills: ["TypeScript", "Vite", "GitHub Pages"], motif: "code" },
  { file: "project-tally.svg", title: "Tally", emoji: "💸", label: "WEB APP · ALGORITHMS", accent: "#34d399", edge2: "#fbbf24", bg0: "#08180f",
    desc: "Expense splitter in React and TypeScript: integer-cent money math, four split modes and a property-tested settle-up algorithm that pays everyone back in at most n-1 transfers.",
    bullets: ["Integer-cent math: no cent lost to rounding", "Settle up in ≤ n−1 payments (property-tested)", "Undo/redo, share links, offline · 83 tests"],
    pills: ["React", "TypeScript", "Vitest"], motif: "bars" },
  { file: "project-emberkv.svg", title: "emberkv", emoji: "🔥", label: "SYSTEMS · DATABASE", accent: "#f87171", edge2: "#fb923c", bg0: "#1c0a0a",
    desc: "A Redis-compatible in-memory database written from scratch in Node.js: speaks the Redis protocol, works with the official redis-cli, supports TTLs, transactions, pub/sub and snapshots.",
    bullets: ["Speaks RESP: works with the official redis-cli", "78 commands · TTLs, MULTI/EXEC, pub/sub", "Up to 480k req/s on redis-benchmark"],
    pills: ["Node.js", "Docker"], motif: "kv" },
  { file: "project-typeflow.svg", title: "TypeFlow", emoji: "⌨️", label: "WEB · FRONTEND", accent: "#fb923c", edge2: "#fbbf24", bg0: "#1a0f0a",
    desc: "A fast typing speed test with live WPM, accuracy, consistency and a per-second chart drawn on canvas. Vanilla JavaScript with zero dependencies, unit tested and deployed to GitHub Pages.",
    bullets: ["Live WPM, accuracy and consistency", "Canvas chart with zero dependencies", "Unit-tested engine · live on GitHub Pages"],
    pills: ["Vanilla JS", "Canvas", "GitHub Pages"], motif: "keys" },
  { file: "project-bankingapp.svg", title: "Banking App", emoji: "🏦", label: "WEB · SPRING BOOT", accent: "#38bdf8", edge2: "#4ade80", bg0: "#071624",
    desc: "Banking web app in Spring Boot and Thymeleaf: registration and login with Spring Security and BCrypt, multiple accounts, deposits, withdrawals, transfers and transaction history.",
    bullets: ["Accounts, deposits, withdrawals, transfers", "Spring Security login with BCrypt", "Layered MVC: controller → service → JPA"],
    pills: ["Java", "Spring Boot", "Thymeleaf"], motif: "coins" },
  { file: "project-java-practice.svg", title: "Java Practice", emoji: "📚", label: "LEARNING JOURNEY", accent: "#fbbf24", edge2: "#fb923c", bg0: "#1a1405",
    desc: "My Java learning journey: around 140 exercises and small programs organised by topic, from loops and arrays to OOP inheritance and Swing GUI apps like a café ordering system.",
    bullets: ["~140 exercises organised by topic", "Loops, arrays, methods, OOP, inheritance", "Swing GUI apps: café ordering, login"],
    pills: ["Java", "OOP", "Swing"], motif: "books" },
];

for (const c of cards) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="470" height="290" viewBox="0 0 470 290" role="img" aria-labelledby="title desc">
<title id="title">${esc(c.title)}</title>
<desc id="desc">${esc(c.desc)}</desc>
<defs>
  <linearGradient id="bg" x2="1" y2="1"><stop stop-color="${c.bg0}"/><stop offset=".5" stop-color="#0d1728"/><stop offset="1" stop-color="#10233d"/></linearGradient>
  <linearGradient id="edge" x1="0" x2="1"><stop stop-color="${c.accent}"/><stop offset=".5" stop-color="${c.edge2}"/><stop offset="1" stop-color="${c.accent}"/>
    <animateTransform attributeName="gradientTransform" type="translate" values="-1 0;0 0" dur="5s" repeatCount="indefinite"/></linearGradient>
</defs>
<style>
  .t{font-family:'Segoe UI',Inter,Arial,sans-serif}
  @media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<rect x="1" y="1" width="468" height="288" rx="20" fill="url(#bg)"/>
<rect x="1.25" y="1.25" width="467.5" height="287.5" rx="19.75" fill="none" stroke="url(#edge)" stroke-opacity=".8" stroke-width="2"/>
<g class="t">
  <text x="28" y="42" fill="${c.accent}" font-size="11" font-weight="700" letter-spacing="2.5">${esc(c.label)}</text>
  <text x="28" y="78" fill="#f8fafc" font-size="25" font-weight="800">${c.emoji} ${esc(c.title)}</text>
  <g font-size="13.5" fill="#cbd5e1">
${c.bullets.map((b, i) => `    <text x="28" y="${110 + i * 24}"><tspan fill="${c.accent}">▸</tspan> ${esc(b)}</text>`).join("\n")}
  </g>
  <g font-size="12" font-weight="700">
    ${pills(c.pills, 226)}
  </g>
  <text x="440" y="270" fill="${c.accent}" font-size="12" font-weight="700" text-anchor="end">View repo →</text>
</g>
<g transform="translate(350 168)">
  ${MOTIFS[c.motif](c.accent)}
</g>
</svg>
`;
  fs.writeFileSync(path.join(__dirname, "..", "assets", c.file), svg);
  console.log("wrote", c.file);
}
