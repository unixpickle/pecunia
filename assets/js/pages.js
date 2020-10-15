class Page {
    constructor() {
        this.element = document.getElementById('page-' + this.name());
    }

    name() {
        throw Error('not implemented');
    }

    show(options) {
        this.element.display = 'block';
    }

    hide() {
        this.element.display = 'none';
    }
}

class PageManager {
    constructor(pages) {
        this.pages = pages;
        this.presentFromURL();
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

        pages.forEach((p) => {
            if (p.name() === pageName) {
                p.show(pageOptions);
            } else {
                p.hide();
            }
        });
    }
}

class PageHome {
    constructor() {
        super();
    }

    name() {
        return "home";
    }
}

class PageAddAccount {
    constructor() {
        super();
    }

    name() {
        return "add-account";
    }
}

class PageAccount {
    constructor() {
        super();
    }

    name() {
        return "account";
    }
}
