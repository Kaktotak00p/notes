// src/stores/notesStore.ts
import { writable } from 'svelte/store';
import { supabase } from '$lib/database/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Define the shape of a note object
export interface Note {
    id: string;
    userId: string;
    fileName: string;
    content: string;
    category: string;
    created_at: string;
    deleted: boolean; // Add the deleted property
}

function createNotesStore() {
    const { subscribe, set, update } = writable<Note[]>([]);

    let notesSubscription: RealtimeChannel | null = null;

    // Function to fetch notes
    async function fetchNotes(userId: string): Promise<void> {
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
    async function createNote(newNote: Omit<Note, 'id' | 'created_at'>): Promise<void> {
        const { data, error } = await supabase
            .from('notes')
            .insert(newNote)
            .select('*');

        if (error) {
            console.error('Error creating note:', error);
        } else {
            // Add the newly created note to the store
            update(currentNotes => [...currentNotes, ...(data || [])]);
        }
    }


    // Function to update a note in Supabase and the store
    async function updateNote(updatedNote: Note): Promise<void> {
        const { data, error } = await supabase
            .from('notes')
            .update({
                fileName: updatedNote.fileName,
                content: updatedNote.content,
                category: updatedNote.category,
                deleted: updatedNote.deleted // Make sure the deleted field is updated
            })
            .eq('id', updatedNote.id)
            .select('*'); // Fetch the updated row

        if (error) {
            console.error('Error updating note:', error);
        } else {
            // Update the store after the database update
            update(currentNotes => currentNotes.map(note =>
                note.id === updatedNote.id ? (data ? data[0] : updatedNote) : note
            ));
        }
    }

    // Function to "move to trash" by setting "deleted" to true
    async function moveToTrash(noteId: string): Promise<void> {
        const { error } = await supabase
            .from('notes')
            .update({ deleted: true }) // Set the note as deleted
            .eq('id', noteId);

        if (error) {
            console.error('Error moving note to trash:', error);
        } else {
            // Remove the note from the store view (since we're not showing deleted notes)
            update(currentNotes => currentNotes.filter(note => note.id !== noteId));
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
            update(currentNotes => currentNotes.filter(note => note.id !== noteId));
        }
    }

    return {
        subscribe,
        fetchNotes,
        createNote,
        subscribeToRealtimeNotes,
        unsubscribeFromRealtimeNotes,
        updateNote, // Keep the update function
        moveToTrash, // Add the move to trash function
        deletePermanently // Add the permanent delete function
    };
}

export const notes = createNotesStore();
