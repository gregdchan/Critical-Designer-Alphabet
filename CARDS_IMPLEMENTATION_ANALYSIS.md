# Critical Designer Alphabet Cards Implementation - Comprehensive Analysis

## Overview
The Critical Designer Alphabet cards are a core component of this design thinking workshop platform. They serve as prompts and frameworks that participants use to approach design challenges. Cards are managed through Sanity CMS and can be staged before sessions and potentially linked to responses.

---

## 1. DATA STRUCTURE & STORAGE

### 1.1 Sanity CMS Schema
**Location:** `/home/user/Critical-Designer-Alphabet/designeralphabet/sanity/schemas/cards.ts` (189 lines)

The schema defines the complete card structure:

```typescript
defineType({
  name: 'cards',
  title: 'Card',
  type: 'document',
  fields: [
    // Identity
    { name: 'title', type: 'string', max: 120 },
    { name: 'slug', type: 'slug', source: 'title' },
    { name: 'letter', type: 'string', validation: uppercase only },
    { name: 'cardID', type: 'string', description: 'Public ID like C-CollectivePower' },
    
    // Content
    { name: 'description', type: 'text', required: true },
    { name: 'prompt', type: 'text' },
    { name: 'category', type: 'string', options: [
      'theory', 'practice', 'lens', 'mindset', 'method'
    ]},
    { name: 'tags', type: 'array', of: [{ type: 'string' }] },
    { name: 'sources', type: 'array', of: [{ type: 'url' }] },
    { name: 'readingList', type: 'array', of: [{ type: 'resourceLink' }] },
    { name: 'exampleUse', type: 'array', of: [{ type: 'text' }] },
    
    // Style
    { name: 'styleMeta', type: 'object', fields: [
      { name: 'icon', type: 'string' },
      { name: 'neonColor', type: 'string' },  // hex or hsl
      { name: 'animationStyle', type: 'string', 
        options: ['neon-pulse', 'scanline', 'bounce', 'glow'] }
    ]},
    
    // Localization
    { name: 'description_i18n', type: 'i18nText' },
    { name: 'prompt_i18n', type: 'i18nText' }
  ]
})
```

**Key Field Properties:**
- `cardID`: Public identifier shown to users (e.g., "C-CollectivePower")
- `letter`: Single uppercase letter (A-Z) identifying the card alphabetically
- `category`: One of 5 types (theory, practice, lens, mindset, method)
- `styleMeta`: Contains neon color and animation styling for retro UI
- `description_i18n` & `prompt_i18n`: Support multi-language (en, es, fr, pt)

---

### 1.2 Card TypeScript Type Definition
**Location:** `/home/user/Critical-Designer-Alphabet/designeralphabet/src/lib/Cards.ts` (110 lines)

```typescript
export type Card = {
  _id: string;
  title: string;
  slug?: { current: string } | string;
  letter?: string;
  category?: string;
  color?: string;
  description?: string;
  prompt?: string;
  tags?: string[];
  sources?: string[];
  readingList?: ReadingListItem[];
  exampleUse?: string[];
  cardID: string;
  postId?: string;
  styleMeta?: StyleMeta;
  description_i18n?: LocalizedText;
  prompt_i18n?: LocalizedText;
};
```

### 1.3 Card Fetching from Sanity
**Function:** `fetchCards()` in `/designeralphabet/src/lib/Cards.ts`

```typescript
const cardsQuery = `*[_type == "cards"]|order(letter asc){
  _id,
  title,
  slug,
  letter,
  category,
  description,
  prompt,
  tags,
  sources,
  readingList[]{ title, url },
  exampleUse,
  cardID,
  styleMeta,
  description_i18n,
  prompt_i18n
}`;

export async function fetchCards(): Promise<Card[]> {
  const raw = await client.fetch(cardsQuery);
  return raw.map((card: any) => ({
    // Maps Sanity fields to Card type
    // Falls back to legacy fields (CardID, slug.current) if needed
  }));
}
```

**Note:** Query orders cards by letter ascending, so cards are alphabetically arranged.

### 1.4 Database Storage of Card References
**Location:** Supabase schema at `/designeralphabet/database/schema.sql`

Cards are stored in two table contexts:

```sql
-- In responses table
CREATE TABLE responses (
  id uuid PRIMARY KEY,
  room_code text NOT NULL,
  question_id uuid NOT NULL,
  participant_id uuid,
  text text NOT NULL,
  cards jsonb DEFAULT '[]'::jsonb,  -- Array of card IDs/titles
  votes int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- In session_phases table
CREATE TABLE session_phases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_code VARCHAR(16),
  phase_key VARCHAR(64),
  cards JSON,  -- Array of cards associated with phase
  status ENUM('pending','active','completed'),
  ...
);
```

