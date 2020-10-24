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

        this.accounts = new AccountsView();
        this.filters = new FilterEditorView('global-filters-section');
        this.summary = new SummaryView();

        this.filters.onChange = () => this.summary.reload();
    }

    name() {
        return "home";
    }

    show() {
        super.show();
        this.accounts.show();
        this.filters.show(null);
        this.summary.show();
    }

    hide() {
        super.hide();
        this.accounts.hide();
        this.filters.hide();
        this.summary.hide();
        if (this._accountsRequest) {
            this._accountsRequest.cancel();
        }
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

        this.title = new AccountTitleView();
        this.upload = new AccountUploadView();
        this.filters = new FilterEditorView('account-filters-section');
        this.transactions = new AccountTransactionsView();

        this.upload.onUploaded = (transactions) => {
            this.transactions.populateList(transactions);
        };
        this.title.onClear = () => {
            this.transactions.populateList([]);
        }
        this.title.onReady = () => {
            this.upload.makeVisible();
            this.filters.makeVisible();
            this.transactions.makeVisible();
        };
    }

    name() {
        return "account";
    }

    show(data) {
        super.show();
        const accountID = data.id;
        this.title.show(accountID);
        this.upload.show(accountID);
        this.filters.show(accountID);
        this.transactions.show(accountID);
        this.upload.makeInvisible();
        this.filters.makeInvisible();
        this.transactions.makeInvisible();
    }

    hide() {
        super.hide();
        this.title.hide();
        this.upload.hide();
        this.filters.hide();
        this.transactions.hide();
    }
}
