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
    }

    name() {
        return "home";
    }

    show() {
        super.show();
        this.accounts.show();
    }

    hide() {
        super.hide();
        this.accounts.hide();
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

        this.nameField = document.getElementById('account-title');
        this.loader = document.getElementById('account-loader');
        this.errorField = document.getElementById('account-error');

        this.transactionsSection = document.getElementById('account-transactions-section');
        this.transactionsEmpty = document.getElementById('account-transactions-empty');
        this.transactions = document.getElementById('account-transactions');

        this.uploadSection = document.getElementById('account-upload-section');
        this.uploadInput = document.getElementById('account-upload-input');
        this.uploadButton = document.getElementById('account-upload-button');
        this.uploadButton.addEventListener('click', () => this.upload());

        this.account_id = null;
        this._request = null;
    }

    name() {
        return "account";
    }

    show(data) {
        super.show();
        this.account_id = data['id'];

        [
            this.nameField,
            this.transactionsSection,
            this.uploadSection,
            this.transactions,
            this.transactionsEmpty,
            this.errorField,
        ].forEach((x) => x.style.display = 'none');
        this.loader.style.display = 'block';

        const accountReq = new APIRequestAccount(data['id']);
        const transReq = new APIRequestTransactions(data['id']);

        this._request = new MultiAPIRequest([accountReq, transReq]);
        this._request.onData((accAndTrans) => {
            const [account, transactions] = accAndTrans;
            this.nameField.style.display = 'block';
            this.nameField.textContent = account['Name'];
            if (transactions.length === 0) {
                this.transactionsEmpty.style.display = 'block';
            } else {
                this.populateTransactions(transactions);
                this.transactions.style.display = 'block';
            }
            this.transactionsSection.style.display = 'block';
            this.uploadSection.style.display = 'block';
        }).onError((err) => {
            this.errorField.style.display = 'block';
            this.errorField.value = '' + err;
        }).finally(() => {
            this.loader.style.display = 'none';
        }).run();
    }

    hide() {
        super.hide();
        if (this._request) {
            this._request.cancel();
        }
    }

    populateTransactions(transactions) {
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

    upload() {
        // TODO: separate pane here.
        const formData = new FormData();
        formData.append("document", this.uploadInput.files[0]);
        fetch('/upload_transactions?account_id=' + encodeURIComponent(this.account_id), {
            method: 'POST',
            body: formData,
        }).then((resp) => resp.json()).then((resp) => {
            this.populateTransactions(resp.result);
        });
    }
}
