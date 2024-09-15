import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import type { RequestEvent } from '@sveltejs/kit';

const vaultDir = path.resolve('notes_vault'); // Directory to save notes

// Ensure notes_vault directory exists
if (!fs.existsSync(vaultDir)) {
  fs.mkdirSync(vaultDir);
}

interface User {
  username: string;
}

function authenticate(request: RequestEvent['request']) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, 'secretKey') as User;
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

  const { fileName, content } = await request.json();

  // Ensure the filename ends with '.md'
  const sanitizedFileName = fileName.endsWith('.md') ? fileName : `${fileName}.md`;

  // Ensure the filename is unique
  const filePath = path.join(vaultDir, sanitizedFileName);
  if (fs.existsSync(filePath)) {
    return new Response(JSON.stringify({ error: 'File already exists' }), { status: 400 });
  }

  // Create the markdown content with metadata
  const markdownContent = `# Note by ${user.username}\n\n${content || ''}\n`;

  // Write the content to a .md file
  fs.writeFileSync(filePath, markdownContent);

  return new Response(JSON.stringify({ message: 'Note added', fileName: sanitizedFileName }), { status: 201 });
}

export async function PUT({ request }) {
  const user = authenticate(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { fileName, content } = await request.json();

  // Check if the note file exists
  const filePath = path.join(vaultDir, fileName);
  if (!fs.existsSync(filePath)) {
    return new Response(JSON.stringify({ error: 'Note not found' }), { status: 404 });
  }

  // Update the markdown content with the new content
  const updatedContent = `${content}`;

  // Write the updated content to the file
  fs.writeFileSync(filePath, updatedContent);

  return new Response(JSON.stringify({ message: 'Note updated' }), { status: 200 });
}

