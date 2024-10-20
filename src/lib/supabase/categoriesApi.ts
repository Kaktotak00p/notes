import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

export interface Category {
    id: string;
    userId: string;
    category: string;
}

let categoriesSubscription: RealtimeChannel | null = null;

export async function fetchCategories(supabase: SupabaseClient, userId: string): Promise<Category[]> {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('userId', userId);

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    return data as Category[];
}

export function subscribeToCategories(supabase: SupabaseClient, userId: string, callback: (payload: any) => void): void {

    if (categoriesSubscription) {
        console.log('Removing existing category subscription');
        supabase.removeChannel(categoriesSubscription);
    }

    console.log('Setting up new category subscription');
    categoriesSubscription = supabase
        .channel('public:categories')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'categories',
                filter: `userId=eq.${userId}`
            },
            (payload) => {
                console.log('Category change detected:', payload);
                console.log('Event type:', payload.eventType);
                if (payload.eventType === 'DELETE') {
                    console.log('Category deleted:', payload.old);
                }
                callback(payload);
            }
        )
        .subscribe((status) => {
            console.log('Subscription status:', status);
            if (status === 'SUBSCRIBED') {
                console.log('Successfully subscribed to category changes');
            }
        });
}

export function unsubscribeFromCategories(supabase: SupabaseClient): void {
    if (categoriesSubscription) {
        supabase.removeChannel(categoriesSubscription);
    }
}

export async function createCategory(supabase: SupabaseClient, newCategory: Omit<Category, 'id'>): Promise<Category | null> {
    const { data, error } = await supabase
        .from('categories')
        .insert(newCategory)
        .select('*');

    if (error) {
        console.error('Error creating category:', error);
        return null;
    }

    return data ? data[0] : null;
}

export async function updateCategory(supabase: SupabaseClient, updatedCategory: Category): Promise<Category | null> {
    const { data, error } = await supabase
        .from('categories')
        .update({
            category: updatedCategory.category
        })
        .eq('id', updatedCategory.id)
        .select('*');

    if (error) {
        console.error('Error updating category:', error);
        return null;
    }

    return data ? data[0] : null;
}

export async function deleteCategoryPermanently(supabase: SupabaseClient, categoryId: string): Promise<void> {
    console.log('Attempting to delete category:', categoryId);
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

    if (error) {
        console.error('Error deleting category permanently:', error);
    } else {
        console.log('Category deleted successfully:', categoryId);
    }
}

export async function getCategory(supabase: SupabaseClient, id: string | undefined | null): Promise<Category | null> {
    if (!id) return null;

    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching category:', error);
        return null;
    }

    return data as Category;
}
