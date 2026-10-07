import {
  SPORTS,
  escape as e,
  filterDrills,
  buildSession,
  validateLog,
  parseBackup,
  weeklyStats,
  localDate,
  bmi,
  mealPlan,
  csv,
} from "./engine.js?v=2";
import { foods } from "./foods.js?v=2";
import { products } from "./products.js?v=2";
const $ = (id) => document.getElementById(id),
  title = (s) => s[0].toUpperCase() + s.slice(1),
  page = document.body.dataset.page;
let drills = [],
  session = null,
  timer = null,
  timerDeadline = 0,
  remaining = 0,
  blockIndex = 0,
  logs = [],
  kit = [],
  kitChecks = new Set(),
  warning = "";
const storeKey = "vivriti.training.v1";
try {
  const saved = localStorage.getItem(storeKey);
  if (saved) logs = parseBackup(JSON.parse(saved));
  kit = JSON.parse(localStorage.getItem("vivriti.kit.v1") || "[]");
  if (!Array.isArray(kit)) kit = [];
  const checks = JSON.parse(
    localStorage.getItem("vivriti.kit-checks.v1") || "[]",
  );
  if (Array.isArray(checks))
    kitChecks = new Set(checks.filter((x) => typeof x === "string"));
} catch {
  warning =
    "Saved data could not be read. Export any recoverable data from your browser before clearing storage.";
}
function persist() {
  try {
    localStorage.setItem(storeKey, JSON.stringify({ version: 1, logs }));
    return true;
  } catch {
    toast("Browser storage unavailable. Export your entries before leaving.");
    return false;
  }
}
function toast(text) {
  const node = $("toast");
  node.textContent = text;
  node.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (node.hidden = true), 4500);
}
function download(name, text, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function links(current) {
  return [
    ["index.html", "Home", "home"],
    ["training.html", "Training", "training"],
    ["progress.html", "Progress", "progress"],
    ["mypage.html", "Nutrition", "nutrition"],
    ["shop.html", "Equipment", "equipment"],
    ["index.html#about-us", "Project", "about"],
  ]
    .map(
      ([url, text, id]) =>
        `<a href="${url}" ${current === id ? 'aria-current="page"' : ""}>${text}</a>`,
    )
    .join("");
}
function header() {
  return `<header class="site-header"><a class="brand" href="index.html" aria-label="AI Sports home"><span class="brand-mark">V</span><span><b>AI SPORTS</b><small>VIVRITI / TRAINING STUDIO</small></span></a><button class="nav-toggle secondary" id="menu" aria-expanded="false" aria-controls="navigation">Menu</button><nav class="site-nav" id="navigation" aria-label="Main navigation">${links(SPORTS.includes(page) ? "training" : page)}</nav></header>`;
}
function footer() {
  return `<footer class="site-footer"><div><b>AI SPORTS / VIVRITI</b><p>A team project by Avdhoot, Arnav, Aayush & Aayusshmaan.</p></div><div>Built for deliberate practice. <a href="https://github.com/Modeldog8197/VIVRITI-FINAL" target="_blank" rel="noopener">Source & methodology ↗</a></div></footer><div id="toast" class="toast" role="status" hidden></div>`;
}
function heading(kicker, name, copy) {
  return `<div class="page-heading"><p class="eyebrow">${kicker}</p><h1>${name}</h1><p>${copy}</p></div>`;
}
function field(id, label, content, wide = false) {
  return `<div class="field ${wide ? "wide" : ""}"><label for="${id}">${label}</label>${content}</div>`;
}
function options(items, first = "") {
  return (
    (first ? `<option value="">${first}</option>` : "") +
    items.map((x) => `<option value="${e(x)}">${e(title(x))}</option>`).join("")
  );
}
function court(sport, interactive = false) {
  let paths = "";
  if (sport === "basketball")
    paths =
      '<rect x="24" y="24" width="352" height="234" rx="2"/><path d="M200 24v234 M24 141h80 M296 141h80"/><circle cx="200" cy="141" r="34"/><path d="M24 92h65v98H24 M376 92h-65v98h65 M24 60a81 81 0 0 1 0 162 M376 60a81 81 0 0 0 0 162"/><circle cx="52" cy="141" r="6"/><circle cx="348" cy="141" r="6"/>';
  if (sport === "football")
    paths =
      '<rect x="24" y="24" width="352" height="234"/><path d="M200 24v234 M24 80h61v122H24 M376 80h-61v122h61 M24 113h24v56H24 M376 113h-24v56h24"/><circle cx="200" cy="141" r="36"/><path d="M85 109a36 36 0 0 1 0 64 M315 109a36 36 0 0 0 0 64"/>';
  if (sport === "cricket")
    paths =
      '<ellipse cx="200" cy="141" rx="169" ry="116"/><ellipse cx="200" cy="141" rx="120" ry="78" stroke-dasharray="5 5"/><rect x="179" y="71" width="42" height="140"/><path d="M160 89h80 M160 194h80 M193 80v12 M200 80v12 M207 80v12 M193 188v12 M200 188v12 M207 188v12"/>';
  return `<svg viewBox="0 0 400 282" role="img" aria-label="${title(sport)} practice diagram illustration"><g fill="none" stroke="currentColor" stroke-width="1.5" opacity=".6">${paths}</g><path d="M130 189 Q175 141 276 104" fill="none" stroke="${interactive ? "#dbe786" : "currentColor"}" stroke-width="2" stroke-dasharray="5 5"/><g fill="${interactive ? "#dbe786" : "currentColor"}"><circle cx="130" cy="189" r="8"/><circle cx="276" cy="104" r="8"/></g><g font-family="Arial" font-size="10" fill="currentColor"><text x="123" y="216">01</text><text x="272" y="90">02</text></g></svg>`;
}
function home() {
  return `<main id="main" class="wrap"><section class="hero" id="home"><div><p class="eyebrow">The next session starts here</p><h1>LESS SCROLLING.<br><span class="red">MORE PRACTICE.</span></h1><p class="lead">A place to turn basketball, football and cricket drills into a session you can actually follow. Choose a skill. Build your plan. Keep a record.</p><div class="actions"><a class="button accent" href="training.html">Build a session ↗</a><a class="button secondary" href="#sports">Explore the sports</a></div><p class="micro">Made for players, by students who play.</p></div><div class="hero-art"><header><span>PRACTICE BOARD / <b id="board-sport">BASKETBALL</b></span><span>01—03</span></header><div id="board">${court("basketball", true)}</div><div class="art-footer"><span>Illustration · plan your next move</span><div class="sport-switch">${SPORTS.map((s, i) => `<button data-board="${s}" aria-label="Show ${s} diagram" aria-pressed="${i === 0}">${String(i + 1).padStart(2, "0")}</button>`).join("")}</div></div></div></section><div class="strip"><div><b>03 SPORTS</b><small>Basketball · football · cricket</small></div><div><b>${drills.length} DRILLS</b><small>The original library, rebuilt</small></div><div><b>YOUR PRACTICE</b><small>Plans and logs stay on this device</small></div></div><section class="section section-anchor" id="sports"><div class="section-head"><div><p class="eyebrow">Find your game</p><h2>THREE SPORTS. ONE ROUTINE.</h2></div><a href="training.html">All drills ↗</a></div><div class="sports-grid">${SPORTS.map((s) => `<a class="sport-card" href="${sportFile(s)}"><div class="sport-graphic">${court(s)}</div><div class="card-body"><h3>${s}</h3><p>${{ basketball: "Shooting, ball handling, passing and team defence.", football: "Finishing, close control, passing and goalkeeping.", cricket: "Batting, bowling, fielding and wicketkeeping." }[s]}</p><div class="card-arrow"><span>${drills.filter((d) => d.sport === s).length} drills</span><span>Explore ↗</span></div></div></a>`).join("")}</div></section><section class="feature-band"><div><p class="eyebrow">Make the session count</p><h2>A PLAN YOU CAN<br>TAKE TO PRACTICE.</h2><a class="button" href="training.html#planner">Open session builder ↗</a></div><div class="steps"><div><strong>01 / CHOOSE</strong><p>Pick your sport, skill, group size and available time.</p></div><div><strong>02 / PRACTISE</strong><p>Follow the drill sequence with a timer for each block.</p></div><div><strong>03 / REFLECT</strong><p>Record actual minutes, effort and a note for next time.</p></div></div></section><section class="section section-anchor" id="news"><div class="section-head"><div><p class="eyebrow">Beyond the session</p><h2>KEEP UP WITH THE GAME.</h2></div></div><div class="news-grid"><a href="https://www.nba.com/news" target="_blank" rel="noopener"><strong>BASKETBALL ↗</strong><small>NBA · news and coverage</small></a><a href="https://www.fifa.com/" target="_blank" rel="noopener"><strong>FOOTBALL ↗</strong><small>FIFA · the global game</small></a><a href="https://www.icc-cricket.com/" target="_blank" rel="noopener"><strong>CRICKET ↗</strong><small>ICC · news and competition</small></a></div><details style="margin-top:22px"><summary>Original sports news feed</summary><p class="micro">The original third-party feed is available on demand. Availability depends on RSS.app.</p><button id="load-news" class="secondary">Load original news feed</button><div id="news-embed" class="embed-container"></div></details></section><section class="section section-anchor" id="about-us"><div class="about-grid"><div><p class="eyebrow">The project</p><h2>BUILT TOGETHER.<br>REBUILT FOR USE.</h2></div><div><p>Vivriti began as a student-built sports platform, bringing three sport-specific chatbots, drill guides, nutrition and equipment together. This edition keeps that scope and gives the experience a clearer structure.</p><p>Session plans use a transparent drill selection rule. Training charts use only your recorded practice. The original hosted AI assistants remain available inside each sport’s coach section.</p><a href="https://github.com/Modeldog8197/VIVRITI-FINAL#readme" target="_blank" rel="noopener">Read the project notes ↗</a></div></div><div class="team">${["Avdhoot Gupta", "Arnav Jhujhunwala", "Aayush Gupta", "Aayusshmaan Singh"].map((n) => `<div><strong>${n}</strong><small>Original project team</small></div>`).join("")}</div></section></main>`;
}
function sportFile(s) {
  return {
    basketball: "bb.html",
    football: "fb.html",
    cricket: "cricket.html",
  }[s];
}
function training() {
  const s = SPORTS.includes(page) ? page : "";
  return `<main id="main" class="wrap">${heading("Practice / Drill library", s ? title(s) + " training" : "Build your next session", "Find a drill, read the steps, then put it into a timed plan. All 52 original drills are included; advanced drills are marked.")}<nav class="tabs" aria-label="Training tools"><a href="#library">Drill library</a><a href="#planner">Session builder</a><a href="#coach">Coach & assistants</a></nav><section class="section section-anchor" id="library"><div class="filters">${field("search", "Search drills", '<input id="search" type="search" placeholder="Try passing, crossover or catching">', true)}${field("sport", "Sport", `<select id="sport">${options(SPORTS, "All sports")}</select>`)}${field("skill", "Skill", '<select id="skill"><option value="">All skills</option></select>')}${field("level", "Experience", '<select id="level"><option value="">All levels</option><option value="foundation">Foundation</option><option value="advanced">Advanced</option></select>')}</div><div class="section-head"><p id="drill-count" class="micro" role="status"></p><label class="micro"><input id="saved-only" type="checkbox"> Favourites only</label></div><div id="drill-list" class="drill-grid"></div></section><section id="planner" class="section section-anchor"><div class="section-head"><div><p class="eyebrow">Session builder</p><h2>SET THE TIME. GET THE PLAN.</h2></div></div><div class="notice">Foundational practice starts with space, suitable equipment and an easy warm-up. Advanced contact, diving and explosive drills need qualified supervision.</div><form id="plan-form"><div class="form-grid">${field("plan-sport", "Sport", `<select id="plan-sport">${options(SPORTS)}</select>`)}${field("plan-skill", "Skill focus", '<select id="plan-skill"><option value="">Mixed skills</option></select>')}${field("plan-minutes", "Available minutes", '<input id="plan-minutes" type="number" value="30" min="15" max="90" step="1" required>')}${field("plan-players", "Group size", '<select id="plan-players"><option value="solo">Solo</option><option value="team">With teammates / coach</option></select>')}</div><div class="actions"><button class="accent">Build session</button><label class="micro"><input type="checkbox" id="plan-advanced"> Include advanced drills with supervision</label></div><p id="plan-error" class="error" role="alert" hidden></p></form><div id="plan-workspace" hidden><div class="planner-layout"><div class="panel"><div class="section-head"><h2 id="plan-title">Session plan</h2><span id="plan-total" class="badge"></span></div><div id="plan-blocks"></div><div class="actions"><button class="secondary" id="export-plan">Download plan</button><button class="secondary" id="print-plan">Print</button></div></div><div><div class="panel timer-panel"><p class="eyebrow" style="color:var(--lime)">Practice timer</p><h3 id="timer-block"></h3><div id="timer-time" class="timer-digits" role="timer" aria-live="off"></div><div class="timer-progress"><i id="timer-bar"></i></div><p id="timer-caption" class="micro"></p><div class="actions"><button id="timer-start">Start</button><button id="timer-next">Next block</button><button id="timer-reset">Reset</button></div><p id="timer-status" class="micro" role="status"></p></div><div class="panel" style="margin-top:22px"><h2>Record your practice</h2><p class="micro">Log what you actually did. Completing the timer does not automatically record a session.</p><form id="log-form"><div class="form-grid">${field("log-date", "Date", '<input id="log-date" type="date" required>')}${field("log-minutes", "Actual minutes", '<input id="log-minutes" type="number" min="1" max="240" required>')}${field("log-effort", "Effort (1 easy – 10 maximal)", '<input id="log-effort" type="number" min="1" max="10" step="1" required>')}${field("log-notes", "One note for next time", '<textarea id="log-notes" maxlength="500" rows="2" placeholder="What worked? What needs practice?"></textarea>', true)}</div><button>Save to progress</button><p id="log-message" class="message" role="status"></p></form></div></div></div></div></section><section id="coach" class="section section-anchor"><div class="section-head"><div><p class="eyebrow">Ask / Explore / Discuss</p><h2>FIND A PLACE TO START.</h2></div></div><div class="about-grid"><div class="panel"><h3>Local drill finder</h3><p class="micro">Searches the project’s drill library. It matches keywords and runs entirely on your device.</p><form id="guide-form"><div class="field"><label for="guide-question">What would you like to practise?</label><input id="guide-question" placeholder="e.g. passing" maxlength="120" required></div><button style="margin-top:16px">Find related drills</button></form><div id="guide-results" class="message" role="status"></div></div><div class="panel"><h3>Original AI assistants</h3><p class="micro">The original GPT-Trainer integrations are preserved. Load one to open a third-party hosted assistant; messages go to that provider. Availability and responses depend on its service.</p><label class="field">Sport<select id="coach-sport">${options(SPORTS)}</select></label><div class="actions"><button id="load-coach" class="accent">Load AI assistant</button><a id="open-coach" target="_blank" rel="noopener">Open directly ↗</a></div><p class="micro">Discuss skill practice with your coach. Use a qualified professional for injury or medical questions.</p><div id="coach-embed" class="embed-container"></div></div></div></section></main>`;
}
function progress() {
  return `<main id="main" class="wrap">${heading("Training journal", "Your practice, recorded.", "A record of what you did, not a score of your athletic ability. Entries stay in this browser; export a backup to keep them.")}<div id="progress-content"></div><div class="actions"><button id="export-logs">Export backup</button><button id="export-csv" class="secondary">Download CSV</button><label class="button secondary" for="import-logs">Import backup</label><input id="import-logs" type="file" accept="application/json,.json" hidden><button id="clear-logs" class="secondary">Clear journal</button></div><p id="import-status" class="message" role="status"></p><dialog id="confirm-clear"><h2>Clear this journal?</h2><p>This removes all training entries from this browser. Download a backup first if you want to keep them.</p><div class="actions"><button id="cancel-clear" class="secondary">Keep entries</button><button id="confirm-delete" class="accent">Clear entries</button></div></dialog><section class="section"><div class="notice">Effort × minutes is a simple self-reported session-load measure. It is not a measure of fitness, performance or injury risk.</div></section></main>`;
}
function nutrition() {
  return `<main id="main" class="wrap">${heading("Food / Preparation", "A meal plan for your day.", "Build a simple food checklist around preferences and ingredient exclusions. Choose portions for your own needs; this tool does not prescribe calorie targets.")}<div class="nutrition-split"><section class="section"><div class="panel"><h2>Build your food checklist</h2><form id="meal-form">${field("diet", "Food preference", `<select id="diet">${options(["vegetarian", "vegan", "omnivore"])}</select>`)}<fieldset style="margin:20px 0"><legend>Exclude ingredients</legend><div class="inline-checks">${["dairy", "nuts", "gluten", "soy", "egg"].map((x) => `<label><input type="checkbox" value="${x}" name="exclude">${title(x)}</label>`).join("")}</div></fieldset><p class="micro">Exclusions filter example ingredients only. Check labels and cross-contact if you have allergies; these recipes are not certified allergen-free.</p><button class="accent">Create meal checklist</button></form></div><div id="meals" class="meal-grid" style="margin-top:22px"></div><div class="actions"><button id="export-meals" class="secondary" disabled>Download shopping list</button><button id="print-meals" class="secondary">Print</button></div></section><aside class="section"><div class="panel"><h2>Variety comes first.</h2><p>Include a variety of vegetables, fruits, pulses, whole grains and protein foods across the day. Food needs depend on age, activity, culture and individual circumstances.</p><a class="micro" href="https://www.who.int/news-room/fact-sheets/detail/healthy-diet" target="_blank" rel="noopener">Source: WHO, Healthy diet ↗</a><div class="aside-note">This is an educational food organiser. For nutrition goals, growth, medical conditions or training demands, ask a qualified dietitian.</div></div><details class="panel" style="margin-top:22px"><summary>Optional adult BMI reference</summary><p class="micro">Adult BMI applies from age 20. It does not set your meal plan. Younger users need age- and sex-specific interpretation.</p><form id="bmi-form"><div class="form-grid">${field("age", "Age (years)", '<input type="number" id="age" min="2" max="120" required>')}${field("weight", "Weight (kg)", '<input type="number" id="weight" min="10" max="400" step="0.1" required>')}${field("height", "Height (cm)", '<input type="number" id="height" min="50" max="250" step="0.1" required>')}</div><button class="secondary">Calculate reference</button></form><p id="bmi-result" class="message" role="status"></p><a class="micro" href="https://www.cdc.gov/bmi/adult-calculator/index.html" target="_blank" rel="noopener">CDC adult BMI reference ↗</a><br><a class="micro" href="https://www.cdc.gov/bmi/child-teen-calculator/index.html" target="_blank" rel="noopener">CDC child and teen calculator ↗</a></details></aside></div></main>`;
}
const gear = [
  {
    id: "basketball",
    name: "Basketball basics",
    category: "basketball",
    items: [
      "Basketball suited to your age and court",
      "Court shoes with a secure fit",
      "Water bottle and comfortable kit",
    ],
    url: "https://www.niviasports.com/products/pro-touch-pro-touch-basketball-balls",
    retailer: "Nivia",
  },
  {
    id: "football",
    name: "Football essentials",
    category: "football",
    items: [
      "Football for your group",
      "Footwear suited to the surface",
      "Shin guards for organised play",
    ],
    url: "https://www.niviasports.com/products/storm",
    retailer: "Nivia",
  },
  {
    id: "cricket",
    name: "Cricket practice kit",
    category: "cricket",
    items: [
      "Soft practice ball for introductory drills",
      "Bat and stumps for batting sessions",
      "Coach-approved protective equipment for hard-ball practice",
    ],
    url: "https://www.niviasports.com/products/nivia-cricket-tennis-ball-heavy-pack-of-12",
    retailer: "Nivia",
  },
  {
    id: "jerseys",
    name: "Teamwear",
    category: "clothing",
    items: [
      "Comfortable training clothing",
      "Team jersey if needed",
      "Spare top for longer sessions",
    ],
    url: "https://shopthearena.com/collections/nba",
    retailer: "The Arena",
  },
  {
    id: "shoes",
    name: "Court footwear",
    category: "basketball",
    items: [
      "Fit and comfort before colour",
      "Check sole grip for your surface",
      "Try on before purchasing where possible",
    ],
    url: "https://www.superkicks.in/",
    retailer: "Superkicks",
  },
  {
    id: "markers",
    name: "Practice markers",
    category: "all",
    items: [
      "Cones or safe flat markers",
      "A clear training space",
      "A notebook for drill results",
    ],
    url: null,
  },
];
function equipment() {
  return `<main id="main" class="wrap">${heading("Equipment / Kit checklist", "Bring the essentials.", "Organise what you need for your next session. Retailer links from the original project are retained as browsing references; prices and availability are not tracked.")}<div class="filters">${field("gear-filter", "Sport / category", `<select id="gear-filter">${options(["basketball", "football", "cricket", "clothing"], "All categories")}</select>`)}</div><div id="gear-list" class="equipment-grid"></div><section class="section" style="margin-top:30px"><details class="panel"><summary>Original retailer catalogue · ${products.length} product links</summary><p class="micro">The original jerseys, shoes, caps and equipment links are preserved here. Listings may be older or unavailable; check the retailer before purchasing.</p><div class="field"><label for="catalogue-filter">Product category</label><select id="catalogue-filter">${options([...new Set(products.map((p) => p.category))], "All categories")}</select></div><div id="catalogue-list" class="equipment-grid" style="margin-top:20px"></div></details></section><section class="section" style="margin-top:30px"><div class="panel"><h2>Your kit checklist</h2><p class="micro">Saved on this device. This is a planning checklist; purchases take place on retailers’ own sites.</p><div id="kit-list"></div><div class="actions"><button id="export-kit" class="secondary">Download checklist</button><button id="clear-kit" class="secondary">Clear checklist</button></div></div></section></main>`;
}
function setSkills(sport, id, first) {
  const previous = $(id).value;
  $(id).innerHTML = options(
    [
      ...new Set(
        drills.filter((d) => !sport || d.sport === sport).map((d) => d.skill),
      ),
    ],
    first,
  );
  if ([...$(id).options].some((o) => o.value === previous))
    $(id).value = previous;
}
let favourites = new Set();
try {
  const ids = JSON.parse(localStorage.getItem("vivriti.favourites.v1") || "[]");
  if (Array.isArray(ids))
    favourites = new Set(ids.filter((x) => typeof x === "string"));
} catch {}
function renderDrills() {
  let data = filterDrills(drills, {
    sport: $("sport").value,
    skill: $("skill").value,
    query: $("search").value,
    level: $("level").value,
  });
  if ($("saved-only").checked) data = data.filter((d) => favourites.has(d.id));
  $("drill-count").textContent = `${data.length} of ${drills.length} drills`;
  $("drill-list").innerHTML = data.length
    ? data
        .map(
          (d) =>
            `<article class="drill-card" id="${d.id}"><div><span class="badge ${d.level}">${e(d.sport)} / ${e(d.skill)}</span></div><h3>${e(d.title)}</h3><p>${e(d.instructions.slice(0, 165))}${d.instructions.length > 165 ? "…" : ""}</p><details><summary>Read the drill steps</summary><p>${e(d.instructions)}</p>${d.level === "advanced" ? "<p><b>Advanced: use qualified supervision and suitable equipment. Adapt the drill to your ability.</b></p>" : ""}</details><div class="drill-meta"><span>${d.players === "solo" ? "Solo option" : "Teammates / coach"}</span><span>${e(d.level)}</span></div><button class="secondary small" data-favourite="${d.id}" aria-pressed="${favourites.has(d.id)}">${favourites.has(d.id) ? "Saved to favourites" : "Save drill"}</button></article>`,
        )
        .join("")
    : '<div class="empty">No drills match these filters. Try another skill or clear the search.</div>';
  $("drill-list")
    .querySelectorAll("[data-favourite]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          const id = b.dataset.favourite;
          favourites.has(id) ? favourites.delete(id) : favourites.add(id);
          try {
            localStorage.setItem(
              "vivriti.favourites.v1",
              JSON.stringify([...favourites]),
            );
          } catch {
            toast("Favourites kept for this visit only.");
          }
          renderDrills();
        }),
    );
}
function startPlan() {
  try {
    const next = buildSession(drills, {
      sport: $("plan-sport").value,
      skill: $("plan-skill").value,
      minutes: Number($("plan-minutes").value),
      players: $("plan-players").value,
      level: $("plan-advanced").checked ? "advanced" : "foundation",
    });
    stopTimer();
    session = next;
    blockIndex = 0;
    remaining = session.blocks[0].minutes * 60;
    $("plan-error").hidden = true;
    $("plan-workspace").hidden = false;
    $("plan-title").textContent = title(session.sport) + " session";
    $("plan-total").textContent = session.minutes + " minutes";
    $("plan-blocks").innerHTML = session.blocks
      .map(
        (b, i) =>
          `<div class="plan-block"><span class="number">${String(i + 1).padStart(2, "0")}</span><div><strong>${e(b.title)}</strong><p>${e(b.instructions)}</p></div><span>${b.minutes} min</span></div>`,
      )
      .join("");
    $("log-date").value = localDate();
    $("log-minutes").value = "";
    $("log-message").textContent = "";
    renderTimer();
  } catch (err) {
    $("plan-error").textContent = err.message;
    $("plan-error").hidden = false;
  }
}
function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
function renderTimer() {
  const block = session.blocks[blockIndex];
  $("timer-block").textContent =
    `${blockIndex + 1} / ${session.blocks.length} · ${block.title}`;
  $("timer-time").textContent =
    `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  $("timer-caption").textContent = block.instructions.slice(0, 180);
  $("timer-start").textContent = timer
    ? "Pause"
    : remaining === 0
      ? "Completed"
      : "Start";
  $("timer-start").disabled = remaining === 0;
  $("timer-next").disabled = blockIndex === session.blocks.length - 1;
  $("timer-bar").style.width =
    `${100 * (1 - remaining / (block.minutes * 60))}%`;
}
function wireTraining() {
  if (SPORTS.includes(page)) {
    $("sport").value = page;
    $("plan-sport").value = page;
    $("coach-sport").value = page;
  }
  setSkills($("sport").value, "skill", "All skills");
  setSkills($("plan-sport").value, "plan-skill", "Mixed skills");
  renderDrills();
  $("sport").onchange = () => {
    setSkills($("sport").value, "skill", "All skills");
    renderDrills();
  };
  ["search", "skill", "level", "saved-only"].forEach((id) =>
    $(id).addEventListener(id === "search" ? "input" : "change", renderDrills),
  );
  $("plan-sport").onchange = () =>
    setSkills($("plan-sport").value, "plan-skill", "Mixed skills");
  $("plan-form").onsubmit = (ev) => {
    ev.preventDefault();
    startPlan();
  };
  $("timer-start").onclick = () => {
    if (!session) return;
    if (timer) {
      remaining = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
      stopTimer();
    } else {
      timerDeadline = Date.now() + remaining * 1000;
      timer = setInterval(() => {
        remaining = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
        if (remaining === 0) {
          stopTimer();
          $("timer-status").textContent =
            blockIndex === session.blocks.length - 1
              ? "Session timer complete. Record your actual practice below."
              : "Block complete. Move to the next when ready.";
        }
        renderTimer();
      }, 200);
    }
    renderTimer();
  };
  $("timer-next").onclick = () => {
    stopTimer();
    blockIndex++;
    remaining = session.blocks[blockIndex].minutes * 60;
    $("timer-status").textContent = "";
    renderTimer();
  };
  $("timer-reset").onclick = () => {
    stopTimer();
    remaining = session.blocks[blockIndex].minutes * 60;
    $("timer-status").textContent = "";
    renderTimer();
  };
  $("export-plan").onclick = () =>
    download(
      "vivriti-session.txt",
      `${title(session.sport)} · ${session.minutes} planned minutes\n\n` +
        session.blocks
          .map((b) => `${b.title} — ${b.minutes} min\n${b.instructions}`)
          .join("\n\n"),
    );
  $("print-plan").onclick = () => window.print();
  $("log-form").onsubmit = (ev) => {
    ev.preventDefault();
    try {
      const entry = validateLog({
        id: crypto.randomUUID(),
        sport: session.sport,
        date: $("log-date").value,
        minutes: Number($("log-minutes").value),
        effort: Number($("log-effort").value),
        notes: $("log-notes").value,
        plannedMinutes: session.minutes,
      });
      if (entry.date > localDate())
        throw Error(
          "Record completed practice with today’s date or an earlier date.",
        );
      if (logs.length >= 1000)
        throw Error(
          "Journal limit reached. Export a backup and clear old entries.",
        );
      logs.push(entry);
      const saved = persist();
      $("log-message").textContent = saved
        ? "Saved. View your Progress journal."
        : "Entry added for this visit. Export before leaving.";
      $("log-minutes").value = "";
      $("log-effort").value = "";
      $("log-notes").value = "";
    } catch (err) {
      $("log-message").textContent = err.message;
    }
  };
  $("guide-form").onsubmit = (ev) => {
    ev.preventDefault();
    const q = $("guide-question")
      .value.toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((t) => t.length > 2);
    const scored = drills
      .filter((d) => !SPORTS.includes(page) || d.sport === page)
      .map((d) => ({
        d,
        score: q.reduce(
          (n, t) => n + (d.title + " " + d.skill).toLowerCase().includes(t),
          0,
        ),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    $("guide-results").innerHTML = scored.length
      ? scored
          .map(
            ({ d }) =>
              `<p><a href="#library" data-find="${d.id}">${e(d.title)} · ${e(d.sport)} ↗</a></p>`,
          )
          .join("")
      : "No title or skill matches. Try a short keyword such as passing, shooting, bowling or catching.";
    $("guide-results")
      .querySelectorAll("[data-find]")
      .forEach(
        (a) =>
          (a.onclick = () => {
            const d = drills.find((d) => d.id === a.dataset.find);
            $("sport").value = d.sport;
            setSkills(d.sport, "skill", "All skills");
            $("skill").value = "";
            $("level").value = "";
            $("search").value = d.title;
            $("saved-only").checked = false;
            renderDrills();
          }),
      );
  };
  const botUrls = {
    basketball:
      "https://app.gpt-trainer.com/widget/40385727f44541b891787e58480e3002",
    football:
      "https://app.gpt-trainer.com/widget/bcc3267b5afa4d59be8b03ed681fed91",
    cricket:
      "https://app.gpt-trainer.com/widget/4d44d30754c54e80876655064857221d",
  };
  const setBot = () => {
    $("open-coach").href = botUrls[$("coach-sport").value];
    $("coach-embed").replaceChildren();
    $("load-coach").disabled = false;
  };
  setBot();
  $("coach-sport").onchange = setBot;
  $("load-coach").onclick = () => {
    const f = document.createElement("iframe");
    f.title =
      title($("coach-sport").value) + " AI assistant, hosted by GPT-Trainer";
    f.src = botUrls[$("coach-sport").value];
    f.referrerPolicy = "no-referrer";
    $("coach-embed").append(f);
    $("load-coach").disabled = true;
    const p = document.createElement("p");
    p.className = "load-note";
    p.textContent =
      "If the assistant does not appear, use “Open directly”. The hosted service may be unavailable.";
    $("coach-embed").append(p);
  };
}
function renderProgress() {
  const week = weeklyStats(logs),
    minutes = week.reduce((n, d) => n + d.minutes, 0),
    count = week.reduce((n, d) => n + d.sessions, 0),
    max = Math.max(1, ...week.map((d) => d.minutes));
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  $("progress-content").innerHTML =
    `<div class="stats"><div class="stat"><strong>${minutes}</strong><small>Minutes · last 7 days</small></div><div class="stat"><strong>${count}</strong><small>Sessions · last 7 days</small></div><div class="stat"><strong>${logs.length}</strong><small>Total recorded sessions</small></div></div><div class="panel"><h2>Last seven days</h2><p class="micro">Select a bar to inspect that day. Only recorded minutes are shown.</p><div class="chart" role="group" aria-label="Daily training minutes">${week.map((d) => `<button data-day="${d.date}" aria-label="${d.date}: ${d.minutes} minutes, ${d.sessions} sessions"><b>${d.minutes} min</b><span class="bar" style="height:${Math.max(3, (145 * d.minutes) / max)}px"></span><span>${new Date(d.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" })}</span></button>`).join("")}</div><p id="day-details" class="message" role="status">${logs.length ? "Select a day above." : "No sessions yet. Build a session and record your practice to start."}</p></div><section class="section" style="margin-top:26px"><div class="section-head"><h2>Session journal</h2><a href="training.html#planner">Record practice ↗</a></div>${logs.length ? `<div class="table-scroll"><table><thead><tr><th>Date</th><th>Sport</th><th>Actual / planned</th><th>Effort</th><th>Notes</th><th>Entry</th></tr></thead><tbody>${sorted.map((l) => `<tr><td>${l.date}</td><td>${title(l.sport)}</td><td>${l.minutes} / ${l.plannedMinutes || "—"} min</td><td>${l.effort}/10</td><td>${e(l.notes)}</td><td><button class="secondary small" data-delete="${e(l.id)}" aria-label="Delete ${e(l.sport)} session on ${l.date}">Delete</button></td></tr>`).join("")}</tbody></table></div>` : '<div class="empty"><h3>Your first session belongs here.</h3><p>A simple note after practice makes the next session easier to plan.</p><a class="button" href="training.html#planner">Build a session</a></div>'}</section>`;
  $("progress-content")
    .querySelectorAll("[data-day]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          const d = week.find((d) => d.date === b.dataset.day);
          $("day-details").textContent =
            `${d.date} · ${d.sessions} sessions · ${d.minutes} actual minutes · ${d.load} effort × minute units.`;
        }),
    );
  $("progress-content")
    .querySelectorAll("[data-delete]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          const removed = logs.find((l) => l.id === b.dataset.delete);
          logs = logs.filter((l) => l.id !== b.dataset.delete);
          persist();
          renderProgress();
          const status = $("import-status");
          status.textContent = "Entry removed. ";
          const undo = document.createElement("button");
          undo.className = "link";
          undo.textContent = "Undo";
          undo.onclick = () => {
            logs.push(removed);
            persist();
            renderProgress();
            status.textContent = "Entry restored.";
          };
          status.append(undo);
        }),
    );
}
function wireProgress() {
  renderProgress();
  $("export-logs").onclick = () =>
    download(
      "vivriti-training-backup.json",
      JSON.stringify(
        { version: 1, exportedAt: new Date().toISOString(), logs },
        null,
        2,
      ),
      "application/json",
    );
  $("export-csv").onclick = () =>
    download(
      "vivriti-training.csv",
      csv([
        [
          "date",
          "sport",
          "actual_minutes",
          "planned_minutes",
          "effort_1_to_10",
          "session_load",
          "notes",
        ],
        ...logs.map((l) => [
          l.date,
          l.sport,
          l.minutes,
          l.plannedMinutes,
          l.effort,
          l.minutes * l.effort,
          l.notes,
        ]),
      ]),
      "text/csv",
    );
  $("import-logs").onchange = async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    try {
      if (file.size > 1500000)
        throw Error("Backup is too large (limit 1.5 MB).");
      const incoming = parseBackup(JSON.parse(await file.text()));
      const map = new Map(logs.map((l) => [l.id, l]));
      let added = 0,
        conflicts = 0;
      for (const l of incoming) {
        if (!map.has(l.id)) {
          map.set(l.id, l);
          added++;
        } else if (JSON.stringify(map.get(l.id)) !== JSON.stringify(l))
          conflicts++;
      }
      if (map.size > 1000)
        throw Error("Combined journal exceeds 1,000 entries.");
      logs = [...map.values()];
      const saved = persist();
      renderProgress();
      $("import-status").textContent =
        `Imported ${added} new entries; existing IDs preserved${conflicts ? `, ${conflicts} conflicting IDs skipped` : ""}. ${saved ? "Saved on this device." : "Export before leaving: storage is unavailable."}`;
    } catch (err) {
      $("import-status").textContent = "Import rejected: " + err.message;
    } finally {
      ev.target.value = "";
    }
  };
  $("clear-logs").onclick = () => $("confirm-clear").showModal();
  $("cancel-clear").onclick = () => $("confirm-clear").close();
  $("confirm-delete").onclick = () => {
    logs = [];
    persist();
    renderProgress();
    $("confirm-clear").close();
    $("import-status").textContent = "Journal cleared.";
  };
}
let meals = [];
function wireNutrition() {
  $("meal-form").onsubmit = (ev) => {
    ev.preventDefault();
    const exclude = [
      ...document.querySelectorAll("[name=exclude]:checked"),
    ].map((x) => x.value);
    meals = mealPlan(foods, $("diet").value, exclude);
    $("meals").innerHTML = meals
      .map(
        (m) =>
          `<article class="meal-card"><p class="eyebrow">Food ideas / ${e($("diet").value)}</p><h3>${m.meal}</h3><ul>${m.foods.map((f) => `<li>${e(f.name)}<small>${e(f.group)}${f.allergens.length ? " · contains " + e(f.allergens.join(", ")) : ""}</small></li>`).join("")}</ul>${m.foods.length < 3 ? '<p class="micro">No matching food for one group. Choose a suitable alternative with your dietitian.</p>' : ""}</article>`,
      )
      .join("");
    $("export-meals").disabled = false;
  };
  $("export-meals").onclick = () =>
    download(
      "vivriti-food-checklist.txt",
      "Food ideas — choose portions to suit your needs. Check labels and cross-contact.\n\n" +
        [...new Set(meals.flatMap((m) => m.foods.map((f) => f.name)))]
          .map((f) => "[ ] " + f)
          .join("\n"),
    );
  $("print-meals").onclick = () => window.print();
  $("bmi-form").onsubmit = (ev) => {
    ev.preventDefault();
    try {
      const r = bmi({
        age: Number($("age").value),
        weight: Number($("weight").value),
        height: Number($("height").value),
      });
      $("bmi-result").textContent =
        (r.value ? "Adult BMI reference: " + r.value.toFixed(1) + ". " : "") +
        r.message;
    } catch (err) {
      $("bmi-result").textContent = err.message;
    }
  };
}
function saveKit() {
  try {
    localStorage.setItem("vivriti.kit.v1", JSON.stringify(kit));
    localStorage.setItem(
      "vivriti.kit-checks.v1",
      JSON.stringify([...kitChecks]),
    );
  } catch {
    toast("Checklist kept for this visit only.");
  }
}
function renderKit() {
  $("kit-list").innerHTML = kit.length
    ? kit
        .map((id) => gear.find((g) => g.id === id))
        .filter(Boolean)
        .flatMap((g) =>
          g.items.map(
            (item) =>
              `<label class="kit-item"><input type="checkbox" data-kit-check="${e(item)}" ${kitChecks.has(item) ? "checked" : ""}><span>${e(item)}<small>${e(g.name)}</small></span></label>`,
          ),
        )
        .join("")
    : "<p>Add a kit from the cards above.</p>";
  $("kit-list")
    .querySelectorAll("[data-kit-check]")
    .forEach(
      (input) =>
        (input.onchange = () => {
          input.checked
            ? kitChecks.add(input.dataset.kitCheck)
            : kitChecks.delete(input.dataset.kitCheck);
          saveKit();
        }),
    );
  $("export-kit").disabled = !kit.length;
}
function renderGear() {
  const category = $("gear-filter").value;
  $("gear-list").innerHTML = gear
    .filter((g) => !category || g.category === category || g.category === "all")
    .map(
      (g) =>
        `<article class="equipment-card"><p class="eyebrow">${e(g.category === "all" ? "Any sport" : g.category)}</p><h3>${e(g.name)}</h3><ul>${g.items.map((i) => `<li>${e(i)}</li>`).join("")}</ul><div class="actions"><button class="secondary small" data-kit="${g.id}" aria-pressed="${kit.includes(g.id)}">${kit.includes(g.id) ? "Remove from checklist" : "Add to checklist"}</button>${g.url ? `<a class="micro" href="${g.url}" target="_blank" rel="noopener">Browse ${g.retailer} ↗</a>` : ""}</div></article>`,
    )
    .join("");
  $("gear-list")
    .querySelectorAll("[data-kit]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          const id = b.dataset.kit;
          kit.includes(id) ? (kit = kit.filter((x) => x !== id)) : kit.push(id);
          saveKit();
          renderGear();
          renderKit();
        }),
    );
}
function wireEquipment() {
  const catalogue = () => {
    const category = $("catalogue-filter").value;
    $("catalogue-list").innerHTML = products
      .filter((p) => !category || p.category === category)
      .map(
        (p) =>
          `<article class="equipment-card"><p class="eyebrow">${e(p.category)}</p><h3 style="font-size:23px">${e(p.name)}</h3><a class="micro" href="${e(p.url)}" target="_blank" rel="noopener">View on ${e(p.retailer)} ↗</a></article>`,
      )
      .join("");
  };
  catalogue();
  $("catalogue-filter").onchange = catalogue;
  kit = kit.filter((id) => gear.some((g) => g.id === id));
  renderGear();
  renderKit();
  $("gear-filter").onchange = renderGear;
  $("clear-kit").onclick = () => {
    kit = [];
    kitChecks.clear();
    saveKit();
    renderGear();
    renderKit();
  };
  $("export-kit").onclick = () =>
    download(
      "vivriti-kit-checklist.txt",
      kit
        .map((id) => gear.find((g) => g.id === id))
        .filter(Boolean)
        .flatMap((g) => [
          g.name,
          ...g.items.map((i) => (kitChecks.has(i) ? "[x] " : "[ ] ") + i),
          "",
        ])
        .join("\n"),
    );
}
async function init() {
  try {
    const response = await fetch("drills.json?v=2");
    if (!response.ok) throw Error("Drill library could not load.");
    drills = await response.json();
    $("app").innerHTML =
      header() +
      (page === "home"
        ? home()
        : page === "progress"
          ? progress()
          : page === "nutrition"
            ? nutrition()
            : page === "equipment"
              ? equipment()
              : training()) +
      footer();
    $("menu").onclick = () => {
      const open = $("menu").getAttribute("aria-expanded") !== "true";
      $("menu").setAttribute("aria-expanded", String(open));
      $("navigation").classList.toggle("open", open);
    };
    if (page === "home") {
      document.querySelectorAll("[data-board]").forEach(
        (b) =>
          (b.onclick = () => {
            $("board").innerHTML = court(b.dataset.board, true);
            $("board-sport").textContent = b.dataset.board.toUpperCase();
            document
              .querySelectorAll("[data-board]")
              .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
          }),
      );
      $("load-news").onclick = () => {
        const f = document.createElement("iframe");
        f.title = "Original Vivriti sports news feed";
        f.src = "https://rss.app/embed/v1/wall/8WgCo4Me7tz2lBkO";
        f.loading = "lazy";
        $("news-embed").append(f);
        $("load-news").disabled = true;
      };
    } else if (page === "progress") wireProgress();
    else if (page === "nutrition") wireNutrition();
    else if (page === "equipment") wireEquipment();
    else wireTraining();
    if (warning) toast(warning);
    if (location.hash) {
      const target = document.querySelector(
        location.hash.replace(/[^#a-z0-9_-]/gi, ""),
      );
      if (target) target.scrollIntoView();
    }
  } catch (err) {
    $("app").innerHTML =
      `<main class="wrap"><div class="page-heading"><h1>Workspace unavailable</h1><p>${e(err.message)}</p><p>Reload the page or serve the project over HTTP.</p></div></main>`;
  }
}
init();
