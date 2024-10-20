import { writable } from 'svelte/store';
import * as tasksApi from '$lib/supabase/tasksApi';

export const selectedTask = writable<tasksApi.Task | null>(null);
export const tasks = writable<tasksApi.Task[]>([]);