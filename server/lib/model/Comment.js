/**
 *
 * @type {Comment}
 */
module.exports = class Comment {

    /**
     *
     * @param {Object} comment
     * @param {boolean} comment.approved
     * @param {string} comment.comment
     * @param {string} comment.image
     * @param {string} comment.link
     * @param {string} comment.reporter
     */
    constructor(comment) {
        this.approved = comment.approved;
        this.comment = comment.comment;
        this.image = comment.image;
        this.link = comment.link;
        this.reporter = comment.reporter;

        this.time = (new Date()).getTime();
    }
}