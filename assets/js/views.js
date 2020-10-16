class View {
    constructor(element) {
        this.element = element;
    }

    show() {
    }

    hide() {
    }

    makeVisible() {
        this.element.style.display = 'block';
    }

    makeInvisible() {
        this.element.style.display = 'none';
    }
}

class AccountsView extends View {
    constructor() {
        super(document.getElementById('accounts-section'));

        this.list = document.getElementById('accounts-list');
        this.empty = document.getElementById('accounts-list-empty');
        this.loader = document.getElementById('accounts-list-loader');
        this.error = document.getElementById('accounts-list-error');
        this.addButton = document.getElementById('add-account-button');
        this.addButton.addEventListener('click', () => this.addAccount());

        this._request = null;
    }

    show() {
        this.list.style.display = 'none';
        this.empty.style.display = 'none';
        this.error.style.display = 'none';
        this.addButton.style.display = 'none';
        this.loader.style.display = 'block';
        this._request = new APIRequestAccounts().onData((accounts) => {
            if (accounts.length === 0) {
                this.empty.style.display = 'block';
            } else {
                this.populateList(accounts);
                this.list.style.display = 'block';
            }
            this.addButton.style.display = 'block';
        }).onError((err) => {
            this.error.style.display = 'block';
            this.error.textContent = '' + err;
        }).finally(() => {
            this.loader.style.display = 'none';
        }).run();
    }

    hide() {
        if (this._request) {
            this._request.cancel();
        }
    }

    addAccount() {
        window.pageManager.go('add-account', {});
    }

    populateList(accounts) {
        this.list.innerHTML = '';
        accounts.forEach((account) => {
            const element = document.createElement('li');
            element.className = 'accounts-list-account';
            const name = document.createElement('a');
            name.className = 'accounts-list-account-name';
            name.href = '#account?id=' + encodeURIComponent(account['ID']);
            name.textContent = account['Name'];
            element.appendChild(name);
            this.list.appendChild(element);
        });
    }
}

class AccountTitleView extends View {
    constructor() {
        super(document.getElementById('account-title-section'));

        this.onReady = () => null;

        this.title = this.element.getElementsByClassName('page-title')[0];
        this.loader = this.element.getElementsByClassName('loader')[0];
        this.error = this.element.getElementsByClassName('error-message')[0];

        this._account = null;
        this._request = null;
    }

    show(account_id) {
        this.title.style.display = 'none';
        this.error.style.display = 'none';
        this.loader.style.display = 'block';

        this._request = new APIRequestAccount(account_id);
        this._request.onData((account) => {
            this._account = account;
            this.title.style.display = 'block';
            this.title.textContent = account['Name'];
            this.onReady();
        }).onError((err) => {
            this.error.style.display = 'block';
            this.error.textContent = '' + err;
        }).finally(() => {
            this.loader.style.display = 'none';
        }).run();
    }

    hide() {
        if (this._request) {
            this._request.cancel();
        }
    }
}

class AccountTransactionsView extends View {
    constructor() {
        super(document.getElementById('account-transactions-section'));

        this.loader = this.element.getElementsByClassName('loader')[0];
        this.error = this.element.getElementsByClassName('error-message')[0];
        this.empty = this.element.getElementsByClassName('empty-list')[0];
        this.transactions = this.element.getElementsByClassName('transactions')[0];

        this._request = null;
    }

    show(account_id) {
        this.error.style.display = 'none';
        this.empty.style.display = 'none';
        this.transactions.style.display = 'none';
        this.loader.style.display = 'block';

        this._request = new APIRequestTransactions(account_id);
        this._request.onData((transactions) => {
            this.populateList(transactions);
        }).onError((err) => {
            this.error.style.display = 'block';
            this.error.textContent = '' + err;
        }).finally(() => {
            this.loader.style.display = 'none';
        }).run();
    }

    hide() {
        if (this._request) {
            this._request.cancel();
        }
    }

    populateList(transactions) {
        if (this._request) {
            // If some other view updates the transactions, we
            // don't want to continue requesting them.
            this._request.cancel();
        }

        if (transactions.length === 0) {
            this.empty.style.display = 'block';
            this.transactions.style.display = 'none';
            return;
        }
        this.empty.style.display = 'none';
        this.transactions.style.display = 'block';

        this.transactions.innerHTML = '<tr><th>Date</th><th>Amount</th><th>About</th></tr>';
        transactions.reverse().forEach((trans) => {
            const row = document.createElement('tr');
            ['Time', 'Amount', 'Description'].forEach((k) => {
                const col = document.createElement('td');
                col.textContent = trans[k];
                row.appendChild(col);
            });
            this.transactions.appendChild(row);
        });
    }
}

class AccountUploadView extends View {
    constructor() {
        super(document.getElementById('account-upload-section'));

        this.onUploaded = (transactions) => null;

        this.input = this.element.getElementsByClassName('file-input')[0];
        this.button = this.element.getElementsByClassName('upload-button')[0];
        this.loader = this.element.getElementsByClassName('loader')[0];
        this.error = this.element.getElementsByClassName('error-message')[0];

        this.button.addEventListener('click', () => this.upload());

        this._request = null;
        this._account_id = null;
    }

    show(account_id) {
        this._account_id = account_id;
        // TODO: clear the upload input, reset the state, etc.
    }

    hide() {
        if (this._request) {
            this._request.cancel();
        }
    }

    upload() {
        // TODO: check if a file has been selected.

        this.loader.style.display = 'block';
        this.error.style.display = 'none';
        this.input.classList.add('disabled-loading');
        this.button.classList.add('disabled-loading');

        const file = this.input.files[0];
        this._request = new APIRequestUploadTransactions(this._account_id, file);
        this._request.onData((transactions) => {
            this.onUploaded(transactions);
        }).onError((err) => {
            this.error.style.display = 'block';
            this.error.textContent = '' + err;
        }).finally(() => {
            this.loader.style.display = 'none';
            this.input.classList.remove('disabled-loading');
            this.button.classList.remove('disabled-loading');
        }).run();
    }
}
