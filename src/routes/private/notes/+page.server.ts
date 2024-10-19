import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
    newcategory: async ({ request, locals }) => {
        const session = locals.session;
        if (!session) {
            return fail(401, { error: 'Unauthorized' });
        }

        const data = await request.formData();
        const categoryName = data.get('category-name');

        if (!categoryName || typeof categoryName !== 'string') {
            return fail(400, { error: 'Invalid category name' });
        }

        const { data: newCategory, error } = await locals.supabase
            .from('categories')
            .insert({ category: categoryName, userId: session.user.id })
            .select()
            .single();

        if (error) {
            console.error('Error creating category:', error);
            return fail(500, { error: 'Failed to create category' });
        }

        return { success: true, category: newCategory };
    },
    renamecategory: async ({ request, locals }) => {
        const session = locals.session;
        if (!session) {
            return fail(401, { error: 'Unauthorized' });
        }

        const data = await request.formData();
        const categoryId = data.get('category-id');
        const newCategoryName = data.get('category-name');

        if (!categoryId || typeof categoryId !== 'string' || !newCategoryName || typeof newCategoryName !== 'string') {
            return fail(400, { error: 'Invalid category ID or name' });
        }

        const { data: updatedCategory, error } = await locals.supabase
            .from('categories')
            .update({ category: newCategoryName })
            .eq('id', categoryId)
            .eq('userId', session.user.id)
            .select()
            .single();

        if (error) {
            console.error('Error renaming category:', error);
            return fail(500, { error: 'Failed to rename category' });
        }

        return { success: true, category: updatedCategory };
    },
};
