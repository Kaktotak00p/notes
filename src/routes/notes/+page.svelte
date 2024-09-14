<script>
  import { onMount } from 'svelte';
  let notes = [];
  let selectedNote = null;
  let noteContent = '';
  let autoSaveTimer = null;
  let newNoteName = '';

  // Fetch the list of notes
  async function fetchNotes() {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/notes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      notes = await res.json();
    } else {
      alert('Failed to fetch notes');
    }
  }

  // Load the selected note content
  function loadNoteContent(note) {
    selectedNote = note;
    noteContent = note.content;
    clearTimeout(autoSaveTimer);
  }

  // Auto-save functionality to save the note 5 seconds after the user stops typing
  function startAutoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(saveNote, 5000); // Save after 5 seconds of inactivity
  }

  // Save the currently selected note
  async function saveNote() {
    if (!selectedNote) return;

    const token = localStorage.getItem('token');
    const res = await fetch('/api/notes', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileName: selectedNote.fileName, content: noteContent })
    });

    if (res.ok) {
      console.log('Note saved');
    } else {
      alert('Failed to save note');
    }
  }

  // Add a new note
  async function addNote() {
    if (!newNoteName) {
      alert('Please enter a name for the new note');
      return;
    }

    const token = localStorage.getItem('token');
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileName: newNoteName, content: '' }) // Empty content for a new note
    });
    if (res.ok) {
      newNoteName = ''; // Reset the input field
      fetchNotes(); // Refresh the notes list
    } else {
      const error = await res.json();
      alert(`Failed to add note: ${error.error}`);
    }
  }
  onMount(fetchNotes);
</script>

<div class="container">
  <div class="editor">
    {#if selectedNote}
      <textarea class="note-input" bind:value={noteContent} on:input={startAutoSave}></textarea>
    {:else}
      <p>Select a note to edit</p>
    {/if}
  </div>

  <div class="notes-list">
    <h3>Notes</h3>
    <input type="text" placeholder="New note" bind:value={newNoteName} />
    <button on:click={addNote}>Add Note</button>
    <ul>
      {#each notes as note}
        <li class="note-item" on:click={() => loadNoteContent(note)}>
          {note.fileName}
        </li>
      {/each}
    </ul>
  </div>
</div>

<style>
  @import './notes.css';
</style>

