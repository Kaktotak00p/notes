// src/routes/api/llama/+server.ts
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { prompt } = body;

		// Validate input
		if (!prompt) {
			return json({ error: 'Prompt is required' }, { status: 400 });
		}

		// LLaMA API running localy is exposed on localhost:11434
		const llamaResponse = await fetch('http://localhost:11434/generate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				prompt,
				stream: false, // Turned off streaming for more consistent beheviour 
			}),
		});

		if (!llamaResponse.ok) {
			throw new Error('Failed to connect to LLaMA API');
		}

		const llamaData = await llamaResponse.json();

		return json({ response: llamaData }, { status: 200 });
	} catch (error) {
		console.error('Error processing LLaMA request:', error);
		return json({ error: 'Failed to process request' }, { status: 500 });
	}
};

