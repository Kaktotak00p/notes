import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const vaultDir = path.resolve('notes_vault'); // Directory to save notes

// Ensure notes_vault directory exists
if (!fs.existsSync(vaultDir)) {
  fs.mkdirSync(vaultDir);
}

function authenticate(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, 'secretKey');
  } catch (err) {
    return false;
  }
}

export async function GET({ request }) {
  const user = authenticate(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Get all .md files from the notes_vault directory
  const noteFiles = fs.readdirSync(vaultDir).filter(file => file.endsWith('.md'));
  const notes = noteFiles.map(file => {
    const content = fs.readFileSync(path.join(vaultDir, file), 'utf-8');
    return { fileName: file, content };
  });

  return new Response(JSON.stringify(notes), { status: 200 });
}

export async function POST({ request }) {
  const user = authenticate(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { content } = await request.json();
  const fileName = `${new Date().toISOString()}_${user.username}.md`; // Create a unique file name

  // Create the markdown content with metadata
  const markdownContent = `# Note by ${user.username}\n\n${content}\n`;

  // Write the content to a .md file
  fs.writeFileSync(path.join(vaultDir, fileName), markdownContent);

  return new Response(JSON.stringify({ message: 'Note added', fileName }), { status: 201 });
}
