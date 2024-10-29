<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	export let icon: any;
	export let text: string;
	export let selected: boolean;
	export let onClick: () => void;
</script>

<Button
	size="sm"
	variant="ghost"
	on:click={onClick}
	class="{selected ? 'bg-sidebar-foreground' : ''} hover:bg-sidebar-foreground/80 py-2 h-fit"
>
	<div class="flex flex-row items-center w-full gap-4">
		<svelte:component this={icon} class="w-4 h-4" />
		<p class="font-normal">{text}</p>
	</div>
</Button>
