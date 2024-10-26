import { OpenAI } from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import * as tasksApi from '$lib/supabase/tasksApi';
import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
});

export const POST: RequestHandler = async ({ request, locals }) => {
    const { noteContent, noteId } = await request.json();
    console.log('Note content: ', noteContent);

    const systemPrompt = `You are an AI assistant that extracts actionable tasks from notes. Identify any sentences or phrases that represent actions the user should take. Only consider meaningful tasks, not simple phrases like or "I want to...". Ignore general advice or suggestions. Ignore tasks that are not actionable. Ignore tasks that are written in the present continuous tense. Do consider possible actionable items, such as "I need to...". Convert these into assertive, task-like statements. Respond with a JSON array of tasks.`;
    const userQuery = `Extract tasks from the following note:\n${noteContent}`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userQuery }
            ],
        });

        const content = completion.choices[0].message.content || '[]';
        console.log('Raw AI response:', content);

        let extractedTasks: string[] = [];

        try {
            // First, try to parse the entire content as JSON
            const parsedResult = JSON.parse(content);
            extractedTasks = Array.isArray(parsedResult) ? parsedResult : parsedResult.tasks || [];
        } catch (parseError) {
            console.error('Failed to parse entire content as JSON:', parseError);

            // If that fails, try to extract JSON array from the content
            const match = content.match(/\[[\s\S]*\]/);
            if (match) {
                try {
                    extractedTasks = JSON.parse(match[0]);
                } catch (arrayParseError) {
                    console.error('Failed to parse extracted array:', arrayParseError);
                }
            }

            // If JSON parsing fails, fall back to simple string splitting
            if (extractedTasks.length === 0) {
                extractedTasks = content
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0 && !line.startsWith('[') && !line.startsWith(']'));
            }
        }

        console.log('Extracted tasks:', extractedTasks);

        // Process the extracted tasks
        for (const task of extractedTasks) {
            const taskText = typeof task === 'string' ? task : (task as any).task || JSON.stringify(task);
            const hash = createHash('md5').update(taskText).digest('hex');
            const existingTask = await getTaskByHash(locals.supabase, hash);

            if (!existingTask && locals.session?.user.id) {
                console.log('Creating new task:', taskText);
                await tasksApi.createTask(locals.supabase, {
                    userId: locals.session?.user.id,
                    task: taskText,
                    completed: false,
                    aiGenerated: true,
                    noteId: noteId,
                    hash: hash
                });
            } else {
                console.log('Task already exists:', taskText);
            }
        }

        return json({ tasks: extractedTasks });
    } catch (error: any) {
        console.error('Error extracting tasks:', error);
        return json({ error: error.message }, { status: error.status || 500 });
    }
};

async function getTaskByHash(supabase: SupabaseClient, hash: string) {
    console.log('Getting task by hash:', hash);
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('hash', hash);

    if (error) {
        console.error('Error fetching task by hash:', error);
        return null;
    }

    return data.length > 0 ? data[0] : null;
}
