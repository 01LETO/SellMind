import { PassThrough } from 'node:stream';
import Anthropic from '@anthropic-ai/sdk';
import logger from '../utils/logger.js';
import { supabaseAdmin } from '../utils/supabaseClient.js';

const client = new Anthropic();

const MessageRole = Object.freeze({
	User: 'user',
	Assistant: 'assistant',
});

const SSEEventType = Object.freeze({
	Content: 'content',
	Reasoning: 'reasoning',
	ToolUse: 'tool_use',
	ToolResult: 'tool_result',
	Usage: 'usage',
	Error: 'error',
	Done: 'done',
	Completed: 'completed',
});

export const ContentBlockType = Object.freeze({
	Text: 'text',
	Image: 'image',
});

const HistoryEventTypes = new Set([
	SSEEventType.Reasoning,
	SSEEventType.Content,
	SSEEventType.ToolUse,
	SSEEventType.ToolResult,
	SSEEventType.Error,
]);

const SquashableSSEEventTypes = new Set([
	SSEEventType.Content,
	SSEEventType.Reasoning,
	SSEEventType.Error,
]);

/**
 * @typedef {object} TextContentBlock
 * @property {'text'} type
 * @property {string} text
 */

/**
 * @typedef {object} ImageContentBlock
 * @property {'image'} type
 * @property {string} image URL
 */

/**
 * @typedef {TextContentBlock | ImageContentBlock} ContentBlock
 */

/**
 * Uploads images to Supabase Storage and returns their public URLs.
 *
 * @param {{ images: Express.Multer.File[] }} params
 * @returns {Promise<string[]>}
 */
