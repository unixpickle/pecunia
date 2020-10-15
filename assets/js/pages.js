class Page {
    constructor() {
        this.element = document.getElementById('page-' + this.name());
    }

    name() {
        throw Error('not implemented');
    }

    show(options) {
        this.element.style.display = 'block';
    }

    hide() {
        this.element.style.display = 'none';
    }
}

class PageManager {
    constructor(pages) {
        this.pages = pages;
        this.presentFromURL();
        window.addEventListener('popstate', () => this.presentFromURL());
    }

    go(pageName, options) {
        let hash = '';
        Object.keys(options).forEach((key) => {
            const value = options[key];
            if (hash === '') {
                hash = '?';
            } else {
                hash += '&';
            }
            hash += encodeURIComponent(key) + '=' + encodeURIComponent(value);
        });
        history.pushState({}, window.title, '/' + pageName + '#' + hash);
    }

    presentFromURL() {
        let pageName = "home";
        let pageOptions = {};

        const hash = location.hash;
        const hashPrefix = hash.split('?')[0];
        if (hashPrefix) {
            pageName = hashPrefix;
        }
        const hashSuffix = hash.split('?')[1];
        if (hashSuffix) {
            const parts = hashSuffix.split('&');
            parts.forEach((part) => {
                const [key, value] = parts.split('=');
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

class PageHome extends Page {
    constructor() {
        super();
    }

    name() {
        return "home";
    }
}

class PageAddAccount extends Page {
    constructor() {
        super();
    }

    name() {
        return "add-account";
    }
}

class PageAccount extends Page {
    constructor() {
        super();
    }

    name() {
        return "account";
    }
}

window.pageManager = new PageManager([
    new PageHome(),
    new PageAddAccount(),
    new PageAccount(),
]);
