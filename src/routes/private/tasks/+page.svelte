<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { writable } from 'svelte/store';
	import * as tasksApi from '$lib/supabase/tasksApi';
	import { Button } from '$lib/components/ui/button';
	import { CirclePlusIcon, Star, CheckCheckIcon } from 'lucide-svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import type { Session, SupabaseClient } from '@supabase/supabase-js';
	import { tasks, aiGeneratedTasksByNoteId } from '$lib/stores/tasks';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { EllipsisIcon } from 'lucide-svelte';
	import { Sparkles, X, Link, Ban, Check } from 'lucide-svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { toast } from 'svelte-sonner';
	import { AiTask } from '../(components)';
	import { Task } from '../(components)';

	export let data: {
		session: Session;
		supabase: SupabaseClient;
	};

	let taskname: string = '';
	let showAddTask: boolean = false;
	let taskInputRef: HTMLInputElement;
	let showAiSuggestions: boolean = true;

	onMount(async () => {
		if (data.session.user) {
			const fetchedTasks = await tasksApi.fetchTasks(data.supabase, data.session.user.id);
			tasks.set(fetchedTasks);
			tasksApi.subscribeToTasks(data.supabase, data.session.user.id, handleRealtimeUpdate);
		}
	});

	onDestroy(() => {
		tasksApi.unsubscribeFromTasks(data.supabase);
	});

	function handleRealtimeUpdate(payload: any) {
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

	async function taskChanged(task: tasksApi.Task, event: Event) {
		const updatedTask = await tasksApi.updateTask(data.supabase, {
			...task,
			task: (event.target as HTMLInputElement).value
		});
		if (updatedTask) {
			tasks.update((currentTasks) =>
				currentTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
			);
		}
	}

	async function checkedChange(task: tasksApi.Task) {
		const updatedTask = await tasksApi.updateTask(data.supabase, {
			...task,
			completed: !task.completed
		});
		if (updatedTask) {
			tasks.update((currentTasks) =>
				currentTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
			);
		}
	}

	async function addTask() {
		if (!taskname.trim()) return;
		const newTask = await tasksApi.createTask(data.supabase, {
			userId: data.session.user.id,
			task: taskname,
			completed: false,
			aiGenerated: false,
			noteId: null,
			hash: null
		});
		if (newTask) {
			// tasks.update((currentTasks) => [newTask, ...currentTasks]);
			taskname = '';
		}
	}

	// function to retrieve Note name from id
	async function getNoteNameById(noteId: string | null): Promise<string> {
		if (!noteId) return 'Unknown Note';

		try {
			const { data: note, error } = await data.supabase
				.from('notes')
				.select('fileName')
				.eq('id', noteId)
				.single();

			if (error) throw error;
			return note?.fileName || 'Untitled Note';
		} catch (error) {
			console.error('Error fetching note name:', error);
			return 'Error Fetching Note';
		}
	}

	$: if (showAddTask) {
		tick().then(() => {
			if (taskInputRef) {
				taskInputRef.focus();
			}
		});
	}
</script>

<div class="flex flex-row w-full h-full">
	<!-- Navigator -->
	<div class="flex flex-col w-full h-full px-4 pt-6">
		<!-- Title -->
		<div class="flex flex-row justify-between items-top">
			<p class="text-2xl font-medium">Tasks</p>
			{#if !showAiSuggestions}
				<Button
					variant="outline"
					class="justify-start w-fit"
					on:click={() => {
						showAiSuggestions = true;
					}}
				>
					<Sparkles class="w-4 h-4 mr-4" />
					AI Suggestions
				</Button>
			{/if}
		</div>

		<!-- Filter bar -->
		<div class="flex justify-between w-full gap-2 pt-6 pb-4">
			<p class="text-sm text-primary/40">
				{$tasks.filter((task) => task.aiGenerated === false).length} tasks
			</p>
		</div>

		<!-- Task table -->
		<div class="flex flex-col w-full h-full gap-2 overflow-y-hidden">
			<!-- Task list -->
			<div class="flex flex-col w-full h-full gap-2 overflow-y-auto">
				<!-- Task -->
				{#each $tasks.filter((task) => task.aiGenerated === false) as task}
					<Task {task} {data} />
				{/each}

				<!-- Add task input -->
				{#if showAddTask}
					<div class="flex flex-col mt-4 border rounded-md">
						<div class="flex flex-row w-full border-b">
							<input
								bind:this={taskInputRef}
								bind:value={taskname}
								placeholder="Add a new task..."
								class="flex-grow p-4 bg-transparent border-none outline-none rounded-t-md focus:ring-0"
								on:keydown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										addTask();
									}
								}}
							/>
						</div>
						<div class="flex flex-row justify-end w-full gap-2 p-2">
							<Button
								variant="outline"
								on:click={() => {
									showAddTask = false;
									addTask();
								}}
							>
								Cancel
							</Button>
							<Button on:click={addTask}>Add Task</Button>
						</div>
					</div>
				{:else}
					<Button
						variant="ghost"
						class="justify-start w-fit"
						on:click={() => {
							showAddTask = true;
							taskname = '';
						}}
					>
						<CirclePlusIcon class="w-4 h-4 mr-4" />
						Add task
					</Button>
				{/if}
			</div>
		</div>
	</div>

	<!-- AI Suggestions -->
	{#if showAiSuggestions}
		<div class="flex flex-col w-full h-full px-4 pt-4 border rounded-md bg-sidebar">
			<div class="flex flex-row items-center justify-between">
				<div class="flex flex-row items-center justify-start gap-4">
					<Sparkles class="w-5 h-5" />
					<p class="text-2xl font-medium">AI Suggestions</p>
				</div>

				<Button
					variant="outline"
					size="icon"
					on:click={() => {
						showAiSuggestions = false;
					}}
				>
					<X class="w-4 h-4" />
				</Button>
			</div>

			<div class="flex justify-between w-full gap-2 pt-6 pb-4">
				<p class="text-sm text-primary/40">
					{$tasks.filter((task) => task.aiGenerated === true).length} Suggestions
				</p>
			</div>

			<!-- Task table -->
			<div class="flex flex-col w-full h-full gap-2 overflow-y-hidden">
				<!-- Task list -->
				<div class="flex flex-col w-full h-full gap-6 overflow-y-auto">
					<!-- Task -->
					{#each $aiGeneratedTasksByNoteId as [noteId, tasks]}
						<div class="flex flex-col w-full gap-2">
							<div class="flex items-center justify-between w-full gap-2 text-sm text-primary/40">
								<div class="flex items-center gap-2">
									Tasks from
									{#await getNoteNameById(noteId) then noteName}
										<a href="/private/notes?id={noteId}" class="flex items-center gap-2 underline">
											{noteName}
											<Link class="w-4 h-4" />
										</a>
									{:catch error}
										{error}
									{/await}
								</div>
								<Badge variant="outline">{tasks.length}</Badge>
							</div>
							{#each tasks as task}
								<AiTask {task} {data} />
							{/each}
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
