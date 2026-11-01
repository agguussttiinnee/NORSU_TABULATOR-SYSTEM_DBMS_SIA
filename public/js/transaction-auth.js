/* Shared Transactions authentication helper.
 * Montessa's login page should save its JWT as localStorage.norsuToken.
 */
(function () {
    const TOKEN_KEY = 'norsuToken';
    const LOGIN_PATH = document.documentElement.dataset.loginPath || '/login.html';

    function currentToken() {
        return localStorage.getItem(TOKEN_KEY) || '';
    }

    function redirectToLogin() {
        const returnTo = window.location.pathname + window.location.search + window.location.hash;
        const separator = LOGIN_PATH.includes('?') ? '&' : '?';
        window.location.replace(`${LOGIN_PATH}${separator}returnUrl=${encodeURIComponent(returnTo)}`);
    }

    function clearSession() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('norsuUser');
    }

    async function requireAdmin() {
        const token = currentToken();
        if (!token) {
            redirectToLogin();
            throw new Error('Redirecting to the shared login page.');
        }

        let response;
        try {
            response = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (_) {
            throw new Error('Cannot reach the server. Make sure the NORSU API is running.');
        }

        const payload = await response.json().catch(() => ({}));
        if (response.status === 401 || !response.ok || payload.success === false) {
            clearSession();
            redirectToLogin();
            throw new Error('Your session expired. Redirecting to login.');
        }

        if (!payload.data || payload.data.role !== 'admin') {
            throw new Error('Administrator access is required for Transactions.');
        }

        return payload.data;
    }

    async function api(path, options = {}) {
        const token = currentToken();
        if (!token) {
            redirectToLogin();
            throw new Error('Please log in first.');
        }

        const headers = {
            ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`
        };

        const response = await fetch(`/api${path}`, { ...options, headers });
        const payload = await response.json().catch(() => null);

        if (response.status === 401) {
            clearSession();
            redirectToLogin();
            throw new Error('Your session expired. Redirecting to login.');
        }

        if (!response.ok || !payload || payload.success === false) {
            throw new Error((payload && payload.message) || `Request failed (${response.status})`);
        }

        return payload.data;
    }

    function logout() {
        clearSession();
        redirectToLogin();
    }

    window.NorsuTransaction = { api, requireAdmin, logout, currentToken };
})();
