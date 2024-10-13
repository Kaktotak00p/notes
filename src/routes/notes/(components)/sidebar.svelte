<script lang="ts">
    import Input from '$lib/components/ui/input/input.svelte';
    import Button from '$lib/components/ui/button/button.svelte';
    import Separator from '$lib/components/ui/separator/separator.svelte';
    import { Trash, Menu, X } from 'lucide-svelte';
    import * as Tabs from '$lib/components/ui/tabs';
    import type { TaskList } from '$lib/stores/tasks';
    import { isMd } from '$lib/stores/screen';
    import { slide } from 'svelte/transition';

    interface Note {
        fileName: string;
        content: string;
        category?: string;
    }

    export let selectedTab: 'notes' | 'tasks';
    export let newNoteName: string;
    export let newCategoryName: string;
    export let notes: Note[];
    export let tasks: TaskList[];
    export let selectedNote: Note | null;
    export let selectedTaskList: TaskList | null;
    export let sidebarOpen: boolean = false;
    export let handleActionButton: () => void;
    export let loadNoteContent: (note: Note) => void;
    export let deleteNote: (fileName: string) => void;
    export let loadTaskList: (taskList: TaskList) => void;
    export let deleteTaskList: (name: string) => void;
    export let logout: () => void;

    // New variables for categories
    export let categories: string[] = [];
    export let addCategory: () => void;
    export let assignCategory: (note: Note, category: string) => void;

    // Function to get notes by category
    function getNotesByCategory(category) {
        return notes.filter(note => note.category === category);
    }

    // Function to get notes without a category
    function getUncategorizedNotes() {
        return notes.filter(note => !note.category || note.category === '');
    }
</script>

