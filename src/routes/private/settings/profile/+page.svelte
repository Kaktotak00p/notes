<script lang="ts">
	import { profile } from '$lib/stores/profile';
	import * as profileApi from '$lib/supabase/profileApi';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import { Check } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { getAvatarUrl } from '$lib/utils';
	import type { Session, SupabaseClient } from '@supabase/supabase-js';

	export let data: {
		session: Session;
		supabase: SupabaseClient;
	};

	$: fullName = $profile?.full_name || '';
	$: avatarUrl = $profile?.avatar_url || '';

	let newAvatar: string | null = null;
	let newName: string | null = null;
	let isUpdating = false;

	function handleAvatarChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const reader = new FileReader();
			reader.onload = (e) => {
				newAvatar = e.target?.result as string;
			};
			reader.readAsDataURL(input.files[0]);
		}
	}

	function handleNameChange(event: Event) {
		const input = event.target as HTMLInputElement;
		newName = input.value;
	}

	async function handleProfileUpdate(result: { success: boolean; error?: string }) {
		if (result.success) {
			toast.success('Profile updated successfully');
			isUpdating = false;
		} else {
			toast.error(result.error || 'Failed to update profile');
			isUpdating = false;
		}
	}
</script>

{#if $profile}
	<form
		class="flex flex-col w-full h-full px-6 py-6"
		action="?/updateProfile"
		method="POST"
		enctype="multipart/form-data"
		use:enhance={() => {
			isUpdating = true;
			return async ({ result }) => {
				if (result.type === 'success') {
					handleProfileUpdate({ success: true });
				} else {
					handleProfileUpdate({ success: false, error: 'Update failed' });
				}
			};
		}}
	>
		<div class="flex flex-row items-center justify-between w-full mb-10">
			<h1 class="text-2xl font-medium">Profile</h1>
			{#if fullName !== ($profile?.full_name || '') || newAvatar !== null}
				<Button type="submit" variant="outline" disabled={isUpdating}>
					<Check class="w-4 h-4 mr-2" />
					{isUpdating ? 'Saving...' : 'Save Changes'}
				</Button>
			{/if}
		</div>

		<div class="flex flex-col max-w-md gap-6">
			<!-- Profile Picture Preview -->
			<div class="flex flex-col items-start gap-4 mb-6">
				<div class="relative w-32 h-32 group">
					{#await getAvatarUrl(data.supabase, avatarUrl) then url}
						<img
							src={newAvatar || url}
							alt="Profile"
							class="object-cover w-32 h-32 border rounded-xl"
							on:error={(e) => {
								if (e.target instanceof HTMLImageElement) {
									e.target.src = 'https://robohash.org/robot.png';
								}
							}}
						/>
					{/await}
					<label
						for="avatar"
						class="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 cursor-pointer rounded-xl bg-black/50 group-hover:opacity-100"
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

			<!-- Profile Picture URL -->
			<input hidden id="avatar" type="url" name="avatar" bind:value={newAvatar} />

			<!-- Full Name -->
			<div class="flex flex-col gap-2">
				<Label for="full-name">Display Name</Label>
				<Input
					id="name"
					name="name"
					type="text"
					placeholder="Enter your display name"
					bind:value={newName}
					on:input={handleNameChange}
				/>
				<p class="text-sm text-primary/40">This is how your name will appear across the app</p>
			</div>

			<!-- Email (Read-only) -->
			<div class="flex flex-col gap-2">
				<Label for="email">Email</Label>
				<Input id="email" type="email" value={data.session?.user.email} disabled />
				<p class="text-sm text-primary/40">This is your email address</p>
			</div>
		</div>
	</form>
{/if}
