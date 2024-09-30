<script lang="ts"> 
	import AiButton from './(components)/AiButton.svelte';
	import AiPanel from './(components)/AiPanel.svelte';
	import { Textarea } from '$lib/components/ui/textarea';
	import { X, Check } from 'lucide-svelte';
	import { notes } from '$lib/stores/notes';
	import { tasks, type TaskList, type Task } from '$lib/stores/tasks';
	import Sortable from 'sortablejs';
	import { Sidebar } from './(components)';
	import { toast } from 'svelte-sonner';

	// AI panel state
	let showAiPanel = false;
	let aiInputText = '';
	let aiResponse = '';
	let isQuerying = false;

  // Ui state
	let selectedNote = null;
	let selectedTaskList = null;
	let noteContent = '';
	let parsedContent = '';
	let isEditing = false;
	let autoSaveTimer = null;
	let newNoteName = '';
	let newTaskName = '';
	let selectedTab = 'notes';
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
		selectedNote = note;
		selectedTaskList = null;
		noteContent = note.content;
		parsedContent = parseMarkdown(noteContent);
		isEditing = false;
		if (autoSaveTimer) clearTimeout(autoSaveTimer);
		sidebarOpen = false;
	}

	// Load the selected note content
	async function loadTaskList(taskList: TaskList) {
		selectedNote = null;
		selectedTaskList = taskList;
		isEditing = false;
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

		// Check if note already exists
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

	// Ai query
	async function queryAI() {
		if (!aiInputText) {
			toast.error('Please enter text to query AI');
			return;
		}

		isQuerying = true;
		try {
			const res = await fetch('/api/ai', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					apiUrl: 'your-ai-api-url', // Replace with actual API
					systemPrompt: 'You are an assistant that helps with notes.',
					userQuery: aiInputText,
				}),
			});
			const data = await res.json();
			aiResponse = data?.output || 'No response from AI';
		} catch (error) {
			toast.error('Error querying AI');
		} finally {
			isQuerying = false;
		}
	}

  // Close ai panel
	function closeAiPanel() {
		showAiPanel = false;
		aiInputText = '';
		aiResponse = '';
	}

  // Capture selected text to a buffer
	function captureSelectedText() {
		const selection = window.getSelection()?.toString();
		if (selection) {
			aiInputText = selection;
		}
	}

	// Auto-capture selected text in the note
	$: if (selectedNote) {
		document.addEventListener('mouseup', captureSelectedText);
	}
</script>

<div class="fixed flex flex-row w-screen h-screen overflow-y-hidden">
	<!-- Sidebar -->
	<Sidebar
		bind:selectedTab
		bind:newNoteName
		bind:notes={$notes}
		bind:tasks={$tasks}
		bind:selectedNote
		bind:selectedTaskList
		bind:sidebarOpen
	/>

	<!-- Note Editor -->
	<div class="flex flex-col w-full gap-8 px-6 py-4 pt-6">
		{#if selectedNote}
			<!-- Toolbar -->
			<div class="flex flex-row items-center justify-between">
				<button on:click={() => (selectedNote = null)}>
					<X class="w-4 h-4 mr-4" /> Close
				</button>
				<button on:click={saveNote}>
					<Check class="w-4 h-4 mr-4" /> Save
				</button>
			</div>

			<!-- Note Content -->
			<div class="flex flex-col items-start justify-start h-full">
				{#if isEditing}
					<Textarea
						class="w-full h-full border-none p-2.5 bg-muted text-black text-base resize-none"
						bind:value={noteContent}
						on:input={updateContent}
					/>
				{:else}
					<button class="w-full h-full text-left" on:click={switchToEditing}>
						<div class="prose-sm prose max-w-none">
							<div class="note-preview"> {@html parsedContent}</div>
						</div>
					</button>
				{/if}
			</div>
		{:else if selectedTaskList}
			<!-- Task List Content -->
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

	<!-- AI Button and Panel -->
	<AiButton onClick={() => (showAiPanel = true)} />
	<AiPanel
		{showAiPanel}
		{aiInputText}
		{aiResponse}
		{isQuerying}
		{closeAiPanel}
		{queryAI}
	/>
</div>
