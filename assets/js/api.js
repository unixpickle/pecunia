class APIRequest {
    constructor(url, callback, errorCallback, finallyCallback) {
        this.url = url;
        this._cancelled = false;
        this._done = false;
        this._callback = null;
        this._errorCallback = null;
        this._finallyCallback = null;
    }

    onData(fn) {
        this._callback = fn;
        return this;
    }

    onError(fn) {
        this._errorCallback = fn;
        return this;
    }

    finally(fn) {
        this._finallyCallback = fn;
        return this;
    }

    run() {
        this._fetch().then((response) => response.json()).then((data) => {
            if (!this._cancelled && this._callback !== null) {
                this._callback(data['result']);
            }
        }).catch((err) => {
            if (!this._cancelled && this._errorCallback !== null) {
                this._errorCallback(err);
            }
        }).finally(() => this.cancel());
        return this;
    }

    _fetch() {
        return fetch(this.url);
    }

    cancel() {
        if (!this._cancelled) {
            this._cancelled = true;
            if (this._finallyCallback !== null) {
                this._finallyCallback();
            }
        }
    }
}

class APIRequestAccount extends APIRequest {
    constructor(accountID) {
        super('/account?account_id=' + encodeURIComponent(accountID));
    }
}

class APIRequestAccounts extends APIRequest {
    constructor() {
        super('/accounts');
    }
}

class APIRequestAddAccount extends APIRequest {
    constructor(name, importer) {
        super('/add_account?name=' + encodeURIComponent(name) +
            '&importer=' + encodeURIComponent(importer));
    }
}

class APIRequestTransactions extends APIRequest {
    constructor(accountID) {
        super('/transactions?account_id=' + encodeURIComponent(accountID));
    }
}

class APIRequestUploadTransactions extends APIRequest {
    constructor(accountID, file) {
        super('/upload_transactions?account_id=' + encodeURIComponent(accountID));
        this._formData = new FormData();
        this._formData.append('document', file);
    }

    _fetch() {
        return fetch(this.url, {
            method: 'POST',
            body: this._formData,
        });
    }
}

class MultiAPIRequest {
    constructor(requests) {
        this._requests = requests;
        this._callback = null;
        this._errorCallback = null;
        this._finallyCallback = null;
    }

    onData(fn) {
        this._callback = fn;
        return this;
    }

    onError(fn) {
        this._errorCallback = fn;
        return this;
    }

    finally(fn) {
        this._finallyCallback = fn;
        return this;
    }

    run() {
        let numDone = 0;
        let numDatas = [];
        let datas = [];
        let hadError = false;
        this._requests.forEach((req, i) => {
            req.onData((data) => {
                datas[i] = data;
                numDatas++;
                if (numDatas === this._requests.length) {
                    if (this._callback !== null) {
                        this._callback(datas);
                    }
                }
            }).onError((err) => {
                if (hadError) {
                    return;
                }
                hadError = true;
                if (this._errorCallback !== null) {
                    this._errorCallback(err);
                }
            }).finally(() => {
                numDone++;
                if (numDone === this._requests.length) {
                    if (this._finallyCallback !== null) {
                        this._finallyCallback();
                    }
                }
            }).run();
        });
    }

    cancel() {
        this._requests.forEach((r) => r.cancel());
    }
}
