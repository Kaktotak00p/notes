import jwt from 'jsonwebtoken';

const users = {
  'testuser': 'password123',  // simple in-memory user
};

export async function POST({ request }) {
  const { username, password } = await request.json();

  if (users[username] && users[username] === password) {
    const token = jwt.sign({ username }, 'secretKey', { expiresIn: '1h' });
    return new Response(JSON.stringify({ token }), { status: 200 });
  }

  return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
}

