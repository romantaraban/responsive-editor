var assert = chai.assert;   

describe('clear', function() {
  
  it('should remove content from editor', function() {
    editor.clear();
    assert.equal(0, editor.serialize(true).length);
  });
  
  it('should remove all content from editor', function() {
    editor.createRow();
    editor.createRow();
    editor.createRow();
    editor.clear();
    assert.equal(0, editor.serialize(true).length);
  }); 
  
  it('should not fail when there is no content', function() {
    editor.clear();
    assert.equal(0, editor.serialize(true).length);
  });
  
  
}); 

describe('createRow', function () {
  
  it('shoul be able to create new row', function () {
    editor.clear();
    editor.createRow();
    assert.equal(1, editor.serialize(true).length);
  })
  
  it('shoul be able to create row from serialized data', function () {
    editor.clear();
    editor.createRow({"collapsed":false,"class":"","id":"","style":"","columns":[{"content":"1","large":"1","medium":"1","small":"1","hideSmall":"0","hideMedium":"0","hideLarge":"0"}]});
    assert.equal(1, editor.serialize(true).length);
  })
  
  it('shoul be able to create row from loose serialized data', function () {
    editor.clear();
    editor.createRow({});
    assert.equal(1, editor.serialize(true).length);
  })
  
});

describe('serialize', function() {
  
  it('should serialize empty editor correctly', function() {
    editor.clear();
    assert.equal('[]', editor.serialize());
  }); 
  
  it('should serialize empty row correctly', function() {
    editor.clear();
    editor.createRow();
    assert.equal('[{"collapsed":false,"class":"","id":"","style":"","columns":[{"content":"%3Cp%3E%3C/p%3E","large":"12","medium":"12","small":"12","hideSmall":"0","hideMedium":"0","hideLarge":"0"}]}]', editor.serialize());
  }); 
  
}); 

describe('buildFromSerialized', function() {
  it('should not fail with different kind of data', function() {
    editor.clear();
    editor.buildFromSerialized('');
    editor.buildFromSerialized(1);
//    editor.buildFromSerialized(null);
//    editor.buildFromSerialized();
//    editor.buildFromSerialized({});
    assert.equal(0, editor.serialize(true).length);
  }); 
  
  it('should build a row from JSON ', function() {
    editor.clear();
    editor.buildFromSerialized([{"collapsed":false,"class":"","id":"","style":"","columns":[{"content":"1111111","large":"12","medium":"12","small":"12","hideSmall":"0","hideMedium":"0","hideLarge":"0"}]}]);
    assert.equal(1, editor.serialize(true).length);
  }); 
  
  it('should build a row from serialized JSON', function() {
    editor.clear();
    editor.buildFromSerialized('[{"collapsed":false,"class":"","id":"","style":"","columns":[{"content":"1111111","large":"12","medium":"12","small":"12","hideSmall":"0","hideMedium":"0","hideLarge":"0"}]}]');
    assert.equal(1, editor.serialize(true).length);
  }); 
  
  it('should build from multiple rows from serialized JSON', function() {
    editor.clear();
    editor.buildFromSerialized('[{"collapsed":false,"class":"","id":"","style":"","columns":[{"content":"1111111","large":"12","medium":"12","small":"12","hideSmall":"0","hideMedium":"0","hideLarge":"0"}]},{"collapsed":false,"class":"","id":"","style":"","columns":[{"content":"1111111","large":"12","medium":"12","small":"12","hideSmall":"0","hideMedium":"0","hideLarge":"0"}]},{"collapsed":false,"class":"","id":"","style":"","columns":[{"content":"1111111","large":"12","medium":"12","small":"12","hideSmall":"0","hideMedium":"0","hideLarge":"0"}]}]');
    assert.equal(3, editor.serialize(true).length);
  }); 
  
});
