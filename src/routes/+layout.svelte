<script lang="ts">
	import '../global.css';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { isAuthenticated } from '$lib/stores/auth';
	import { Toaster } from 'svelte-sonner';

	let showFlashscreen = false;

	$: if (browser && !$isAuthenticated) {
		// Check if token is stored locally
		const token = localStorage.getItem('token');
		if (token) {
			isAuthenticated.set(true);
		} else {
			console.log('Redirecting to login');
			goto('/login');
		}
	}

	onMount(() => {
		if (browser) {
			const hasSeenFlashscreen = localStorage.getItem('hasSeenFlashscreen');
			const isRootToLoginRedirect =
				document.referrer === window.location.origin + '/' && window.location.pathname === '/login';
			const isFirstLoad = !document.referrer;

			if (!hasSeenFlashscreen || isRootToLoginRedirect || isFirstLoad) {
				showFlashscreen = true;
				localStorage.setItem('hasSeenFlashscreen', 'true');

				setTimeout(() => {
					showFlashscreen = false;
				}, 1000);
			}
		}
	});
</script>

{#if showFlashscreen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-primary text-primary-foreground"
		in:fade={{ duration: 300 }}
		out:fly={{ y: -1000, duration: 500 }}
	>
		<h1 class="text-6xl font-bold">NodeNest</h1>
	</div>
{/if}

<Toaster />
<slot />
