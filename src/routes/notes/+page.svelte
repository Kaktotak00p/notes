<script lang="ts">
	import { onMount } from 'svelte';
	import { marked } from 'marked'; // Import the Markdown parser
	import Input from '$lib/components/ui/input/input.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { logout } from '$lib/utils/auth';

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

<div class="flex flex-row h-screen">
	<!-- Sidebar -->
	<div class="w-[300px] pt-6 flex flex-col bg-primary justify-between">
		<div class="flex flex-col items-start">
			<!-- Header -->
			<div class="flex flex-col items-start gap-2 px-6">
				<h3 class="mb-4 text-4xl font-bold text-primary-foreground">Notes</h3>
				<Input
					type="text"
					placeholder="New note"
					bind:value={newNoteName}
					class="w-full rounded "
				/>
				<Button
					on:click={addNote}
					class="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/80"
					>Add Note</Button
				>
			</div>

			<!-- Notes List -->
			<ul class="flex flex-col mt-8 h-full overflow-y-scroll">
				{#each notes as note}
					<Separator class="my-0" />
					<li class="">
						<button
							class={`flex flex-row items-start w-full py-3 px-6 cursor-pointer ${
								selectedNote && selectedNote.fileName === note.fileName
									? 'bg-primary-foreground text-primary'
									: 'bg-primary hover:bg-primary-foreground/60'
							}`}
							on:click={() => loadNoteContent(note)}
						>
							<div class="prose prose-sm max-w-none w-full overflow-hidden">
								<p class="truncate text-left">{note.fileName}</p>
							</div>
						</button>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Logout -->
		<div class="flex items-center justify-center gap-2 py-4 flex-col">
			<Separator class="my-0 py-0" />
			<div class="flex flex-row items-center justify-center gap-2 w-full px-6">
				<Button
					class="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/80"
					on:click={logout}>Logout</Button
				>
			</div>
		</div>
	</div>

	<!-- Note Editor -->
	<div class="w-[70%] mr-5 p-5 bg-white text-black border-l flex flex-col justify-between">
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
