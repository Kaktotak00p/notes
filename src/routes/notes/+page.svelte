<script lang="ts">
	import { onMount } from 'svelte';
	import { marked } from 'marked'; // Import the Markdown parser

	interface Note {
		fileName: string;
		content: string;
	}

	let notes: Note[] = [];
	let selectedNote: Note | null = null;
	let noteContent = '';
	let parsedContent = '';
	let isEditing = false; // New variable to track if the user is in editing mode
	let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
	let newNoteName = '';

	// Fetch the list of notes
	async function fetchNotes() {
		const token = localStorage.getItem('token');
		const res = await fetch('/api/notes', {
			headers: { Authorization: `Bearer ${token}` }
		});
		if (res.ok) {
			notes = await res.json();
		} else {
			alert('Failed to fetch notes');
		}
	}

	// Load the selected note content
	async function loadNoteContent(note: Note) {
		selectedNote = note;
		noteContent = note.content;
		parsedContent = await parseMarkdown(noteContent); // Parse markdown on load
		isEditing = false; // Open in viewing mode
		if (autoSaveTimer) clearTimeout(autoSaveTimer);
	}

	// Parse markdown text into HTML
	async function parseMarkdown(content: string): Promise<string> {
		return await marked.parseInline(content);
	}

	// Auto-save functionality to save the note 5 seconds after the user stops typing
	function startAutoSave() {
		if (autoSaveTimer) clearTimeout(autoSaveTimer);
		autoSaveTimer = setTimeout(saveNote, 5000); // Save after 5 seconds of inactivity
	}

	// Save the currently selected note and switch back to preview mode
	async function saveNote() {
		if (!selectedNote) return;

		const token = localStorage.getItem('token');
		const res = await fetch('/api/notes', {
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ fileName: selectedNote.fileName, content: noteContent })
		});

		if (res.ok) {
			parsedContent = await parseMarkdown(noteContent); // Re-parse the content after saving
			isEditing = false; // Switch back to viewing mode
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
				Authorization: `Bearer ${token}`,
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

	// Update the note content and apply the markdown parsing in real-time
	async function updateContent(event: any) {
		noteContent = event.target.value;
		parsedContent = await parseMarkdown(noteContent); // Parse markdown as user types
		startAutoSave();
	}

	// Switch to editing mode when the user interacts with the preview
	function switchToEditing() {
		isEditing = true;
	}

	onMount(fetchNotes);
</script>

<div class="container">
	<div class="notes-list">
		<h3>Notes</h3>
		<input type="text" placeholder="New note" bind:value={newNoteName} />
		<button on:click={addNote}>Add Note</button>
		<ul>
			{#each notes as note}
				<li class="note-item">
					<button
						class={selectedNote && selectedNote.fileName === note.fileName ? 'active' : ''}
						on:click={() => loadNoteContent(note)}
					>
						{note.fileName}
					</button>
				</li>
			{/each}
		</ul>
	</div>

	<div class="editor">
		{#if selectedNote}
			<!-- Show the editing area if in editing mode -->
			{#if isEditing}
				<textarea class="note-input" bind:value={noteContent} on:input={updateContent}></textarea>
			{:else}
				<!-- Otherwise show the preview and switch to editing when the user interacts -->
				<button class="note-preview" on:click={switchToEditing}>
					{@html parsedContent}
				</button>
			{/if}
		{:else}
			<p>Select a note to edit</p>
		{/if}
	</div>
</div>

<style>
	@import './notes.css';
</style>
