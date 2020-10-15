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

        this.accountsList = document.getElementById('accounts-list');
        this.accountsListEmpty = document.getElementById('accounts-list-empty');
        this.accountsListLoader = document.getElementById('accounts-list-loader');
        this.accountsListError = document.getElementById('accounts-list-error');

        this.addButton = document.getElementById('add-account-button');
        this.addButton.addEventListener('click', () => this.addAccount());

        this._accountsRequest = null;
    }

    name() {
        return "home";
    }

    show() {
        super.show();
        this.accountsList.style.display = 'none';
        this.accountsListEmpty.style.display = 'none';
        this.accountsListLoader.style.display = 'block';
        this.addButton.classList.add('disabled-loading');
        this._accountsRequest = new APIRequestAccounts().onData((accounts) => {
            if (accounts.length === 0) {
                this.accountsListEmpty.style.display = 'block';
            } else {
                this.populateAccountsList(accounts);
                this.accountsList.style.display = 'block';
            }
        }).onError((err) => {
            this.accountsListError.style.display = 'block';
            this.accountsListError = '' + err;
        }).finally(() => {
            this.accountsListLoader.style.display = 'none';
            this.addButton.classList.remove('disabled-loading');
        }).run();
    }

    hide() {
        super.hide();
        if (this._accountsRequest) {
            this._accountsRequest.cancel();
        }
    }

    addAccount() {
        window.pageManager.go('add-account', {});
    }

    populateAccountsList(accounts) {
        this.accountsList.innerHTML = '';
        accounts.forEach((account) => {
            const element = document.createElement('li');
            element.className = 'accounts-list-account';
            const name = document.createElement('a');
            name.className = 'accounts-list-account-name';
            name.href = '#account?id=' + encodeURIComponent(account['ID']);
            name.textContent = account['Name'];
            element.appendChild(name);
            this.accountsList.appendChild(element);
        });
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
