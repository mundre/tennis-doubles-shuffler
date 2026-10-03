import { generateSchedule, getDuplicateNames, getScheduleStats, parsePlayers } from "./scheduler.js";

const $ = (selector) => document.querySelector(selector);
const form = $("#schedule-form"), playersInput = $("#players"), playerCount = $("#player-count");
const groupSizeInput = $("#group-size"), courtCountInput = $("#court-count"), roundsInput = $("#rounds"), errorMessage = $("#form-error");
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
  const groupSize = Number.parseInt(groupSizeInput.value, 10), courtCount = Number.parseInt(courtCountInput.value, 10), rounds = Number.parseInt(roundsInput.value, 10);
  const duplicates = getDuplicateNames(players);
  if (players.length < 2) return { error: "Add at least two players to make groups." };
  if (duplicates.length) return { error: `Each player needs a unique name. Check: ${duplicates.join(", ")}.` };
  if (!Number.isInteger(groupSize) || groupSize < 2) return { error: "Players per court must be at least 2." };
  if (players.length < groupSize) return { error: `Add at least ${groupSize} players to fill one court.` };
  if (!Number.isInteger(courtCount) || courtCount < 1 || courtCount > 30) return { error: "Choose between 1 and 30 available courts." };
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 30) return { error: "Choose between 1 and 30 rounds." };
  return { players, groupSize, courtCount, rounds };
}

function escapeHtml(value) { const div = document.createElement("div"); div.textContent = value; return div.innerHTML; }

function renderSchedule(schedule, playerTotal) {
  const stats = getScheduleStats(schedule.pairCounts), allFours = schedule.groupSizes.every((size) => size === 4);
  const groupLabel = schedule.groupSizes[0] === 4 ? "court" : "group";
  const courtDescription = `${schedule.groupSizes.length} ${schedule.groupSizes.length === 1 ? groupLabel : `${groupLabel}s`} of ${schedule.groupSizes[0]} per round`;
  const sittingOut = playerTotal - schedule.groupSizes.reduce((total, size) => total + size, 0);
  $("#schedule-summary").textContent = `${playerTotal} players · ${schedule.rounds.length} rounds · ${courtDescription}${sittingOut ? ` · ${sittingOut} ${sittingOut === 1 ? "player" : "players"} sitting out each round` : ""}`;
  $("#quality-note").innerHTML = stats.repeatedPairs === 0
    ? `<span class="quality-icon">✓</span><span><strong>No repeated groupmates.</strong> Everyone gets a fresh mix in every round.</span>`
    : `<span class="quality-icon">✓</span><span><strong>Best mix found.</strong> ${stats.repeatedPairs} player ${stats.repeatedPairs === 1 ? "pair repeats" : "pairs repeat"}, with any pair together ${stats.maxMeetings === 2 ? "at most twice" : `up to ${stats.maxMeetings} times`}.</span>`;
  const sitoutHistory = new Map();
  roundsOutput.innerHTML = schedule.rounds.map((round, roundIndex) => {
    round.sitouts.forEach((player) => sitoutHistory.set(player, (sitoutHistory.get(player) || 0) + 1));
    const sitoutMarkup = round.sitouts.length ? `<section class="sitout"><div class="group-heading"><h4>Sitting out</h4><span>${round.sitouts.length} ${round.sitouts.length === 1 ? "player" : "players"}</span></div><ol>${round.sitouts.map((player) => `<li><span>${escapeHtml(player.charAt(0).toUpperCase())}</span>${escapeHtml(player)}</li>`).join("")}</ol></section>` : "";
    return `<article class="round-card"><div class="round-title"><span>${String(roundIndex + 1).padStart(2, "0")}</span><h3>Round ${roundIndex + 1}</h3></div><div class="groups-list">${round.groups.map((group, groupIndex) => `<section class="group"><div class="group-heading"><h4>${allFours ? "Court" : "Group"} ${groupIndex + 1}</h4><span>${group.length} players</span></div><ol>${group.map((player) => `<li><span>${escapeHtml(player.charAt(0).toUpperCase())}</span>${escapeHtml(player)}</li>`).join("")}</ol></section>`).join("")}${sitoutMarkup}</div></article>`;
  }).join("");
  if (sittingOut > 0) {
    const sits = [...sitoutHistory.values()];
    const fairlyRotated = Math.max(...sits) - Math.min(...sits) <= 1;
    const exactlyOneSitout = schedule.rounds.every((round) => round.sitouts.length === 1);
    const noOneRepeatsYet = exactlyOneSitout && new Set(schedule.rounds.map((round) => round.sitouts[0])).size === schedule.rounds.length;
    const rotationText = noOneRepeatsYet && schedule.rounds.length <= playerTotal
      ? "No one sits out twice before everyone has had a turn"
      : fairlyRotated ? "Sit-outs are rotated as evenly as possible" : "Sit-out order is shown for each round";
    $("#quality-note").innerHTML += `<span class="sitout-note">${rotationText}.</span>`;
  }
  results.hidden = false; results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function createSchedule() {
  errorMessage.textContent = ""; clampInput(groupSizeInput); clampInput(courtCountInput); clampInput(roundsInput);
  const values = validate();
  if (values.error) { errorMessage.textContent = values.error; results.hidden = true; return; }
  currentSchedule = generateSchedule(values.players, values.groupSize, values.courtCount, values.rounds);
  renderSchedule(currentSchedule, values.players.length);
}

function scheduleAsText() {
  if (!currentSchedule) return "";
  const allFours = currentSchedule.groupSizes.every((size) => size === 4);
  return currentSchedule.rounds.map((round, roundIndex) => [`Round ${roundIndex + 1}`, ...round.groups.map((group, groupIndex) => `  ${allFours ? "Court" : "Group"} ${groupIndex + 1}: ${group.join(", ")}`), ...(round.sitouts.length ? [`  Sitting out: ${round.sitouts.join(", ")}`] : [])].join("\n")).join("\n\n");
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
