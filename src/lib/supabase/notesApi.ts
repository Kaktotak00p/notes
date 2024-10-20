import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

export interface Note {
    id: string;
    userId: string;
    fileName: string;
    content: string;
    categoryid: string | null;
    created_at: string;
    updated_at: string;
    deleted: boolean;
}

let notesSubscription: RealtimeChannel | null = null;

export async function fetchNotes(supabase: SupabaseClient, userId: string): Promise<Note[]> {
    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('userId', userId)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching notes:', error);
        return [];
    }

    return data as Note[];
}

export function subscribeToNotes(supabase: SupabaseClient, userId: string, callback: (payload: any) => void): void {
    if (notesSubscription) {
        supabase.removeChannel(notesSubscription);
    }

    notesSubscription = supabase
        .channel(`notes:${userId}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'notes', filter: `userId=eq.${userId}` },
            callback
        )
        .on('presence', { event: 'sync' }, () => {
            const state = notesSubscription?.presenceState();
            console.log('Presence state:', state);
        })
        .subscribe();
}

export function unsubscribeFromNotes(supabase: SupabaseClient): void {
    if (notesSubscription) {
        supabase.removeChannel(notesSubscription);
    }
}

export async function createNote(supabase: SupabaseClient, newNote: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<Note | null> {
    const { data, error } = await supabase
        .from('notes')
        .insert(newNote)
        .select('*');

    if (error) {
        console.error('Error creating note:', error);
        return null;
    }

    return data ? data[0] : null;
}

export async function updateNote(supabase: SupabaseClient, updatedNote: Partial<Note> & { id: string }): Promise<Note | null> {
    const { data, error } = await supabase
        .from('notes')
        .update(updatedNote)
        .eq('id', updatedNote.id)
        .select('*');

    if (error) {
        console.error('Error updating note:', error);
        return null;
    }

    return data ? data[0] : null;
}

export async function moveToTrash(supabase: SupabaseClient, noteId: string): Promise<Note | null> {
    return updateNote(supabase, { id: noteId, deleted: true });
}

export async function restoreNote(supabase: SupabaseClient, noteId: string): Promise<Note | null> {
    return updateNote(supabase, { id: noteId, deleted: false });
}

export async function deletePermanently(supabase: SupabaseClient, noteId: string): Promise<void> {
    const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

    if (error) {
        console.error('Error deleting note permanently:', error);
    }
}

export async function getDeletedNotes(supabase: SupabaseClient, userId: string): Promise<Note[]> {
    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('userId', userId)
        .eq('deleted', true);

    if (error) {
        console.error('Error fetching deleted notes:', error);
        return [];
    }

    return data as Note[];
}

export async function restoreAllNotes(supabase: SupabaseClient, userId: string): Promise<number> {
    const { data, error } = await supabase
        .from('notes')
        .update({ deleted: false })
        .eq('userId', userId)
        .eq('deleted', true)
        .select('id');

    if (error) {
        console.error('Error restoring all notes:', error);
        return 0;
    }

    return data ? data.length : 0;
}

export async function emptyTrash(supabase: SupabaseClient, userId: string): Promise<void> {
    const { error } = await supabase
        .from('notes')
        .delete()
        .eq('userId', userId)
        .eq('deleted', true);

    if (error) {
        console.error('Error emptying trash:', error);
    }
}

export function getNotesChronologicalOrder(notes: Note[]): Note[] {
    return [...notes].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export function getNotesAntiChronologicalOrder(notes: Note[]): Note[] {
    return [...notes].sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
}

export function getLastCreatedNote(notes: Note[]): Note | undefined {
    return notes.reduce((latest, current) =>
        new Date(current.created_at) > new Date(latest.created_at) ? current : latest
    );
}
