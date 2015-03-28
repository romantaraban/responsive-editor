// load assertion module
var assert = require('assert');

// load modules from out app
var math = require('../source/js/main.js'); 

// examples
describe('serialize', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1, 2, 3].indexOf(22));
      assert.equal(-1, [1, 2, 3].indexOf(9));
    }); 
    it('should return correct index when value is present', function() {
      assert.equal(0, [1, 2, 3].indexOf(1));
      assert.equal(2, [1, 2, 3].indexOf(3));
    });
  });
});

