<script lang="ts">
	import { onMount } from 'svelte';
	import { marked } from 'marked'; // Import the Markdown parser
	import Input from '$lib/components/ui/input/input.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { logout } from '$lib/utils/auth';
	import { Textarea } from '$lib/components/ui/textarea';
	import { X, Check, Trash } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { notes } from '$lib/stores/notes';

	interface Note {
		fileName: string;
		content: string;
	}

	let selectedNote: Note | null = null;
	let noteContent = '';
	let parsedContent = '';
	let isEditing = false; // New variable to track if the user is in editing mode
	let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
	let newNoteName = '';

	// Load the selected note content
	async function loadNoteContent(note: Note) {
		selectedNote = note;
		noteContent = note.content;
		parsedContent = parseMarkdown(noteContent); // Parse markdown on load
		isEditing = false; // Open in viewing mode
		if (autoSaveTimer) clearTimeout(autoSaveTimer);
	}

	// Parse markdown text into HTML
	function parseMarkdown(content: string): string {
		return marked(content) as string;
	}

	// Auto-save functionality to save the note 5 seconds after the user stops typing
	function startAutoSave() {
		if (autoSaveTimer) clearTimeout(autoSaveTimer);
		autoSaveTimer = setTimeout(saveNote, 5000); // Save after 5 seconds of inactivity
	}

	// Save the currently selected note and switch back to preview mode
	async function saveNote() {
		if (!selectedNote) {
			toast.error('No note selected');
			return;
		}

		// Save or update note in store
		notes.updateNote(selectedNote.fileName, noteContent);

		parsedContent = parseMarkdown(noteContent); // Re-parse the content after saving
		isEditing = false; // Switch back to viewing mode

		toast.success('Note saved');

		// const token = localStorage.getItem('token');
		// const res = await fetch('/api/notes', {
		// 	method: 'PUT',
		// 	headers: {
		// 		Authorization: `Bearer ${token}`,
		// 		'Content-Type': 'application/json'
		// 	},
		// 	body: JSON.stringify({ fileName: selectedNote.fileName, content: noteContent })
		// });

		// if (res.ok) {
		// 	parsedContent = parseMarkdown(noteContent); // Re-parse the content after saving
		// 	isEditing = false; // Switch back to viewing mode
		// 	toast.success('Note saved');
		// 	console.log('Note saved');
		// } else {
		// 	toast.error('Failed to save note');
		// 	alert('Failed to save note');
		// }
	}

	// Delete a note
	async function deleteNote(fileName: string) {
		notes.deleteNote(fileName);
		toast.success('Note deleted');
	}

	// Add a new note
	async function addNote() {
		if (!newNoteName) {
			toast.error('Please enter a name for the new note');
			return;
		}

		// check if note already exists
		if ($notes.some((note) => note.fileName === newNoteName)) {
			toast.error('Note already exists');
			return;
		} else {
			notes.addNote({ fileName: newNoteName, content: '' });

			// Open the new note
			loadNoteContent({ fileName: newNoteName, content: '' });
			newNoteName = '';
		}

		// const token = localStorage.getItem('token');
		// const res = await fetch('/api/notes', {
		// 	method: 'POST',
		// 	headers: {
		// 		Authorization: `Bearer ${token}`,
		// 		'Content-Type': 'application/json'
		// 	},
		// 	body: JSON.stringify({ fileName: newNoteName, content: '' }) // Empty content for a new note
		// });
		// if (res.ok) {
		// 	newNoteName = ''; // Reset the input field
		// 	// fetchNotes(); // Refresh the notes list
		// } else {
		// 	const error = await res.json();
		// 	alert(`Failed to add note: ${error.error}`);
		// }
	}

	// Update the note content and apply the markdown parsing in real-time
	function updateContent(event: any) {
		noteContent = event.target.value;
		parsedContent = parseMarkdown(noteContent); // Parse markdown as user types
		startAutoSave();
	}

	// Switch to editing mode when the user interacts with the preview
	function switchToEditing() {
		isEditing = true;
	}

	// onMount(() => {
	// 	if ($isAuthenticated) {

	// 		fetchNotes();
	// 	}
	// });
</script>

<div class="flex flex-row h-screen">
	<!-- Sidebar -->
	<div class="min-w-[300px] pt-6 flex flex-col bg-primary-foreground justify-between border-r">
		<div class="flex flex-col items-start">
			<!-- Header -->
			<div class="flex flex-col items-start w-full gap-2 px-6">
				<h3 class="mb-4 text-4xl font-bold text-primary">NoteNest</h3>
				<Input
					type="text"
					placeholder="New note"
					bind:value={newNoteName}
					class="w-full rounded "
				/>
				<Button on:click={addNote} class="w-full">Add Note</Button>
			</div>

			<!-- Notes List -->
			<ul class="flex flex-col w-full h-full mt-8 overflow-y-scroll">
				{#each $notes as note}
					<Separator class="my-0" />
					<li class="w-full">
						<button
							class={`flex flex-row w-full py-3 px-6 cursor-pointer overflow-hidden prose-sm prose max-w-none justify-between items-center text-left truncate ${
								selectedNote && selectedNote.fileName === note.fileName
									? 'bg-primary text-primary-foreground hover:bg-primary/20 hover:text-primary'
									: 'bg-primary-foreground text-primary hover:bg-primary/20'
							}`}
							on:click={() => loadNoteContent(note)}
						>
							{note.fileName}
							<Button variant="ghost" size="icon" on:click={() => deleteNote(note.fileName)}
								><Trash class="w-4 h-4"></Trash></Button
							>
						</button>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Logout -->
		<div class="flex flex-col items-center justify-center">
			<Separator class="py-0 my-0" />
			<div class="flex flex-row items-center justify-center w-full px-6 py-4">
				<Button class="w-full" on:click={logout}>Logout</Button>
			</div>
		</div>
	</div>

	<!-- Note Editor -->
	<div class="flex flex-col w-full gap-8 px-6 py-4 text-black bg-white">
		{#if selectedNote}
			<!-- Toolbar -->
			<div class="flex flex-row items-center justify-between">
				<Button class="" on:click={() => (selectedNote = null)}
					><X class="w-4 h-4 mr-4"></X> Close</Button
				>
				<Button class="" on:click={saveNote}><Check class="w-4 h-4 mr-4"></Check> Save</Button>
			</div>

			<!-- Note Content -->
			<div class="flex flex-col items-start justify-start h-full">
				{#if isEditing}
					<Textarea
						class="w-full h-full border-none outline outline-muted-foreground/20 p-2.5 bg-muted text-black text-base resize-none focus-visible:outline-primary/20"
						bind:value={noteContent}
						on:input={updateContent}
					></Textarea>
				{:else}
					<button class="w-full h-full text-left" on:click={switchToEditing}>
						<div class="flex flex-col h-full prose-sm prose max-w-none">
							<div
								class="note-preview [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-2.5 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-2 [&>ul]:list-disc [&>ul]:ml-5 [&>ol]:list-decimal [&>ol]:ml-5 [&>img]:max-w-full [&>img]:h-auto [&>img]:my-2.5"
							>
								{@html parsedContent}
							</div>
						</div>
					</button>
				{/if}
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center h-full">
				<p class="text-primary-foreground">Select a note to edit</p>
			</div>
		{/if}
	</div>
</div>
