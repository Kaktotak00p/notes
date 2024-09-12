<script>
  import { onMount } from 'svelte';

  let notes = [];
  let newNote = '';

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

  async function addNote() {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: newNote })
    });
    if (res.ok) {
      newNote = '';
      fetchNotes();
    } else {
      alert('Failed to add note');
    }
  }

  onMount(fetchNotes);
</script>

<ul>
  {#each notes as note}
    <li>{note.content} - by {note.user}</li>
  {/each}
</ul>

<input type="text" placeholder="New note" bind:value={newNote} />
<button on:click={addNote}>Add Note</button>

