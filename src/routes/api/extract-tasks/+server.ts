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

    const systemPrompt = `You are an AI assistant that extracts actionable tasks from notes. Your job is to identify sentences or phrases representing specific actions the user needs to take. Follow these guidelines:
1. Only extract actionable tasks; ignore general advice, suggestions, or non-actionable items.
2. Exclude tasks written in the present continuous tense (e.g., "I am doing...").
3. Consider actionable items such as "I need to...", "I should...", or "I have to...".
4. Do not create new tasks; only extract existing ones from the note.

Respond with a JSON object that follows this structure:
{
    "tasks": [ // An array of tasks, each as a string.
        "Submit the report",
        "Schedule the meeting"
    ],
    "taskCount": 2 // The total number of tasks found.
}

If no tasks are found, return:
{
    "tasks": [],
    "taskCount": 0
}`;

    const userQuery = `Extract tasks from the following note:\n${noteContent}`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userQuery }
            ],
        });

        const content = completion.choices[0].message.content || '[]';
        console.log('Raw AI response:', content);

        let extractedTasks: string[] = [];

        try {
            // Remove JSON code block markers if present
            const cleanedContent = content.replace(/^```json\n?|\n?```$/g, '').trim();
            const parsedResult = JSON.parse(cleanedContent);

            if (parsedResult && typeof parsedResult === 'object' && 'tasks' in parsedResult && 'taskCount' in parsedResult) {
                extractedTasks = parsedResult.tasks;
                console.log(`Extracted ${parsedResult.taskCount} tasks:`, extractedTasks);
            } else {
                throw new Error('Invalid response structure');
            }
        } catch (parseError) {
            console.error('Failed to parse content as expected JSON structure:', parseError);

            // Fallback: try to extract any array of strings from the content
            const match = content.match(/\[([\s\S]*?)\]/);
            if (match) {
                try {
                    extractedTasks = JSON.parse(`[${match[1]}]`);
                    console.log('Extracted tasks from array:', extractedTasks);
                } catch (arrayParseError) {
                    console.error('Failed to parse extracted array:', arrayParseError);
                }
            }

            // If all parsing fails, fall back to simple string splitting
            if (extractedTasks.length === 0) {
                extractedTasks = content
                    .split(/\n/)
                    .map(line => line.replace(/^["-\s]+|["-\s]+$/g, '').trim())
                    .filter(line => line.length > 0 && !line.match(/^(tasks?|taskCount):?$/i));
                console.log('Extracted tasks by splitting:', extractedTasks);
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
