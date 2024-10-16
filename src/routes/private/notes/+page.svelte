<script lang="ts">
	import { onDestroy } from 'svelte';
	import { derived } from 'svelte/store';
	import { Page } from '$lib/components/ui/pages';
	import { marked } from 'marked'; // Import the Markdown parser
	import { notes, type Note, selectedNote } from '$lib/stores/notes';
	import { categories } from '$lib/stores/categories';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Select from '$lib/components/ui/select';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { Trash, Ellipsis, Check } from 'lucide-svelte';
	import { page } from '$app/stores';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Badge } from '$lib/components/ui/badge';
	import type { Session, SupabaseClient } from '@supabase/supabase-js';
	import { enhance } from '$app/forms';

	export let data: {
		session: Session;
		supabase: SupabaseClient;
	};

	let notesList: Note[] = [];
	let isEditing: boolean = true;
	let noteContent = '';
	let parsedContent = '';
	let fileName = '';
	let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
	let textareaRef: any;
	let categoryDialogOpen: boolean = false;
	let newCategoryName: string = '';

	// Get the categoryid from the URL
	$: categoryId = $page.url.searchParams.get('categoryid');
	$: categoryName =
		categoryId === 'uncategorized'
			? 'Uncategorized'
			: categoryId
				? $categories.find((c) => c.id === categoryId)?.category
				: 'All Notes';
	$: newCategoryName = categoryName ?? '';

	// Filter notes based on the selected category
	$: filteredNotes = derived([notes, categories], ([$notes, $categories]) => {
		if (!categoryId) return $notes;
		if (categoryId === 'uncategorized') {
			return $notes.filter((note) => !note.categoryid);
		}
		return $notes.filter((note) => note.categoryid === categoryId);
	});

	// Update notesList when filteredNotes changes
	$: {
		filteredNotes.subscribe((value) => {
			notesList = value;
		});
	}

	$: loadNoteContent($selectedNote);

	// Create a derived store for the selected category
	const unsubscribe = notes.subscribe((value) => {
		notesList = value;
	});

	onDestroy(unsubscribe);

	// Category renaming
	function handleCategoryRename(result: { type: string; data?: any }) {
		console.log(result);
		if (result.type === 'failure') {
			console.error(result.data?.error);
			toast.error(result.data?.error || 'An error occurred');
		} else {
			console.log('success');
			if (result.data?.success) {
				categoryDialogOpen = false;
				toast.success(`Category renamed!`);
				// The store should update automatically due to realtime subscription
			} else {
				let error = result.data?.error || 'An error occurred';
				toast.error(error);
			}
		}
	}

	// Update the note content and apply the markdown parsing in real-time
	function updateContent(event: any) {
		noteContent = event.target.value;
		parsedContent = parseMarkdown(noteContent); // Parse markdown as user types
		startAutoSave();
	}

	// Add a new note
	async function addNote(categoryid: string | null) {
		const newNote: Omit<Note, 'id' | 'created_at' | 'updated_at'> = {
			userId: data.session.user.id,
			fileName: 'New Note',
			content: '',
			categoryid: categoryid === 'uncategorized' ? null : categoryid,
			deleted: false
		};
		const supabaseNote = await notes.createNote(newNote);

		// Get back supabase note id
		console.log('Supabase note: ', supabaseNote);
		if (supabaseNote) {
			selectedNote.set(supabaseNote);
			toast.success('Note created');
		} else {
			toast.error('Error creating note');
			return;
		}
	}

	// Parse markdown text into HTML
	function parseMarkdown(content: string): string {
		return marked(content) as string;
	}

	// Switch to editing mode when the user interacts with the preview
	function switchToEditing() {
		isEditing = true;

		// After switching to editing mode, focus on the textarea
		setTimeout(() => {
			textareaRef?.focus();
		}, 0);
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

		// Check if there are changes before saving
		if ($selectedNote.content === noteContent && $selectedNote.fileName === fileName) {
			console.log('No changes detected, skipping save');
			loadNoteContent($selectedNote);
			return;
		}

		// Extract note data from the store
		const noteData = $selectedNote;
		noteData.content = noteContent;
		noteData.fileName = fileName;

		// Save or update note in store
		notes.updateNote(noteData);

		loadNoteContent(noteData);
		// toast.success('Note saved');
	}

	// Delete a note
	async function deleteNote(id: string) {
		if (!$selectedNote) {
			toast.error('No note selected');
			return;
		}

		notes.moveToTrash(id);
		resetViewedContent();
		toast.success('Note deleted');
	}

	function formatDate(date: string) {
		const dateObj = new Date(date);
		return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
</script>

<Page title={categoryName}>
	<div slot="filter-bar" class="flex items-center justify-between w-full">
		<p class="text-sm text-primary/40">{notesList.length} notes</p>

		<!-- Action buttons -->
		<div class="flex items-center gap-2">
			{#if categoryId}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<Button variant="ghost" size="icon">
							<Ellipsis class="w-4 h-4"></Ellipsis>
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						<DropdownMenu.Group>
							<DropdownMenu.Label>Category {categoryName}</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<DropdownMenu.Item
								on:click={() => {
									addNote(categoryId);
								}}>Add new note to {categoryName}</DropdownMenu.Item
							>
							{#if !(categoryId === 'uncategorized')}
								<DropdownMenu.Item
									on:click={() => {
										categoryDialogOpen = true;
									}}>Rename category</DropdownMenu.Item
								>
								<DropdownMenu.Item>Delete category</DropdownMenu.Item>
							{/if}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>

				<!-- Add Category -->
				<Dialog.Root bind:open={categoryDialogOpen}>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>Rename category</Dialog.Title>
							<Dialog.Description>
								Categories are useful for grouping notes around a common topic. They are private to
								you.
							</Dialog.Description>

							<form
								method="POST"
								action="?/renamecategory"
								class="flex flex-col w-full gap-2 pt-8"
								use:enhance={() => {
									return ({ result }) => {
										handleCategoryRename(result);
									};
								}}
							>
								<Label for="category-name" class="text-sm font-medium">Category name</Label>
								<input name="category-id" value={categoryId} hidden />
								<Input
									name="category-name"
									id="category-name"
									placeholder="Enter category name"
									bind:value={newCategoryName}
									required
								/>

								<div class="flex justify-end w-full pt-6">
									<Button type="submit"><Check class="w-4 h-4 mr-4"></Check> Save</Button>
								</div>
							</form>
						</Dialog.Header>
					</Dialog.Content>
				</Dialog.Root>
			{/if}
		</div>
	</div>
	<div slot="navigator" class="w-full">
		<!-- Notes list -->
		<div class="flex flex-col w-full h-full gap-2 overflow-y-scroll">
			{#each notesList as note (note.id)}
				<button
					class="flex flex-col w-full px-6 py-8 border rounded-md h-28 hover:bg-gray-100/80 {$selectedNote &&
					note.id === $selectedNote.id
						? 'bg-gray-100'
						: 'bg-white'}"
					on:click={() => {
						// Set selected
						console.log('Set selected: ', note.id);
						selectedNote.set(note);
					}}
				>
					<p class="text-sm font-normal">{note.fileName}</p>
					<div class="flex w-full gap-2">
						<p class="text-sm font-normal text-primary/40">{formatDate(note.updated_at)}</p>

						{#if !categoryId}
							{#if note.categoryid}
								{#await categories.getCategory(note.categoryid)}
									Loading...
								{:then category}
									<Badge class="rounded-sm" variant="secondary">
										{category?.category || 'Uncategorized'}
									</Badge>
								{/await}
							{/if}
						{/if}
					</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- Note Content -->

	<div slot="content" class="flex flex-col items-start justify-start h-full px-4 pt-4">
		{#key $selectedNote}
			{#if $selectedNote}
				<div class="flex flex-col w-full h-full gap-8">
					<!-- Action bar -->
					<div class="flex flex-col gap-2">
						<div class="flex justify-between w-full">
							<!-- Category picker -->
							{#key $selectedNote.categoryid}
								<Select.Root
									onSelectedChange={(v) => {
										if ($selectedNote && v && typeof v.value === 'string') {
											const updated = { ...$selectedNote, categoryid: v.value };
											notes.updateNote(updated);
											selectedNote.set(updated);
										}
									}}
									selected={$selectedNote.categoryid
										? { value: $selectedNote.categoryid }
										: undefined}
								>
									<Select.Trigger class="w-[180px]">
										{$categories.find((e) => e.id === $selectedNote?.categoryid)?.category ??
											'Choose a category'}
									</Select.Trigger>
									<Select.Content>
										{#each $categories as category}
											<Select.Item value={category.id}>{category.category}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							{/key}

							<div class="flex gap-2">
								<!-- Delete button -->
								<AlertDialog.Root>
									<AlertDialog.Trigger>
										<Button size="icon" variant="ghost"><Trash class="w-4 h-4"></Trash></Button>
									</AlertDialog.Trigger>
									<AlertDialog.Content>
										<AlertDialog.Header>
											<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
											<AlertDialog.Description>
												This will move the note into the trash. You can always restore the note from
												the trash, or you can delete it permantely.
											</AlertDialog.Description>
										</AlertDialog.Header>
										<AlertDialog.Footer>
											<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
											<AlertDialog.Action
												on:click={() => {
													// Delete note
													if ($selectedNote) deleteNote($selectedNote.id);
												}}>Continue</AlertDialog.Action
											>
										</AlertDialog.Footer>
									</AlertDialog.Content>
								</AlertDialog.Root>
							</div>
						</div>
						<p class="text-sm text-primary/40">
							Last edited on {formatDate($selectedNote.updated_at)}
						</p>
					</div>

					<div class="flex flex-col w-full h-full gap-8 px-8 pt-4">
						<!-- Title -->
						<input
							on:keyup={saveNote}
							on:abort={saveNote}
							on:focusout={saveNote}
							bind:value={fileName}
							class="text-2xl font-semibold bg-transparent border-none outline-none focus:ring-0"
						/>

						<!-- Text area -->
						{#if isEditing}
							<textarea
								bind:this={textareaRef}
								class="w-full h-full p-2.5 text-base resize-none bg-transparent border-none outline-none focus:ring-0 focus-visible:outline-none"
								bind:value={noteContent}
								on:input={updateContent}
								on:blur={() => {
									isEditing = false;
									saveNote();
								}}
							/>
						{:else}
							<button class="flex w-full h-full text-left" on:click={switchToEditing}>
								<div class="flex flex-col w-full h-full prose-sm prose max-w-none">
									<div
										class="note-preview [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-2.5 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-2 [&>ul]:list-disc [&>ul]:ml-5 [&>ol]:list-decimal [&>ol]:ml-5 [&>img]:max-w-full [&>img]:h-auto [&>img]:my-2.5"
									>
										{@html parsedContent}
									</div>
								</div>
							</button>
						{/if}
					</div>
				</div>
			{/if}
		{/key}
	</div>
</Page>
