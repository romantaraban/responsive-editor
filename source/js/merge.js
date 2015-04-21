/**
 * Merge. Helper for recursive object merging.
 * Accepts two or more object and recursively copies theirs properties into the first object.
 * @param {object} obj, [obj2, ...]
 */

var merge = function(obj) {
  // if only one object  - return it
  if (arguments.length > 1) {
    // go throughout all arguments
    for (var x = 1, l = arguments.length; x < l; x++) {
      // if argument is object
      if (typeof(arguments[x]) === 'object') {
        // iterate its properties
        for (var prop in arguments[x]) {
          if (arguments[x].hasOwnProperty(prop)) {
            // if this property is an object and there and origin object has property with same name and type
            if (typeof(arguments[x][prop]) === 'object' && obj[prop] && typeof(obj[prop]) === 'object') {
              merge(obj[prop], arguments[x][prop]);
            } else {
              obj[prop] = arguments[x][prop];
            }
          }
        }
      }
    }
  }
  return obj;
};

module.exports = merge;
