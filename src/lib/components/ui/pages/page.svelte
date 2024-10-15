<script lang="ts">
	export let title: string = 'Page';
</script>

<div class="flex flex-row w-full h-full">
	<!-- Navigator -->
	<div class="flex flex-col h-full px-4 py-6 w-96">
		<!-- Title -->
		<p class="text-2xl font-medium">{title}</p>

		<!--  -->
		<slot name="navigator" />
	</div>

	<!-- Page Content -->
	<div class="flex flex-col w-full h-full bg-white rounded-md">
		<slot name="content" />
	</div>
</div>
