<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import * as tasksApi from '$lib/supabase/tasksApi';
	import { Button } from '$lib/components/ui/button';
	import { CirclePlusIcon, Star } from 'lucide-svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import type { Session, SupabaseClient } from '@supabase/supabase-js';

	export let data: {
		session: Session;
		supabase: SupabaseClient;
	};

	let tab: 'yourtasks' | 'aisuggestions' = 'yourtasks';
	let taskname: string = '';

	const tasks = writable<tasksApi.Task[]>([]);

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
			dueDate: null
		});
		if (newTask) {
			tasks.update((currentTasks) => [newTask, ...currentTasks]);
			taskname = '';
		}
	}
</script>

<div class="flex flex-row w-full h-full">
	<!-- Navigator -->
	<div class="flex flex-col w-full h-full px-4 pt-6">
		<!-- Title -->
		<p class="text-2xl font-medium">Tasks</p>

		<!-- Filter bar -->
		<div class="flex justify-between w-full gap-2 pt-6 pb-4">
			<p class="text-sm text-primary/40">{$tasks.length} tasks</p>
		</div>

		<!-- Task table -->
		<div class="flex w-full h-full overflow-y-hidden">
			<!-- Table header -->
			<div class="flex flex-row justify-start w-full gap-4 pb-2 border-b h-fit">
				<!-- Your tasks -->
				<Button
					class=""
					variant="ghost"
					on:click={() => {
						tab = 'yourtasks';
					}}
				>
					<CirclePlusIcon class="w-4 h-4 mr-4" />
					Your tasks
				</Button>

				<!-- AI suggestions -->
				<Button
					class=""
					variant="ghost"
					on:click={() => {
						tab = 'aisuggestions';
					}}
				>
					<Star class="w-4 h-4 mr-4" />
					AI Suggestions
				</Button>
			</div>

			<!-- Task list -->
			<div class="flex flex-col w-full h-full gap-2 overflow-y-auto">
				<!-- Task -->
				{#each $tasks as task}
					<div class="flex flex-row justify-between w-full">
						<!-- Check and task title -->
						<div class="flex gap-6">
							<!-- Check -->
							<Checkbox
								checked={task.completed}
								class="rounded-full"
								onCheckedChange={(e) => checkedChange(task)}
							/>

							<!-- Title -->
							<input value={task.task} class="" on:blur={(event) => taskChanged(task, event)} />
						</div>

						<!-- Delete button -->
						<!-- Implement delete functionality here -->
					</div>
				{/each}
			</div>
		</div>

		<!-- Add task input -->
		<div class="flex mt-4">
			<input
				bind:value={taskname}
				placeholder="Add a new task"
				class="flex-grow p-2 border rounded"
			/>
			<Button on:click={addTask}>Add Task</Button>
		</div>
	</div>
</div>
