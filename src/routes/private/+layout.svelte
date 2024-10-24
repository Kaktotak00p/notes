<script lang="ts">
	import AiButton from './notes/(components)/AiButton.svelte';

	import { toast } from 'svelte-sonner';
	import { selectedNote } from '$lib/stores/notes';
	import Sortable from 'sortablejs';
	import { Sidebar } from './notes/(components)';
	import { type Session, type SupabaseClient } from '@supabase/supabase-js';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import * as notesApi from '$lib/supabase/notesApi';
	import * as categoriesApi from '$lib/supabase/categoriesApi';
	import * as tasksApi from '$lib/supabase/tasksApi';
	import type { Note } from '$lib/supabase/notesApi';
	import type { Category } from '$lib/supabase/categoriesApi';
	import { categories } from '$lib/stores/categories';
	import { notes } from '$lib/stores/notes';
	import { tasks } from '$lib/stores/tasks';
	import type { Task } from '$lib/supabase/tasksApi';

	$: if ($categories) {
		console.log('Categories updated:', $categories);
	}

	export let data: {
		session: Session;
		supabase: SupabaseClient;
	};

	interface AiResponse {
		category: string;
		tasks: string[];
	}

	// AI panel state
	let showAiPanel = false;
	let aiInputText = '';
	let aiResponse: AiResponse | undefined = undefined;
	let isQuerying = false;

	// Ui state
	let newNoteName = '';
	let newTaskName = '';
	let sidebarOpen = false;

	$: console.log('Categories: ', $categories);

	$: selectedTab =
		$page.url.searchParams.get('categoryid') ||
		($page.url.pathname === '/private' ? 'home' : $page.url.pathname.replace('/private/', '')) ||
		'home';

	// Logout function
	async function logout() {
		console.log('logging out');
		await data.supabase.auth.signOut();

		// Redirect to home
		console.log('redirecting to home');
		goto('/auth');
	}

	// Add a new note
	async function addNote(categoryid: string | null) {
		const newNote: Omit<Note, 'id' | 'created_at' | 'updated_at'> = {
			userId: data.session.user.id,
			fileName: 'New Note',
			content: '',
			categoryid,
			deleted: false
		};
		const supabaseNote = await notesApi.createNote(data.supabase, newNote);

		// Get back supabase note id
		console.log('Supabase note: ', supabaseNote);
		if (supabaseNote) {
			selectedNote.set(supabaseNote);
			toast.success('Note created');
		} else {
			toast.error('Error creating note');
			return;
		}

		// Redirect to notes page if not already there
		if (!window.location.pathname.includes('/private/notes')) {
			goto('/private/notes');
		}
	}

	// Add a new task
	async function addTask() {
		console.log('Adding task');
		const newTask: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'dueDate'> = {
			userId: data.session.user.id,
			task: 'New Task',
			completed: false,
			aiGenerated: false,
			noteId: null,
			hash: null
		};
		const supabaseTask = await tasksApi.createTask(data.supabase, newTask);

		if (supabaseTask) {
			toast.success('Task created');
		} else {
			toast.error('Error creating task');
		}

		// Redirect to notes page if not already there
		if (!window.location.pathname.includes('/private/tasks')) {
			goto('/private/tasks');
		}
	}

	// Function to assign category to a note
	async function assignCategory(note: Note | null, categoryId: string) {
		if (!note) return;

		const updatedNote = { ...note, categoryid: categoryId };
		await notesApi.updateNote(data.supabase, updatedNote);
		// Refresh the selected note
		if ($selectedNote) selectedNote.update((note) => ({ ...$selectedNote, categoryid: null }));

		// Get the category name for the toast message
		const categories = await categoriesApi.fetchCategories(data.supabase, data.session.user.id);
		const category = categories.find((c) => c.id === categoryId);
		const categoryName = category ? category.category : 'Unknown';

		toast.success(`Category "${categoryName}" assigned`);
	}

	// TODO Ai query
	async function queryAI({
		note,
		availableCategories,
		selectedText
	}: {
		note: Note | null;
		availableCategories: Category[];
		selectedText: string | null;
	}) {
		if (!note) return;

		isQuerying = true;
		try {
			let systemPrompt = '';
			let userQuery = '';

			if (selectedText && selectedText.trim().length > 0) {
				// If text is highlighted, extract tasks
				systemPrompt = `You are an assistant that extracts tasks from provided text. Respond with a JSON array of tasks in the format: [ "Task 1", "Task 2", ... ].`;
				userQuery = `Extract tasks from the following text:\n${selectedText}`;
			} else {
				// If no text is highlighted, categorize the note
				systemPrompt = `You are an assistant that categorizes notes based on their filename and content. Available categories are: ${availableCategories.join(', ')}. Please assign the most appropriate category from the available categories to the note. Respond with JSON in the format: { "category": "CategoryName" }.`;
				userQuery = `Note filename: ${note.fileName}\nNote content:\n${note.content}`;
			}

			const res = await fetch('/api/ai', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					systemPrompt,
					userQuery
				})
			});

			// Define structure of aiResponse
			const data = await res.json();
			aiResponse = data as AiResponse;

			if (selectedText && selectedText.trim().length > 0) {
				// Handle task extraction
				// console.log(aiResponse);
				// console.log(Array.isArray(aiResponse.tasks) && aiResponse.tasks.length > 0);
				// if (Array.isArray(aiResponse.tasks) && aiResponse.tasks.length > 0) {
				// 	// Create a new task list or add to an existing one
				// 	const taskListName = note.fileName + ' Tasks';
				// 	let existingTaskList = $tasks.find((tl) => tl.name === taskListName);
				// 	if (!existingTaskList) {
				// 		tasks.addTaskList(taskListName);
				// 		existingTaskList = { name: taskListName, tasks: [] };
				// 	}
				// 	// Add extracted tasks to the task list
				// 	let i = 0;
				// 	aiResponse.tasks.forEach((task) => {
				// 		let taskNew = { id: i.toString(), content: task, completed: false };
				// 		tasks.addTask(existingTaskList.name, taskNew);
				// 		i++;
				// 	});
				// 	toast.success('Tasks extracted and added to your task list');
				// } else {
				// 	toast.error('AI did not return any tasks');
				// }
			} else {
				// Handle categorization
				if (aiResponse && aiResponse.category) {
					const categories = await categoriesApi.fetchCategories(
						data.supabase,
						data.session.user.id
					);

					const existingCategory = categories.find(
						(c: Category) => aiResponse && c.category === aiResponse.category
					);
					if (!existingCategory) {
						await categoriesApi.createCategory(data.supabase, {
							userId: data.session.user.id,
							category: aiResponse.category
						});
					}
					const categoryToAssign = existingCategory || categories[categories.length - 1];
					assignCategory(note, categoryToAssign.id);
					toast.success(`Category "${aiResponse.category}" assigned by AI`);
				} else {
					toast.error('AI did not return a category');
				}
			}
		} catch (error) {
			console.error('Error querying AI:', error);
			toast.error('Error querying AI');
		} finally {
			isQuerying = false;
		}
	}

	// TODO Function to handle AI button click
	async function handleAiButtonClick() {
		if (!selectedNote) {
			toast.error('No note selected');
			return;
		}

		let selectedText = getSelectedText();

		const categories = await categoriesApi.fetchCategories(data.supabase, data.session.user.id);

		queryAI({
			note: $selectedNote,
			availableCategories: categories,
			selectedText
		});
	}

	// Function to get highlighted text
	function getSelectedText() {
		const selection = window.getSelection();
		return selection ? selection.toString() : '';
	}

	// Capture selected text to a buffer
	function captureSelectedText() {
		const selection = window.getSelection()?.toString();
		if (selection) {
			aiInputText = selection;
		}
	}

	// Auto-capture selected text in the note
	$: if ($selectedNote) {
		document.addEventListener('mouseup', captureSelectedText);
	}

	// // Load notes, categories and tasks on load
	$: if ($page && data.session.user) {
		(async () => {
			const fetchedNotes = await notesApi.fetchNotes(data.supabase, data.session.user.id);
			const fetchedCategories = await categoriesApi.fetchCategories(
				data.supabase,
				data.session.user.id
			);
			const fetchedTasks = await tasksApi.fetchTasks(data.supabase, data.session.user.id);

			notes.set(fetchedNotes);
			categories.set(fetchedCategories);
			tasks.set(fetchedTasks);

			notesApi.unsubscribeFromNotes(data.supabase);
			categoriesApi.unsubscribeFromCategories(data.supabase);
			tasksApi.unsubscribeFromTasks(data.supabase);

			notesApi.subscribeToNotes(data.supabase, data.session.user.id, handleRealtimeUpdate);
			categoriesApi.subscribeToCategories(
				data.supabase,
				data.session.user.id,
				handleCategoryUpdate
			);
			tasksApi.subscribeToTasks(data.supabase, data.session.user.id, handleTaskUpdate);
		})();
	}

	onDestroy(() => {
		notesApi.unsubscribeFromNotes(data.supabase);
		categoriesApi.unsubscribeFromCategories(data.supabase);
		tasksApi.unsubscribeFromTasks(data.supabase);
	});

	function handleRealtimeUpdate(payload: any) {
		const { eventType, new: newRecord, old: oldRecord } = payload;
		console.log('Realtime note update: ', payload);
		notes.update((currentNotes) => {
			switch (eventType) {
				case 'INSERT':
					return [newRecord, ...currentNotes];
				case 'UPDATE':
					return currentNotes.map((note) => (note.id === newRecord.id ? newRecord : note));
				case 'DELETE':
					return currentNotes.filter((note) => note.id !== oldRecord.id);
				default:
					return currentNotes;
			}
		});
	}

	function handleTaskUpdate(payload: any) {
		console.log('Tasks updated: ', payload);
		const { eventType, new: newRecord, old: oldRecord } = payload;
		tasks.update((currentTasks) => {
			switch (eventType) {
				case 'INSERT':
					return [...currentTasks, newRecord];
				case 'UPDATE':
					return currentTasks.map((task) => (task.id === newRecord.id ? newRecord : task));
				case 'DELETE':
					return currentTasks.filter((task) => task.id !== oldRecord.id);
				default:
					return currentTasks;
			}
		});
	}

	function handleCategoryUpdate(payload: any) {
		const { eventType, new: newRecord, old: oldRecord } = payload;
		console.log('Categories updated: ', newRecord);
		categories.update((currentCategories) => {
			switch (eventType) {
				case 'INSERT':
					return [...currentCategories, newRecord];
				case 'UPDATE':
					return currentCategories.map((category) =>
						category.id === newRecord.id ? newRecord : category
					);
				case 'DELETE':
					return currentCategories.filter((category) => category.id !== oldRecord.id);
				default:
					return currentCategories;
			}
		});
	}
</script>

<div class="fixed flex flex-row w-screen h-screen p-2 overflow-y-hidden bg-background">
	<!-- Greater Sidebar -->
	<div class="flex flex-col h-full w-fit">
		<!-- Persistent Sidebar -->
		<Sidebar
			bind:selectedTab
			email={data.session.user.email ?? 'No email connected'}
			categories={$categories}
			{addNote}
			{addTask}
			{logout}
		/>
	</div>

	<slot />

	<!-- AI Button and Panel -->
	<AiButton onClick={handleAiButtonClick} />
</div>
