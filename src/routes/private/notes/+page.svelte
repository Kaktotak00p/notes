<script lang="ts">
	import { Page } from '$lib/components/ui/pages';
	import { marked } from 'marked'; // Import the Markdown parser
	import { notes, type Note, selectedNote } from '$lib/stores/notes';
	import { Textarea } from '$lib/components/ui/textarea';
	import { toast } from 'svelte-sonner';

	let isEditing: boolean = true;
	let noteContent = '';
	let parsedContent = '';
	let fileName = '';
	let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

	$: loadNoteContent($selectedNote);

	// Update the note content and apply the markdown parsing in real-time
	function updateContent(event: any) {
		noteContent = event.target.value;
		parsedContent = parseMarkdown(noteContent); // Parse markdown as user types
		startAutoSave();
	}

	// Parse markdown text into HTML
	function parseMarkdown(content: string): string {
		return marked(content) as string;
	}

	// Switch to editing mode when the user interacts with the preview
	function switchToEditing() {
		isEditing = true;
	}

	// Reset viewed content
	function resetViewedContent() {
		$selectedNote = null;
		noteContent = '';
		parsedContent = '';
		isEditing = false;
	}

	// Load the selected note content
	async function loadNoteContent(note: Note | null) {
		if (note) {
			noteContent = note.content;
			parsedContent = parseMarkdown(note.content);
			fileName = note.fileName;
			isEditing = false;
			if (autoSaveTimer) clearTimeout(autoSaveTimer);
		} else {
			noteContent = '';
			parsedContent = '';
			fileName = '';
		}
	}

	// Auto-save functionality to save the note 5 seconds after the user stops typing
	function startAutoSave() {
		if (autoSaveTimer) clearTimeout(autoSaveTimer);
		autoSaveTimer = setTimeout(saveNote, 5000); // Save after 5 seconds of inactivity
	}

	// Save the currently selected note and switch back to preview mode
	async function saveNote() {
		if (!$selectedNote) {
			toast.error('No note selected');
			return;
		}

		// Extract note data from the store
		const noteData = $selectedNote;
		noteData.content = noteContent;
		noteData.fileName = fileName;

		// Save or update note in store
		notes.updateNote(noteData);

		loadNoteContent(noteData);
		toast.success('Note saved');
	}

	// Delete a note
	async function deleteNote(fileName: string) {
		if (!$selectedNote) {
			toast.error('No note selected');
			return;
		}

		notes.moveToTrash($selectedNote.id);
		resetViewedContent();
		toast.success('Note deleted');
	}

	function formatDate(date: string) {
		const dateObj = new Date(date);
		return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
</script>

<Page title="Notes">
	<div slot="filter-bar">
		<p class="text-sm text-primary/40">{$notes.length} notes</p>
	</div>
	<div slot="navigator" class="w-full">
		<!-- Notes list -->
		<div class="flex flex-col w-full h-full gap-2 overflow-y-scroll">
			{#each $notes as note}
				<button
					class="flex flex-col w-full px-6 py-8 bg-white border rounded-md h-28 hover:bg-gray-100"
				>
					<p class="text-sm font-normal">{note.fileName}</p>
					<p class="text-sm font-normal text-primary/40">{formatDate(note.created_at)}</p>
				</button>
			{/each}
		</div>
	</div>

	<!-- Note Content -->
	<div slot="content" class="flex flex-col items-start justify-start h-full">
		{#if isEditing}
			<Textarea
				class="w-full h-full border-none outline outline-muted-foreground/20 p-2.5 bg-muted text-black text-base resize-none focus-visible:outline-primary/20"
				bind:value={noteContent}
				on:input={updateContent}
			/>
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
</Page>
