import { writable } from 'svelte/store';
import * as notesApi from '$lib/supabase/notesApi';

export const selectedNote = writable<notesApi.Note | null>(null);
export const notes = writable<notesApi.Note[]>([]);

