var assert = chai.assert;   


describe('serialize', function() {
  it('should serialize empty row correctly', function() {
    assert.equal('[{"collapsed":false,"class":"","id":"","style":"","columns":[{"content":"%3Cp%3E%3C/p%3E","large":"12","medium":"12","small":"12","hideSmall":"0","hideMedium":"0","hideLarge":"0"}]}]', editor.serialize());
  }); 
});  
