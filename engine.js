export const SPORTS = ["basketball", "football", "cricket"];
export const escape = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function filterDrills(
  drills,
  { sport = "", skill = "", query = "", level = "", players = "" } = {},
) {
  const q = query.trim().toLowerCase();
  return drills.filter(
    (d) =>
      (!sport || d.sport === sport) &&
      (!skill || d.skill === skill) &&
      (!level || d.level === level) &&
      (!players || d.players === players) &&
      (!q ||
        `${d.title} ${d.skill} ${d.instructions}`.toLowerCase().includes(q)),
  );
}
export function buildSession(
  drills,
  { sport, skill = "", minutes, players = "solo", level = "foundation" },
) {
  if (
    !SPORTS.includes(sport) ||
    !Number.isInteger(minutes) ||
    minutes < 15 ||
    minutes > 90
  )
    throw Error("Choose a sport and 15–90 whole minutes.");
  const candidates = filterDrills(drills, { sport, skill }).filter(
    (d) =>
      (players === "team" || d.players === "solo") &&
      (level === "advanced" || d.level !== "advanced"),
  );
  if (!candidates.length)
    throw Error("No drills match. Change the skill, group size or experience.");
  const diverse = [];
  const seen = new Set();
  for (const d of candidates) {
    if (!seen.has(d.skill)) {
      diverse.push(d);
      seen.add(d.skill);
    }
  }
  const chosen = [
      ...diverse,
      ...candidates.filter((d) => !diverse.includes(d)),
    ].slice(0, 3),
    available = minutes - 8;
  return {
    sport,
    minutes,
    createdAt: new Date().toISOString(),
    blocks: [
      {
        id: "warmup",
        title: "Warm-up",
        minutes: 5,
        instructions:
          "Walk or jog gently, then rehearse the sport’s basic movements at an easy pace. Check the space and equipment.",
      },
      ...chosen.map((d, i) => ({
        ...d,
        minutes:
          Math.floor(available / chosen.length) +
          (i < available % chosen.length ? 1 : 0),
      })),
      {
        id: "cooldown",
        title: "Cool-down & review",
        minutes: 3,
        instructions:
          "Ease the pace, walk, and note one thing that worked and one thing to practise next.",
      },
    ],
  };
}
export function validateLog(log) {
  if (
    !log ||
    !SPORTS.includes(log.sport) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(log.date) ||
    !Number.isFinite(Date.parse(log.date + "T12:00:00Z")) ||
    new Date(log.date + "T12:00:00Z").toISOString().slice(0, 10) !== log.date ||
    !Number.isInteger(log.minutes) ||
    log.minutes < 1 ||
    log.minutes > 240 ||
    !Number.isInteger(log.effort) ||
    log.effort < 1 ||
    log.effort > 10 ||
    typeof log.notes !== "string" ||
    log.notes.length > 500 ||
    typeof log.id !== "string" ||
    log.id.length > 100
  )
    throw Error(
      "Invalid training entry. Check date, duration (1–240 min) and effort (1–10).",
    );
  return {
    id: log.id,
    sport: log.sport,
    date: log.date,
    minutes: log.minutes,
    effort: log.effort,
    notes: log.notes,
    plannedMinutes: Number.isInteger(log.plannedMinutes)
      ? Math.max(0, Math.min(90, log.plannedMinutes))
      : 0,
  };
}
export function parseBackup(input) {
  if (
    !input ||
    input.version !== 1 ||
    !Array.isArray(input.logs) ||
    input.logs.length > 1000
  )
    throw Error("Use a Vivriti version 1 training backup (max 1,000 entries).");
  const logs = input.logs.map(validateLog);
  if (new Set(logs.map((l) => l.id)).size !== logs.length)
    throw Error("Duplicate entry IDs in backup.");
  return logs;
}
export function weeklyStats(logs, now = new Date()) {
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    const date = localDate(d),
      entries = logs.filter((l) => l.date === date);
    result.push({
      date,
      minutes: entries.reduce((a, l) => a + l.minutes, 0),
      load: entries.reduce((a, l) => a + l.minutes * l.effort, 0),
      sessions: entries.length,
    });
  }
  return result;
}
export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function bmi({ age, weight, height }) {
  if (
    !Number.isFinite(age) ||
    age < 2 ||
    age > 120 ||
    !Number.isFinite(weight) ||
    weight < 10 ||
    weight > 400 ||
    !Number.isFinite(height) ||
    height < 50 ||
    height > 250
  )
    throw Error("Enter plausible age, height and weight.");
  if (age < 20)
    return {
      value: null,
      message:
        "For ages 2–19, BMI needs age- and sex-specific interpretation. Use the linked CDC child and teen calculator.",
    };
  const value = weight / (height / 100) ** 2;
  return {
    value,
    message: "BMI is a screening measure, not a diagnosis or a calorie target.",
  };
}
export function mealPlan(foods, diet, exclude = []) {
  if (!["vegetarian", "vegan", "omnivore"].includes(diet))
    throw Error("Unknown food preference.");
  return ["Breakfast", "Lunch", "Snack", "Dinner"].map((meal) => ({
    meal,
    foods: ["grain", "protein", "produce"]
      .map((group) =>
        foods.find(
          (f) =>
            f.meals.includes(meal) &&
            f.group === group &&
            (diet === "omnivore" ||
              (diet === "vegan" ? f.vegan : f.vegetarian)) &&
            !f.allergens.some((a) => exclude.includes(a)),
        ),
      )
      .filter(Boolean),
  }));
}
export function csv(rows) {
  return rows
    .map((r) =>
      r
        .map((v) => {
          let s = String(v ?? "");
          if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
          return '"' + s.replaceAll('"', '""') + '"';
        })
        .join(","),
    )
    .join("\r\n");
}
