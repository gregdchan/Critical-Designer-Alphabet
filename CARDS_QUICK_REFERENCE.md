# Critical Designer Alphabet Cards - Quick Reference Guide

## File Locations at a Glance

### Core Card Files
| Purpose | Path | Lines |
|---------|------|-------|
| Schema Definition | `/designeralphabet/sanity/schemas/cards.ts` | 189 |
| Card Type & Fetch | `/designeralphabet/src/lib/Cards.ts` | 110 |
| Cards Library Page | `/designeralphabet/src/routes/cards/+page.svelte` | 602 |
| Card Display Component | `/designeralphabet/src/lib/components/Card.svelte` | 74 |
| Card Panel (Session) | `/designeralphabet/src/lib/components/session/CardPanel.svelte` | 397 |
| Session Card Store | `/designeralphabet/src/lib/stores/sessionCards.ts` | 96 |
| Session Page | `/designeralphabet/src/routes/session/[code]/+page.svelte` | 2800+ |
| Response API | `/designeralphabet/src/routes/api/responses/add/+server.ts` | 33 |
| Server Workshop Logic | `/designeralphabet/src/lib/server/workshop.ts` | 860 |

---

## 5 Card Categories with Color Mapping

```
THEORY    → Purple   (border-purple-500, bg-purple-100, text-purple-900)
PRACTICE  → Cyan     (border-cyan-500, bg-cyan-100, text-cyan-900)
LENS      → Pink     (border-pink-500, bg-pink-100, text-pink-900)
MINDSET   → Lime     (border-lime-600, bg-lime-100, text-lime-900)
METHOD    → Orange   (border-orange-500, bg-orange-100, text-orange-900)
```

---

## What's Active vs Hidden

### ACTIVE Features
- Browse all cards at `/cards`
- Search by: title, description, prompt, cardID
- Filter by: category, letter, tags
- View full card details in modal
- Stage 3-5 cards before session
- Random draw (3-5 cards)
- Create session with staged cards

### HIDDEN/COMMENTED Features
- Card panel in session view (CardPanel component commented out)
- Linking cards to responses during session
- Visual display of used cards
- Card-based gamification bonuses

---

## Database Structure

### Cards in Responses
```sql
CREATE TABLE responses (
  ...
  cards jsonb DEFAULT '[]'::jsonb,  -- Stores array of card IDs
  ...
);
```

### Currently Populated With
Empty arrays (`[]`) because submission passes `cards: []` on line 749 of session page

### Could Be Populated With
Card IDs/titles selected during response submission (currently disabled)

---

## Key Code Snippets

### Fetch All Cards
```typescript
import { fetchCards } from '$lib/Cards';

const allCards = await fetchCards();
```

### Card Selection (Library)
```typescript
const MAX_SELECTION = 5;
const selectedCards: Card[] = [];

function toggleCard(card: Card) {
  if (selectedCards.some(c => c._id === card._id)) {
    selectedCards = selectedCards.filter(c => c._id !== card._id);
  } else if (selectedCards.length < MAX_SELECTION) {
    selectedCards = [...selectedCards, card];
  }
}
```

### Submit Response with Cards
```typescript
await addResponse({
  code: sessionCode,
  questionId: selectedQuestionId,
  participantId: currentParticipant.id,
  text: responseText,
  cards: ['card-id-1', 'card-id-2'],  // Currently empty
  metadata: responseMetadata
});
```

### Session Card Store
```typescript
const cardStore = createSessionCardStore(sessionCode);

$: selectedCards = $cardStore.selectedCards;

cardStore.toggleCard(card, maxSelection);
cardStore.addCard(card, maxSelection);
cardStore.removeCard(cardId);
cardStore.clearCards();
```

---

## To Re-Enable Cards in Sessions (5 Steps)

1. **Line 56-62 of `/routes/session/[code]/+page.svelte`**
   - Uncomment CardPanel import
   - Uncomment createSessionCardStore import
   - Uncomment Card type import

2. **Line 135 of same file**
   - Uncomment `const cardStore = createSessionCardStore(sessionCode);`

3. **Line 143-145 of same file**
   - Uncomment subscription to cardStore

4. **Line 749 of same file**
   - Change `cards: []` to `cards: selectedCards.map(c => c.cardID || c.title)`

5. **Template section**
   - Add `<CardPanel>` component to UI
   - Connect card selection to submission form

---

## Card Properties

| Property | Type | Example | Required |
|----------|------|---------|----------|
| title | string | "Collective Power" | Yes |
| letter | string | "C" (uppercase only) | Yes |
| cardID | string | "C-CollectivePower" | Yes |
| category | string | "theory" / "practice" / "lens" / "mindset" / "method" | Yes |
| description | string | Long form text | Yes |
| prompt | string | Question to guide thinking | No |
| tags | string[] | ["diversity", "collaboration"] | No |
| sources | string[] | URLs | No |
| readingList | {title, url}[] | Links to resources | No |
| exampleUse | string[] | Use case scenarios | No |
| styleMeta | {icon, neonColor, animationStyle} | Styling info | No |
| description_i18n | {en, es, fr, pt} | Localized text | No |
| prompt_i18n | {en, es, fr, pt} | Localized text | No |

---

## Storage Keys

| Purpose | Storage | Key | Format |
|---------|---------|-----|--------|
| Staged cards (before session) | sessionStorage | `critical-alphabet:stagedCards` | JSON array of cardIDs |
| Session cards (during session) | localStorage | `cda:session-cards:{sessionCode}` | {selectedCards[], isCardPanelOpen} |
| User votes | localStorage | `cda:votes:{sessionCode}` | Set of responseIDs |

---

## API Endpoints

### POST /api/responses/add
Submit a response with optional card references

**Request:**
```json
{
  "code": "SESSION_CODE",
  "questionId": "question-uuid",
  "participantId": "participant-uuid",
  "text": "Response text",
  "cards": ["card-id-1", "card-id-2"],
  "metadata": { "x": 5, "y": 10 }
}
```

**Response:**
```json
{
  "success": true,
  "response": { ... full response object ... }
}
```

### GET /api/session/[code]
Fetch session bundle including responses with cards

---

## Sanity CMS Configuration

**Project Variables Required:**
```env
VITE_SANITY_PROJECT_ID=your_project_id
VITE_SANITY_DATASET=production
VITE_SANITY_API_VERSION=2024-09-01
```

**GROQ Query for Cards:**
```groq
*[_type == "cards"]|order(letter asc){
  _id, title, slug, letter, category,
  description, prompt, tags, sources,
  readingList[]{ title, url }, exampleUse,
  cardID, styleMeta, description_i18n, prompt_i18n
}
```

---

## Component Props Reference

### CardPanel
```typescript
export let selectedCards: Card[] = [];
export let maxSelection = 5;
export let onCardToggle: (card: Card) => void;
export let isOpen = false;
export let isMobile = false;
```

### Card
```typescript
export let card: Card;
export let selectable = false;
export let selected = false;
export let disabled = false;
```

---

## Session Export

Cards are included in markdown export with format:
```
- **Author** (5 votes): Response text _(cards: card-id-1, card-id-2)_
```

**Export Function:** `buildSessionExport()` in `/lib/server/workshop.ts:798`

---

