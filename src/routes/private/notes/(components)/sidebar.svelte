<script lang="ts">
	import Input from '$lib/components/ui/input/input.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import SidebarButton from './sidebar-button.svelte';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import {
		Trash,
		Menu,
		X,
		Notebook,
		CircleCheckBig,
		ChevronRight,
		Tag,
		House,
		Archive
	} from 'lucide-svelte';

	import type { Note } from '$lib/stores/notes';
	import { notes } from '$lib/stores/notes';
	import { tasks } from '$lib/stores/tasksOld';
	import { categories } from '$lib/stores/categories';
	import { goto } from '$app/navigation';

	export let email: string;
	export let selectedTab: string;

	export let addNote: (categoryid: string | null) => void;
	export let addTask: (content: string) => void;
	export let logout: () => void;

	// New variables for categories
	export let addCategory: () => void;
	export let assignCategory: (note: Note | null, category: string) => void;
	export let deleteCategory: (category: string) => void;

	let showCategories: boolean = false;

	// TODO Function to get notes by category
	// function getNotesByCategory(category: string) {
	// 	return $notes.filter((note) => note.category === category);
	// }

	// TODO Function to get notes without a category
	// function getUncategorizedNotes() {
	// 	return $notes.filter((note) => !note.category || note.category === '');
	// }
</script>

<div
	class="min-w-[300px] flex flex-col bg-sidebar rounded-md justify-between border-r h-full border"
