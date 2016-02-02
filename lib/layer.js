module.exports = Layer;

function Layer(path, middleware) {
    this.handle = middleware;
    this.path = path;

    this.match = function(str) {
        var reg = new RegExp('^' + this.path);

        if (str.search(reg) != -1) {
            return {path: path};
        } else {
            return undefined;
        }

    }
}