import { generateSchedule, getDuplicateNames, getScheduleStats, parsePlayers } from "./scheduler.js";

const $ = (selector) => document.querySelector(selector);
const form = $("#schedule-form"), playersInput = $("#players"), playerCount = $("#player-count");
const groupSizeInput = $("#group-size"), roundsInput = $("#rounds"), errorMessage = $("#form-error");
const results = $("#results"), roundsOutput = $("#rounds-output"), copyButton = $("#copy");
let currentSchedule = null;

function updateCount() {
  const count = parsePlayers(playersInput.value).length;
  playerCount.textContent = `${count} ${count === 1 ? "player" : "players"}`;
}

function clampInput(input) {
  const value = Number.parseInt(input.value, 10);
  input.value = Number.isFinite(value) ? Math.min(Number(input.max), Math.max(Number(input.min), value)) : input.min;
}

function validate() {
  const players = parsePlayers(playersInput.value);
  const groupSize = Number.parseInt(groupSizeInput.value, 10), rounds = Number.parseInt(roundsInput.value, 10);
  const duplicates = getDuplicateNames(players);
  if (players.length < 2) return { error: "Add at least two players to make groups." };
  if (duplicates.length) return { error: `Each player needs a unique name. Check: ${duplicates.join(", ")}.` };
  if (!Number.isInteger(groupSize) || groupSize < 2) return { error: "Players per group must be at least 2." };
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 30) return { error: "Choose between 1 and 30 rounds." };
  return { players, groupSize: Math.min(groupSize, players.length), rounds };
}

function describeSizes(sizes) {
  const counts = new Map(); sizes.forEach((size) => counts.set(size, (counts.get(size) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[0] - a[0]).map(([size, count]) => `${count} ${count === 1 ? "group" : "groups"} of ${size}`).join(" and ");
}

function escapeHtml(value) { const div = document.createElement("div"); div.textContent = value; return div.innerHTML; }

function renderSchedule(schedule, playerTotal) {
  const stats = getScheduleStats(schedule.pairCounts), allFours = schedule.groupSizes.every((size) => size === 4);
  $("#schedule-summary").textContent = `${playerTotal} players · ${schedule.rounds.length} rounds · ${describeSizes(schedule.groupSizes)} per round`;
  $("#quality-note").innerHTML = stats.repeatedPairs === 0
    ? `<span class="quality-icon">✓</span><span><strong>No repeated groupmates.</strong> Everyone gets a fresh mix in every round.</span>`
    : `<span class="quality-icon">✓</span><span><strong>Best mix found.</strong> ${stats.repeatedPairs} player ${stats.repeatedPairs === 1 ? "pair repeats" : "pairs repeat"}, with any pair together ${stats.maxMeetings === 2 ? "at most twice" : `up to ${stats.maxMeetings} times`}.</span>`;
  roundsOutput.innerHTML = schedule.rounds.map((round, roundIndex) => `<article class="round-card"><div class="round-title"><span>${String(roundIndex + 1).padStart(2, "0")}</span><h3>Round ${roundIndex + 1}</h3></div><div class="groups-list">${round.map((group, groupIndex) => `<section class="group"><div class="group-heading"><h4>${allFours ? "Court" : "Group"} ${groupIndex + 1}</h4><span>${group.length} players</span></div><ol>${group.map((player) => `<li><span>${escapeHtml(player.charAt(0).toUpperCase())}</span>${escapeHtml(player)}</li>`).join("")}</ol></section>`).join("")}</div></article>`).join("");
  results.hidden = false; results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function createSchedule() {
  errorMessage.textContent = ""; clampInput(groupSizeInput); clampInput(roundsInput);
  const values = validate();
  if (values.error) { errorMessage.textContent = values.error; results.hidden = true; return; }
  currentSchedule = generateSchedule(values.players, values.groupSize, values.rounds);
  renderSchedule(currentSchedule, values.players.length);
}

function scheduleAsText() {
  if (!currentSchedule) return "";
  const allFours = currentSchedule.groupSizes.every((size) => size === 4);
  return currentSchedule.rounds.map((round, roundIndex) => [`Round ${roundIndex + 1}`, ...round.map((group, groupIndex) => `  ${allFours ? "Court" : "Group"} ${groupIndex + 1}: ${group.join(", ")}`)].join("\n")).join("\n\n");
}

form.addEventListener("submit", (event) => { event.preventDefault(); createSchedule(); });
playersInput.addEventListener("input", updateCount);
document.querySelectorAll(".step-button").forEach((button) => button.addEventListener("click", () => { const input = $(`#${button.dataset.step}`); input.value = Number(input.value || input.min) + Number(button.dataset.change); clampInput(input); }));
$("#reshuffle").addEventListener("click", createSchedule);
$("#print").addEventListener("click", () => window.print());
copyButton.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(scheduleAsText()); copyButton.textContent = "Copied!"; setTimeout(() => { copyButton.textContent = "Copy schedule"; }, 1600); }
  catch { errorMessage.textContent = "Copy was blocked by the browser. You can use Print instead."; }
});
updateCount();
