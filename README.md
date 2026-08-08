# Rally Mixer

A responsive tennis group generator that creates multiple rounds while minimizing repeated groupmates.

## Features

- Paste names one per line or separated by commas
- Choose any target group size (default: 4)
- Choose 1–30 rounds
- Evenly distribute totals that do not divide cleanly
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

The repository is ready for GitHub Pages. In the repository settings, choose **Pages**, deploy from the `main` branch, and use the repository root.
