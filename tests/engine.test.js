import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  filterDrills,
  buildSession,
  validateLog,
  parseBackup,
  weeklyStats,
  bmi,
  mealPlan,
  csv,
  escape,
} from "../engine.js";
import { foods } from "../foods.js";
const drills = JSON.parse(
  readFileSync(new URL("../drills.json", import.meta.url)),
);
const entry = {
  id: "a",
  sport: "basketball",
  date: "2026-10-05",
  minutes: 30,
  effort: 6,
  notes: "Useful practice.",
  plannedMinutes: 35,
};
test("original library has 52 unique drills across three sports", () => {
  assert.equal(drills.length, 52);
  assert.equal(new Set(drills.map((d) => d.id)).size, 52);
  assert.deepEqual(
    ["basketball", "football", "cricket"].map(
      (s) => filterDrills(drills, { sport: s }).length,
    ),
    [12, 13, 27],
  );
  assert.ok(
    drills.every((d) => d.title.length > 3 && d.instructions.length > 25),
  );
});
test("filter combines sport, skill, query and experience", () => {
  const list = filterDrills(drills, {
    sport: "basketball",
    skill: "dribbling",
    query: "cross",
    level: "foundation",
  });
  assert.equal(list.length, 1);
  assert.equal(list[0].title, "Crossover");
  assert.equal(filterDrills(drills, { query: "<script>" }).length, 0);
});
test("session respects time, sport, group and advanced constraints", () => {
  for (const sport of ["basketball", "football", "cricket"])
    for (const minutes of [15, 30, 61, 90]) {
      const s = buildSession(drills, { sport, minutes, players: "solo" });
      assert.equal(
        s.blocks.reduce((a, b) => a + b.minutes, 0),
        minutes,
      );
      assert.ok(s.blocks.every((b) => b.minutes > 0));
      assert.ok(
        s.blocks
          .slice(1, -1)
          .every(
            (d) =>
              d.sport === sport &&
              d.players === "solo" &&
              d.level !== "advanced",
          ),
      );
      assert.ok(new Set(s.blocks.slice(1, -1).map((d) => d.skill)).size > 1);
    }
  assert.throws(
    () =>
      buildSession(drills, {
        sport: "basketball",
        minutes: 30,
        players: "solo",
        skill: "passing",
      }),
    /No drills/,
  );
  assert.throws(() => buildSession(drills, { sport: "football", minutes: 14 }));
  assert.throws(() => buildSession(drills, { sport: "chess", minutes: 30 }));
});
test("journal rejects impossible dates and malformed load values", () => {
  assert.deepEqual(validateLog(entry), entry);
  for (const bad of [
    { minutes: 0 },
    { effort: 11 },
    { date: "2026-02-30" },
    { sport: "chess" },
    { notes: 42 },
    { minutes: Infinity },
  ])
    assert.throws(() => validateLog({ ...entry, ...bad }));
});
test("backup parsing is atomic and refuses duplicate IDs", () => {
  assert.deepEqual(parseBackup({ version: 1, logs: [entry] }), [entry]);
  assert.throws(() => parseBackup({ version: 2, logs: [] }));
  assert.throws(() =>
    parseBackup({
      version: 1,
      logs: [entry, { ...entry, id: "b", effort: -1 }],
    }),
  );
  assert.throws(() => parseBackup({ version: 1, logs: [entry, entry] }));
});
test("weekly charts aggregate exact actual minutes including zero days", () => {
  const days = weeklyStats(
    [
      entry,
      { ...entry, id: "b", minutes: 10, effort: 2 },
      { ...entry, id: "c", date: "2026-09-01" },
    ],
    new Date(2026, 9, 7, 12),
  );
  assert.equal(days.length, 7);
  assert.equal(days[0].date, "2026-10-01");
  assert.equal(days.at(-1).date, "2026-10-07");
  assert.equal(days.find((d) => d.date === entry.date).minutes, 40);
  assert.equal(days.find((d) => d.date === entry.date).load, 200);
  assert.equal(
    days.reduce((a, d) => a + d.sessions, 0),
    2,
  );
});
test("adult BMI reference never categorises minors or drives meals", () => {
  assert.equal(bmi({ age: 17, weight: 70, height: 175 }).value, null);
  assert.ok(
    Math.abs(bmi({ age: 20, weight: 70, height: 175 }).value - 22.857) < 0.01,
  );
  assert.throws(() => bmi({ age: 25, weight: 0, height: 0 }));
});
test("meal examples obey dietary and ingredient exclusions", () => {
  for (const diet of ["vegetarian", "vegan", "omnivore"]) {
    const plan = mealPlan(foods, diet, [
      "dairy",
      "gluten",
      "soy",
      "egg",
      "nuts",
    ]);
    assert.equal(plan.length, 4);
    assert.ok(plan.every((m) => m.foods.length === 3));
    for (const m of plan)
      for (const f of m.foods) {
        assert.equal(f.allergens.length, 0);
        if (diet === "vegan") assert.ok(f.vegan);
        if (diet === "vegetarian") assert.ok(f.vegetarian);
      }
  }
});
test("rendered notes and CSV exports do not interpret user input", () => {
  assert.equal(
    escape('<img src=x onerror="x">'),
    "&lt;img src=x onerror=&quot;x&quot;&gt;",
  );
  assert.equal(
    csv([["=2+2", "a,b", '"quoted"']]),
    '"\'=2+2","a,b","""quoted"""',
  );
});
