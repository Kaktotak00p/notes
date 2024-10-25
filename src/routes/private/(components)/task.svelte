<script lang="ts">
	import * as tasksApi from '$lib/supabase/tasksApi';
	import { Button } from '$lib/components/ui/button';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import type { Session, SupabaseClient } from '@supabase/supabase-js';
	import { tasks } from '$lib/stores/tasks';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { EllipsisIcon } from 'lucide-svelte';

	export let data: {
		session: Session;
		supabase: SupabaseClient;
	};
	export let task: tasksApi.Task;

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
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			<Button variant="ghost">
				<EllipsisIcon class="w-4 h-4" />
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content>
			<DropdownMenu.Group>
				<DropdownMenu.Label>My Account</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Item>Profile</DropdownMenu.Item>
				<DropdownMenu.Item>Billing</DropdownMenu.Item>
				<DropdownMenu.Item>Team</DropdownMenu.Item>
				<DropdownMenu.Item>Subscription</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
	<!-- Implement delete functionality here -->
</div>
