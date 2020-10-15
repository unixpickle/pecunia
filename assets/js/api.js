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
        fetch(this.url).then((response) => response.json()).then((data) => {
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

    cancel() {
        if (!this._cancelled) {
            this._cancelled = true;
            if (this._finallyCallback !== null) {
                this._finallyCallback();
            }
        }
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
