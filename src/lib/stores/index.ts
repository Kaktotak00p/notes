export * as auth from './auth';

import { createNotesStore } from './notes';
import { createCategoriesStore } from './categories';
import { createTasksStore } from './tasks';
import type { SupabaseClient } from '@supabase/supabase-js';

export const notes = createNotesStore();
export const categories = createCategoriesStore();
export const tasks = createTasksStore();

export async function initializeStores(userId: string, supabase: SupabaseClient) {
    await Promise.all([
        notes.initialize(supabase),
        categories.initialize(supabase),
        tasks.initialize(supabase)
    ]);
}