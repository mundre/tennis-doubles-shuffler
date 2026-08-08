import assert from "node:assert/strict";
import { calculateGroupSizes, generateSchedule, getDuplicateNames, parsePlayers } from "./scheduler.js";

assert.deepEqual(parsePlayers("Alex\n Blake,Casey\n\nDevon"), ["Alex", "Blake", "Casey", "Devon"]);
assert.deepEqual(getDuplicateNames(["Alex", "Blake", "alex"]), ["alex"]);
assert.deepEqual(calculateGroupSizes(8, 4), [4, 4]);
assert.deepEqual(calculateGroupSizes(10, 4), [4, 3, 3]);
assert.deepEqual(calculateGroupSizes(5, 4), [3, 2]);
assert.deepEqual(calculateGroupSizes(3, 10), [3]);

const players = ["A", "B", "C", "D", "E", "F", "G", "H"];
const schedule = generateSchedule(players, 4, 3);
assert.equal(schedule.rounds.length, 3);
for (const round of schedule.rounds) {
  assert.deepEqual(round.map((group) => group.length), [4, 4]);
  assert.deepEqual([...round.flat()].sort(), players);
}

const uneven = generateSchedule(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"], 4, 4);
for (const round of uneven.rounds) {
  assert.deepEqual(round.map((group) => group.length), [4, 3, 3]);
  assert.equal(new Set(round.flat()).size, 10);
}

console.log("Scheduler tests passed");
