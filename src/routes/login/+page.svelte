<script lang="ts">
	import { goto } from '$app/navigation';
	import Input from '$lib/components/ui/input/input.svelte';
	import Button from '$lib/components/ui/button/button.svelte';

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
			goto('/notes');
		} else {
			alert('Login failed');
		}
	}
</script>

<div class="flex flex-col items-center justify-center h-screen">
	<form
		on:submit|preventDefault={login}
		class="flex flex-col items-center justify-center h-screen w-60 gap-4"
	>
		<Input type="text" placeholder="Username" bind:value={username} class="input-field" />
		<Input type="password" placeholder="Password" bind:value={password} class="input-field" />
		<Button type="submit" class="w-full bg-primary">Login</Button>
	</form>
</div>
