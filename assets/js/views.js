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
        this._request = new APIRequestAccounts();
        this._request.onData((accounts) => {
            if (accounts.length === 0) {
                this.empty.style.display = 'block';
            } else {
                this.populateList(accounts);
                this.list.style.display = 'block';
            }
            this.addButton.style.display = 'block';
        }).runView(
            this.loader,
            this.error,
            [this.addButton, this.list, this.empty],
            null,
        );
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
        this.onClear = () => null;

        this.title = this.element.getElementsByClassName('section-title')[0];
        this.loader = this.element.getElementsByClassName('loader')[0];
        this.error = this.element.getElementsByClassName('error-message')[0];
        this.buttonSet = this.element.getElementsByClassName('button-set')[0];
        this.deleteButton = this.element.getElementsByClassName('delete-button')[0];
        this.clearButton = this.element.getElementsByClassName('clear-button')[0];

        this.deleteButton.addEventListener('click', () => this.deleteAccount());
        this.clearButton.addEventListener('click', () => this.clearAccount());

        this._account = null;
        this._request = null;
    }

    show(accountID) {
        this._request = new APIRequestAccount(accountID);
        this._request.onData((account) => {
            this._account = account;
            this.title.style.display = 'block';
            this.title.textContent = account['Name'];
            this.buttonSet.style.display = 'block';
            this.onReady();
        }).runView(
            this.loader,
            this.error,
            [this.title, this.buttonSet],
            null,
        );
    }

    hide() {
        if (this._request) {
            this._request.cancel();
        }
        this._account = null;
    }

    deleteAccount() {
        this.runUpdateRequest('Do you really want to delete this account?',
            APIRequestDeleteAccount, () => pageManager.go('home', {}));
    }

    clearAccount() {
        this.runUpdateRequest('Do you really want to clear all transactions in this account?',
            APIRequestClearAccount, () => this.onClear());
    }

    runUpdateRequest(message, requestClass, onDone) {
        if (this._account === null) {
            return;
        }
        if (!confirm(message)) {
            return;
        }
        this._request = new requestClass(this._account['ID']);
        this._request.onData(() => {
            onDone();
        }).finally(() => {
            this.title.style.display = 'block';
            this.buttonSet.style.display = 'block';
        }).runView(
            this.loader,
            this.error,
            [this.buttonSet, this.title],
            null,
        );
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

    show(accountID) {
        this._request = new APIRequestTransactions(accountID);
        this._request.onData((transactions) => {
            this.populateList(transactions);
        }).runView(
            this.loader,
            this.error,
            [this.empty, this.transactions],
            null,
        );
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
        this.transactions.style.display = 'table';
        fillTransactionsTable(this.transactions, transactions);
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
        this._accountID = null;
    }

    show(accountID) {
        this._accountID = accountID;
        this.input.value = '';
    }

    hide() {
        if (this._request) {
            this._request.cancel();
        }
    }

    upload() {
        if (this.input.files.length === 0) {
            alert('No files selected!');
            return;
        }
        const file = this.input.files[0];
        this._request = new APIRequestUploadTransactions(this._accountID, file);
        this._request.onData((transactions) => {
            this.onUploaded(transactions);
        }).runView(
            this.loader,
            this.error,
            null,
            [this.input, this.button],
        );
    }
}

class FilterEditorView extends View {
    constructor(sectionID) {
        const section = document.getElementById(sectionID);
        super(section);

        this.generated = section.getElementsByClassName('filter-editor')[0];

        this.onChange = () => null;

        this.container = document.createElement('div');
        this.container.style.display = 'none';
        this.generated.appendChild(this.container);

        this.createSections();

        this.saveButton = document.createElement('button');
        this.saveButton.className = 'filter-editor-save-button';
        this.saveButton.textContent = 'Save filters';
        this.saveButton.addEventListener('click', () => this.save());
        this.container.appendChild(this.saveButton);

        this.expandButton = document.createElement('button');
        this.expandButton.className = 'filter-editor-expand';
        this.expandButton.addEventListener('click', () => this.toggleExpand());
        this.expandButton.textContent = 'Show filter editor';
        this.generated.appendChild(this.expandButton);

        this.error = document.createElement('div');
        this.error.className = 'error-message';
        this.generated.appendChild(this.error);

        this.loader = document.createElement('div');
        this.loader.className = 'loader';
        this.generated.appendChild(this.loader);

        this._accountID = null;
        this._request = null;
    }

