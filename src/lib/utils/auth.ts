export const logout = async () => {
    localStorage.removeItem('token');
};