<script lang="ts">
	import Page from '$lib/components/ui/pages/page.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { onMount } from 'svelte';
	import { notes } from '$lib/stores';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Dialog from '$lib/components/ui/dialog';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { Note } from '$lib/stores/notes';
	import { Tag } from 'lucide-svelte';
	import { selectedNote } from '$lib/stores/notes';
	import { Ellipsis, Trash } from 'lucide-svelte';
	import { marked } from 'marked';
	import { onDestroy } from 'svelte';
	import { categories } from '$lib/stores';
	import { toast } from 'svelte-sonner';
	import { RotateCcw } from 'lucide-svelte';

	export let data;

	let deletedNotes: Note[] = [];
	let selected: Note | null = null;

	let restoreDialogOpen: boolean = false;
	let deleteDialogOpen: boolean = false;

	let unsubscribe: () => void;

	onMount(async () => {
		await notes.initialize(data.supabase);
		deletedNotes = await notes.getDeletedNotes();

		unsubscribe = notes.subscribe(async ($notes) => {
			deletedNotes = await notes.getDeletedNotes();
		});
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	function parseMarkdown(content: string): string {
		console.log(content);
		const markedContent = marked(content) as string;
		console.log(markedContent);
		return markedContent;
	}

	async function restoreAllNotes() {
		// Return if there are no notes
		if (deletedNotes.length === 0) {
			toast.error('No notes to restore');
			restoreDialogOpen = false;
			return;
		}

		try {
			await notes.restoreAllNotes();
			deletedNotes = [];
			restoreDialogOpen = false;
			selected = null;
		} catch (error) {
			console.error('Error restoring all notes:', error);
			// You might want to add some error handling or user feedback here
		}
	}

	async function emptyTrash() {
		// Return if there are no notes
		if (deletedNotes.length === 0) {
			toast.error('No notes to delete');
			deleteDialogOpen = false;
			return;
		}

		try {
			await notes.emptyTrash();
			deletedNotes = [];
			deleteDialogOpen = false;
			selected = null;
		} catch (error) {
			console.error('Error emptying trash:', error);
			// You might want to add some error handling or user feedback here
		}
	}

	async function restoreNote(noteId: string | undefined) {
		if (!noteId) {
			return;
		}

		try {
			await notes.restoreNote(noteId);
			deletedNotes = deletedNotes.filter((note) => note.id !== noteId);
			selected = null;
		} catch (error) {
			console.error('Error restoring note:', error);
		}
	}

	async function deleteNote(noteId: string) {
		try {
			await notes.deletePermanently(noteId);
			deletedNotes = deletedNotes.filter((note) => note.id !== noteId);
			selected = null;
		} catch (error) {
			console.error('Error deleting note:', error);
		}
	}

	function formatDate(date: string) {
		const dateObj = new Date(date);
		return dateObj.toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<Page title="Trash">
	<div slot="filter-bar" class="flex items-center justify-between w-full">
		<p class="text-sm text-primary/40">{deletedNotes.length} notes</p>

		<!-- Action buttons -->
		<div class="flex items-center gap-2">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					<Button variant="ghost" size="icon">
						<Ellipsis class="w-4 h-4"></Ellipsis>
					</Button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					<DropdownMenu.Group>
						<DropdownMenu.Label>Manage Trash</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item
							on:click={() => {
								restoreDialogOpen = true;
							}}>Restore all notes</DropdownMenu.Item
						>
						<DropdownMenu.Item
							on:click={() => {
								deleteDialogOpen = true;
							}}>Empty Trash</DropdownMenu.Item
						>
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<!-- Restore all notes -->
			<AlertDialog.Root bind:open={restoreDialogOpen}>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Restore all notes</AlertDialog.Title>
						<AlertDialog.Description>
							This will restore all notes in the trash.
						</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<AlertDialog.Action on:click={() => restoreAllNotes()}>Continue</AlertDialog.Action>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>

			<!-- Empty trash -->
			<AlertDialog.Root bind:open={deleteDialogOpen}>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
						<AlertDialog.Description>
							This action cannot be undone. This will permanently delete this all notes in the
							trash.
						</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<AlertDialog.Action on:click={() => emptyTrash()}>Continue</AlertDialog.Action>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
		</div>
	</div>

	<!-- Navigator -->
	<div slot="navigator" class="w-full">
		<!-- Notes list -->
		<div class="flex flex-col w-full h-full gap-2 overflow-y-scroll">
			{#each deletedNotes as note (note.id)}
				<button
					class="flex flex-col w-full px-6 py-8 border rounded-md h-28 hover:bg-gray-100/80 {selected &&
					note.id === selected.id
						? 'bg-gray-100'
						: 'bg-white'}"
					on:click={() => {
						// Set selected
						console.log('Set selected: ', note.id);
						selected = note;
					}}
				>
					<p class="text-sm font-normal">{note.fileName}</p>
					<div class="flex w-full gap-2">
						<p class="text-sm font-normal text-primary/40">{formatDate(note.updated_at)}</p>
					</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- Note Content -->

	<div slot="content" class="flex flex-col items-start justify-start h-full px-4 pt-4">
		{#if selected}
			<div class="flex flex-col w-full h-full gap-8">
				<!-- Action bar -->
				<div class="flex flex-col gap-2">
					<div class="flex justify-between w-full">
						<!-- Category display -->
						{#key selected.categoryid}
							<Button disabled class="flex items-center gap-2" variant="outline">
								<Tag class="w-4 h-4"></Tag>
								{$categories.find((c) => selected && c.id === selected.categoryid)?.category ??
									'Uncategorized'}
							</Button>
						{/key}

						<div class="flex gap-2">
							<!-- Restore button -->
							<Button variant="outline" on:click={() => restoreNote(selected?.id)}>
								<RotateCcw class="w-4 h-4 mr-4" /> Restore
							</Button>

							<!-- Delete button -->
							<AlertDialog.Root>
								<AlertDialog.Trigger>
									<Button size="icon" variant="destructive"><Trash class="w-4 h-4"></Trash></Button>
								</AlertDialog.Trigger>
								<AlertDialog.Content>
									<AlertDialog.Header>
										<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
										<AlertDialog.Description>
											This will delete this note permanently. This action cannot be undone.
										</AlertDialog.Description>
									</AlertDialog.Header>
									<AlertDialog.Footer>
										<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
										<AlertDialog.Action
											on:click={() => {
												// TODO Delete note
												if (selected) deleteNote(selected.id);
											}}>Continue</AlertDialog.Action
										>
									</AlertDialog.Footer>
								</AlertDialog.Content>
							</AlertDialog.Root>
						</div>
					</div>
					<p class="text-sm text-primary/40">
						Last edited on {formatDate(selected.updated_at)}
					</p>
				</div>

				<div class="flex flex-col w-full h-full gap-8 px-8 pt-4">
					<!-- Title -->
					<p class="text-2xl font-semibold bg-transparent border-none outline-none focus:ring-0">
						{selected.fileName}
					</p>

					<!-- Text area -->
					<div class="flex w-full h-full text-left">
						<div class="flex flex-col w-full h-full prose-sm prose max-w-none">
							<div
								class="note-preview [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-2.5 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-2 [&>ul]:list-disc [&>ul]:ml-5 [&>ol]:list-decimal [&>ol]:ml-5 [&>img]:max-w-full [&>img]:h-auto [&>img]:my-2.5"
							>
								{@html parseMarkdown(selected.content)}
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</Page>