**Current Status:** The `cards` field in responses is populated but currently receiving empty arrays during submission.

---

## 2. UI COMPONENTS & DISPLAY

### 2.1 Cards Library Page
**Location:** `/home/user/Critical-Designer-Alphabet/designeralphabet/src/routes/cards/+page.svelte` (602 lines)

**Purpose:** Main hub for browsing and staging cards before launching a session

**Key Features:**
1. **Card Grid Display** (lg:grid-cols-3, sm:grid-cols-2)
   - Each card shows: letter badge, title, cardID, category badge, description, prompt, tags
   - Visual color variation based on card letter
   - Category-based color scheme:
     - theory: purple
     - practice: cyan
     - lens: pink
     - mindset: lime
     - method: orange

2. **Filtering & Search**
   ```javascript
   const CATEGORIES = ['theory', 'practice', 'lens', 'mindset', 'method'];
   const MAX_SELECTION = 5;
   const MIN_RANDOM = 3;
   
   // Filters available:
   - Search by title, description, prompt, cardID
   - Category filter (single select)
   - Letter filter (multi-select, shows all letters from cards)
   - Tag filter (multi-select, shows all tags from all cards)
   ```

3. **Selection Features**
   - "Stage card" button to select for session (max 5)
   - "Random draw" button selects 3-5 random cards
   - Selected cards appear in floating sticky card at bottom
   - "Launch session" button redirects to `/session?code={ROOM_CODE}`

4. **Card Details Drawer**
   - Opens via "View" button on each card
   - Full-screen white modal showing:
     - Description (in bordered section)
     - Prompt (in purple-highlighted section)
     - Example uses (bulleted list)
     - Reading list (with external links)
     - Sources (clickable URLs)
   - "Stage this card" button to add from details view

**Code Snippet - Selection Logic:**
```typescript
const MAX_SELECTION = 5;

function toggleCard(card: Card) {
  const exists = selectedCards.some((entry) => entry._id === card._id);
  if (exists) {
    selectedCards = selectedCards.filter((entry) => entry._id !== card._id);
    statusMessage = `Removed ${card.title} from the session deck.`;
    return;
  }
  if (selectedCards.length >= MAX_SELECTION) {
    statusMessage = 'You can stage up to five cards at a time. Remove one before adding another.';
    return;
  }
  selectedCards = [...selectedCards, card];
  statusMessage = `Added ${card.title} to the session deck.`;
}

function startSession() {
  if (!selectedCards.length) {
    statusMessage = 'Select at least one card to seed your session.';
    return;
  }
  const code = generateRoomCode();
  persistSelection(selectedCards.map((card) => card.cardID ?? card._id));
  goto(`/session?code=${code}`);
}
```

### 2.2 Card Component (Generic Reusable)
**Location:** `/home/user/Critical-Designer-Alphabet/designeralphabet/src/lib/components/Card.svelte` (74 lines)

```typescript
// Props
export let card: Card;
export let selectable = false;
export let selected = false;
export let disabled = false;

// Outputs
dispatch('toggle', { card });
```

**Features:**
- Displays card with letter badge, title, category, cardID
- Shows description and prompt
- Lists tags
- Optional "Add to session" button
- Custom accent color using `--card-accent` CSS variable
- Hover animation: -translate-y-1 (lifts on hover)

### 2.3 Card Panel for Sessions (Desktop & Mobile)
**Location:** `/home/user/Critical-Designer-Alphabet/designeralphabet/src/lib/components/session/CardPanel.svelte` (397 lines)

**Purpose:** Side panel or mobile drawer for selecting cards during session (currently commented out)

**Props:**
```typescript
export let selectedCards: Card[] = [];
export let maxSelection = 5;
export let onCardToggle: (card: Card) => void = () => {};
export let isOpen = false;
export let isMobile = false;
```

**Features:**
- **Desktop:** Right sidebar that can collapse/expand
- **Mobile:** Bottom drawer with backdrop
- Search cards within session
- Filter by category
- Shows "My Cards" selection section
- Max 5 card selection with disabled state when limit reached

**Status:** Currently commented out in main session page (lines 56, 60-61 of +page.svelte)

### 2.4 Resource Card Component
**Location:** `/home/user/Critical-Designer-Alphabet/designeralphabet/src/lib/components/ResourceCard.svelte` (23 lines)

