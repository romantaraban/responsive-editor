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
      assert.equal(1, $(editor.el).find('.row-add').length);
    });
    
    it('Click on .row-add should add new row', function() {
      editor.clear();
      $(editor.el).find('.row-add').click();
      assert.equal(1, $(editor.el).find('.editor-column').length);
    });
    
    it('Multiple click on .row-add should add multiple rows', function() {
      editor.clear();
      var button = $(editor.el).find('.row-add');
      button.click();
      button.click();
      assert.equal(2, editor.serialize(true).length);
    });
    
  });
  
  describe('Remove rows', function() {
    
    it('Button is present row', function() {
      editor.clear();
      editor.createRow();
      assert.equal(1,  $(editor.el).find('.editor-row .row-remove').length);
    })
    
    it('Click on button removes row', function() {
      editor.clear();
      editor.createRow();
      $(editor.el).find('.row-remove').click();
      assert.equal(0, $(editor.el).find('.editor-row').length);
    })
    
    it('Click on button removes only parent row', function() {
      editor.clear();
      editor.createRow();
      editor.createRow();
      $(editor.el).find('.row-remove').last().parent().addClass('test-remove-row');
      $(editor.el).find('.test-remove-row .row-remove').click();
      assert.equal(1, $(editor.el).find('.editor-row').length);
    })
    
  });
  
  describe('Add columns', function() {
    it('Button is present on screen', function() {
      editor.clear();
      editor.createRow();
      assert.equal(1, $(editor.el).find('.column-add').length);
    });
    
    it('Click on button adds one column', function() {
      editor.clear();
      editor.createRow();
      $(editor.el).find('.column-add').first().click();
      assert.equal(2, $(editor.el).find('.editor-column').length);
    })
   
    it('Click on button fee times adds few columns', function() {
      editor.clear();
      editor.createRow();
      var button = $(editor.el).find('.column-add')
      button.first().click();
      button.first().click();
      assert.equal(3, $(editor.el).find('.editor-column').length);
    })
    
    it('Click on button create column in parrent columns', function() {
      editor.clear();
      editor.createRow();
      editor.createRow();
      var rows = $(editor.el).find('.editor-row');
      rows.last().find('.column-add').click();
      assert.equal(1, rows.first().find('.editor-column').length);
      assert.equal(2, rows.last().find('.editor-column').length);
    })
    
  });
  
  describe('Remove columns', function() {
    
    it('Button is present column', function() {
      editor.clear();
      editor.createRow();
      assert.equal(1, $(editor.el).find('.editor-column .column-remove').length);
    });
    
    it('Button removes column', function() {
      editor.clear();
      editor.createRow();
      $(editor.el).find('.editor-column .column-remove').click();
      assert.equal(0, $(editor.el).find('.editor-column').length);
    });
    
    it('Button removes column with row if there is only one column', function() {
      editor.clear();
      editor.createRow();
      $(editor.el).find('.editor-column .column-remove').click();
      assert.equal(0, $(editor.el).find('.editor-column').length);
    });
    
    it('Button removes only parent column', function() {
      editor.clear();
      editor.createRow();
      $(editor.el).find('.column-add').click();
      var columns = $(editor.el).find('.editor-column');
      
     
      
      
      
    });

  });
  
});
