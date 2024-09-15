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

<div class="flex flex-row h-screen bg-[#f0f0f0] text-black">
	<div class="w-[30%] bg-[#2d2d2d] pl-2.5 pt-5 text-white overflow-y-auto">
		<h3 class="mb-4">Notes</h3>
		<input
			type="text"
			placeholder="New note"
			bind:value={newNoteName}
			class="w-[60%] p-2.5 mb-1.25 bg-[#444] rounded text-white"
		/>
		<button
			on:click={addNote}
			class="w-full bg-[#8a2be2] text-white border-none rounded p-2.5 cursor-pointer text-base hover:bg-[#7a1fd1] mb-5"
			>Add Note</button
		>
		<ul>
			{#each notes as note}
				<li class="mb-1.25">
					<button
						class={`w-full p-2.5 rounded cursor-pointer ${
							selectedNote && selectedNote.fileName === note.fileName
								? 'bg-[#8a2be2]'
								: 'bg-[#444] hover:bg-[#555]'
						}`}
						on:click={() => loadNoteContent(note)}
					>
						{note.fileName}
					</button>
				</li>
			{/each}
		</ul>
	</div>

	<div
		class="w-[70%] mr-5 p-5 bg-white text-black border-l border-[#ccc] flex flex-col justify-between"
	>
		{#if selectedNote}
			{#if isEditing}
				<textarea
					class="w-full h-[calc(100%-50px)] border-none outline-none p-2.5 bg-[#f9f9f9] text-black text-base resize-none"
					bind:value={noteContent}
					on:input={updateContent}
				></textarea>
			{:else}
				<button class="text-left w-full h-full" on:click={switchToEditing}>
					<div class="prose prose-sm max-w-none">
						<div
							class="note-preview [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-2.5 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-2 [&>ul]:list-disc [&>ul]:ml-5 [&>ol]:list-decimal [&>ol]:ml-5 [&>img]:max-w-full [&>img]:h-auto [&>img]:my-2.5"
						>
							{@html parsedContent}
						</div>
					</div>
				</button>
			{/if}
		{:else}
			<p>Select a note to edit</p>
		{/if}
	</div>
</div>
