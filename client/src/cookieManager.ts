/*global base.cookieHandler, canny */


var DEFAULT_LIFETIME_AS_DAYS = 365 * 5,
    DEFAULT_PATH = '/';

var cookieManager = {};

/**
 * A cookie manager for handling cookies where the cookie value is a JSON-stringified object.
 *
 * For creating a session cookie (i.e. deleted when browser closes), add a null-valued domain property to
 * cookieAttributes.
 *
 * @param cookieName
 * @param cookieAttributes: an optional object where the properties are attributes of the cookie - expireDays,
 * domain, path (if any of those is left out defaults will be used).
 * @returns {{cookieName, store: store, storeAll: storeAll, getValue: getValue, getValues: getValues}}
 * @constructor
 */
class CookieManager {
    private _cookieName;
    private lifetimeAsDays;
    private domain;
    private path;

    constructor (cookieName: any, cookieAttributes?: any) {
        this._cookieName = cookieName;
        this.lifetimeAsDays = (function() {
            if (cookieAttributes && cookieAttributes.expireDays) {
                return cookieAttributes.expireDays;
            } else if (cookieAttributes && cookieAttributes.expireDays === null) {
                return null;
            } else {
                return DEFAULT_LIFETIME_AS_DAYS;
            }
        })();

        this.domain = cookieAttributes && cookieAttributes.domain ?
            cookieAttributes.domain : this.computeCookieDomain(document.location.hostname, false);
        this.path = cookieAttributes && cookieAttributes.path ?
            cookieAttributes.path : DEFAULT_PATH;
    }

    /**
     * Extracts the cookie domain from the given hostname.
     * @param hostname
     * @param includeSubDomains if true all subdomains will be omitted
     */
    computeCookieDomain(hostname, includeSubDomains) {
        if (hostname.indexOf('gameduell') !== -1 && !includeSubDomains) {
            var hostnameParts = hostname.split('.');
            for (var i = 0; i < hostnameParts.length; i++) {
                if (hostnameParts[i] === "gameduell") {
                    // some infos about the leading dot:
                    // http://stackoverflow.com/questions/9618217/what-does-the-dot-prefix-in-the-cookie-domain-mean
                    // tl;dr: an obsolete RFC defined that a domain with a leading dot would mean "allow for
                    // subdomains, too" IE8/9 are still affected. Others should just disregard the dot (as per newer
                    // RFC)
                    return '.' + hostnameParts.splice(i).join('.');
                }
            }
        }
        return hostname;
    };



    getCookieValues(cookieName) {
        let i, currentName, currentValue,
            allCookies = window.document.cookie.split(";"),
            cookieValue = {};
        for (i = 0; i < allCookies.length; i++) {
            currentName = allCookies[i].substr(0, allCookies[i].indexOf("="));
            currentName = currentName.replace(/^\s+|\s+$/g, "");
            if (currentName === cookieName) {
                currentValue = allCookies[i].substr(allCookies[i].indexOf("=") + 1);
                try {
                  cookieValue = JSON.parse(decodeURIComponent(currentValue));
                } catch (err) {
                  cookieValue = decodeURIComponent(currentValue);
                }

            }
        }
        return cookieValue;
    }

    computeNewExpiryDateString() {
        let expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + this.lifetimeAsDays);
        return expiryDate.toUTCString();
    }

    /**
     * Update the *full* value of the cookie, incl. writing all other cookie attributes according to
     * configuration of cookie manager.
     * @param cookieValue an object where each own property is an entry in the cookie value.
     */
    updateCookie(cookieValue) {
        let cookieParts = [
            this._cookieName + '=' + encodeURIComponent(JSON.stringify(cookieValue)),
            'path=' + this.path,
            'domain=' + this.domain
        ];
        if (this.lifetimeAsDays) {
            cookieParts.push('expires=' + this.computeNewExpiryDateString());
        }

        window.document.cookie = cookieParts.join(';');
    }

    /**
     * Merge new values into existing/old values.
     * @param newCookieValues an object holding all new cookie value entries (entries may already exist
     * in existingCookieValues)
     * @param existingCookieValues an object holding all existing cookie value entries.
     * @returns {*}
     */
    mergeNewIntoOldValues(newCookieValues, existingCookieValues) {
        Object.keys(newCookieValues).forEach(function (key) {
            existingCookieValues[key] = newCookieValues[key];
        });
        return existingCookieValues;
    }

    updateCookieValues(cookieValues) {
        var oldCookieValue = this.getCookieValues(this._cookieName);
        if (Object.keys(oldCookieValue).length === 0) {
            this.updateCookie(cookieValues);
        } else {
            this.updateCookie(this.mergeNewIntoOldValues(cookieValues, oldCookieValue));
        }
    }


    isValidCookieValueEntries(entries) {
        return typeof entries === 'object' && Object.prototype.toString.call( entries ) !== '[object Array]';
    }

    get cookieName() { return this._cookieName; }
    /**
     *
     * @param key a key (String)
     * @param value a value, can be any type of object (incl. nested). value can be a JSON string but will
     *     *not*  be parsed.
     */
    store (key, value) {
        var newValue = {};
        newValue[key] = value;
        this.updateCookieValues(newValue);
    }
    /**
     *
     * @param entries an object where all own properties will be added to the cookie value (rules for values
     * from store function apply here as well). Existing entries will be overwritten. No object encoded as
     * Json string accepted, no Arrays either.
     */
    storeAll(entries) {
        if (!this.isValidCookieValueEntries(entries)) {
            throw new TypeError('cookieManager.storeAll accepts only objects (incl. no arrays), parameter was "'
                + entries + '"');
        }
        this.updateCookieValues(entries);
    }
    /**
     * Get the value of a single entry from the cookie.
     * @param key
     * @returns {*}
     */
    getValue(key) {
        return this.getCookieValues(this._cookieName)[key];
    }
    /**
     * Get all entries (as an object) from the cookie.
     * @returns {*}
     */
    getValues() {
        return this.getCookieValues(this._cookieName);
    }
}

/**
 * Factory function which produces a cookie manager for the given cookie name and config.
 * @param cookieName
 * @param cookieAttributes: see constructor documentation
 * @returns {CookieManager}
 */
export const forCookie = function(cookieName, cookieAttributes) {
    return new CookieManager(cookieName, cookieAttributes);
};

/**
 *
 * @param cookieName the name of the cookie
 * @param cookieAttributes attributes of the cookie (but note that expires attributes cannot be overwritten, it will
 * be added to that object)
 * @returns {CookieManager}
 */
export const forSessionCookie = function(cookieName: string, cookieAttributes?: Object):CookieManager {
    cookieAttributes = cookieAttributes || {};
    cookieAttributes['expireDays'] = null;
    return new CookieManager(cookieName, cookieAttributes);
};

/**
 * Convenience factory function which produces a cookie manager for the standard GD cookie.
 * @param cookieAttributes: see constructor documentation
 * @returns {CookieManager}
 */
export const forGDStandardCookie = function () {
    // TODO what is the name of the standard cookie?
    return new CookieManager('GD');
};


