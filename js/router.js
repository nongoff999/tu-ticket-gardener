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
        const [route, ...params] = path.split('/').filter(Boolean);
        const routePath = '/' + route;

        if (this.routes[routePath]) {
            this.currentRoute = routePath;
            this.routes[routePath](params);
        } else {
            // Default to dashboard
            this.navigate('/dashboard');
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
