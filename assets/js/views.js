class View {
    show() {
    }

    hide() {
    }
}

class AccountsView extends View {
    constructor() {
        super();

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