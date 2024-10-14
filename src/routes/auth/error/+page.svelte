<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
</script>

<div class="flex flex-col items-center justify-center h-screen bg-primary-foreground">
	<h1 class="mb-4 text-4xl font-bold text-primary">Authentication Error</h1>
	<p class="max-w-md mb-6 text-lg text-center text-white">
		{$page.error?.message || 'An error occurred during authentication. Please try again.'}
	</p>
	<Button on:click={() => goto('/auth')} class="bg-primary text-primary-foreground">
		Return to Login
	</Button>
</div>
