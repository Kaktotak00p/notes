<script lang="ts">
	import Page from '$lib/components/ui/pages/page.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { onMount, onDestroy } from 'svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Tag, Ellipsis, Trash, RotateCcw } from 'lucide-svelte';
	import { marked } from 'marked';
	import { toast } from 'svelte-sonner';
	import { writable } from 'svelte/store';
	import * as notesApi from '$lib/supabase/notesApi';
	import * as categoriesApi from '$lib/supabase/categoriesApi';
	import type { SupabaseClient, Session } from '@supabase/supabase-js';

	export let data: {
		supabase: SupabaseClient;
		session: Session;
	};

	const deletedNotes = writable<notesApi.Note[]>([]);
	const categories = writable<categoriesApi.Category[]>([]);
	let selected: notesApi.Note | null = null;

	let restoreDialogOpen: boolean = false;
	let deleteDialogOpen: boolean = false;

	onMount(async () => {
		if (data.session.user) {
			const fetchedNotes = await notesApi.fetchNotes(data.supabase, data.session.user.id);
			deletedNotes.set(fetchedNotes.filter((note) => note.deleted));
			const fetchedCategories = await categoriesApi.fetchCategories(
				data.supabase,
				data.session.user.id
			);
			categories.set(fetchedCategories);
			notesApi.subscribeToNotes(data.supabase, data.session.user.id, handleRealtimeUpdate);
		}
	});

	onDestroy(() => {
		notesApi.unsubscribeFromNotes(data.supabase);
	});

	function handleRealtimeUpdate(payload: any) {
		const { eventType, new: newRecord, old: oldRecord } = payload;
		deletedNotes.update((currentNotes) => {
			switch (eventType) {
				case 'INSERT':
					return newRecord.deleted ? [newRecord, ...currentNotes] : currentNotes;
				case 'UPDATE':
					if (newRecord.deleted) {
						return currentNotes.map((note) => (note.id === newRecord.id ? newRecord : note));
					} else {
						return currentNotes.filter((note) => note.id !== newRecord.id);
					}
				case 'DELETE':
					return currentNotes.filter((note) => note.id !== oldRecord.id);
				default:
					return currentNotes;
			}
		});
	}

	function parseMarkdown(content: string): string {
		return marked(content) as string;
	}

	async function restoreAllNotes() {
		if ($deletedNotes.length === 0) {
			toast.error('No notes to restore');
			restoreDialogOpen = false;
			return;
		}

		try {
			for (const note of $deletedNotes) {
				await notesApi.updateNote(data.supabase, { ...note, deleted: false });
			}
			deletedNotes.set([]);
			restoreDialogOpen = false;
			selected = null;
			toast.success('All notes restored');
		} catch (error) {
			console.error('Error restoring all notes:', error);
			toast.error('Failed to restore all notes');
		}
	}

	async function emptyTrash() {
		if ($deletedNotes.length === 0) {
			toast.error('No notes to delete');
			deleteDialogOpen = false;
			return;
		}

		try {
			for (const note of $deletedNotes) {
				await notesApi.deletePermanently(data.supabase, note.id);
			}
			deletedNotes.set([]);
			deleteDialogOpen = false;
			selected = null;
			toast.success('Trash emptied');
		} catch (error) {
			console.error('Error emptying trash:', error);
			toast.error('Failed to empty trash');
		}
	}

	async function restoreNote(noteId: string | undefined) {
		if (!noteId) return;

		try {
			const noteToRestore = $deletedNotes.find((note) => note.id === noteId);
			if (noteToRestore) {
				await notesApi.updateNote(data.supabase, { ...noteToRestore, deleted: false });
				deletedNotes.update((notes) => notes.filter((note) => note.id !== noteId));
				selected = null;
				toast.success('Note restored');
			}
		} catch (error) {
			console.error('Error restoring note:', error);
			toast.error('Failed to restore note');
		}
	}

	async function deleteNote(noteId: string) {
		try {
			await notesApi.deletePermanently(data.supabase, noteId);
			deletedNotes.update((notes) => notes.filter((note) => note.id !== noteId));
			selected = null;
			toast.success('Note permanently deleted');
		} catch (error) {
			console.error('Error deleting note:', error);
			toast.error('Failed to delete note');
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString();
	}
</script>

<Page title="Trash">
	<div slot="filter-bar" class="flex items-center justify-between w-full">
		<p class="text-sm text-primary/40">{$deletedNotes.length} notes</p>

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
			{#each $deletedNotes as note (note.id)}
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