Simple wrapper for displaying links within card details:
```typescript
export let title: string;
export let desc: string;
export let url: string;
export let border: string;  // Tailwind border color class
```

---

## 3. SESSION CARD MANAGEMENT

### 3.1 Session Card Store
**Location:** `/home/user/Critical-Designer-Alphabet/designeralphabet/src/lib/stores/sessionCards.ts` (96 lines)

```typescript
export interface SessionCardStore {
  selectedCards: Card[];
  isCardPanelOpen: boolean;
}

function createSessionCardStore(sessionCode: string) {
  const storageKey = `${STORAGE_KEY_PREFIX}${sessionCode}`;
  
  // Persists to localStorage with key: cda:session-cards:{sessionCode}
  // Auto-saves on changes
  
  return {
    toggleCard: (card: Card, maxSelection = 5) => {...},
    addCard: (card: Card, maxSelection = 5) => {...},
    removeCard: (cardId: string) => {...},
    clearCards: () => {...},
    setCardPanelOpen: (isOpen: boolean) => {...},
    toggleCardPanel: () => {...},
    getCardNames: () => {...},
    reset: () => {...}
  };
}
```

**Note:** This store is NOT currently used in the session page (lines 135, 144-145 of session [code]/+page.svelte show it's commented out).

### 3.2 Staged Cards Persistence
**Location:** `/designeralphabet/src/routes/cards/+page.svelte` lines 169-180

```typescript
function persistSelection(cardIds: string[]) {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem('critical-alphabet:stagedCards', JSON.stringify(cardIds));
}

function startSession() {
  if (!selectedCards.length) {
    statusMessage = 'Select at least one card to seed your session.';
    return;
  }
  const code = generateRoomCode();
  persistSelection(selectedCards.map((card) => card.cardID ?? card._id));
  goto(`/session?code=${code}`);
}
```

**Storage Key:** `critical-alphabet:stagedCards`
**Storage Type:** sessionStorage (cleared when tab closes)
**Data Format:** JSON array of cardIDs (strings)

### 3.3 Card Submission with Responses
**Location:** `/designeralphabet/src/routes/api/responses/add/+server.ts` (33 lines)

```typescript
export const POST: RequestHandler = async ({ request }) => {
  const { code, questionId, participantId, text, cards, metadata } = 
    await request.json();
  
  // cards is expected to be: Array<string> (card IDs or titles)
  
  const response = await addResponse({
    code,
    questionId: String(questionId),
    participantId: participantId ? String(participantId) : null,
    text,
    cards: Array.isArray(cards) ? cards : [],  // Defaults to empty array
    metadata: metadata || null
  });
  
  return json({ success: true, response });
};
```

**Server-Side Processing:**
```typescript
// From /designeralphabet/src/lib/server/workshop.ts lines 586-639

export async function addResponse({
  code,
  questionId,
  participantId,
  text,
  cards,
  metadata
}: {
  code: string;
  questionId: string;
  participantId: string | null;
  text: string;
  cards: string[];  // Array of card identifiers
  metadata?: any;
}) {
  const response = await supabaseAdmin
    .from('responses')
    .insert({
      room_code: code,
      question_id: questionId,
      participant_id: participantId,
      text,
      cards,  // Stored in JSONB field
      metadata: metadata || null
    })
    .select()
    .single();
  
  broadcast(code, { type: 'RESPONSE_ADDED', response: result });
  return result;
}
```

**Status:** Function supports cards but session page currently passes empty array (line 749):
```typescript
await apiAddResponse(sessionCode, {
  questionId: selectedQuestionId,
  participantId: currentParticipant.id,
  text: normalizedResponseText,
  cards: [],  // Temporarily empty - cards feature hidden
  metadata: responseMetadata
});
```

---

## 4. CURRENT FUNCTIONALITY & FEATURES

### 4.1 What Users Can Do With Cards (Currently Active)

| Feature | Status | Location |
|---------|--------|----------|
| **Browse Card Library** | ✅ ACTIVE | `/cards` route |
| **Search Cards** | ✅ ACTIVE | Title, description, prompt, cardID search |
| **Filter by Category** | ✅ ACTIVE | 5 categories: theory, practice, lens, mindset, method |
| **Filter by Letter** | ✅ ACTIVE | Single-letter A-Z filters |
| **Filter by Tags** | ✅ ACTIVE | Multi-select tag filtering |
| **View Card Details** | ✅ ACTIVE | Drawer modal with full card info |
| **Stage Cards (3-5)** | ✅ ACTIVE | Select for session launch |
| **Random Draw** | ✅ ACTIVE | Randomly select 3-5 cards |
| **Launch Session** | ✅ ACTIVE | Create room with staged cards |
| **Link Cards to Responses** | ❌ HIDDEN | Database schema supports it, UI/submission disabled |
| **View Cards in Session** | ❌ HIDDEN | CardPanel component exists but not rendered |
| **Track Card Usage** | ❌ HIDDEN | Export includes card data, but not visualized |

### 4.2 What's Disabled/Hidden

**Session Page (Lines 56, 60-62, 90, 135, 143-145 of `/designeralphabet/src/routes/session/[code]/+page.svelte`):**
```typescript
// COMMENTED OUT - Feature disabled
// import CardPanel from '$lib/components/session/CardPanel.svelte';
// import { createSessionCardStore } from '$lib/stores/sessionCards';
// import type { Card } from '$lib/Cards';

// In component:
// let linkedCardsText = '';

// Submission:
// const selectedCardTitles = selectedCards.map((card) => card.title);
// const additionalCards = linkedCardsText.split(',').map((card) => card.trim()).filter(Boolean);
// const allCards = [...selectedCardTitles, ...additionalCards];

cards: [],  // Temporarily empty - cards feature hidden
```

### 4.3 Gamification Integration
**Location:** `/designeralphabet/src/lib/gamification.ts`

Cards are NOT currently part of the gamification system, but the system references:
```typescript
updateFairnessMultiplier(
  participantsWhoContributed,
  totalParticipants,
  distinctCards = 0  // Parameter exists but not used
)
```

---

## 5. CODE LOCATIONS & ROUTES

### 5.1 Route Pages
| Route | File | Purpose |
|-------|------|---------|
| `/cards` | `/designeralphabet/src/routes/cards/+page.svelte` | Main cards library (602 lines) |
| `/session/[code]` | `/designeralphabet/src/routes/session/[code]/+page.svelte` | Session view (2800+ lines, cards functionality commented) |

### 5.2 API Endpoints
| Endpoint | Method | File | Purpose |
|----------|--------|------|---------|
| `/api/responses/add` | POST | `/designeralphabet/src/routes/api/responses/add/+server.ts` | Submit response with optional cards |
| `/api/session/[code]` | GET | `/designeralphabet/src/routes/api/session/[code]/+server.ts` | Fetch session bundle (includes responses with cards) |

### 5.3 Data Access Layer
| Function | File | Purpose |
|----------|------|---------|
| `fetchCards()` | `/lib/Cards.ts:64` | Fetch all cards from Sanity with GROQ |
| `addResponse()` | `/lib/server/workshop.ts:586` | Insert response with card references |
| `getResponses()` | `/lib/server/workshop.ts:641` | Fetch responses (includes cards array) |
| `buildSessionExport()` | `/lib/server/workshop.ts:798` | Generate markdown export with card tags |

### 5.4 Component Tree
```
/routes/cards/+page.svelte
├── SearchInput + Filters
├── Card Grid
│   └── Card display (styled per category)
│       ├── "View" button → SimpleDrawer
│       │   └── Full card details with sources/reading list
│       └── "Stage card" button
└── Floating staged cards summary
    └── "Launch session" button

/routes/session/[code]/+page.svelte
├── Response modal (no card linking UI)
│   └── TextInput / Advanced input components
│       └── submitResponse() → /api/responses/add (cards: [])
└── [Commented out] CardPanel (side/mobile panel)
```

### 5.5 Sanity Studio
**Location:** `/designeralphabet/content/` (separate SvelteKit project)

Schema files:
- `/sanity/schemas/index.ts`: Exports all schemas including cards
- `/sanity/schemas/cards.ts`: Complete card schema definition
- Objects: `i18n-text.ts`, `resource-link.ts` (used by cards)

---

## 6. DATABASE SCHEMA

### 6.1 Responses Table with Cards
```sql
CREATE TABLE responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL REFERENCES sessions(code) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE SET NULL,
  text text NOT NULL,
  cards jsonb DEFAULT '[]'::jsonb,  -- Stores: ["card-id-1", "card-id-2"]
  votes int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

### 6.2 Session Phases Table
```sql
CREATE TABLE session_phases (
  ...
  cards JSON,  -- Array of card objects/IDs for phase
  status ENUM('pending','active','completed'),
  ...
);
```

---

## 7. CARD COUNTS & CATEGORIES

### 7.1 Card Categories
```typescript
const CATEGORIES = ['theory', 'practice', 'lens', 'mindset', 'method'];

// Color mapping in UI
const CATEGORY_VARIANTS: Record<CategoryType, VariantName> = {
  theory: 'purple',
  practice: 'cyan',
  lens: 'pink',
  mindset: 'lime',
  method: 'orange'
};
```

### 7.2 Total Cards
**Not directly visible in code** - Must be queried from Sanity at runtime via `fetchCards()`. The count is determined by documents with `_type == "cards"` in the Sanity dataset.

Status message when loading shows available count:
```typescript
if (!deck.length) {
  statusMessage = 'No cards found yet. Add cards in Sanity Studio to populate the library.';
}
```

---

## 8. LOCALIZATION & INTERNATIONALIZATION

Card schema supports i18n:
```typescript
export type LocalizedText = {
  en?: string;
  es?: string;
  fr?: string;
  pt?: string;
  [key: string]: string | undefined;
};
```

**Supported Languages:**
- English (en)
- Spanish (es)
- French (fr)
- Portuguese (pt)

**Fields with i18n:**
- `description_i18n`: Localized card descriptions
- `prompt_i18n`: Localized prompts

---

## 9. STYLING & RETRO UI

### 9.1 Style Metadata
Each card can include styling via `styleMeta`:
```typescript
type StyleMeta = {
  icon?: string;           // Icon slug (lucide or custom)
  neonColor?: string;      // Hex or HSL (e.g., #ff2aad, hsl(310 100% 60%))
  animationStyle?: string; // 'neon-pulse' | 'scanline' | 'bounce' | 'glow'
};
```

### 9.2 Category Color Scheme
```typescript
// In cards library page
const CATEGORY_VARIANTS: Record<CategoryType, VariantName> = {
  theory: 'purple',    // border-purple-500, bg-purple-100, text-purple-900
  practice: 'cyan',    // border-cyan-500, bg-cyan-100, text-cyan-900
  lens: 'pink',        // border-pink-500, bg-pink-100, text-pink-900
  mindset: 'lime',     // border-lime-600, bg-lime-100, text-lime-900
  method: 'orange'     // border-orange-500, bg-orange-100, text-orange-900
};
```

### 9.3 Individual Card Color Variation
```typescript
function getCardColorVariation(card: Card): string {
  const letter = card.letter?.charCodeAt(0) || 65;
  const variation = ((letter - 65) * 7) % 20;  // 0-19 range
  return `filter: brightness(${1 + variation * 0.02 - 0.2}) 
          saturate(${1 + (variation % 10) * 0.03 - 0.15});`;
}
```

---

## 10. EXPORT & REPORTING

### 10.1 Session Export
**Function:** `buildSessionExport()` in `/lib/server/workshop.ts:798`

Includes card references in exported markdown:
```typescript
lines.push('## Questions & Responses');
questions.forEach((question) => {
  responses
    .filter((response) => response.question_id === question.id)
    .forEach((response) => {
      const tags = response.cards?.length 
        ? ` _(cards: ${response.cards.join(', ')})_` 
        : '';
      lines.push(`- **${author}** (${response.votes} votes): ${response.text}${tags}`);
    });
});
```

**Format:** `_(cards: [card-id-1, card-id-2])_` appended to response text

---

## 11. SUMMARY: CURRENT STATE

### Implemented & Active:
✅ Card browsing/filtering/search library
✅ Staging 3-5 cards before session
✅ Random draw functionality
✅ Database schema support for card linking
✅ API endpoints accept cards parameter
✅ Card metadata storage (JSONB in responses table)
✅ Card details view with full content
✅ Localization framework
✅ Export includes card references
✅ Sanity studio management interface

### Disabled/Not Yet Implemented:
❌ Card panel UI in sessions
❌ Linking cards to responses during session
❌ Visual display of which cards were used
❌ Card-based gamification
❌ Actual card prompt integration into questions
❌ Cards count in leaderboard/scoring

---

## 12. IMPLEMENTATION ROADMAP (For Re-enabling Cards in Sessions)

To re-enable card functionality in sessions:

1. **Uncomment CardPanel import** (line 60)
2. **Uncomment store creation** (line 135)
3. **Uncomment card variables** (line 136, 143-145)
4. **Populate cards array in submitResponse()** (line 749):
   ```typescript
   const selectedCardTitles = selectedCards.map((c) => c.cardID || c.title);
   cards: selectedCardTitles,  // Instead of: cards: []
   ```
5. **Add CardPanel to UI** in template section of session page
6. **Style and integrate** card selection UI into response modal

---

