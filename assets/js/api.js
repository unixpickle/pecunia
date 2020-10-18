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
            if (this._cancelled) {
                return;
            }
            if (data['error']) {
                if (this._errorCallback !== null) {
                    this._errorCallback(data['error']);
                }
            } else if (this._callback !== null) {
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

class APIRequestDeleteAccount extends APIRequest {
    constructor(accountID) {
        super('/delete_account?account_id=' + encodeURIComponent(accountID));
    }
}

class APIRequestClearAccount extends APIRequest {
    constructor(accountID) {
        super('/clear_account?account_id=' + encodeURIComponent(accountID));
    }
}

class APIRequestAllTransactions extends APIRequest {
    constructor() {
        super('/all_transactions');
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

class APIRequestFilters extends APIRequest {
    constructor(accountIDOrNull) {
        if (accountIDOrNull === null) {
            super('/global_filters');
        } else {
            super('/account_filters?account_id=' + encodeURIComponent(accountIDOrNull));
        }
    }
}

class APIRequestSetFilters extends APIRequest {
    constructor(accountIDOrNull, filters) {
        let postData = "filters=" + encodeURIComponent(JSON.stringify(filters));
        if (accountIDOrNull === null) {
            super('/set_global_filters');
        } else {
            super('/set_account_filters');
            postData += '&account_id=' + accountIDOrNull;
        }
        this.postData = postData;
    }

    _fetch() {
        return fetch(this.url, {
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
            body: this.postData,
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
