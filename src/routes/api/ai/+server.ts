import { json } from '@sveltejs/kit';

export const POST = async ({ request }) => {
	try {
		const { apiUrl, systemPrompt, userQuery } = await request.json();

		// Perform the API request to the external AI service
		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				prompt: `${systemPrompt} ${userQuery}`,
			}),
		});

		if (!response.ok) {
			return json({ error: 'Failed to fetch from the AI API' }, { status: 500 });
		}
    
		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('Error in AI query request:', error);
		return json({ error: 'Error processing the request' }, { status: 500 });
	}
};
