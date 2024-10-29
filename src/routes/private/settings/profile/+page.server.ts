import { fail } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
    updateProfile: async ({ request, locals: { supabase, session } }) => {
        try {
            if (!session) {
                return fail(401, { error: 'Unauthorized' })
            }

            const formData = await request.formData()
            const name = formData.get('name')?.toString()
            const avatar = formData.get('avatar') as File | null
            const prevAvatarPath = formData.get('prevAvatarPath')?.toString()


            // Validate name if provided
            if (name) {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ full_name: name })
                    .eq('id', session.user.id)

                if (updateError) {
                    return { success: false, error: updateError.message }
                }
            }

            // Handle avatar upload if provided
            if (avatar?.size) {
                const fileName = `${session.user.id}/${Date.now()}-${avatar.name}`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, avatar, {
                        upsert: true,
                        contentType: avatar.type
                    })

                if (uploadError) {
                    return { success: false, error: uploadError.message }
                } else {
                    // Delete previous avatar
                    if (prevAvatarPath) {
                        const { error: deleteError } = await supabase
                            .storage
                            .from('avatars')
                            .remove([prevAvatarPath])
                    }
                }


                // Update profile with new avatar URL
                const { error: avatarUpdateError } = await supabase
                    .from('profiles')
                    .update({ avatar_url: uploadData?.path })
                    .eq('id', session.user.id)

                if (avatarUpdateError) {
                    return { success: false, error: avatarUpdateError.message }
                }
            }

            return { success: true }

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred'
            }
        }
    }
}
