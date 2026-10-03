import assert from "node:assert/strict";
import { calculateGroupSizes, generateSchedule, getDuplicateNames, parsePlayers } from "./scheduler.js";

assert.deepEqual(parsePlayers("Alex\n Blake,Casey\n\nDevon"), ["Alex", "Blake", "Casey", "Devon"]);
assert.deepEqual(getDuplicateNames(["Alex", "Blake", "alex"]), ["alex"]);
assert.deepEqual(calculateGroupSizes(8, 4, 2), [4, 4]);
assert.deepEqual(calculateGroupSizes(9, 4, 2), [4, 4]);
assert.deepEqual(calculateGroupSizes(9, 4, 1), [4]);
assert.deepEqual(calculateGroupSizes(10, 4, 3), [4, 4]);
assert.deepEqual(calculateGroupSizes(3, 4, 2), []);

const players = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
const schedule = generateSchedule(players, 4, 2, 3);
assert.equal(schedule.rounds.length, 3);
assert.deepEqual(schedule.rounds.map((round) => round.groups.map((group) => group.length)), [[4, 4], [4, 4], [4, 4]]);
assert.deepEqual(schedule.rounds.map((round) => round.sitouts.length), [1, 1, 1]);
assert.equal(new Set(schedule.rounds.map((round) => round.sitouts[0])).size, 3);
for (const round of schedule.rounds) assert.deepEqual([...round.groups.flat(), ...round.sitouts].sort(), players);

const oneCourt = generateSchedule(players, 4, 1, 3);
assert.deepEqual(oneCourt.rounds.map((round) => round.groups.length), [1, 1, 1]);
const sitoutCounts = new Map(players.map((player) => [player, 0]));
for (const round of oneCourt.rounds) for (const player of round.sitouts) sitoutCounts.set(player, sitoutCounts.get(player) + 1);
assert.ok(Math.max(...sitoutCounts.values()) - Math.min(...sitoutCounts.values()) <= 1);

console.log("Scheduler tests passed");
