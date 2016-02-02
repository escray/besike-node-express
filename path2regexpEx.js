var p2re = require("path-to-regexp");

re = p2re("/foo");

console.log(re);
console.log(re.test("/foo"));
console.log(re.test("/foo/"));
console.log(re.test("/fooo"));
console.log(re.test("/foo/bar"));

re = p2re("/foo/:a/:b");

console.log(re);

console.log(m = re.exec("/foo/apple/samsung"));

var names = [];
re = p2re("/foo/:a/:b", names);

console.log(re);

console.log("names");
console.log(names);

names = [];

re = p2re("/foo/:a/:b", names, {end:true});
console.log(re.test("/foo/apple/samsung"));
console.log(re.test("/foo/apple/samsung/Xiaomi"));