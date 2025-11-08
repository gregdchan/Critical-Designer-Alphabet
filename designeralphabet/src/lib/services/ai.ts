// Phase 7: AI Integration Service (Optional - activate when needed)
// This service provides intelligent card recommendations based on response content

import { browser } from '$app/environment';

export interface AIConfig {
	enabled: boolean;
	apiKey: string;
	model: string;
	temperature: number;
}

export interface CardRecommendation {
	cardId: string;
	cardTitle: string;
	relevance: number; // 0-1
	reasoning: string;
}

const DEFAULT_CONFIG: AIConfig = {
	enabled: false,
	apiKey: '',
	model: 'gpt-4',
	temperature: 0.7
};

// Store AI config in localStorage
function getAIConfig(): AIConfig {
	if (!browser) return DEFAULT_CONFIG;

	const stored = localStorage.getItem('cda:ai-config');
	if (stored) {
		try {
			return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
		} catch (e) {
			console.error('Failed to parse AI config:', e);
		}
	}
	return DEFAULT_CONFIG;
}

function setAIConfig(config: Partial<AIConfig>) {
	if (!browser) return;

	const current = getAIConfig();
	const updated = { ...current, ...config };
	localStorage.setItem('cda:ai-config', JSON.stringify(updated));
}

export function enableAI(apiKey: string) {
	setAIConfig({ enabled: true, apiKey });
}

export function disableAI() {
	setAIConfig({ enabled: false });
}

export function isAIEnabled(): boolean {
	return getAIConfig().enabled;
}

// Card recommendation using OpenAI
export async function getCardRecommendations(
	responseText: string,
	availableCards: { id: string; title: string; description: string; category: string }[],
	questionContext?: string
): Promise<CardRecommendation[]> {
	const config = getAIConfig();

	if (!config.enabled || !config.apiKey) {
		console.warn('AI is not enabled or API key is missing');
		return [];
	}

	try {
		const prompt = buildCardRecommendationPrompt(responseText, availableCards, questionContext);

		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${config.apiKey}`
			},
			body: JSON.stringify({
				model: config.model,
				temperature: config.temperature,
				messages: [
					{
						role: 'system',
						content:
							'You are an expert in critical design thinking and design justice. Your role is to recommend relevant Critical Designer Alphabet cards based on participant responses.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				max_tokens: 500
			})
		});

		if (!response.ok) {
			throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		const content = data.choices[0]?.message?.content;

		if (!content) {
			throw new Error('No content in OpenAI response');
		}

		// Parse the AI response into recommendations
		return parseCardRecommendations(content, availableCards);
	} catch (error) {
		console.error('AI recommendation failed:', error);
		return [];
	}
}

function buildCardRecommendationPrompt(
	responseText: string,
	availableCards: { id: string; title: string; description: string; category: string }[],
	questionContext?: string
): string {
	const cardList = availableCards
		.map((card) => `- ${card.title} (${card.category}): ${card.description}`)
		.join('\n');

	return `
You are analyzing a participant's response in a design thinking workshop focused on critical design and pluriversal perspectives.

${questionContext ? `Question/Prompt: ${questionContext}\n` : ''}
Participant Response: "${responseText}"

Available Critical Designer Alphabet Cards:
${cardList}

Based on the participant's response, recommend 3-5 cards that would be most relevant and valuable for them to explore. Consider:
1. Thematic alignment with their response
2. Cards that would deepen their critical thinking
3. Cards that introduce complementary or challenging perspectives
4. Diversity across categories (avoid recommending all cards from one category)

Format your response as JSON array:
[
  {
    "cardTitle": "Card Name",
    "relevance": 0.95,
    "reasoning": "Brief explanation of why this card is relevant"
  }
]
`.trim();
}

function parseCardRecommendations(
	aiResponse: string,
	availableCards: { id: string; title: string }[]
): CardRecommendation[] {
	try {
		// Extract JSON from response (handle markdown code blocks)
		const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
		if (!jsonMatch) {
			console.warn('No JSON array found in AI response');
			return [];
		}

		const parsed = JSON.parse(jsonMatch[0]);

		return parsed
			.map((item: any) => {
				const card = availableCards.find(
					(c) => c.title.toLowerCase() === item.cardTitle.toLowerCase()
				);
				if (!card) return null;

				return {
					cardId: card.id,
					cardTitle: card.title,
					relevance: item.relevance || 0.5,
					reasoning: item.reasoning || ''
				};
			})
			.filter((r: CardRecommendation | null): r is CardRecommendation => r !== null)
			.sort((a, b) => b.relevance - a.relevance);
	} catch (error) {
		console.error('Failed to parse AI recommendations:', error);
		return [];
	}
}

// Response quality analysis
export async function analyzeResponseQuality(
	responseText: string,
	cards: string[]
): Promise<{
	score: number; // 0-100
	feedback: string;
	suggestions: string[];
}> {
	const config = getAIConfig();

	if (!config.enabled || !config.apiKey) {
		return {
			score: 50,
			feedback: 'AI analysis not available',
			suggestions: []
		};
	}

	try {
		const prompt = `
Analyze this design thinking workshop response for quality and depth:

Response: "${responseText}"
Cards Referenced: ${cards.join(', ')}

Provide:
1. Quality score (0-100)
2. Brief constructive feedback
3. 2-3 suggestions for improvement

Format as JSON:
{
  "score": 75,
  "feedback": "Your response shows...",
  "suggestions": ["Consider...", "You could also..."]
}
`.trim();

		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${config.apiKey}`
			},
			body: JSON.stringify({
				model: config.model,
				temperature: 0.5,
				messages: [
					{
						role: 'system',
						content:
							'You are a supportive design thinking facilitator providing constructive feedback.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				max_tokens: 300
			})
		});

		const data = await response.json();
		const content = data.choices[0]?.message?.content;

		const jsonMatch = content.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			return JSON.parse(jsonMatch[0]);
		}

		return {
			score: 50,
			feedback: content,
			suggestions: []
		};
	} catch (error) {
		console.error('AI quality analysis failed:', error);
		return {
			score: 50,
			feedback: 'Analysis unavailable',
			suggestions: []
		};
	}
}

export { getAIConfig, setAIConfig };
