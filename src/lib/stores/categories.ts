import { writable } from 'svelte/store';
import type { Category } from '$lib/supabase/categoriesApi';

export const categories = writable<Category[]>([]);

