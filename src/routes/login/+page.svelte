<script lang="ts">
	import { goto } from '$app/navigation';
	import Input from '$lib/components/ui/input/input.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { isAuthenticated } from '$lib/stores/auth';
	import { toast } from 'svelte-sonner';

	let username = '';
	let password = '';

	async function login() {
		const res = await fetch('/api/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password })
		});

		if (res.ok) {
			const { token } = await res.json();
			localStorage.setItem('token', token);
			$isAuthenticated = true;
			goto('/notes');
		} else {
			toast.error('Invalid credentials...');
		}
	}
</script>

<div class="flex flex-col items-center justify-center h-screen bg-primary-foreground">
	<form
		on:submit|preventDefault={login}
		class="flex flex-col items-center justify-center h-screen gap-4 w-60"
	>
		<Input type="text" placeholder="Username" bind:value={username} class="input-field" />
		<Input type="password" placeholder="Password" bind:value={password} class="input-field" />
		<Button type="submit" class="w-full bg-primary">Login</Button>
	</form>
</div>
