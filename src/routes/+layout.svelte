<script lang="ts">
	import '../global.css';
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { browser } from '$app/environment';
	import { invalidate } from '$app/navigation';
	import { Toaster } from 'svelte-sonner';
	import { notes } from '$lib/stores/notes';
	import { categories } from '$lib/stores/categories';
	import { tasks } from '$lib/stores/tasks';

	export let data;
	$: ({ session, supabase } = data);

	let showFlashscreen = false;

	onMount(async () => {
		console.log('Initializing stores...');
		if (data.session) {
			await Promise.all([
				notes.initialize(data.supabase),
				categories.initialize(data.supabase)
				// tasks.initialize(data.supabase)
			]);
			console.log('Stores initialized');
		}
	});

	onDestroy(() => {
		notes.unsubscribeFromRealtimeNotes();
		categories.unsubscribeFromRealtimeCategories();
		// newtasks.unsubscribeFromRealtimeTasks();
	});

	onMount(() => {
		if (browser) {
			const hasSeenFlashscreen = localStorage.getItem('hasSeenFlashscreen');
			const isRootToLoginRedirect =
				document.referrer === window.location.origin + '/' && window.location.pathname === '/auth';
			const isFirstLoad = !document.referrer;

			if (!hasSeenFlashscreen || isRootToLoginRedirect || isFirstLoad) {
				showFlashscreen = true;
				localStorage.setItem('hasSeenFlashscreen', 'true');

				setTimeout(() => {
					showFlashscreen = false;
				}, 1000);
			}
		}

		const { data: authData } = supabase.auth.onAuthStateChange((_, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => authData.subscription.unsubscribe();
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
