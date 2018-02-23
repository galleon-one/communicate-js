export default class Communicate {

    _server = null;
    _account = null;
    _user = null;
    _subaccount = null;
    _subuser = null;
    _rights = 'user';

    _mode = null;
    _password = null;
    _apikey = null;
    _hash = null;

    _xdebug = null;

    constructor (initialSettings = {}) {
        // Copy the initial settings to the object
        Object.keys(initialSettings).forEach(key=>{
            this[`_${key}`] = initialSettings[key];
        })
    }

    get server() {
        return this._server;
    }

    set server(value) {
        this._server = value;
    }

    get account() {
        return this._account;
    }

    set account(value) {
        this._account = value;
    }

    get user() {
        return this._user;
    }

    set user(value) {
        this._user = value;
    }

    get subaccount() {
        return this._subaccount;
    }

    set subaccount(value) {
        this._subaccount = value;
    }

    get subuser() {
        return this._subuser;
    }

    set subuser(value) {
        this._subuser = value;
    }

    get mode() {
        return this._mode;
    }

    set mode(value) {
        this._mode = value;
    }

    get password() {
        return this._password;
    }

    set password(value) {
        this._password = value;
        this._hash = null;
        this._apikey = null;
        this._mode = 'password';
    }

    get apikey() {
        return this._apikey;
    }

    set apikey(value) {
        this._apikey = value;
        this._hash = null;
        this._password = null;
        this._mode = 'apikey';
    }

    get hash() {
        return this._hash;
    }

    set hash(value) {
        this._hash = value;
        this._apikey = null;
        this._password = null;
        this._mode = 'hash';
    }

    get rights() {
        return this._rights;
    }

    set rights(value) {
        this._rights = value;
    }

    get xdebug() {
        return this._xdebug;
    }

    set xdebug(value) {
        this._xdebug = value;
    }

    /**
     * Set the username and rights level to user
     * @param user
     */
    callAsUser (user) {
        this.user = user;
        this.subaccount = null;
        this.rights = 'user';
    }

    /**
     * Set the subaccount and rights level to subuser
     * @param subaccount
     */
    callAdSubuser (subaccount) {
        this.user = 'user';
        this.subaccount = subaccount;
        this.rights = 'subuser';
    }

    /**
     * Set the mode to anonymous
     */
    callAsAnonymous () {
        this.user = 'anonymous';
        this.rights = 'anonymous';
        this.subaccount = null;
        this.password = null;
        this.hash = null;
        this.apikey = null;
        this.mode = 'none';
    }

    /**
     * Sets the call mode and its value
     * @param mode is either hash, apikey, password
     * @param value
     */
    callMode ( mode, value ) {
        let modes = ['hash', 'apikey', 'password'];
        if (
            modes.indexOf(mode) === -1
        ) {
            throw new Error(`${mode} is not a valid mode: ${modes.join(', ')}`)
        }

        this[mode] = value;
    }

    /**
     * Checks if you can execute the call method
     * @param module
     * @param method
     * @param parameters
     * @param fetchOptions
     */
    canCall (module, method, parameters = {}, fetchOptions = {}) {
        // Url
        if ( module && typeof module === 'string' ) {
            throw new Error('Module is required');
        }
        if ( method && typeof method === 'string' ) {
            throw new Error('Module is required');
        }
        if ( this.server && typeof this.server === 'string' ) {
            throw new Error('Server is required');
        }

        // Auth
        if ( this.account && typeof this.account === 'string' ) {
            throw new Error('Account is required');
        }
        if ( this.mode && typeof this.mode === 'string' ) {
            throw new Error('Mode is required');
        }
        if ( this.rights && typeof this.rights === 'string' ) {
            throw new Error('Rights is required');
        }
    }

    /**
     * Gets the authentication needed to make a call
     * @return {{account: *, mode: *, rights: *, user: *}}
     * @private
     */
    _getAuth () {
        let auth = {
            account: this.account,
            mode: this.mode,
            rights: this.rights,
            user: this.user,
        };

        if ( this.rights === 'subuser' ) {
            auth['subaccount'] = this.subaccount;
        }

        auth[this.mode] = this[this.mode];

        return auth;
    }

    /**
     * Serializes data
     * @param object
     * @param prefix
     * @return {string}
     * @private
     */
    _serializeData (object, prefix) {
        let string = [];
        for (let objectItem in object) {
            let additionalPrefix = prefix ? `${prefix}[${objectItem}]` : objectItem;
            let objectOrString = object[objectItem];
            string.push(typeof objectOrString == "object" ?
                this._serializeData(objectOrString, additionalPrefix) :
                encodeURIComponent(additionalPrefix) + "=" + encodeURIComponent(objectOrString));
        }
        return string.join('&')
    }

    /**
     * Call the given method on the UPX server
     * @param module
     * @param method
     * @param parameters
     * @param fetchOptions
     * @return {Promise<Response>}
     */
    async call (module, method, parameters = {}, fetchOptions = {}) {
        this.canCall(module, method, parameters, fetchOptions);
        let url = `${this.server}/?action=request&api=json&module=${module}&instance=0&function=${method}`
        +this.xdebug?`&XDEBUG_SESSION_START=${this.xdebug}`:'';
        return fetch(url, Object.assign({}, {
            cache: 'no-cache',
            method: 'POST',

            body: this._serializeData({
                param: parameters,
                auth: this._getAuth(),
            })
        }, fetchOptions))
    }
}
