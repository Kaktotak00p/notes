<script lang="ts">
	import type { Session, SupabaseClient } from '@supabase/supabase-js';
	import { Page } from '$lib/components/ui/pages';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Settings } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { SidebarButton } from '$lib/components/ui/components';
	import { page } from '$app/stores';
	export let data: {
		session: Session;
		supabase: SupabaseClient;
	};
</script>

<Page title="Settings">
	<div slot="navigator" class="flex flex-col w-full gap-2">
		<SidebarButton
			icon={Settings}
			text="Profile"
			selected={$page.url.pathname === '/private/settings/profile'}
			onClick={() => goto('/private/settings/profile')}
		/>
	</div>

	<div slot="content" class="flex flex-col items-start justify-start w-full h-full">
		<slot />
	</div>
</Page>
