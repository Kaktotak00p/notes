import { json } from '@sveltejs/kit';

export const POST = async ({ request }) => {
    try {
        const { systemPrompt, userQuery } = await request.json();

        // Perform the API request to the external AI service
        const response = await fetch("http://localhost:11434/api/generate", {
			    method: 'POST',
			    headers: {
				    'Content-Type': 'application/json',
			    },
			    body: JSON.stringify({
            model: "gemma:2b",
            prompt: `${systemPrompt} ${userQuery}`,
            format: "json",
            stream: false
            }),
        });
        if (!response.ok) {
          console.log(response);
            return json({ error: 'Failed to fetch from the AI API' }, { status: 500 });
        }

        const data = await response.json();
        console.log(data.response);
        return new Response (data.response);
    } catch (error) {
        console.error('Error in AI query request:', error);
        return json({ error: 'Error processing the request' }, { status: 500 });
    }
};