export async function uploadImagesToSupabase({ images }) {
	const uploadPromises = images.map(async (file) => {
		const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.originalname}`;

		const { error } = await supabaseAdmin.storage
			.from('ai-images')
			.upload(fileName, file.buffer, {
				contentType: file.mimetype,
				upsert: false,
			});

		if (error) throw new Error(`Failed to upload image: ${error.message}`);

		const { data } = supabaseAdmin.storage.from('ai-images').getPublicUrl(fileName);
		return data.publicUrl;
	});

	return Promise.all(uploadPromises);
}

/**
 * Maps stored ContentBlock[] to a Claude API user message.
 *
 * @param {ContentBlock[]} userMessage
 * @returns {{ role: 'user', content: object[] }}
 */
function mapUserMessageForClaude(userMessage) {
	const content = userMessage.map((block) => {
		if (block.type === ContentBlockType.Text) {
			return { type: 'text', text: block.text };
		}
		return { type: 'image', source: { type: 'url', url: block.image } };
	});

	return { role: 'user', content };
}

/**
 * Maps stored SSE event history to a Claude API assistant message.
 * Returns null if there is no text content to preserve.
 *
 * @param {object[]} assistantEvents
 * @returns {{ role: 'assistant', content: object[] } | null}
 */
function mapAssistantForClaude(assistantEvents) {
	const text = assistantEvents
		.filter((e) => e.type === SSEEventType.Content)
		.map((e) => e.data.content)
		.join('');

	if (!text) return null;

	return { role: 'assistant', content: [{ type: 'text', text }] };
}

/**
 * Fetches message history from Supabase and converts it to Claude API format.
 *
 * @param {{ userId: string }} params
 * @returns {Promise<object[]>}
 */
export async function getHistory({ userId }) {
	if (!userId) return [];

	const { data: records, error } = await supabaseAdmin
		.from('integrated_ai_messages')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: true });

	if (error) throw new Error(`Failed to fetch history: ${error.message}`);

	const claudeMessages = [];

	for (const record of records) {
		if (record.role === MessageRole.User) {
			claudeMessages.push(mapUserMessageForClaude(record.content));
		} else if (record.role === MessageRole.Assistant) {
			const msg = mapAssistantForClaude(record.content);
			if (msg) claudeMessages.push(msg);
		}
	}

	return claudeMessages;
}

/**
 * @param {{ userId: string, messages: { role: string, content: object }[] }} params
 */
async function saveMessages({ userId, messages }) {
	const rows = messages.map((message) => ({
		...(userId && { user_id: userId }),
		role: message.role,
		content: message.content,
	}));

	const { error } = await supabaseAdmin.from('integrated_ai_messages').insert(rows);
	if (error) throw new Error(`Failed to save messages: ${error.message}`);
}

function squashSSEEvents({ events }) {
	if (!events.length) return events;

	const squashedEvents = [];
	let [currentEvent, ...restEvents] = events;

	restEvents.forEach((event) => {
		if (
			!SquashableSSEEventTypes.has(currentEvent.type) ||
			!SquashableSSEEventTypes.has(event.type) ||
			event.type !== currentEvent.type
		) {
			squashedEvents.push(currentEvent);
			currentEvent = event;
			return;
		}

		currentEvent = {
			...currentEvent,
			data: {
				...currentEvent.data,
				content: `${currentEvent.data.content}${event.data.content}`,
			},
		};
	});

	squashedEvents.push(currentEvent);
	return squashedEvents;
}

/**
 * Streams a Claude response to the client over SSE.
 * The assistant message is saved to Supabase when the stream completes.
 *
 * @param {{ userId: string, systemPrompt: string, userMessage: ContentBlock[] }} params
 * @returns {Promise<import('node:stream').PassThrough>}
 */
export async function stream({ userId, systemPrompt, userMessage }) {
	const history = await getHistory({ userId });

	const claudeMessages = [...history, mapUserMessageForClaude(userMessage)];

	const passThrough = new PassThrough();

	function sseWrite(event) {
		if (!passThrough.destroyed) {
			passThrough.push(`data: ${JSON.stringify(event)}\n\n`);
		}
	}

	/** @type {object[]} */
	const collectedEvents = [];

	const claudeStream = client.messages.stream({
		model: process.env.CLAUDE_MODEL || 'claude-opus-4-7',
		max_tokens: 8192,
		system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
		messages: claudeMessages,
	});

	claudeStream.on('text', (text) => {
		const event = { type: SSEEventType.Content, data: { content: text } };
		collectedEvents.push(event);
		sseWrite(event);
	});

	// Swallow stream-level errors — finalMessage() rejects with the same error
	claudeStream.on('error', (err) => {
		logger.error('Claude stream error', err);
	});

	claudeStream
		.finalMessage()
		.then(async (finalMessage) => {
			const { usage } = finalMessage;

			sseWrite({
				type: SSEEventType.Usage,
				data: {
					promptTokens: usage.input_tokens,
					completionTokens: usage.output_tokens,
					reasoningTokens: 0,
					cacheCreationInputTokens: usage.cache_creation_input_tokens ?? 0,
					cacheReadInputTokens: usage.cache_read_input_tokens ?? 0,
					cachedPromptTokens: 0,
					model: process.env.CLAUDE_MODEL || 'claude-opus-4-7',
					provider: 'anthropic',
					platform: 'api',
					agent: 'sellmind',
				},
			});

			sseWrite({ type: SSEEventType.Done, data: { content: '[DONE]' } });

			const historyEvents = collectedEvents.filter((e) => HistoryEventTypes.has(e.type));
			const squashedEvents = squashSSEEvents({ events: historyEvents });

			await saveMessages({
				userId,
				messages: [
					{ role: MessageRole.User, content: userMessage },
					{ role: MessageRole.Assistant, content: squashedEvents },
				],
			});
		})
		.catch((err) => {
			logger.error('Claude stream finalMessage error', err);
			sseWrite({ type: SSEEventType.Error, data: { content: err.message } });
		})
		.finally(() => {
			if (!passThrough.destroyed) {
				passThrough.end(
					`data: ${JSON.stringify({ type: SSEEventType.Completed, data: { content: '[COMPLETED]' } })}\n\n`,
				);
			}
		});

	return passThrough;
}
