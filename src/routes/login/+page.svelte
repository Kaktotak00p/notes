<script>
  import { goto } from '$app/navigation';
  let username = '';
  let password = '';

  async function login() {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      const { token } = await res.json();
      localStorage.setItem('token', token);
      goto('/notes');
    } else {
      alert('Login failed');
    }
  }
</script>

<form on:submit|preventDefault={login}>
  <input type="text" placeholder="Username" bind:value={username} />
  <input type="password" placeholder="Password" bind:value={password} />
  <button type="submit">Login</button>
</form>

