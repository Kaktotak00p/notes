<script lang="ts">
	export let title: string = 'Notes';
	export let showPage = true;
</script>

<div class="flex flex-row w-full h-full">
	<!-- Navigator -->
	<div class="flex flex-col h-full px-4 pt-6 w-[30rem]">
		<!-- Title -->
		<p class="text-2xl font-medium">{title}</p>

		<!-- Filter bar -->
		<div class="flex justify-between w-full gap-2 pt-6 pb-4">
			<slot name="filter-bar"></slot>
		</div>

		<div class="flex w-full h-full overflow-y-hidden">
			<slot name="navigator" />
		</div>
	</div>

	{#if showPage}
		<!-- Page Content -->
		<div class="flex flex-col w-full h-full bg-white border rounded-md">
			<slot name="content" />
		</div>
	{/if}
</div>
