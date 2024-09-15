import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface Note {
    fileName: string;
    content: string;
}

function createNotesStore() {
    const storedNotes = browser ? localStorage.getItem('notes') : null;
    const initialNotes: Note[] = storedNotes ? JSON.parse(storedNotes) : [];

    const { subscribe, set, update } = writable<Note[]>(initialNotes);

    return {
        subscribe,
        set: (notes: Note[]) => {
            if (browser) {
                localStorage.setItem('notes', JSON.stringify(notes));
            }
            set(notes);
        },
        addNote: (note: Note) => update(notes => {
            const updatedNotes = [...notes, note];
            if (browser) {
                localStorage.setItem('notes', JSON.stringify(updatedNotes));
            }
            return updatedNotes;
        }),
        updateNote: (fileName: string, content: string) => update(notes => {
            const updatedNotes = notes.map(note =>
                note.fileName === fileName ? { ...note, content } : note
            );
            if (browser) {
                localStorage.setItem('notes', JSON.stringify(updatedNotes));
            }
            return updatedNotes;
        }),
        deleteNote: (fileName: string) => update(notes => {
            const updatedNotes = notes.filter(note => note.fileName !== fileName);
            if (browser) {
                localStorage.setItem('notes', JSON.stringify(updatedNotes));
            }
            return updatedNotes;
        })
    };
}

export const notes = createNotesStore();
