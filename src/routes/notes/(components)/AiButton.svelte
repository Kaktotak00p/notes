<script lang="ts">
	export let onClick: () => void;
</script>

<!-- Floating AI Button -->
<div class="fixed bottom-6 right-6 z-50">
	<button class="rounded-full p-4 shadow-lg bg-primary text-white" on:click={onClick}>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
		</svg>
	</button>
</div>

