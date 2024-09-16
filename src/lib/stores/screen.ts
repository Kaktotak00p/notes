import { mediaQuery } from 'svelte-legos';

export const isSm = mediaQuery('(min-width: 640px)');
export const isMd = mediaQuery('(min-width: 768px)');
export const isLg = mediaQuery('(min-width: 1024px)');
export const isXl = mediaQuery('(min-width: 1280px)');
export const is2xl = mediaQuery('(min-width: 1536px)');