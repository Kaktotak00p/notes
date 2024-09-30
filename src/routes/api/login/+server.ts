import jwt from 'jsonwebtoken';

interface User {
  username: string;
  password: string;
}

const users: User[] = [
  { username: 'test', password: 'password' },
  { username: '1', password: '1'},
  { username: '2', password: '2'}
];

export async function POST({ request }) {
  const { username, password } = await request.json();

  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    const token = jwt.sign({ username }, 'secretKey', { expiresIn: '1h' });
    return new Response(JSON.stringify({ token }), { status: 200 });
  }

  return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
}

