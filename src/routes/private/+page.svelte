<script lang="ts">
    import type { Session, SupabaseClient } from "@supabase/supabase-js";
    import * as notesApi from "$lib/supabase/notesApi";
    import type { Note } from "$lib/supabase/notesApi";
    import { LibraryBig, CookingPot, Lightbulb, Plus } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import { selectedNote } from "$lib/stores/notes";
    import { goto } from "$app/navigation";
    import { notes } from "$lib/stores/notes";
    import { Badge } from "$lib/components/ui/badge";
    import { categories } from "$lib/stores/categories";
    import { tasks } from "$lib/stores/tasks";
	import Task from "./(components)/task.svelte";
    
    export let data: {
        session: Session;
        supabase: SupabaseClient;
    }

    // Add a new note
    async function addNote(fileName: string) {
		const newNote: Omit<Note, 'id' | 'created_at' | 'updated_at'> = {
			userId: data.session.user.id,
			fileName: fileName,
			content: '',
			deleted: false,
            categoryid: null
		};
		const supabaseNote = await notesApi.createNote(data.supabase, newNote);

		// Get back supabase note id
		console.log('Supabase note: ', supabaseNote);
		if (supabaseNote) {
			selectedNote.set(supabaseNote);
			toast.success('Note created');
		} else {
			toast.error('Error creating note');
			return;
		}

		// Redirect to notes page if not already there
		if (!window.location.pathname.includes('/private/notes')) {
			goto('/private/notes');
		}
	}
</script>


<div class="flex flex-col justify-start w-full h-full gap-4 pb-8 overflow-y-auto">
    <!-- Header -->
     <div class="flex flex-col justify-start px-8 py-6">
        <p class="text-sm text-gray-500">Ready to start your day?</p>
        <h1 class="text-2xl font-semibold">{data.session.user.email}'s Notes</h1>
    </div>

    <!-- Suggested actions -->
    <div class="flex flex-col justify-start w-full gap-12 px-8">

        <!-- Inspirations -->
        <div class="flex flex-col gap-4">
            <h2 class="mb-4 text-lg font-semibold">Inspirations for your next note</h2>
            <div class="flex flex-row flex-wrap justify-between w-full gap-4">
            <!-- Reading List -->
            <div class="flex flex-row items-center gap-6 p-2 bg-gray-100 rounded-md">
                <!-- Icon -->
                 <LibraryBig class="w-14 h-14 text-primary-foreground" />

                <!-- Text -->
                 <div class="flex flex-col items-start gap-1">
                    <p class="text-sm font-semibold">Reading List</p>
                    <p class="text-sm text-gray-500">Add articles to your reading list for later.</p>
                    <button class="text-sm font-semibold text-primary" on:click={() => addNote('Reading List')}>Create note</button>
                 </div>                
            </div>

            <!-- Recipe -->
            <div class="flex flex-row items-center gap-6 p-2 bg-gray-100 rounded-md">
                <!-- Icon -->
                 <CookingPot class="w-14 h-14 text-primary-foreground" />

                <!-- Text -->
                 <div class="flex flex-col items-start gap-1">
                    <p class="text-sm font-semibold">Recipe</p>
                    <p class="text-sm text-gray-500">Add a recipe to your recipe book.</p>
                    <button class="text-sm font-semibold text-primary" on:click={() => addNote('Recipe')}>Create note</button>
                 </div>                
            </div>

            <!-- Idea -->
            <div class="flex flex-row items-center gap-6 p-2 bg-gray-100 rounded-md">
                <!-- Icon -->
                 <Lightbulb class="w-14 h-14 text-primary-foreground" />

                <!-- Text -->
                 <div class="flex flex-col items-start gap-1">
                    <p class="text-sm font-semibold">Idea</p>
                    <p class="text-sm text-gray-500">Add an idea to your idea book.</p>
                    <button class="text-sm font-semibold text-primary" on:click={() => addNote('Idea')}>Create note</button>
                    </div>                
                </div>
            </div>
        </div>
    

        <!-- Recent Notes -->
        <div class="flex flex-col justify-start">
            <h2 class="mb-8 text-lg font-semibold">Recent notes</h2>

            <!-- Notes -->
             {#if $notes.filter(note => !note.deleted).length > 0}
            <div class="flex flex-row flex-wrap gap-4">
                {#each $notes
                    .filter(note => !note.deleted)
                    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                    .slice(0, 4) as note}
                    <button class="flex flex-col items-start justify-between w-48 h-64 gap-2 p-4 transition-transform duration-200 ease-in-out bg-white border rounded-md hover:scale-105" on:click={() => {
                        selectedNote.set(note);
                        goto('/private/notes');
                    }}>
                        <!-- Title and contents -->
                         <div class="flex flex-col items-start gap-2">
                            <p class="text-sm font-semibold">{note.fileName}</p>
                            <p class="text-sm text-gray-500">{note.content}</p>
                         </div>

                        <!-- Date -->
                         <div class="flex flex-col items-start gap-2">
                            <!-- Category (if any) -->
                            {#if note.categoryid}
                                {#each $categories.filter(category => category.id === note.categoryid) as category}
                                    <Badge variant="outline" class="text-gray-500 rounded-md">{category.category}</Badge>
                                {/each}
                            {/if}

                            <!-- Updated date -->
                            <p class="text-sm text-gray-500">{new Date(note.updated_at).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'})}</p>
                         </div>

                    </button>
                {/each}

                <!-- Add more notes button -->
                <button class="flex flex-row items-center justify-center w-48 h-64 p-4 transition-transform duration-200 ease-in-out border border-gray-300 border-dashed rounded-md hover:scale-105" on:click={() => addNote('New Note')}>
                    <Plus class="w-4 h-4 mr-4 " />
                    <p class="text-sm font-semibold ">Add a note</p>
                </button>
            </div>
            {:else}
                <p class="text-sm text-gray-500">No notes yet. <a href="/private/notes" class="text-primary hover:underline">Add a note to get started.</a></p>
            {/if}
        </div>

        <!-- Recent Tasks -->
        <div class="flex flex-col justify-start">
            <h2 class="mb-8 text-lg font-semibold">Your Tasks</h2>

            <!-- Tasks -->
             {#if $tasks.filter(task => !task.aiGenerated).length > 0}
            <div class="flex flex-row flex-wrap gap-4">
                <!-- Task 1 -->
                {#each $tasks
                    .filter(task => !task.aiGenerated)
                    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                    .slice(0, 6) as task}
                    <Task data={data} task={task} />
                {/each}

               <!-- View all tasks button -->
               <button class="text-sm font-semibold text-primary" on:click={() => goto('/private/tasks')}>View all tasks</button>
            </div>
            {:else}
                <p class="text-sm text-gray-500">No tasks yet. <a href="/private/tasks" class="text-primary hover:underline">Add a task to get started.</a></p>
            {/if}
        </div>
    </div>
</div>