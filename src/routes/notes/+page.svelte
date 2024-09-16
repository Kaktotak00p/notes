<script lang="ts">
	import { marked } from 'marked'; // Import the Markdown parser
	import Input from '$lib/components/ui/input/input.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { logout } from '$lib/utils/auth';
	import { Textarea } from '$lib/components/ui/textarea';
	import { X, Check, Trash, GripVertical, Plus, Menu } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { notes } from '$lib/stores/notes';
	import { tasks, type TaskList, type Task } from '$lib/stores/tasks';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import Sortable from 'sortablejs';
	import { isMd } from '$lib/stores/screen';
	import { slide } from 'svelte/transition';
	import { Sidebar } from './(components)';

	interface Note {
		fileName: string;
		content: string;
	}

	let selectedNote: Note | null = null;
	let selectedTaskList: TaskList | null = null;
	let noteContent = '';
	let parsedContent = '';
	let isEditing = false; // New variable to track if the user is in editing mode
	let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
	let newNoteName = '';
	let newTaskName = '';
	let selectedTab: 'notes' | 'tasks' = 'notes';
	let sidebarOpen = false;

	// Components
	let sortableDiv: HTMLElement | null = null;

	$: if (sortableDiv && selectedTaskList) {
		new Sortable(sortableDiv, {
			handle: '.dragger',
			animation: 150,
			onEnd: (evt: any) => {
				if (!selectedTaskList) return;
				const newTasks = Array.from(evt.to.children)
					.map((el: any) => {
						const taskId = el.getAttribute('data-task-id');
						return selectedTaskList && selectedTaskList.tasks.find((task) => task.id === taskId);
					})
					.filter(Boolean) as Task[];

				selectedTaskList.tasks = newTasks;
				tasks.set(
					$tasks.map((list) =>
						selectedTaskList && list.name === selectedTaskList.name
							? { ...list, tasks: newTasks }
							: list
					)
				);
			}
		});
	}

	// Reset viewed content
	function resetViewedContent() {
		selectedNote = null;
		selectedTaskList = null;
		noteContent = '';
		parsedContent = '';
		isEditing = false;
	}

	// Load the selected note content
	async function loadNoteContent(note: Note) {
		resetViewedContent();

		selectedNote = note;
		noteContent = note.content;
		parsedContent = parseMarkdown(noteContent); // Parse markdown on load
		isEditing = false; // Open in viewing mode
		if (autoSaveTimer) clearTimeout(autoSaveTimer);
		sidebarOpen = false;
	}

	// Load the selected note content
	async function loadTaskList(taskList: TaskList) {
		resetViewedContent();

		selectedTaskList = taskList;
		isEditing = false; // Open in viewing mode
		sidebarOpen = false;
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
	}

	// Delete a note
	async function deleteNote(fileName: string) {
		notes.deleteNote(fileName);
		resetViewedContent();
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

	function handleActionButton() {
		if (selectedTab === 'notes') {
			addNote();
		} else if (selectedTab === 'tasks') {
			createTaskList();
		}
	}

	function createTaskList() {
		if (!newNoteName) {
			toast.error('Please enter a name for the new task list');
			return;
		}

		if (newNoteName.trim()) {
			$tasks = [...$tasks, { name: newNoteName.trim(), tasks: [] }];
			newNoteName = '';
		}

		// Open the new task list
		loadTaskList({ name: newNoteName.trim(), tasks: [] });
	}

	function deleteTaskList(listName: string) {
		tasks.deleteTaskList(listName);
		resetViewedContent();
		toast.success('Task list deleted');
	}

	function addTask(listName: string) {
		if (newTaskName && newTaskName.trim()) {
			tasks.addTask(listName, {
				id: Date.now().toString(),
				content: newTaskName.trim(),
				completed: false
			});

			// Refresh the selected task list
			selectedTaskList = $tasks.find((taskList) => taskList.name === listName) || null;
			toast.success('Task added');
		} else {
			toast.error('Please enter a name for the new task');
		}
		newTaskName = '';
	}

	function deleteTask(listName: string, taskId: string) {
		tasks.deleteTask(listName, taskId);

		// Refresh the selected task list
		selectedTaskList = $tasks.find((taskList) => taskList.name === listName) || null;
		toast.success('Task deleted');
	}

	function toggleTask(listName: string, taskId: string) {
		console.log('toggleTask', listName, taskId);
		tasks.toggleTask(listName, taskId);

		// Refresh the selected task list
		selectedTaskList = $tasks.find((taskList) => taskList.name === listName) || null;
		toast.success('Task status updated');
	}
</script>

<div class="fixed flex flex-row w-screen h-screen overflow-y-hidden">
	{#if $isMd}
		<!-- Sidebar -->
		<Sidebar
			bind:selectedTab
			bind:newNoteName
			bind:notes={$notes}
			bind:tasks={$tasks}
			bind:selectedNote
			bind:selectedTaskList
			{handleActionButton}
			{loadNoteContent}
			{deleteNote}
			{loadTaskList}
			{deleteTaskList}
			{logout}
		/>
	{:else}
		<!-- AppBar for smaller screens -->
		<div
			class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-primary-foreground"
		>
			<h3 class="text-2xl font-bold text-primary">NoteNest</h3>
			<Button variant="ghost" size="icon" on:click={() => (sidebarOpen = true)}>
				<Menu class="w-4 h-4 text-primary" />
			</Button>
		</div>

		<!-- Drawer for sidebar on smaller screens -->
		{#if sidebarOpen}
			<div
				in:slide
				class="fixed top-0 left-0 z-50 w-screen h-full transition-transform duration-300 ease-in-out transform bg-primary-foreground"
			>
				<!-- Sidebar content (same as above, but in a drawer) -->
				<div class="flex flex-col h-full overflow-hidden">
					<!-- Header -->
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
						<Button on:click={handleActionButton} class="w-full"
							>{selectedTab === 'notes' ? 'Add Note' : 'Add Task List'}</Button
						>
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
									{#each $notes as note}
										<button
											class={`flex flex-row w-full py-3 px-6 cursor-pointer overflow-hidden prose-sm prose max-w-none justify-between items-center text-left truncate ${
												selectedNote && selectedNote.fileName === note.fileName
													? 'bg-primary text-primary-foreground hover:bg-primary/20 hover:text-primary'
													: 'bg-primary-foreground text-primary hover:bg-primary/20'
											}`}
											on:click={() => loadNoteContent(note)}
										>
											<span class="truncate">{note.fileName}</span>
											<Button variant="ghost" size="icon" on:click={() => deleteNote(note.fileName)}
												><Trash class="w-4 h-4"></Trash></Button
											>
										</button>
									{/each}
								</div>
							</Tabs.Content>
							<Tabs.Content class="flex-grow overflow-y-auto" value="tasks">
								<div class="flex flex-col w-full">
									{#each $tasks as taskList}
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
												><Trash class="w-4 h-4"></Trash></Button
											>
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
		{:else if selectedTaskList}
			<!--  Task List Editor -->
			{#key selectedTaskList}
				<!-- New task input -->
				<div class="flex flex-row items-center justify-between gap-6">
					<Input type="text" placeholder="New task" bind:value={newTaskName} />
					<Button on:click={() => selectedTaskList && addTask(selectedTaskList.name)}
						><Plus class="w-4 h-4 mr-2"></Plus> Add Task</Button
					>
				</div>

				<!-- Task List Content -->
				<div
					class="flex flex-col items-start justify-start w-full h-full gap-4"
					bind:this={sortableDiv}
				>
					{#each selectedTaskList.tasks as task}
						{#if task && selectedTaskList}
							<!-- Individual Task -->
							<div
								class="flex flex-row items-center justify-between w-full gap-4 p-2 px-6 border rounded-md border-muted"
								data-task-id={task.id}
							>
								<div
									class="flex items-center justify-center w-6 h-6 cursor-move dragger text-muted-foreground/40"
								>
									<GripVertical class="w-4 h-4" />
								</div>

								<div class="flex items-center w-full gap-6">
									<Checkbox
										bind:checked={task.completed}
										class="items-center justify-center w-5 h-5 mr-2 rounded-full form-checkbox"
										on:click={(v) => selectedTaskList && toggleTask(selectedTaskList.name, task.id)}
									/>
									<span class={task.completed ? 'line-through text-gray-500' : ''}
										>{task.content}</span
									>
								</div>
								<Button
									variant="ghost"
									size="sm"
									on:click={() => selectedTaskList && deleteTask(selectedTaskList.name, task.id)}
								>
									<Trash class="w-4 h-4" />
								</Button>
							</div>
						{/if}
					{/each}
				</div>
			{/key}
		{:else}
			<div class="flex flex-col items-center justify-center h-full">
				<p class="text-primary-foreground">Select a note or task list to edit</p>
			</div>
		{/if}
	</div>
</div>