>
	<div class="flex flex-col h-full overflow-hidden">
		<!-- Header -->
		<div class="flex flex-col items-start w-full gap-2 px-4 pt-4">
			<div class="flex flex-col gap-0 mb-4">
				<h3 class="text-4xl font-bold text-primary">NoteNest</h3>
				<p class="text-sm text-primary/40">{email}</p>
			</div>

			<!-- Search Input -->
			<Input type="text" placeholder="Search" class="w-full rounded" />

			<!-- Add Note or Task List Buttons -->

			<div class="flex flex-row justify-between w-full gap-2">
				<Button on:click={() => addNote(null)} class="w-full">
					<Notebook class="w-4 h-4 mr-2" />
					Add Note</Button
				>

				<Button on:click={() => addTask('')} class="w-full">
					<CircleCheckBig class="w-4 h-4 mr-2" />
					Add Task
				</Button>
			</div>
		</div>

		<!-- List of options -->
		<div class="flex flex-col flex-grow w-full gap-2 px-4 mt-8 overflow-hidden">
			<SidebarButton
				icon={House}
				text="Home"
				selected={selectedTab === 'home'}
				onClick={() => {
					selectedTab = 'home';
					goto('/private');
				}}
			/>

			<SidebarButton
				icon={Notebook}
				text="Notes"
				selected={selectedTab === 'notes'}
				onClick={() => {
					selectedTab = 'notes';
					goto('/private/notes');
				}}
			/>

			<SidebarButton
				icon={CircleCheckBig}
				text="Tasks"
				selected={selectedTab === 'tasks'}
				onClick={() => {
					selectedTab = 'tasks';
					goto('/private/tasks');
				}}
			/>

			<Collapsible.Root bind:open={showCategories}>
				<Collapsible.Trigger class="w-full">
					<Button size="sm" variant="ghost" class="w-full">
						<div class="flex flex-row items-center w-full gap-4">
							<ChevronRight
								class="w-4 h-4 transition-transform duration-300 {showCategories
									? 'rotate-90'
									: ''}"
							/>
							<p class="font-normal">Categories</p>
						</div>
					</Button>
				</Collapsible.Trigger>
				<Collapsible.Content>
					<div class="flex flex-col gap-2 pl-6">
						{#each $categories as category}
							<SidebarButton
								icon={Tag}
								text={category.category}
								selected={selectedTab === category.id}
								onClick={() => {
									selectedTab = category.category;
									// goto('private/notes', )
								}}
							/>
						{/each}

						<SidebarButton
							icon={Archive}
							text="Uncategorized"
							selected={selectedTab === 'uncategorized'}
							onClick={() => (selectedTab = 'uncategorized')}
						/>
					</div>
				</Collapsible.Content>
			</Collapsible.Root>

			<SidebarButton
				icon={Trash}
				text="Trash"
				selected={selectedTab === 'trash'}
				onClick={() => {
					selectedTab = 'trash';
					goto('/private/trash');
				}}
			/>
		</div>

		<!-- Notes and Tasks List -->

		<!-- Notes and Tasks List -->
		<!-- <div class="flex flex-col flex-grow w-full mt-8 overflow-hidden">
				<Tabs.Root class="flex flex-col w-full h-full" bind:value={selectedTab}>
					<div class="px-6">
						<Tabs.List class="w-full">
							<Tabs.Trigger value="notes" class="w-full">Notes</Tabs.Trigger>
							<Tabs.Trigger value="tasks" class="w-full">Tasks</Tabs.Trigger>
						</Tabs.List>
					</div>
					<Tabs.Content value="notes" class="flex-grow overflow-y-auto">
						<div class="flex flex-col w-full">
							{#each categories as category}
								<div class="category">
									<h3 class="px-6 py-2 font-semibold">{category}</h3>
									<Button variant="ghost" size="icon" on:click={() => deleteCategory(category)}>
										<Trash class="w-4 h-4" />
									</Button>
									{#each getNotesByCategory(category) as note}
										<button
											class={`flex flex-row w-full py-3 px-6 cursor-pointer justify-between items-center text-left truncate ${
												selectedNote && selectedNote.fileName === note.fileName
													? 'bg-primary text-primary-foreground hover:bg-primary/20 hover:text-primary'
													: 'bg-primary-foreground text-primary hover:bg-primary/20'
											}`}
											on:click={() => loadNoteContent(note)}
										>
											<span class="truncate">{note.fileName}</span>
											<Button
												variant="ghost"
												size="icon"
												on:click={(e) => {
													e.stopPropagation();
													deleteNote(note.fileName);
												}}
											>
												<Trash class="w-4 h-4" />
											</Button>
										</button>
									{/each}
								</div>
							{/each}
							<div class="category">
								<h3 class="px-6 py-2 font-semibold">Uncategorized</h3>
								{#each getUncategorizedNotes() as note}
									<button
										class={`flex flex-row w-full py-3 px-6 cursor-pointer justify-between items-center text-left truncate ${
											selectedNote && selectedNote.fileName === note.fileName
												? 'bg-primary text-primary-foreground hover:bg-primary/20 hover:text-primary'
												: 'bg-primary-foreground text-primary hover:bg-primary/20'
										}`}
										on:click={() => loadNoteContent(note)}
									>
										<span class="truncate">{note.fileName}</span>
										<Button
											variant="ghost"
											size="icon"
											on:click={(e) => {
												e.stopPropagation();
												deleteNote(note.fileName);
											}}
										>
											<Trash class="w-4 h-4" />
										</Button>
									</button>
								{/each}
							</div>
						</div>
					</Tabs.Content>
					<Tabs.Content class="flex-grow overflow-y-auto" value="tasks">
						<div class="flex flex-col w-full">
							{#each tasks as taskList}
								<button
									class={`flex flex-row w-full py-3 px-6 cursor-pointer overflow-hidden prose-sm prose max-w-none justify-between items-center text-left truncate ${
										selectedTaskList && selectedTaskList.name === taskList.name
											? 'bg-primary text-primary-foreground hover:bg-primary/20 hover:text-primary'
											: 'bg-primary-foreground text-primary hover:bg-primary/20'
									}`}
									on:click={() => loadTaskList(taskList)}
								>
									{taskList.name}
									<Button
										variant="ghost"
										size="icon"
										on:click={() => deleteTaskList(taskList.name)}
									>
										<Trash class="w-4 h-4" />
									</Button>
								</button>
							{/each}
						</div>
					</Tabs.Content>
				</Tabs.Root>
			</div> -->
	</div>

	<!-- Logout -->
	<div class="flex flex-col items-center justify-center">
		<Separator class="py-0 my-0" />
		<div class="flex flex-row items-center justify-center w-full px-6 py-4">
			<Button class="w-full" variant="destructive" on:click={logout}>Logout</Button>
		</div>
	</div>
</div>
