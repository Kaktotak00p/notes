// src/stores/categoriesStore.ts
import { writable, get } from 'svelte/store';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

// Define the shape of a category object
export interface Category {
    id: string;
    userId: string;
    category: string;
}

function createCategoriesStore() {
    const { subscribe, set, update } = writable<Category[]>([]);

    let categoriesSubscription: RealtimeChannel | null = null;
    let supabase: SupabaseClient;

    async function initialize(supabaseClient: SupabaseClient) {
        supabase = supabaseClient;
        const { data } = await supabase.auth.getUser();
        if (data && data.user) {
            fetchCategories(data.user.id);
            subscribeToRealtimeCategories(data.user.id);
        }
    }

    // Function to fetch categories
    async function fetchCategories(userId: string): Promise<void> {
        console.log('Fetching categories for user:', userId);
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('userid', userId);

        if (error) {
            console.error('Error fetching categories:', error);
        } else {
            set(data || []);
        }
    }

    // Function to start real-time syncing
    function subscribeToRealtimeCategories(userId: string): void {
        console.log('Subscribing to real-time categories for user:', userId);
        categoriesSubscription = supabase
            .channel('public:categories')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'categories' },
                payload => {
                    update(currentCategories => {
                        switch (payload.eventType) {
                            case 'INSERT':
                                return [...currentCategories, payload.new as Category];
                            case 'UPDATE':
                                return currentCategories.map(category =>
                                    category.id === (payload.new as Category).id ? (payload.new as Category) : category
                                );
                            case 'DELETE':
                                return currentCategories.filter(category => category.id !== (payload.old as Category).id);
                            default:
                                return currentCategories;
                        }
                    });
                }
            )
            .subscribe();
    }

    // Function to stop real-time syncing
    function unsubscribeFromRealtimeCategories(): void {
        if (categoriesSubscription) {
            supabase.removeChannel(categoriesSubscription);
        }
    }

    // Function to create a new category
    async function createCategory(newCategory: Omit<Category, 'id'>): Promise<Category | null> {
        const { data, error } = await supabase
            .from('categories')
            .insert(newCategory)
            .select('*');

        if (error) {
            console.error('Error creating category:', error);
            return null;
        } else {
            // Add the newly created category to the store
            return data ? data[0] : null;
        }
    }

    // Function to update a category in Supabase and the store
    async function updateCategory(updatedCategory: Category): Promise<Category | null> {
        const { data, error } = await supabase
            .from('categories')
            .update({
                category: updatedCategory.category
            })
            .eq('id', updatedCategory.id)
            .select('*'); // Fetch the updated row

        if (error) {
            console.error('Error updating category:', error);
            return null;
        } else {
            // Update the store after the database update
            return data ? data[0] : null;
        }
    }

    // Function to delete a category permanently from Supabase
    async function deleteCategoryPermanently(categoryId: string): Promise<void> {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', categoryId);

        if (error) {
            console.error('Error deleting category permanently:', error);
        } else {
            // Remove the category from the store after deletion
            console.log("Deleted category")
        }
    }

    return {
        subscribe,
        initialize,
        fetchCategories,
        createCategory,
        subscribeToRealtimeCategories,
        unsubscribeFromRealtimeCategories,
        updateCategory,
        deleteCategoryPermanently,
    };
}

console.log("Initializing categories store");
export const categories = createCategoriesStore();
