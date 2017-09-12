/**
 *
 * @type {StyleguideJSON}
 */
module.exports = class StyleguideJSON {
    constructor(jsonObj) {
        this.styleguideId   = jsonObj.styleguideId;
        this.timeStamp  = jsonObj.timeStamp;
        this.approved   = jsonObj.approved;
        this.comments   = jsonObj.comments;
        this.labels     = jsonObj.labels;
        this.dysis      = jsonObj.dysis;
        this.specs      = jsonObj.specs;
    }
}