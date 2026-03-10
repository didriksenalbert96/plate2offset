# Plate2Offset

Upload a meal photo (or type a description) → AI guesses ingredients → user confirms/edits → app shows a suggested donation amount → user taps to donate to FarmKind via Every.org.

## Non-negotiables

- **User confirms first.** The user MUST confirm or edit the AI-guessed ingredients before seeing any donation number.
- **No shaming.** Donations are framed as positive and optional — never guilt-based.
- **Uncertainty is explicit.** If the AI isn't confident about an ingredient, it says "unknown" and asks the user.
- **Donation is the output.** The app suggests a donation amount — it does not show suffering statistics.
- **Not affiliated.** This project is not affiliated with FarmKind unless they explicitly approve. A disclaimer is shown in the app.

## Privacy

- All OpenAI API calls use `store: false` so meal photos and descriptions are not stored by OpenAI.
- No user data is saved on our servers. The app is stateless — nothing persists after you close the tab.

## Tech stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- OpenAI API (gpt-4o-mini, Structured Outputs)
- Every.org donate link for FarmKind
- Deployed on Vercel

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 to see the app.

## Environment variables

Create a `.env.local` file in the project root:

```
OPENAI_API_KEY=your-key-here
```
