class PageManager {
    constructor(pages) {
        this.pages = pages;
        this.presentFromURL();
        window.addEventListener('popstate', () => this.presentFromURL());
    }

    go(pageName, options) {
        history.pushState({}, window.title, this._buildURL(pageName, options));
        this.presentFromURL();
    }

    replace(pageName, options) {
        history.replaceState({}, window.title, this._buildURL(pageName, options));
        this.presentFromURL();
    }

    _buildURL(pageName, options) {
        let query = '';
        Object.keys(options).forEach((key) => {
            const value = options[key];
            if (query === '') {
                query = '?';
            } else {
                query += '&';
            }
            query += encodeURIComponent(key) + '=' + encodeURIComponent(value);
        });
        return '#' + pageName + query;
    }

    presentFromURL() {
        let pageName = "home";
        let pageOptions = {};

        let hash = location.hash;
        if (hash.startsWith('#')) {
            hash = hash.substr(1);
        }
        const hashPrefix = hash.split('?')[0];
        if (hashPrefix) {
            pageName = hashPrefix;
        }
        const hashSuffix = hash.split('?')[1];
        if (hashSuffix) {
            const parts = hashSuffix.split('&');
            parts.forEach((part) => {
                const [key, value] = part.split('=');
                if (key) {
                    pageOptions[decodeURIComponent(key)] = decodeURIComponent(value || '');
                }
            })
        }

        this.pages.forEach((p) => {
            if (p.name() === pageName) {
                p.show(pageOptions);
            } else {
                p.hide();
            }
        });
    }
}

window.pageManager = new PageManager([
    new PageHome(),
    new PageAddAccount(),
    new PageAccount(),
]);
