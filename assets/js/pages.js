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

class PageHome extends Page {
    constructor() {
        super();

        this.addButton = document.getElementById('add-account-button');
        this.addButton.addEventListener('click', () => this.addAccount());
    }

    name() {
        return "home";
    }

    addAccount() {
        window.pageManager.go('add-account', {});
    }
}

class PageAddAccount extends Page {
    constructor() {
        super();

        this.nameField = document.getElementById('add-account-name');
        this.typeField = document.getElementById('add-account-type');
        this.loader = document.getElementById('add-account-loader');
        this.submitButton = document.getElementById('add-account-submit-button');
        this.submitButton.addEventListener('click', () => this.submit());
        this.errorField = document.getElementById('add-account-error');
        this._request = null;
    }

    name() {
        return "add-account";
    }

    submit() {
        this.submitButton.classList.add('disabled-loading');
        this.nameField.classList.add('disabled-loading');
        this.typeField.classList.add('disabled-loading');
        this.loader.style.display = 'inline-block';
        this.errorField.style.display = 'none';

        const name = this.nameField.value;
        const importer = this.typeField.value;
        this._request = new APIRequestAddAccount(name, importer).onData((data) => {
            window.pageManager.replace('account', { 'id': data['ID'] });
        }).onError((err) => {
            this.errorField.innerText = '' + err;
            this.errorField.style.display = 'block';
        }).finally(() => {
            this.loader.style.display = 'none';
            this.submitButton.classList.remove('disabled-loading');
            this.nameField.classList.remove('disabled-loading');
            this.typeField.classList.remove('disabled-loading');
        }).run();
    }

    show() {
        super.show();
        this.errorField.style.display = 'none';
        this.nameField.value = '';
        this.typeField.value = 'wellsfargocsv';
    }

    hide() {
        super.hide();
        if (this._request) {
            this._request.cancel();
        }
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
