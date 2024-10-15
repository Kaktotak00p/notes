// src/stores/tasksStore.ts
import { writable, get } from 'svelte/store';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

// Define the shape of a task object
export interface Task {
    id: string;
    userId: string;
    task: string;
    dueDate: string | null;
    aiGenerated: boolean;
    created_at: string;
    updated_at: string;
    completed: boolean;
}

function createTasksStore() {
    const { subscribe, set, update } = writable<Task[]>([]);

    let tasksSubscription: RealtimeChannel | null = null;
    let supabase: SupabaseClient;

    async function initialize(supabaseClient: SupabaseClient) {
        supabase = supabaseClient;
        const { data } = await supabase.auth.getUser();
        if (data && data.user) {
            fetchTasks(data.user.id);
            subscribeToRealtimeTasks(data.user.id);
        }
    }

    // Function to fetch tasks
    async function fetchTasks(userId: string): Promise<void> {
        console.log('Fetching tasks for user:', userId);
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('userid', userId);

        if (error) {
            console.error('Error fetching tasks:', error);
        } else {
            set(data || []);
        }
    }

    // Function to start real-time syncing
    function subscribeToRealtimeTasks(userId: string): void {
        console.log('Subscribing to real-time tasks for user:', userId);
        tasksSubscription = supabase
            .channel('public:tasks')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                payload => {
                    update(currentTasks => {
                        switch (payload.eventType) {
                            case 'INSERT':
                                return [...currentTasks, payload.new as Task];
                            case 'UPDATE':
                                return currentTasks.map(task =>
                                    task.id === (payload.new as Task).id ? (payload.new as Task) : task
                                );
                            case 'DELETE':
                                return currentTasks.filter(task => task.id !== (payload.old as Task).id);
                            default:
                                return currentTasks;
                        }
                    });
                }
            )
            .subscribe();
    }

    // Function to stop real-time syncing
    function unsubscribeFromRealtimeTasks(): void {
        if (tasksSubscription) {
            supabase.removeChannel(tasksSubscription);
        }
    }

    // Function to create a new task
    async function createTask(newTask: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
        const { data, error } = await supabase
            .from('tasks')
            .insert(newTask)
            .select('*');

        if (error) {
            console.error('Error creating task:', error);
        } else {
            // Add the newly created task to the store
            update(currentTasks => [...currentTasks, ...(data || [])]);
        }
    }

    // Function to update a task in Supabase and the store
    async function updateTask(updatedTask: Task): Promise<void> {
        const { data, error } = await supabase
            .from('tasks')
            .update({
                task: updatedTask.task,
                dueDate: updatedTask.dueDate,
                aiGenerated: updatedTask.aiGenerated,
                completed: updatedTask.completed
            })
            .eq('id', updatedTask.id)
            .select('*'); // Fetch the updated row

        if (error) {
            console.error('Error updating task:', error);
        } else {
            // Update the store after the database update
            update(currentTasks => currentTasks.map(task =>
                task.id === updatedTask.id ? (data ? data[0] : updatedTask) : task
            ));
        }
    }

    // Function to delete a task permanently from Supabase
    async function deleteTaskPermanently(taskId: string): Promise<void> {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) {
            console.error('Error deleting task permanently:', error);
        } else {
            // Remove the task from the store after deletion
            update(currentTasks => currentTasks.filter(task => task.id !== taskId));
        }
    }

    // Function to get the last created task
    function getLastCreatedTask(): Task | undefined {
        return get({ subscribe }).sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
    }

    return {
        subscribe,
        initialize,
        fetchTasks,
        createTask,
        subscribeToRealtimeTasks,
        unsubscribeFromRealtimeTasks,
        updateTask,
        deleteTaskPermanently,
        getLastCreatedTask // Add the new function to the returned object
    };
}

console.log("Initializing tasks store");
export const tasks = createTasksStore();