    createSections() {
        this.patternSection = new FilterEditorSection('Exclude patterns', FieldEditorPatternField);
        this.container.appendChild(this.patternSection.element);

        this.categorySection = new FilterEditorSection('Categorize', FieldEditorCategoryField);
        this.container.appendChild(this.categorySection.element);

        this.replaceSection = new FilterEditorSection('Edit description', FieldEditorReplaceField);
        this.container.appendChild(this.replaceSection.element);
    }

    toggleExpand() {
        if (this.container.style.display === 'none') {
            this.container.style.display = 'block';
            this.expandButton.textContent = 'Hide filter editor';
        } else {
            this.container.style.display = 'none';
            this.expandButton.textContent = 'Show filter editor';
        }
    }

    show(accountID) {
        this._accountID = accountID;

        this._request = new APIRequestFilters(accountID);
        this._request.onData((filterData) => {
            this.loadFilterData(filterData);
            this.expandButton.style.display = 'block';
            this.expandButton.textContent = 'Show filter editor';
            this.container.style.display = 'none';
        }).runView(
            this.loader,
            this.error,
            [this.container, this.expandButton],
            null,
        );
    }

    hide() {
        if (this._request) {
            this._request.cancel();
        }
    }

    save() {
        const data = {
            'PatternFilters': this.patternSection.save(),
            'CategoryFilters': this.categorySection.save(),
            'ReplaceFilters': this.replaceSection.save(),
        };

        this._request = new APIRequestSetFilters(this._accountID, data);
        this._request.onData((filterData) => {
            this.loadFilterData(filterData);
            this.onChange();
        }).runView(
            this.loader,
            this.error,
            null,
            [this.expandButton, this.container],
        );
    }

    loadFilterData(filterData) {
        this.patternSection.load(filterData['PatternFilters']);
        this.categorySection.load(filterData['CategoryFilters']);
        this.replaceSection.load(filterData['ReplaceFilters']);
    }
}

class SummaryView extends View {
    constructor() {
        super(document.getElementById('summary-section'));

        this.content = this.element.getElementsByClassName('summary-content')[0];
        this.loader = this.element.getElementsByClassName('loader')[0];
        this.error = this.element.getElementsByClassName('error-message')[0];

        this.timespan = this.element.getElementsByClassName('summary-timespan')[0];
        this.timespan.addEventListener('change', () => this.populateContent());
        this.totalIncome = this.element.getElementsByClassName('summary-total-income')[0];
        this.totalExpenses = this.element.getElementsByClassName('summary-total-expenses')[0];
        this.barGraph = this.element.getElementsByClassName('summary-content-bar-graph')[0];
        this.legend = this.element.getElementsByClassName('summary-content-legend')[0];
        this.expandButton = this.element.getElementsByClassName('summary-expand')[0];
        this.transactions = this.element.getElementsByClassName('transactions')[0];

        this._data = null;
        this._request = null;
    }

    show() {
        this._request = new APIRequestAllTransactions();
        this._request.onData((transactions) => {
            this.content.style.display = 'block';
            this._data = transactions;
            this.populateContent();
        }).runView(
            this.loader,
            this.error,
            [this.content],
            null,
        );
    }

    hide() {
        if (this._request) {
            this._request.cancel();
        }
        this._data = null;
    }

    reload() {
        this.hide();
        this.show();
    }

    populateContent() {
        if (!this._data) {
            return;
        }

        const spanValue = this.timespan.value;
        let spanMillis = 24 * 60 * 60 * 1000;
        if (spanValue === 'days7') {
            spanMillis *= 7;
        } else if (spanValue === 'days28') {
            spanMillis *= 28;
        } else if (spanValue === 'days90') {
            spanMillis *= 90;
        } else if (spanValue === 'all') {
            spanMillis = Infinity;
        }
        const firstDate = new Date().getTime() - spanMillis;
        const transactions = this._data.filter((x) => {
            return new Date(x['Time']).getTime() >= firstDate;
        });

        this.createBarGraph(transactions);
        this.createUnknownTransactionTable(transactions);
    }

