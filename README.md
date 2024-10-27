# NoteNest - An Intelligent Notes App

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Running the App](#running-the-app)
4. [Features](#features)
5. [Usage](#usage)
6. [AI-Enhanced Functionality](#ai-enhanced-functionality)
7. [Contributing](#contributing)
8. [License](#license)

## Prerequisites

Before running NoteNest, ensure you have the following:

1. Node.js installed on your system
2. A Supabase account and project set up
3. An OpenAI API key

You need to set up 3 environment variables:

- PUBLIC_SUPABASE_URL
- PUBLIC_SUPABASE_ANON_KEY
- OPENAI_API_KEY

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/davidwickerhf/notes.git
   cd notes
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:
   ```
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

## Running the App

To run the app in development mode, use:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` or the port specified in the console output.

## Features

1. Notes Management
2. Task Management
3. AI-Enhanced Categorization
4. Smart Task Extraction
5. Markdown Support
6. Real-time Sync
7. User Authentication

## Usage

### Authentication

1. Navigate to the `/auth` page.
2. To register, click "Sign up", enter your email and password, then click "Sign up" again.
3. To log in, enter your email and password, then click "Login".

### Notes Management

- Create a new note using the "+" button.
- Edit notes by clicking on them.
- Delete notes by using the options menu (three dots) next to each note.

### Task Management

- Create tasks manually or extract them from notes using AI.
- Mark tasks as complete by clicking the checkbox.
- Delete tasks using the options menu.

### Categories

- Create custom categories for your notes.
- Assign notes to categories using the dropdown menu.
- Filter notes by category in the sidebar.

## AI-Enhanced Functionality

### Smart Task Extraction

NoteNest can automatically extract tasks from your notes. To use this feature:

1. Open a note.
2. Click the AI button or use the shortcut (if available).
3. The AI will analyze your note and suggest tasks.
4. Review and confirm the extracted tasks.

### Intelligent Note Categorization

The AI can suggest categories for your notes based on their content:

1. Open a note.
2. Click the "Categorize" button or use the AI panel.
3. The AI will suggest a category based on the note's content.
4. Accept the suggestion or choose a different category.

## Contributing

We welcome contributions to NoteNest! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with clear, descriptive messages.
4. Push your changes to your fork.
5. Submit a pull request to the main repository.

## License

NoteNest is released under the MIT License. See the LICENSE file for more details.
