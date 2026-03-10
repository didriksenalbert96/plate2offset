# Plate2Offset — Build Plan

## What this app does

Upload a meal photo (or type a description) → AI guesses ingredients →
user confirms/edits the list → app shows a suggested donation amount →
user taps a link to donate to FarmKind via Every.org.

---

## Phase 0 — Skeleton & Planning (YOU ARE HERE)

### Step 0.1  Create the plan file (this file)
- **File:** `PLAN.md`

### Step 0.2  Scaffold the Next.js project
- Uses `create-next-app` with TypeScript, Tailwind CSS, ESLint, App Router
- Creates the standard Next.js folder structure automatically

### Step 0.3  Add project docs
- **Files:** `README.md`, `BUILDING.md`, `DEVLOG.md`

### Step 0.4  Add shared TypeScript types
- **File:** `lib/types.ts`
- Defines the data shapes used across the whole app (Category, Unit, MealItem, etc.)

### Step 0.5  Initialize git & first commit

---

## Phase 1 — Meal Input (the "upload or type" screen)

### Step 1.1  Build the home page layout
- **File:** `app/page.tsx`
- A simple centered card with two options: upload a photo OR type a description

### Step 1.2  Add the text input component
- **File:** `components/MealInput.tsx`
- A text box where the user can type what they ate (e.g. "chicken sandwich with fries")

### Step 1.3  Add the photo upload component
- **File:** `components/PhotoUpload.tsx`
- A button to pick a photo from the phone/computer
- Resizes the image on the client side before sending (saves bandwidth & cost)

---

## Phase 2 — AI Analysis (the "guess ingredients" step)

### Step 2.1  Create the API route for text analysis
- **File:** `app/api/analyze/route.ts`
- Receives the meal description, sends it to OpenAI, returns structured JSON
- Uses Structured Outputs so the response is always valid JSON

### Step 2.2  Add image support to the API route
- **File:** `app/api/analyze/route.ts` (update)
- Accepts a base64 image, sends it to OpenAI Vision, returns the same JSON shape

### Step 2.3  Build the loading state
- **File:** `components/AnalyzingSpinner.tsx`
- A friendly "Analyzing your meal…" animation while waiting for AI

---

## Phase 3 — Confirm / Edit Ingredients (the "you must review" screen)

### Step 3.1  Build the ingredient review list
- **File:** `components/IngredientList.tsx`
- Shows each guessed ingredient with quantity, unit, category
- User can edit, remove, or add items
- Items the AI is unsure about are marked "unknown — please check"

### Step 3.2  Add the confirm button
- **File:** `components/ConfirmButton.tsx`
- Only becomes active after the user has seen and reviewed the list
- Moves the user to the donation screen

---

## Phase 4 — Donation Suggestion (the main output)

### Step 4.1  Create the offset calculation logic
- **File:** `lib/calculate-offset.ts`
- Takes confirmed ingredients → looks up category coefficients → returns a dollar amount
- Coefficients are stored in a simple config file (easy to tweak later)

### Step 4.2  Create the coefficient config
- **File:** `lib/coefficients.ts`
- A plain object mapping each animal-product category to a donation multiplier
- Example: `{ "chicken": 0.05, "beef": 0.08, "eggs": 0.02, ... }` per gram

### Step 4.3  Build the donation screen
- **File:** `components/DonationCard.tsx`
- Shows the suggested amount in a friendly, non-shaming way
- "Based on your meal, a $X.XX donation could help fund animal welfare programs."
- Big button links to Every.org with pre-filled amount

### Step 4.4  Build the Every.org donate link
- **File:** `lib/donate-link.ts`
- Constructs the URL: `https://www.every.org/farmkind#donate` with amount & frequency params
- Includes disclaimer: "Plate2Offset is not affiliated with FarmKind"

---

## Phase 5 — Polish & Deploy

### Step 5.1  Add error handling & edge cases
- What if the photo is blurry? → show a helpful message
- What if there are no animal products? → show a congratulatory message
- What if the API is down? → show a retry button

### Step 5.2  Mobile-friendly styling
- Make sure everything looks good on a phone screen
- Touch-friendly buttons, readable text sizes

### Step 5.3  Privacy & metadata
- **File:** `app/layout.tsx` (update)
- Page title, description, Open Graph tags
- Privacy note: "We don't store your photos or meal data"

### Step 5.4  Deploy to Vercel
- Connect GitHub repo → Vercel auto-deploys
- Add `OPENAI_API_KEY` as an environment variable on Vercel

---

## Decisions to Make Later

These are things we don't need to decide right now. We'll figure them out
as we build and test:

| Decision | Options | Notes |
|---|---|---|
| **AI model** | `gpt-4o-mini`, `gpt-4o`, Claude (`claude-sonnet`), Deepseek | **OpenAI gpt-4o-mini** is the starting choice — cheapest, fastest, and best-documented structured outputs + vision combo. **Claude** (Anthropic) is a strong alternative with good vision and JSON support; easy swap later. **Deepseek** is very cheap but has limited vision and less mature structured output tooling — riskier for a first project. The AI call lives in one file (`app/api/analyze/route.ts`) so switching models later is easy. |
| **Image resize dimensions** | 512px, 768px, 1024px? | Smaller = cheaper API calls but less accurate. Need to test. |
| **Coefficient calibration** | How many cents per gram of each product? | Needs research. Start with rough estimates, refine with user feedback. |
| **Donation rounding** | Round to nearest $0.50? $1.00? Show exact cents? | UX decision — test what feels right. |
| **Frequency options** | One-time only, or also offer monthly? | Every.org supports both. Start with one-time. |
| **Rate limiting** | How many API calls per user per day? | Important for cost control. Add later if needed. |
| **Analytics** | Track usage? Which tool? | Only if needed. Privacy-first approach. |
| **Image storage** | Never store? Store temporarily? | Current plan: never store (process in memory only). |

---

## File Tree (when complete)

```
plate2offset/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts          ← AI analysis endpoint
│   ├── layout.tsx                ← App shell, metadata, fonts
│   ├── page.tsx                  ← Home page (upload/type)
│   └── globals.css               ← Tailwind base styles
├── components/
│   ├── MealInput.tsx             ← Text description input
│   ├── PhotoUpload.tsx           ← Image upload + resize
│   ├── AnalyzingSpinner.tsx      ← Loading animation
│   ├── IngredientList.tsx        ← Review/edit ingredients
│   ├── ConfirmButton.tsx         ← "Looks good" button
│   └── DonationCard.tsx          ← Suggested donation + link
├── lib/
│   ├── types.ts                  ← Shared TypeScript types
│   ├── coefficients.ts           ← Donation multipliers
│   ├── calculate-offset.ts       ← Offset math
│   └── donate-link.ts            ← Every.org URL builder
├── PLAN.md                       ← This file
├── README.md                     ← Project description
├── BUILDING.md                   ← Reference links
└── DEVLOG.md                     ← Your learning journal
```
