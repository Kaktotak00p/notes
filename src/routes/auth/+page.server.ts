import { redirect } from '@sveltejs/kit'

import type { Actions } from './$types'

export const actions: Actions = {
    signup: async ({ request, locals: { supabase } }) => {
        try {
            const formData = await request.formData()
            const name = formData.get('name')?.toString()
            const email = formData.get('email')?.toString()
            const password = formData.get('password')?.toString()
            const avatar = formData.get('avatar') as File | null

            // Validate required fields
            if (!name || !email || !password) {
                return { success: false, error: 'Missing required fields' }
            }

            // Create auth user
            const { error: signUpError, data: { user } } = await supabase.auth.signUp({
                email,
                password
            })

            if (signUpError || !user) {
                return { success: false, error: signUpError?.message ?? 'Signup failed' }
            }

            // Update profile with name
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ full_name: name })
                .eq('id', user.id)

            if (updateError) {
                return { success: false, error: updateError.message }
            }

            // Handle avatar upload if provided
            let avatarUrl = 'https://robohash.org/robot.png'

            if (avatar?.size) {
                const fileName = `${user.id}/${Date.now()}-${avatar.name}`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, avatar, {
                        upsert: true,
                        contentType: avatar.type
                    })

                if (uploadError) {
                    return { success: false, error: uploadError.message }
                }

                avatarUrl = uploadData?.path ?? avatarUrl
            }

            // Update profile with avatar
            const { error: avatarUpdateError } = await supabase
                .from('profiles')
                .update({ avatar_url: avatarUrl })
                .eq('id', user.id)

            if (avatarUpdateError) {
                return { success: false, error: avatarUpdateError.message }
            }

            return { success: true }

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred'
            }
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
