<script>
	import '../global.css';
	import { page } from '$app/stores';

	let isAuthenticated = false;

	$: isAuthenticated = !!$page.data.token;
</script>

<slot />
