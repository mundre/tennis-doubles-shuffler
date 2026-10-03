# Rally Mixer

A responsive tennis scheduler that fills available courts with full groups, rotates sit-outs fairly, and minimizes repeated groupmates.

## Features

- Paste names one per line or separated by commas
- Choose players per group (default: 4), available courts (default: 2), and 1–30 rounds
- Uses only courts that can be filled with a complete group
- Rotates sit-outs so a player does not sit again before others have had a turn when one person sits out per round
- Balances sit-outs across players when multiple people sit each round
- Search for schedules with the fewest repeated player combinations
- Copy or print the finished schedule
- Run entirely in the browser with no account or server

## Run locally

Serve this folder with any static web server, then open the local URL:

```sh
python3 -m http.server 8000
```

## Test

```sh
node test-scheduler.mjs
```

## Deploy

The repository is hosted on GitHub Pages: <https://mundre.github.io/tennis-doubles-shuffler/>.
