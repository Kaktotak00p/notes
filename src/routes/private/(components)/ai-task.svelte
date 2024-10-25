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

	export let data: {
		session: Session;
		supabase: SupabaseClient;
	};
	export let task: tasksApi.Task;

	let showAddTask: boolean = false;
	let taskInputRef: HTMLInputElement;

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

	// Reject AI Suggestion
	async function rejectAiSuggestion(task: tasksApi.Task) {
		try {
			await tasksApi.deleteTaskPermanently(data.supabase, task.id);
			tasks.update((currentTasks) => currentTasks.filter((t) => t.id !== task.id));
			toast.success('AI suggestion rejected');
		} catch (error) {
			tasks.update((currentTasks) => currentTasks.filter((t) => t.id !== task.id));
			toast.success('AI suggestion rejected');
		}
	}

	// Accept AI Suggestion
	async function acceptAiSuggestion(task: tasksApi.Task) {
		const updatedTask = await tasksApi.updateTask(data.supabase, {
			...task,
			aiGenerated: false
		});
		if (updatedTask) {
			tasks.update((currentTasks) =>
				currentTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
			);
			toast.success('AI suggestion accepted');
		} else {
			toast.error('Failed to accept AI suggestion');
		}
	}
</script>

<div class="flex flex-row items-center justify-between w-full p-4 border rounded-md">
	<!-- Check and task title -->
	<div class="flex items-center gap-6">
		<!-- Check -->
		<Checkbox
			checked={task.completed}
			class="rounded-full"
			onCheckedChange={(e) => checkedChange(task)}
		/>

		<!-- Title -->
		<input
			value={task.task}
			class="flex-grow bg-transparent border-none outline-none rounded-t-md focus:ring-0"
			on:blur={(event) => taskChanged(task, event)}
		/>
	</div>

	<!-- Delete button -->
	<div class="flex gap-2">
		<Button variant="outline" class="w-8 h-8 p-0" on:click={() => rejectAiSuggestion(task)}>
			<Ban class="w-4 h-4 text-red-500" />
		</Button>

		<!-- Implement delete functionality here -->
		<Button variant="outline" class="w-8 h-8 p-0" on:click={() => acceptAiSuggestion(task)}>
			<Check class="w-4 h-4 " />
		</Button>
	</div>
</div>
