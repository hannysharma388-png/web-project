// Data Service simulating a backend with localStorage

const DataService = {
    // Keys for localStorage
    KEYS: {
        USERS: 'jis_users',
        NOTICES: 'jis_notices',
        TESTS: 'jis_tests',
        ASSIGNMENTS: 'jis_assignments',
        SESSION: 'jis_session'
    },

    // Initialize dummy data if empty
    init: function() {
        if (!localStorage.getItem(this.KEYS.USERS)) {
            const initialUsers = [
                { id: '1', name: 'System Admin', email: 'admin@jis.edu', role: 'admin', password: 'admin' },
                { id: '2', name: 'Prof. John Doe', email: 'faculty@jis.edu', role: 'faculty', password: 'faculty', department: 'Computer Science' },
                { id: '3', name: 'Alice Smith', email: 'student@jis.edu', role: 'student', password: 'student', course: 'Computer Science' }
            ];
            localStorage.setItem(this.KEYS.USERS, JSON.stringify(initialUsers));
        }
        if (!localStorage.getItem(this.KEYS.NOTICES)) {
            localStorage.setItem(this.KEYS.NOTICES, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.TESTS)) {
            localStorage.setItem(this.KEYS.TESTS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.ASSIGNMENTS)) {
            localStorage.setItem(this.KEYS.ASSIGNMENTS, JSON.stringify([]));
        }
    },

    // Generic get list
    getList: function(key) {
        return JSON.parse(localStorage.getItem(key) || '[]');
    },

    // Generic add item
    addItem: function(key, item) {
        const list = this.getList(key);
        item.id = Date.now().toString(); // Generate unique ID
        item.createdAt = new Date().toISOString();
        list.push(item);
        localStorage.setItem(key, JSON.stringify(list));
        return item;
    },

    // Generic delete item
    deleteItem: function(key, id) {
        const list = this.getList(key);
        const filtered = list.filter(item => item.id !== id.toString());
        localStorage.setItem(key, JSON.stringify(filtered));
    },

    // Specific user functions
    getUsersByRole: function(role) {
        return this.getList(this.KEYS.USERS).filter(user => user.role === role);
    },

    login: function(email, password, role) {
        const users = this.getList(this.KEYS.USERS);
        const user = users.find(u => 
            (u.email === email || u.name.toLowerCase() === email.toLowerCase()) && 
            u.password === password && 
            u.role === role
        );

        if (user) {
            localStorage.setItem(this.KEYS.SESSION, JSON.stringify(user));
            return user;
        }
        return null;
    },

    logout: function() {
        localStorage.removeItem(this.KEYS.SESSION);
    },

    getCurrentUser: function() {
        const session = localStorage.getItem(this.KEYS.SESSION);
        return session ? JSON.parse(session) : null;
    }
};

// Initialize on load
DataService.init();
