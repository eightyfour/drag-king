module.exports = {
    add : function (node) {
        var path = location.pathname;
        if (path[path.length - 1] !== '/') {
            path += '/';
        }
        node.addEventListener('keypress', function (e) {
            console.log('keypress', e);
            var self = this;
            if (e.charCode === 13) {
                location.href = path + this.value;
            }
            if (e.charCode === 32 || e.charCode === 47 || e.charCode === 92) {
                e.returnValue = false;
                this.classList.add('error');
                setTimeout(function () {
                    self.classList.remove('error');
                }, 300);
            }
        })
    }
}
