import { writable } from 'svelte/store';
import * as profileApi from '$lib/supabase/profileApi';

export const profile = writable<profileApi.Profile | null>(null);