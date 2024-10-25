<script lang="ts">
	import Input from '$lib/components/ui/input/input.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import SidebarButton from './sidebar-button.svelte';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { toast } from 'svelte-sonner';
	import type { Category } from '$lib/supabase/categoriesApi';
	import {
		Trash,
		Menu,
		X,
		Notebook,
		CircleCheckBig,
		ChevronRight,
		Tag,
		House,
		Archive,
		CirclePlus,
		Check
	} from 'lucide-svelte';

	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';

	export let email: string;
	export let selectedTab: string;
	export let categories: Category[];

	export let addNote: (categoryid: string | null) => void;
	export let addTask: (content: string) => void;
	export let logout: () => void;

	let showCategories: boolean = false;
	let newCategoryName = '';
	let dialogOpen = false;

	function handleNewCategory(result: { type: string; data?: any }) {
		console.log(result);
		if (result.type === 'failure') {
			console.error(result.data?.error);
			toast.error(result.data?.error || 'An error occurred');
		} else {
			console.log('success');
			if (result.data?.success) {
				dialogOpen = false;
				toast.success(`Category created!`);
				// The store should update automatically due to realtime subscription
				goto(`/private/notes?categoryid=${result.data.category.id}`);
			} else {
				let error = result.data?.error || 'An error occurred';
				toast.error(error);
			}
		}
	}
</script>

<div
	class="min-w-[300px] flex flex-col bg-sidebar rounded-md justify-between border-r h-full border"
>
	<div class="flex flex-col h-full overflow-hidden">
		<!-- Header -->
		<div class="flex flex-col items-start w-full gap-2 px-4 pt-4">
			<div class="flex flex-col gap-0 mb-4">
				<h3 class="text-4xl font-bold text-primary">NoteNest</h3>
				<p class="text-sm text-primary/40">{email}</p>
			</div>

			<!-- Search Input -->
			<Input type="text" placeholder="Search" class="w-full rounded" />

			<!-- Add Note or Task List Buttons -->

			<div class="flex flex-row justify-between w-full gap-2">
				<Button on:click={() => addNote(null)} class="w-full">
					<Notebook class="w-4 h-4 mr-2" />
					Add Note</Button
				>

				<Button on:click={() => addTask('')} class="w-full">
					<CircleCheckBig class="w-4 h-4 mr-2" />
					Add Task
				</Button>
			</div>
		</div>

		<!-- List of options -->
		<div class="flex flex-col flex-grow w-full gap-2 px-4 pb-8 mt-8 overflow-y-scroll">
			<SidebarButton
				icon={House}
				text="Home"
				selected={selectedTab === 'home'}
				onClick={() => {
					goto('/private');
				}}
			/>

			<SidebarButton
				icon={Notebook}
				text="Notes"
				selected={selectedTab === 'notes'}
				onClick={() => {
					goto('/private/notes');
				}}
			/>

			<SidebarButton
				icon={CircleCheckBig}
				text="Tasks"
				selected={selectedTab === 'tasks'}
				onClick={() => {
					goto('/private/tasks');
				}}
			/>

			<div class="flex flex-row items-start justify-between gap-2">
				<Collapsible.Root bind:open={showCategories} class="w-full">
					<Collapsible.Trigger class="w-full">
						<Button size="sm" variant="ghost" class="flex justify-between w-full">
							<div class="flex flex-row items-center w-full gap-4">
								<ChevronRight
									class="w-4 h-4 transition-transform duration-300 {showCategories
										? 'rotate-90'
										: ''}"
								/>
								<p class="font-normal">Categories</p>
							</div>
						</Button>
					</Collapsible.Trigger>
					<Collapsible.Content>
						<div class="flex flex-col gap-2 pl-6">
							{#each categories as category}
								<SidebarButton
									icon={Tag}
									text={category.category}
									selected={selectedTab === category.id}
									onClick={() => {
										goto(`/private/notes?categoryid=${category.id}`);
									}}
								/>
							{/each}

							<SidebarButton
								icon={Archive}
								text="Uncategorized"
								selected={selectedTab === 'uncategorized'}
								onClick={() => {
									goto(`/private/notes?categoryid=uncategorized`);
								}}
							/>
						</div>
					</Collapsible.Content>
				</Collapsible.Root>

				<!-- Add Category -->
				<Dialog.Root bind:open={dialogOpen}>
					<Dialog.Trigger
						><Button
							class="z-50"
							variant="ghost"
							size="icon"
							on:click={(event) => {
								event.stopPropagation();
								dialogOpen = true;
								showCategories = true;
							}}
						>
							<CirclePlus class="w-4 h-4"></CirclePlus>
						</Button></Dialog.Trigger
					>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>Create new category</Dialog.Title>
							<Dialog.Description>
								Categories are useful for grouping notes around a common topic. They are private to
								you.
							</Dialog.Description>

							<form
								method="POST"
								action="?/newcategory"
								class="flex flex-col w-full gap-2 pt-8"
								use:enhance={() => {
									return ({ result }) => {
										handleNewCategory(result);
									};
								}}
							>
								<Label for="category-name" class="text-sm font-medium">Category name</Label>
								<Input
									name="category-name"
									id="category-name"
									placeholder="Enter category name"
									bind:value={newCategoryName}
									required
								/>

								<div class="flex justify-end w-full pt-6">
									<Button type="submit"><Check class="w-4 h-4 mr-4"></Check> Save</Button>
								</div>
							</form>
						</Dialog.Header>
					</Dialog.Content>
				</Dialog.Root>
			</div>

			<SidebarButton
				icon={Trash}
				text="Trash"
				selected={selectedTab === 'trash'}
				onClick={() => {
					goto('/private/trash');
				}}
			/>
		</div>
	</div>

	<!-- Logout -->
	<div class="flex flex-col items-center justify-center">
		<Separator class="py-0 my-0" />
		<div class="flex flex-row items-center justify-center w-full px-6 py-4">
			<Button class="w-full" variant="destructive" on:click={logout}>Logout</Button>
		</div>
	</div>
</div>
