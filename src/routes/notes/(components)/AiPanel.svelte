<script lang="ts">
	import { Textarea } from '$lib/components/ui/textarea';
	import { X } from 'lucide-svelte';

	// Props passed from parent
	export let showAiPanel: boolean;
	export let aiInputText: string;
	export let aiResponse: any; // Changed to 'any' to handle JSON responses
	export let isQuerying: boolean;

	// Methods passed from parent
	export let closeAiPanel: () => void;
	export let queryAI: () => void;
	export let applyAiCategory: () => void; // New function to apply AI category

	// Function to handle apply button
	function handleApply() {
		applyAiCategory();
		closeAiPanel();
	}
</script>

{#if showAiPanel}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div class="bg-white w-96 p-6 shadow-lg rounded-lg relative">
			<!-- Close Button -->
			<button class="absolute top-2 right-2" on:click={closeAiPanel}>
				<X class="w-4 h-4" />
			</button>

			<!-- AI Input Area -->
			<h3 class="text-lg font-bold mb-2">AI Query Panel</h3>

			<Textarea
				class="w-full h-32 p-2 mb-4 border rounded"
				placeholder="Enter text or highlight text in your note to query AI..."
				bind:value={aiInputText}
			/>

			<!-- Submit AI Query Button -->
			<div class="flex items-center justify-between mt-2">
				<button
					class="bg-primary text-white px-4 py-2 rounded"
					on:click={queryAI}
					disabled={isQuerying}
				>
					{#if isQuerying}
						<span>Querying AI...</span>
					{:else}
						<span>Query AI</span>
					{/if}
				</button>
				<button class="text-red-500" on:click={closeAiPanel}>Close</button>
			</div>

			<!-- AI Response -->
			{#if aiResponse}
				<div class="mt-4 bg-gray-100 p-4 rounded">
					<h4 class="font-bold mb-2">AI Response:</h4>
					<!-- Display the AI response as formatted JSON -->
					<pre class="bg-gray-100 p-2 rounded overflow-auto">
						{JSON.stringify(aiResponse, null, 2)}
					</pre>
					<!-- Apply Category Button -->
					<button
						class="mt-2 bg-green-500 text-white px-4 py-2 rounded"
						on:click={handleApply}
					>
						Apply Category
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

