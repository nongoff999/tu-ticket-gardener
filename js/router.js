/**
 * TU Ticket Gardener - Simple Router
 * Client-side hash-based routing
 */

class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;

        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    // Register a route
    register(path, handler) {
        this.routes[path] = handler;
        return this;
    }

    // Navigate to a route
    navigate(path) {
        window.location.hash = path;
    }

    // Handle current route
    handleRoute() {
        const hash = window.location.hash || '#/dashboard';
        const path = hash.replace('#', '');

        // Extract route and params
        const parts = path.split('/').filter(Boolean);
        const route = parts.length > 0 ? parts[0] : 'dashboard';
        const routePath = '/' + route;
        const params = parts.slice(1);

        // Toggle FAB Visibility
        const fab = document.getElementById('add-ticket-fab');
        if (fab) {
            if (route === 'dashboard') {
                fab.classList.remove('fab-hidden');
            } else {
                fab.classList.add('fab-hidden');
            }
        }

        if (this.routes[routePath]) {
            this.currentRoute = routePath;
            this.routes[routePath](params);
        } else {
            // Default to dashboard if route not found
            // This might cause infinite loop if /dashboard is not registered yet?
            if (window.location.hash !== '#/dashboard') {
                this.navigate('/dashboard');
            }
        }
    }

    // Get current route
    getCurrent() {
        return this.currentRoute;
    }
}

// Create router instance
const router = new Router();

// Export
window.router = router;
