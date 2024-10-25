import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

export interface Task {
    id: string;
    userId: string;
    task: string;
    dueDate: string | null;
    aiGenerated: boolean;
    created_at: string;
    updated_at: string;
    completed: boolean;
    noteId: string | null;
    hash: string | null;
}

let tasksSubscription: RealtimeChannel | null = null;

export async function fetchTasks(supabase: SupabaseClient, userId: string): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('userId', userId);

    if (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }

    return data as Task[];
}

export function subscribeToTasks(supabase: SupabaseClient, userId: string, callback: (payload: any) => void): void {
    if (tasksSubscription) {
        supabase.removeChannel(tasksSubscription);
    }

    tasksSubscription = supabase
        .channel('public:tasks')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tasks', filter: `userId=eq.${userId}` },
            callback
        )
        .subscribe();
}

export function unsubscribeFromTasks(supabase: SupabaseClient): void {
    if (tasksSubscription) {
        supabase.removeChannel(tasksSubscription);
    }
}

export async function createTask(supabase: SupabaseClient, newTask: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'dueDate'>): Promise<Task | null> {
    const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select('*');

    if (error) {
        console.error('Error creating task:', error);
        return null;
    }

    return data ? data[0] : null;
}

export async function updateTask(supabase: SupabaseClient, updatedTask: Task): Promise<Task | null> {
    const { data, error } = await supabase
        .from('tasks')
        .update({
            task: updatedTask.task,
            dueDate: updatedTask.dueDate,
            aiGenerated: updatedTask.aiGenerated,
            completed: updatedTask.completed
        })
        .eq('id', updatedTask.id)
        .select('*');

    if (error) {
        console.error('Error updating task:', error);
        return null;
    }

    return data ? data[0] : null;
}

export async function deleteTaskPermanently(supabase: SupabaseClient, taskId: string): Promise<void> {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

    if (error) {
        throw error;
    }
}

export function getLastCreatedTask(tasks: Task[]): Task | undefined {
    return tasks.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
}
