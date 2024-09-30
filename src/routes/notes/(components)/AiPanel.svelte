<script lang="ts">
	import { Textarea } from '$lib/components/ui/textarea';
	import { X } from 'lucide-svelte';

	// Props passed from parent
	export let showAiPanel: boolean;
	export let aiInputText: string;
	export let aiResponse: string;
	export let isQuerying: boolean;

	// Methods passed from parent
	export let closeAiPanel: () => void;
	export let queryAI: () => void;
</script>

{#if showAiPanel}
	<div class="fixed inset-0 z-50 flex items-end justify-end bg-black bg-opacity-50">
		<div class="bg-white w-96 p-6 shadow-lg rounded-lg relative">
			<!-- Close Button -->
			<button class="absolute top-2 right-2" on:click={closeAiPanel}>
				<X class="w-4 h-4" />
			</button>

			<!-- AI Input Area -->
			<h3 class="text-lg font-bold mb-2">AI Query Panel</h3>

			<Textarea
				class="w-full h-32 p-2 mb-4 border"
				placeholder="Enter text or highlight text in your note to query AI..."
				bind:value={aiInputText}
			/>

			<!-- Submit AI Query Button -->
			<button class="w-full bg-primary text-white p-2 rounded mt-2" on:click={queryAI} disabled={isQuerying}>
				{#if isQuerying}
					<span>Querying AI...</span>
				{:else}
					<span>Query AI</span>
				{/if}
			</button>

			<!-- AI Response -->
			{#if aiResponse}
				<div class="mt-4 bg-gray-100 p-4 rounded">
					<h4 class="font-bold mb-2">AI Response:</h4>
					<p>{aiResponse}</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

