import { browser } from '$app/environment';

export function load() {
    if (browser) {
        const token = localStorage.getItem('token');
        return {
            token
        };
    }
    return {
        token: null
    };
}