    createBarGraph(transactions) {
        const categories = {};
        transactions.forEach((x) => {
            categories[x['Category']] = (categories[x['Category']] || 0) + x['Amount'];
        });
        let totalAmount = 0;
        let totalIncome = 0;
        Object.keys(categories).forEach((k) => {
            if (categories[k] > 0) {
                totalIncome += categories[k];
                delete categories[k];
            } else {
                totalAmount += categories[k];
            }
        });
        this.totalIncome.textContent = formatMoney(totalIncome);
        this.totalExpenses.textContent = formatMoney(totalAmount);

        const keys = Object.keys(categories);
        keys.sort((a, b) => {
            return categories[a] - categories[b];
        });


        this.barGraph.innerHTML = '';
        this.legend.innerHTML = '';

        const colors = createColorScheme(keys.length);

        keys.forEach((k, i) => {
            const color = colors[i];
            const fraction = categories[k] / totalAmount;
            const bar = document.createElement('div');
            bar.className = 'summary-content-bar';
            bar.style.width = (fraction * 100).toFixed(3) + '%';
            bar.style.backgroundColor = color;
            bar.title = (k || 'Unknown') + ': ' + formatMoney(categories[k]);
            this.barGraph.appendChild(bar);
            const legendItem = document.createElement('div');
            legendItem.className = 'summary-content-legend-item';
            legendItem.title = bar.title;
            const swatch = document.createElement('div');
            swatch.className = 'summary-content-swatch';
            swatch.style.backgroundColor = color;
            legendItem.appendChild(swatch);
            const label = document.createElement('label');
            label.textContent = k || 'Unknown';
            legendItem.appendChild(label);
            this.legend.appendChild(legendItem);
        });
    }

    createUnknownTransactionTable(transactions) {
        const unknown = transactions
            .filter((x) => x['Category'] === '')
            .sort((x, y) => Math.abs(x['Amount']) - Math.abs(y['Amount']));
        if (unknown.length === 0) {
            return;
        }
        let smallUnknown = unknown;
        if (unknown.length > 5) {
            smallUnknown = unknown.slice(unknown.length - 5);
        }

        fillTransactionsTable(this.transactions, smallUnknown);

        if (smallUnknown.length === unknown.length) {
            this.expandButton.style.display = 'none';
            return;
        }

        this.expandButton.style.display = 'inline-block';
        this.expandButton.textContent = 'Show all';
        this.expandButton.onclick = () => {
            if (this.expandButton.textContent === 'Show all') {
                this.expandButton.textContent = 'Show less';
                fillTransactionsTable(this.transactions, unknown);
            } else {
                this.expandButton.textContent = 'Show all';
                fillTransactionsTable(this.transactions, smallUnknown);
            }
        };
    }
}

function fillTransactionsTable(table, transactions) {
    table.innerHTML = '<tr><th>Date</th><th>Amount</th><th>About</th></tr>';
    transactions.slice().reverse().forEach((trans) => {
        const row = document.createElement('tr');
        ['Time', 'Amount', 'Description'].forEach((k) => {
            const col = document.createElement('td');
            if (k === 'Amount') {
                col.textContent = formatMoney(trans[k]);
            } else if (k === 'Time') {
                const date = new Date(trans[k]);
                col.textContent = formatDate(date);
            } else {
                col.textContent = trans[k];
            }
            row.appendChild(col);
        });
        table.appendChild(row);
    });
}

function formatMoney(cents) {
    if (cents < 0) {
        return '-' + formatMoney(-cents);
    }
    return '$' + (cents / 100).toFixed(2);
}

function formatDate(date) {
    // https://stackoverflow.com/questions/11591854/format-date-to-mm-dd-yyyy-in-javascript
    var year = date.getFullYear();

    var month = (1 + date.getMonth()).toString();
    month = month.length > 1 ? month : '0' + month;

    var day = date.getDate().toString();
    day = day.length > 1 ? day : '0' + day;

    return month + '/' + day + '/' + year;
}

function createColorScheme(numColors) {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        const hue = i / numColors;
        const rgb = HSVtoRGB(hue, 0.65, 0.9);
        let color = '#';
        [rgb.r, rgb.g, rgb.b].forEach((comp) => {
            if (comp < 16) {
                color += '0';
            }
            color += comp.toString(16);
        });
        colors.push(color);
    }
    for (let i = 0; i + 1 < numColors; i += 2) {
        [colors[i], colors[i + 1]] = [colors[i + 1], colors[i]];
    }
    return colors;
}

function HSVtoRGB(h, s, v) {
    // https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
    var r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}