{#if $isMd}
	<div class="min-w-[300px] flex flex-col bg-primary-foreground justify-between border-r h-screen">
		<div class="flex flex-col h-full overflow-hidden">
			<!-- Header -->
			<div class="flex flex-col items-start w-full gap-2 px-6 pt-6">
				<h3 class="mb-4 text-4xl font-bold text-primary">NoteNest</h3>
				<Input
					type="text"
					placeholder={selectedTab === 'notes' ? 'New note' : 'New task list'}
					bind:value={newNoteName}
					class="w-full rounded"
				/>
				<Button on:click={handleActionButton} class="w-full">
					{selectedTab === 'notes' ? 'Add Note' : 'Add Task List'}
				</Button>
			</div>

    <!-- Notes and Tasks List -->
    <div class="flex flex-col flex-grow w-full mt-8 overflow-hidden">
        <Tabs.Root class="flex flex-col w-full h-full" bind:value={selectedTab}>
            <div class="px-6">
                <Tabs.List class="w-full">
                    <Tabs.Trigger value="notes" class="w-full">Notes</Tabs.Trigger>
                    <Tabs.Trigger value="tasks" class="w-full">Tasks</Tabs.Trigger>
                </Tabs.List>
            </div>
            <!-- Notes Tab Content -->
            <Tabs.Content value="notes" class="flex-grow overflow-y-auto">
                <div class="flex flex-col w-full">
                    {#each categories as category}
                        <!-- Category Section -->
                        <div class="category">
                            <h3 class="px-6 py-2 font-semibold">{category}</h3>
                            {#each getNotesByCategory(category) as note}
                                <!-- Note Item -->
                                <button
                                    class={`flex flex-row w-full py-3 px-6 cursor-pointer justify-between items-center text-left truncate ${
                                        selectedNote && selectedNote.fileName === note.fileName
                                            ? 'bg-primary text-primary-foreground hover:bg-primary/20 hover:text-primary'
                                            : 'bg-primary-foreground text-primary hover:bg-primary/20'
                                    }`}
                                    on:click={() => loadNoteContent(note)}
                                >
                                    <span class="truncate">{note.fileName}</span>
                                    <Button variant="ghost" size="icon" on:click={(e) => { e.stopPropagation(); deleteNote(note.fileName); }}>
                                        <Trash class="w-4 h-4" />
                                    </Button>
                                </button>
                            {/each}
                        </div>
                    {/each}
                    <!-- Uncategorized Notes -->
                    <div class="category">
                        <h3 class="px-6 py-2 font-semibold">Uncategorized</h3>
                        {#each getUncategorizedNotes() as note}
                            <!-- Note Item -->
                            <button
                                class={`flex flex-row w-full py-3 px-6 cursor-pointer justify-between items-center text-left truncate ${
                                    selectedNote && selectedNote.fileName === note.fileName
                                        ? 'bg-primary text-primary-foreground hover:bg-primary/20 hover:text-primary'
                                        : 'bg-primary-foreground text-primary hover:bg-primary/20'
                                }`}
                                on:click={() => loadNoteContent(note)}
                            >
                                <span class="truncate">{note.fileName}</span>
                                <Button variant="ghost" size="icon" on:click={(e) => { e.stopPropagation(); deleteNote(note.fileName); }}>
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
			</div>
		</div>

		<!-- Logout -->
		<div class="flex flex-col items-center justify-center">
			<Separator class="py-0 my-0" />
			<div class="flex flex-row items-center justify-center w-full px-6 py-4">
				<Button class="w-full" on:click={logout}>Logout</Button>
			</div>
		</div>
	</div>
{:else}
	<div
		class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-primary-foreground"
	>
		<h3 class="text-2xl font-bold text-primary">NoteNest</h3>
		<Button variant="ghost" size="icon" on:click={() => (sidebarOpen = true)}>
			<Menu class="w-4 h-4 text-primary" />
		</Button>
	</div>

	{#if sidebarOpen}
		<div
			in:slide
			class="fixed top-0 left-0 z-50 w-screen h-full transition-transform duration-300 ease-in-out transform bg-primary-foreground"
		>
			<div class="flex flex-col h-full overflow-hidden">
				<div class="flex flex-col items-start w-full gap-2 px-6 pt-6">
					<div class="flex flex-row items-center justify-between w-full">
						<h3 class="mb-4 text-4xl font-bold text-primary">NoteNest</h3>
						<Button variant="ghost" size="sm" on:click={() => (sidebarOpen = false)}>
							<X class="w-4 h-4 text-primary" />
						</Button>
					</div>

					<Input
						type="text"
						placeholder={selectedTab === 'notes' ? 'New note' : 'New task list'}
						bind:value={newNoteName}
						class="w-full rounded"
					/>
					<Button on:click={handleActionButton} class="w-full">
						{selectedTab === 'notes' ? 'Add Note' : 'Add Task List'}
					</Button>
				</div>
				<!-- Notes List -->
				<div class="flex flex-col flex-grow w-full mt-8 overflow-hidden">
					<Tabs.Root class="flex flex-col w-full h-full" bind:value={selectedTab}>
						<div class="px-6">
							<Tabs.List class="w-full">
								<Tabs.Trigger value="notes" class="w-full">Notes</Tabs.Trigger>
								<Tabs.Trigger value="tasks" class="w-full">Tasks</Tabs.Trigger>
							</Tabs.List>
						</div>
						<Tabs.Content value="notes" class="flex-grow overflow-y-auto">
							<div class="flex flex-col w-full">
								{#each notes as note}
									<button
										class={`flex flex-row w-full py-3 px-6 cursor-pointer overflow-hidden prose-sm prose max-w-none justify-between items-center text-left truncate ${
											selectedNote && selectedNote.fileName === note.fileName
												? 'bg-primary text-primary-foreground hover:bg-primary/20 hover:text-primary'
												: 'bg-primary-foreground text-primary hover:bg-primary/20'
										}`}
										on:click={() => loadNoteContent(note)}
									>
										<span class="truncate">{note.fileName}</span>
										<Button variant="ghost" size="icon" on:click={() => deleteNote(note.fileName)}>
											<Trash class="w-4 h-4" />
										</Button>
									</button>
								{/each}
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
				</div>
			</div>
			<!-- Logout -->
			<div class="flex flex-col items-center justify-center">
				<Separator class="py-0 my-0" />
				<div class="flex flex-row items-center justify-center w-full px-6 py-4">
					<Button class="w-full" on:click={logout}>Logout</Button>
				</div>
			</div>
		</div>
	{/if}
{/if}
