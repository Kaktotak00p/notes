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

export interface NoteStore {
    subscribe: (run: (value: Note[]) => void) => () => void;
    initialize: (supabaseClient: SupabaseClient) => Promise<void>;
    fetchNotes: (userId: string) => Promise<void>;
    createNote: (newNote: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => Promise<Note | null>;
    subscribeToRealtimeNotes: (userId: string) => void;
    unsubscribeFromRealtimeNotes: () => void;
    getDeletedNotes: () => Promise<Note[]>;
    updateNote: (updatedNote: Note) => Promise<Note | null>;
    moveToTrash: (noteId: string) => Promise<Note | null>;
    deletePermanently: (noteId: string) => Promise<void>;
    restoreNote: (noteId: string) => Promise<Note | null>;
    restoreAllNotes: () => Promise<number>;
    emptyTrash: () => Promise<void>;
    getLastCreatedNote: () => Note | undefined;
    getNotesChronologicalOrder: () => Note[];
    getNotesAntiChronologicalOrder: () => Note[];
}

export function createNotesStore(): NoteStore {
    const { subscribe, set, update } = writable<Note[]>([]);

    let notesSubscription: RealtimeChannel | null = null;
    let supabase: SupabaseClient;

    async function initialize(supabaseClient: SupabaseClient) {
        supabase = supabaseClient;
        const { data } = await supabase.auth.getUser();
        if (data && data.user) {
            await fetchNotes(data.user.id);  // Wait for notes to be fetched
            await subscribeToRealtimeNotes(data.user.id);
        } else {
            console.log("Initializing without user")
        }
    }

    // Function to fetch notes
    async function fetchNotes(userId: string): Promise<void> {
        console.log('Fetching notes for user:', userId);
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('userId', userId)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching notes:', error);
        } else {
            set(data || []);
        }
    }

    // Function to start real-time syncing
    function subscribeToRealtimeNotes(userId: string): void {
        console.log('Subscribing to real-time notes for user:', userId);
        if (notesSubscription) {
            console.log('Removing existing subscription');
            supabase.removeChannel(notesSubscription);
        }
        notesSubscription = supabase
            .channel('public:notes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notes', filter: `userId=eq.${userId}` },
                payload => {
                    console.log('Received real-time update for notes:', payload);
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
            .subscribe((status) => {
                console.log('Subscription status:', status);
            });
    }

    // Function to stop real-time syncing
    function unsubscribeFromRealtimeNotes(): void {
        if (notesSubscription) {
            supabase.removeChannel(notesSubscription);
        }
    }


    // Function to get notes in chronological order
    function getNotesChronologicalOrder(): Note[] {
        const notes = get({ subscribe });
        return notes.sort((a, b) => {
            // Sort by updated_at in descending order (most recent first)
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
    }

    // Function to get notes in anti-chronological order
    function getNotesAntiChronologicalOrder(): Note[] {
        const notes = get({ subscribe });
        return notes.sort((a, b) => {
            // Sort by updated_at in ascending order (oldest first)
            return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        });
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
        const notes = get({ subscribe });
        if (notes.length === 0) {
            console.log("No notes found");
            return undefined;
        }

        const lastNote = notes.reduce((latest, current) =>
            new Date(current.created_at) > new Date(latest.created_at) ? current : latest
        );
        console.log("Last created note: ", lastNote);
        return lastNote;
    }

    // Function to restore all notes
    async function restoreAllNotes(): Promise<number> {
        const { data, error } = await supabase
            .from('notes')
            .update({ deleted: false })
            .eq('deleted', true)
            .select('id');  // We only need to select the id to count the number of affected rows

        if (error) {
            console.error('Error restoring all notes:', error);
            return 0;
        } else {
            const restoredCount = data ? data.length : 0;
            console.log(`Restored ${restoredCount} notes`);
        }

        return data ? data.length : 0;
    }

    // Function to empty the trash
    async function emptyTrash(): Promise<void> {
        const { data, error } = await supabase
            .from('notes')
            .delete()
            .eq('deleted', true);

        if (error) {
            console.error('Error emptying trash:', error);
        } else {
            console.log('Emptied trash:', data);
        }
    }

    // Function to restore a note
    async function restoreNote(noteId: string): Promise<Note | null> {
        const { data, error } = await supabase
            .from('notes')
            .update({ deleted: false })
            .eq('id', noteId)
            .select('*');

        if (error) {
            console.error('Error restoring note:', error);
            return null;
        } else {
            console.log('Restored note:', data);
            return data ? data[0] : null;
        }
    }

    // Function to retrieve all deleted notes
    async function getDeletedNotes(): Promise<Note[]> {
        return get({ subscribe }).filter(note => note.deleted);
    }

    return {
        subscribe,
        initialize,
        fetchNotes,
        createNote,
        getDeletedNotes,
        restoreNote,
        restoreAllNotes,
        emptyTrash,
        subscribeToRealtimeNotes,
        unsubscribeFromRealtimeNotes,
        updateNote,
        moveToTrash,
        deletePermanently,
        getLastCreatedNote,
        getNotesChronologicalOrder,
        getNotesAntiChronologicalOrder
    };
}

// Create a writable store for the selected note
export const selectedNote = writable<Note | null>(null);


