<script lang="ts">
	import { goto } from '$app/navigation';
	import '../../global.css';
	import './login.css';

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
	<form on:submit|preventDefault={login}>
		<input type="text" placeholder="Username" bind:value={username} class="input-field" />
		<input type="password" placeholder="Password" bind:value={password} class="input-field" />
		<button type="submit" class="submit-btn">Login</button>
	</form>
</div>
