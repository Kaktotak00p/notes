import { redirect } from '@sveltejs/kit'

import type { Actions } from './$types'

export const actions: Actions = {
    signup: async ({ request, locals: { supabase } }) => {
        const formData = await request.formData()
        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        const { error, data: user } = await supabase.auth.signUp({ email, password })
        if (error) {
            return { success: false, error: error.message }
        } else {
            // Save user name to supabase
            const { data, error: updateError } = await supabase
                .from('profiles')
                .update({ full_name: name })
                .eq('id', user?.user?.id)
                .select()

            if (updateError) {
                return { success: false, error: updateError.message }
            }
            return { success: true }
        }
    },
    login: async ({ request, locals: { supabase } }) => {
        const formData = await request.formData()
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            return { success: false, error: error.message }
        } else {
            return { success: true }
        }
    },
}
