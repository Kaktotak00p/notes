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

// Authenticate the user from the JWT token in the authorization header
function authenticate(request: RequestEvent['request']): User | false {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, 'secretKey') as User;
  } catch (err) {
    return false;
  }
}

// Helper function to extract metadata from the note content
function extractMetadata(content: string): { username: string } | null {
  const metaStart = content.indexOf('//// Meta\n');
  const metaEnd = content.indexOf('////\n');
  
  if (metaStart !== -1 && metaEnd !== -1 && metaEnd > metaStart) {
    const metadataContent = content.substring(metaStart + '//// Meta\n'.length, metaEnd).trim();
    const metaLines = metadataContent.split('\n');
    
    const metadata: { username: string } = { username: '' };
    metaLines.forEach(line => {
      const [key, value] = line.split(':').map(part => part.trim());
      if (key && value && key.toLowerCase() === 'username') {
        metadata.username = value;
      }
    });
    return metadata;
  }
  return null;
}

// GET: Fetch all notes created by the authenticated user
export async function GET({ request }: { request: RequestEvent['request'] }) {
  const user = authenticate(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Get all .md files from the notes_vault directory
  const noteFiles = fs.readdirSync(vaultDir).filter(file => file.endsWith('.md'));
  const notes = noteFiles.map(file => {
    const content = fs.readFileSync(path.join(vaultDir, file), 'utf-8');
    const metadata = extractMetadata(content);

    if (metadata && metadata.username === user.username) {
      return { fileName: file, content };
    }
    return null;
  }).filter(Boolean);

  return new Response(JSON.stringify(notes), { status: 200 });
}

// POST: Create a new note with metadata
export async function POST({ request }: { request: RequestEvent['request'] }) {
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
  const markdownContent = `//// Meta\nusername: ${user.username}\n////\n\n${content || ''}\n`;

  // Write the content to a .md file
  fs.writeFileSync(filePath, markdownContent);

  return new Response(JSON.stringify({ message: 'Note added', fileName: sanitizedFileName }), { status: 201 });
}

// PUT: Update an existing note (only if the user is the creator)
export async function PUT({ request }: { request: RequestEvent['request'] }) {
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

  // Ensure the user is the creator of the note
  const existingContent = fs.readFileSync(filePath, 'utf-8');
  const metadata = extractMetadata(existingContent);
  if (!metadata || metadata.username !== user.username) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }

  // Update the markdown content, keeping the metadata intact
  const updatedContent = `//// Meta\nusername: ${user.username}\n////\n\n${content}`;

  // Write the updated content to the file
  fs.writeFileSync(filePath, updatedContent);

  return new Response(JSON.stringify({ message: 'Note updated' }), { status: 200 });
}

