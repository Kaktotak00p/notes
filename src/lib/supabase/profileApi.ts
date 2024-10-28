import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

export interface Profile {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    website: string | null;
    updated_at: string | null;
}

let profileSubscription: RealtimeChannel | null = null;

export async function fetchProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    return data as Profile;
}

export function subscribeToProfile(supabase: SupabaseClient, userId: string, callback: (payload: any) => void): void {
    if (profileSubscription) {
        supabase.removeChannel(profileSubscription);
    }

    profileSubscription = supabase
        .channel(`profile:${userId}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
            callback
        )
        .subscribe();
}

export function unsubscribeFromProfile(supabase: SupabaseClient): void {
    if (profileSubscription) {
        supabase.removeChannel(profileSubscription);
    }
}

export async function updateProfile(
    supabase: SupabaseClient,
    userId: string,
    updates: Partial<Omit<Profile, 'id' | 'updated_at'>>
): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select('*')
        .single();

    if (error) {
        console.error('Error updating profile:', error);
        return null;
    }

    return data as Profile;
}

export async function createProfile(
    supabase: SupabaseClient,
    profile: Omit<Profile, 'updated_at'>
): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .insert(profile)
        .select('*')
        .single();

    if (error) {
        console.error('Error creating profile:', error);
        return null;
    }

    return data as Profile;
}

