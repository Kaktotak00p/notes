<script lang="ts">
	import type { Session, SupabaseClient } from '@supabase/supabase-js';

	export let data: {
		session: Session;
		supabase: SupabaseClient;
	};
</script>
