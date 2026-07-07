# ScreenLab

AI-powered UI review and redesign studio for live websites.

ScreenLab takes screenshots of a site, unlocks two workflows, and uses the user's own OpenAI API key at run time:

- **UI Reviewer**: inspects captured screens, finds friction, visual issues, confusing copy, accessibility concerns, and moments users might love.
- **UI Revamp**: proposes a redesigned version of the page and previews the direction in a live, iterative workspace.
- **Run Cost**: estimates the OpenAI API cost for each review or revamp run so experiments stay transparent.

Live app: https://uireviewer.whhite.com

## Development

```bash
npm install
npm start
```

Then open `http://localhost:5000`.

## Privacy

OpenAI API keys are entered by the user in the browser for a run. Do not commit keys, login credentials, or private site data to this repository.
