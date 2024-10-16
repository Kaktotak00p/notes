// src/stores/notesStore.ts
import { writable, get } from 'svelte/store';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

// Define the shape of a note object
export interface Note {
    id: string;
    userId: string;
    fileName: string;
    content: string;
    categoryid: string | null; // Matches the schema: can be null
    created_at: string;
    updated_at: string;
    deleted: boolean; // Matches the schema: soft deletion column
}

function createNotesStore() {
    const { subscribe, set, update } = writable<Note[]>([]);

    let notesSubscription: RealtimeChannel | null = null;
    let supabase: SupabaseClient;

    async function initialize(supabaseClient: SupabaseClient) {
        supabase = supabaseClient;
        const { data } = await supabase.auth.getUser();
        if (data && data.user) {
            fetchNotes(data.user.id);
            subscribeToRealtimeNotes(data.user.id);
        }
    }

    // Function to fetch notes
    async function fetchNotes(userId: string): Promise<void> {
        console.log('Fetching notes for user:', userId);
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('userId', userId)
            .eq('deleted', false); // Only fetch non-deleted notes

        if (error) {
            console.error('Error fetching notes:', error);
        } else {
            set(data || []);
        }
    }

    // Function to start real-time syncing
    function subscribeToRealtimeNotes(userId: string): void {
        console.log('Subscribing to real-time notes for user:', userId);
        notesSubscription = supabase
            .channel('public:notes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notes' },
                payload => {
                    update(currentNotes => {
                        switch (payload.eventType) {
                            case 'INSERT':
                                return [...currentNotes, payload.new as Note];
                            case 'UPDATE':
                                return currentNotes.map(note =>
                                    note.id === (payload.new as Note).id ? (payload.new as Note) : note
                                );
                            case 'DELETE':
                                return currentNotes.filter(note => note.id !== (payload.old as Note).id);
                            default:
                                return currentNotes;
                        }
                    });
                }
            )
            .subscribe();
    }

    // Function to stop real-time syncing
    function unsubscribeFromRealtimeNotes(): void {
        if (notesSubscription) {
            supabase.removeChannel(notesSubscription);
        }
    }

    // Function to create a new note
    async function createNote(newNote: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<Note | null> {
        const { data, error } = await supabase
            .from('notes')
            .insert(newNote)
            .select('*');

        if (error) {
            console.error('Error creating note:', error);
            return null;
        } else {
            return data ? data[0] : null;
        }
    }

    // Function to update a note in Supabase and the store
    async function updateNote(updatedNote: Note): Promise<Note | null> {
        const { data, error } = await supabase
            .from('notes')
            .update({
                fileName: updatedNote.fileName,
                content: updatedNote.content,
                categoryid: updatedNote.categoryid, // Update categoryid
                deleted: updatedNote.deleted // Update deleted field
            })
            .eq('id', updatedNote.id)
            .select('*'); // Fetch the updated row

        if (error) {
            console.error('Error updating note:', error);
            return null;
        } else {
            console.log('Updated note: ', updatedNote);
            return data ? data[0] : null;
        }
    }

    // Function to "move to trash" by setting "deleted" to true
    async function moveToTrash(noteId: string): Promise<Note | null> {
        const { data, error } = await supabase
            .from('notes')
            .update({ deleted: true }) // Set the note as deleted
            .eq('id', noteId);

        if (error) {
            console.error('Error moving note to trash:', error);
            return null;
        } else {
            // Remove the note from the store view (since we're not showing deleted notes)
            console.log('Moved note to trash');
            return data ? data[0] : null;
        }
    }

    // Function to delete a note permanently from Supabase
    async function deletePermanently(noteId: string): Promise<void> {
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', noteId);

        if (error) {
            console.error('Error deleting note permanently:', error);
        } else {
            // Remove the note from the store after deletion
            console.log("Note deleted permanently")
        }
    }

    // Function to get the last created note
    function getLastCreatedNote(): Note | undefined {
        return get({ subscribe }).sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
    }

    return {
        subscribe,
        initialize,
        fetchNotes,
        createNote,
        subscribeToRealtimeNotes,
        unsubscribeFromRealtimeNotes,
        updateNote,
        moveToTrash,
        deletePermanently,
        getLastCreatedNote // Add the new function to the returned object
    };
}

console.log("Initializing notes store");
export const notes = createNotesStore();


// Create a writable store for the selected note
export const selectedNote = writable<Note | null>(null);