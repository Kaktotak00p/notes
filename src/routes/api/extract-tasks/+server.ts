import { OpenAI } from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';


const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
});

export const POST: RequestHandler = async ({ request }) => {
    const { noteContent } = await request.json();
    console.log('Note content: ', noteContent);

    const systemPrompt = `You are an AI assistant that extracts actionable tasks from notes. Identify any sentences or phrases that represent actions the user should take. Convert these into assertive, task-like statements. Respond with a JSON array of tasks.`;
    const userQuery = `Extract tasks from the following note:\n${noteContent}`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userQuery }
            ],
        });

        // Remove markdown formatting if present
        const content = completion.choices[0].message.content || '[]';
        const jsonString = content.replace(/```json\n|\n```/g, '').trim();
        const tasks = JSON.parse(jsonString);
        console.log('Tasks: ', tasks);
        return json({ tasks });
    } catch (error: any) {
        console.error('Error extracting tasks:', error);
        return json({ error: error.message }, { status: error.status });
    }
};

