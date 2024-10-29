<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Input from '$lib/components/ui/input/input.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { toast } from 'svelte-sonner';

	let showSignup = false;
	let error = '';
	let avatarPreview: string | null = 'https://robohash.org/YOUR-TEXT.png';

	function handleAvatarChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const reader = new FileReader();
			reader.onload = (e) => {
				avatarPreview = e.target?.result as string;
			};
			reader.readAsDataURL(input.files[0]);
		}
	}

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
				goto('/private');

				// Force a page reload
				window.location.reload();
			} else {
				error = result.data?.error || 'An error occurred';
				console.error(error);
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
			enctype="multipart/form-data"
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
			<div class="flex flex-col items-center gap-4">
				<div class="relative w-24 h-24 group">
					<img
						src={avatarPreview || 'https://robohash.org/robot.png'}
						alt="Profile"
						class="object-cover w-24 h-24 border rounded-full"
					/>
					<label
						for="avatar"
						class="absolute inset-0 flex items-center justify-center transition-opacity rounded-full opacity-0 cursor-pointer bg-black/50 group-hover:opacity-100"
					>
						<span class="text-sm text-white">Change</span>
						<Input
							id="avatar"
							type="file"
							name="avatar"
							accept="image/*"
							class="absolute inset-0 opacity-0 cursor-pointer"
							on:change={handleAvatarChange}
						/>
					</label>
				</div>
			</div>
			<Input required type="text" placeholder="Name" name="name" class="input-field" />
			<Input required type="email" placeholder="Email" name="email" class="input-field" />
			<Input required type="password" placeholder="Password" name="password" class="input-field" />
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
