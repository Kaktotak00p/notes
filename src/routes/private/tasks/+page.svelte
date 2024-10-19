<script lang="ts">
	import { tasks } from '$lib/stores';

	import { Button } from '$lib/components/ui/button';
	import { CirclePlusIcon, Star } from 'lucide-svelte';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';

	let tab: 'yourtasks' | 'aisuggestions' = 'yourtasks';
	let taskname: string = '';

	// Function on task name change
	function taskChanged(event: any) {
		// Sync to supabase
	}

	// Function on checked change
	function checkedChange(event: any) {
		// Sync to supabase
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
						tab = 'yourtasks';
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
								onCheckedChange={checkedChange}
							></Checkbox>

							<!-- Title -->
							<input value={task.task} class="" on:blur={taskChanged} />
						</div>

						<!-- Delete button -->
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
