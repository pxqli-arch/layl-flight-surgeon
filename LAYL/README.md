# LAYL — Flight Surgeon · 3 Stage Prototype

A browser-based educational game prototype created for Team Layl. It is NOT an official NASA game, medical trainer, or evidence of astronaut readiness. Medical scenarios and crystal-created medicine are fictional and simplified for education.

## Play locally

Run `npm run dev`, then open `http://127.0.0.1:5173/`. No npm installation or Vite dependencies are needed if Node is installed. The `server.mjs` file is for local testing and owner-only tools, not required for GitHub Pages.

## Stages

1. **Crew Rescue** — randomized oxygen-low or high-temperature scenario. Complete two oxygen tanks or craft fictional medicine, then help Amina. No science quiz after treatment.
2. **Crystal Supply** — merge and auto-collect Level 3 crystals in Crystal Dome. Craft one fresh research supply with **2 Amethyst + 1 Solar + 1 Azure**.
3. **Emergency Command** — a 3-part interactive emergency, with choices, feedback, and corrective retries.

The **STAGES** button in the mission's top-right corner opens a hub. All three stages are selectable for demonstration/testing. Completed stages are recorded in the browser.

## Game score and pilot testing

- **Success score** = 70% × (number of completed stages / 3) + 30% × (correct first-try emergency decisions / 3). Rounded to a whole percent.
- Wrong emergency choices count as mistakes but players can retry.
- **This is an in-game metric**, not actual clinical accuracy or demonstrated educational impact.
- In Stage Select choose **New Test Session** to reset local progress. Finished sessions are stored *on that browser only*. Choose **Export Test Results CSV** to download local results for analysis. No personal information is requested or sent anywhere. Different players' results are **not automatically aggregated**.

## Publish to GitHub Pages

1. Create a GitHub repository, e.g. `layl-flight-surgeon`.
2. Upload the CONTENTS of this folder to the repository root, including the hidden `.github` directory and `.nojekyll` file (using git is safest).
3. Commit/push to the `main` branch.
4. In GitHub choose **Settings → Pages → Build and deployment → Source: GitHub Actions**.
5. The included `.github/workflows/deploy.yml` will deploy the static website on pushes to main.
6. Open the published URL shown in GitHub Actions / Pages.

Example commands from this folder (after creating an empty repository on GitHub):

```bash
git init
git add .
git commit -m "Launch LAYL three-stage prototype"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/layl-flight-surgeon.git
git push -u origin main
```

**Static hosting caveat:** The optional owner PIN features in Settings/Capsule Bay require the local `server.mjs` process and are not available on GitHub Pages. All public gameplay, stage tracking, and local CSV export are static/browser-based. Avoid using admin PIN tools on a public deployment.

## Navigation fix
Mission Control now opens a confirmation that returns to the main menu and preserves stage progress.
