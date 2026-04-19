const App = {
  darkMode: {
    isDark() {
      const stored = localStorage.getItem('fitforge_dark_mode');
      if (stored !== null) return stored === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    },

    init() {
      this.set(this.isDark());
    },

    set(isDark) {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('fitforge_dark_mode', isDark);
    },

    toggle() {
      this.set(!this.isDark());
    }
  },

  toast: {
    container: null,

    init() {
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none';
        document.body.appendChild(this.container);
      }
    },

    show(message, type = 'info') {
      this.init();

      const colors = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        info: 'bg-primary-500 text-white',
        warning: 'bg-yellow-500 text-white'
      };

      const icons = {
        success: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
        error: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
        info: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        warning: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>'
      };

      const toast = document.createElement('div');
      toast.className = `pointer-events-auto min-w-[300px] max-w-md px-4 py-3 rounded-lg shadow-lg ${colors[type]} transform transition-all duration-300 translate-x-full opacity-0`;
      toast.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">${icons[type]}</div>
          <span class="flex-1 text-sm font-medium">${message}</span>
          <button class="flex-shrink-0 hover:opacity-80 transition-opacity" data-dismiss>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      `;

      this.container.appendChild(toast);

      requestAnimationFrame(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
      });

      toast.querySelector('[data-dismiss]').addEventListener('click', () => {
        this.dismiss(toast);
      });

      setTimeout(() => {
        this.dismiss(toast);
      }, 4000);

      return toast;
    },

    success(message) { return this.show(message, 'success'); },
    error(message) { return this.show(message, 'error'); },
    info(message) { return this.show(message, 'info'); },
    warning(message) { return this.show(message, 'warning'); },

    dismiss(toast) {
      if (toast && toast.parentNode) {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
          if (toast.parentNode) toast.remove();
        }, 300);
      }
    }
  },

  state: {
    store: {},
    listeners: {},

    get(key) { return this.store[key]; },

    set(key, value) {
      this.store[key] = value;
      this.notify(key, value);
    },

    subscribe(key, callback) {
      if (!this.listeners[key]) this.listeners[key] = [];
      this.listeners[key].push(callback);
      return () => {
        this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
      };
    },

    notify(key, value) {
      if (this.listeners[key]) {
        this.listeners[key].forEach(cb => cb(value));
      }
    }
  },

  navigate(path) {
    window.location.href = path;
  },

  api: {
    async fetch(url, options = {}) {
      try {
        const response = await Auth.fetch(url, options);
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Request failed: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        App.toast.error(error.message);
        throw error;
      }
    },

    get(url) { return this.fetch(url, { method: 'GET' }); },
    post(url, data) { return this.fetch(url, { method: 'POST', body: JSON.stringify(data) }); },
    put(url, data) { return this.fetch(url, { method: 'PUT', body: JSON.stringify(data) }); },
    delete(url) { return this.fetch(url, { method: 'DELETE' }); }
  },

  utils: {
    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    formatTime(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    },

    formatDateTime(dateStr) {
      return `${this.formatDate(dateStr)} ${this.formatTime(dateStr)}`;
    },

    formatNumber(num) {
      return (num === null || num === undefined) ? '-' : num.toLocaleString();
    },

    debounce(func, wait) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    },

    clamp(num, min, max) {
      return Math.min(Math.max(num, min), max);
    },

    formatDuration(seconds) {
      if (seconds < 60) return `${seconds}s`;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.darkMode.init();

  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => App.darkMode.toggle());
  }
});

window.App = App;