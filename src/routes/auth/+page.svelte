<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Input from '$lib/components/ui/input/input.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { toast } from 'svelte-sonner';

	let showSignup = false;
	let error = '';

	function handleAuthResult(result: { type: string; data?: any }) {
		console.log(result);
		if (result.type === 'failure') {
			console.error(result.data?.error);
			toast.error(result.data?.error || 'An error occurred');
		} else {
			console.log('success');
			// Check if the authentication is successful
			if (result.data?.success) {
				toast.success(showSignup ? 'Signup successful!' : 'Login successful!');
				goto('/private/notes');
			} else {
				error = result.data?.error || 'An error occurred';
				toast.error(error);
			}
		}
	}
</script>

<div class="flex flex-col items-center justify-center h-screen gap-8 bg-background">
	<p class="text-2xl font-bold">{showSignup ? 'Sign up to Note Nest' : 'Login into Note Nest'}</p>

	{#if error}
		<p class="text-red-500">{error}</p>
	{/if}

	{#if showSignup}
		<form
			method="POST"
			action="?/signup"
			class="flex flex-col items-center justify-center gap-4 w-60"
			use:enhance={({ formElement, formData, action, cancel }) => {
				return async ({ result, update }) => {
					handleAuthResult(result);
					if (result.type === 'success') {
						await update();
					}
				};
			}}
		>
			<Input type="email" placeholder="Email" name="email" class="input-field" />
			<Input type="password" placeholder="Password" name="password" class="input-field" />
			<Button type="submit" class="w-full bg-primary">Sign up</Button>
			<Button type="button" on:click={() => (showSignup = false)} class="w-full" variant="outline"
				>Back to Login</Button
			>
		</form>
	{:else}
		<form
			method="POST"
			action="?/login"
			class="flex flex-col items-center justify-center gap-4 w-60"
			use:enhance={({ formElement, formData, action, cancel }) => {
				return async ({ result, update }) => {
					handleAuthResult(result);
					if (result.type === 'success') {
						await update();
					}
				};
			}}
		>
			<Input type="email" placeholder="Email" name="email" class="input-field" />
			<Input type="password" placeholder="Password" name="password" class="input-field" />
			<Button type="submit" class="w-full bg-primary">Login</Button>
			<Button type="button" on:click={() => (showSignup = true)} class="w-full" variant="outline"
				>Sign up</Button
			>
		</form>
	{/if}
</div>
<!-- 
<form method="POST" action="?/login">
	<label>
		Email
		<input name="email" type="email" />
	</label>
	<label>
		Password
		<input name="password" type="password" />
	</label>
	<button>Login</button>
	<button formaction="?/signup">Sign up</button>
</form> -->
