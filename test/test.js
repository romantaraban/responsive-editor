var assert = chai.assert;
var clickEvent = new Event('click', {bubbles: true, cancelable: true});

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

describe('createRow', function() {
  
  it('shoul be able to create new row', function() {
    editor.clear();
    editor.createRow();
    assert.equal(1, editor.serialize(true).length);
  })
  
  it('shoul be able to create row from serialized data', function() {
    editor.clear();
    editor.createRow({"collapsed":false,"class":"","id":"","style":"","columns":[{"content":"1","large":"1","medium":"1","small":"1","hideSmall":"0","hideMedium":"0","hideLarge":"0"}]});
    assert.equal(1, editor.serialize(true).length);
  })
  
  it('shoul be able to create row from loose serialized data', function() {
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
    editor.buildFromSerialized(null);
    editor.buildFromSerialized();
    editor.buildFromSerialized({});
    editor.buildFromSerialized(/a[0-9]/);
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

describe('UI', function() {
  
  describe('Add rows', function() {
    
    it('Button is present on screen', function() {
      assert.equal(1, editor.el.querySelectorAll('.row-add').length);
    });
    
    it('Click on .row-add should add new row', function() {
      editor.clear();
      editor.el.querySelector('.row-add').dispatchEvent(clickEvent);
      assert.equal(1, editor.serialize(true).length);
    });
    
    it('Multiple click on .row-add should add multiple rows', function() {
      editor.clear();
      var button = editor.el.querySelector('.row-add');
      button.dispatchEvent(clickEvent);
      button.dispatchEvent(clickEvent);
      assert.equal(2, editor.serialize(true).length);
    });
    
  });
  
  describe('Remove rows', function() {
    
    it('Button is present row', function() {
      editor.clear();
      editor.createRow();
      assert.equal(1, editor.el.querySelector('.editor-row').querySelectorAll('.row-remove').length)
    })
    
    it('Click on button removes row', function() {
      editor.clear();
      editor.createRow();
      var button = editor.el.querySelector('.row-remove').dispatchEvent(clickEvent);
      assert.equal(0, editor.el.querySelectorAll('.editor-row').length)
    })
    
    it('Click on button removes only parent row', function() {
      editor.clear();
      editor.createRow();
      editor.createRow();
      editor.el.querySelector('.row-remove').parentElement.classList.add('test-remove-row');
      var button = editor.el.querySelector('.test-remove-row .row-remove').dispatchEvent(clickEvent);
      assert.equal(1, editor.el.querySelectorAll('.editor-row').length)
    })
    
  });
  
  describe('Add columns', function() {
    it('Button is present on screen', function() {
      editor.clear();
      editor.createRow();
      assert.equal(1, editor.el.querySelectorAll('.column-add').length);
    });
    
    it('Click on button adds one column', function() {
      editor.clear();
      editor.createRow();
      editor.el.querySelector('.column-add').dispatchEvent(clickEvent);
      assert.equal(2, editor.el.querySelectorAll('.editor-column').length)
    })
   
    it('Click on button fee times adds few columns', function() {
      editor.clear();
      editor.createRow();
      var button = editor.el.querySelector('.column-add')
      button.dispatchEvent(clickEvent);
      button.dispatchEvent(clickEvent);
      assert.equal(3, editor.el.querySelectorAll('.editor-column').length)
    })
    
    it('Click on button create column in parrent columns', function() {
      editor.clear();
      editor.createRow();
      editor.createRow();
      var rows = editor.el.querySelectorAll('.editor-row');
      var button = rows[1].querySelector('.column-add');
      button.dispatchEvent(clickEvent);
      assert.equal(1, rows[0].querySelectorAll('.editor-column').length)
      assert.equal(2, rows[1].querySelectorAll('.editor-column').length)
    })
    
  });
  
});
