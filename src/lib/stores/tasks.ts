import { writable } from 'svelte/store';
import { derived } from 'svelte/store';
import * as tasksApi from '$lib/supabase/tasksApi';

export const selectedTask = writable<tasksApi.Task | null>(null);
export const tasks = writable<tasksApi.Task[]>([]);

/**
 * Group tasks by noteId
 */
export const aiGeneratedTasksByNoteId = derived(tasks, ($tasks) => {
    return Object.entries(
        $tasks
            .filter((task) => task.aiGenerated)
            .reduce((acc: Record<string, tasksApi.Task[]>, task) => {
                if (task.noteId != null) { // Check if noteId is not null or undefined
                    if (!acc[task.noteId]) {
                        acc[task.noteId] = [];
                    }
                    acc[task.noteId].push(task);
                }
                return acc;
            }, {})
    );
});
