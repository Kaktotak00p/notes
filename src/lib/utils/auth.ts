import { isAuthenticated } from '$lib/stores/auth';

export const logout = async () => {
    localStorage.removeItem('token');
    isAuthenticated.set(false);
};