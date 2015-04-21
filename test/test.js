(function() {
  var assert = chai.assert;

  var Editor = _Editor;
  var Row = _Row;
  var Column = _Column;

  var click;
   // Sane browsers
  try {
    // Chrome, Safari, Firefox
    click = new Event('click', {
      'bubbles': true
    });
  } catch (e) {
    // PhantomJS (wat!)
    click = document.createEvent('MouseEvent');
    click.initEvent('click', true, false);
  }


  var editor = new Editor(document.body, null, {
    useIframe: false,
    cssPath: './editor.css'
  });

  describe('Editor', function() {
    beforeEach(function() {
      editor.clear();
    });

    it('should haave immutable property class', function() {
      console.log(editor.class)
      editor.class = 'test';
      assert.equal('Editor', editor.class);
    });

    describe('addRow()', function() {
      it('should add row to internal storage', function() {
        assert.equal(0, editor.storage.length);
        editor.addRow();
        assert.equal(1, editor.storage.length);
      });
    });

    describe('clear()', function() {

      it('should remove content from editor', function() {
        editor.clear();
        assert.equal(0, editor.storage.length);
      });

      it('should remove all content from editor', function() {
        editor.addRow();
        editor.addRow();
        editor.addRow();
        editor.clear();
        assert.equal(0, editor.storage.length);
      });

      it('should not fail when there is no content', function() {
        editor.clear();
        assert.equal(0, editor.storage.length);
      });

    });

    describe('serialize()', function() {

      it('should serialize empty editor correctly', function() {
        editor.clear();
        assert.equal('[]', editor.serialize());
      });

      it('should serialize empty row correctly', function() {
        editor.clear();
        editor.addRow();
        assert.equal('[{"columns":[{"size":{"small":12,"medium":12,"large":12},"hide":{"small":false,"medium":false,"large":false},"content":"<p>&nbsp;</p>"}],"collapsed":false,"class":"","id":"","style":""}]', editor.serialize());
      });

    });

    describe('buildFromSerialized()', function() {

      it('should throw meaningful error when can\'t parse data', function() {
        editor.clear();
        try {
          editor.buildFromSerialized('');
          editor.buildFromSerialized(1);
          editor.buildFromSerialized(null);
          editor.buildFromSerialized();
          editor.buildFromSerialized({});
          editor.buildFromSerialized(/a[0-9]/);
        } catch (error) {
          assert.equal(true, error.message.length > 0);
        }
        assert.equal(0, editor.serialize(true).length);
      });

      it('should build a row from JSON ', function() {
        editor.clear();
        editor.buildFromSerialized([{"collapsed": false, "class": "", "id": "", "style": "", "columns": [{"content": "1", "large": "1", "medium": "1", "small": "1", "hide": {"small": "0", "medium": "0", "large": "0"}}]}]);
        assert.equal(1, editor.serialize(true).length);
      });

      it('should build a row from serialized JSON', function() {
        editor.clear();
        editor.buildFromSerialized('[{"collapsed":false,"class":"","id":"","style":"","columns":[{"content":"1","large":"1","medium":"1","small":"1","hide":{"small":"0","medium":"0","large":"0"}}]}]');
        assert.equal(1, editor.serialize(true).length);
      });

      it('should build from multiple rows from serialized JSON', function() {
        editor.clear();
        editor.buildFromSerialized('[{"collapsed":false,"class":"","id":"","style":"","columns":[{"content":"1","large":"1","medium":"1","small":"1","hide":{"small":"0","medium":"0","large":"0"}}]},{"collapsed":false,"class":"","id":"","style":"","columns":[{"content":"1","large":"1","medium":"1","small":"1","hide":{"small":"0","medium":"0","large":"0"}}]},{"collapsed":false,"class":"","id":"","style":"","columns":[{"content":"1","large":"1","medium":"1","small":"1","hide":{"small":"0","medium":"0","large":"0"}}]}]');
        assert.equal(3, editor.serialize(true).length);
      });

    });

    describe('renderHTML()', function() {
      it('shoud render html correctly', function() {
        editor.addRow({columns:[{content: "test1"}, {content: "test2"}]});
        var rendered = editor.renderHTML();
        var correct = '<div class="row"><div class="columns large-12 medium-12 small-12">test1</div><div class="columns large-12 medium-12 small-12">test2</div></div>'
        assert.equal(correct, rendered);

        editor.clear();
        editor.addRow({columns:[{content: "test1", size: {large:2, small:4}}]});
        var rendered = editor.renderHTML();
        var correct = '<div class="row"><div class="columns large-2 medium-12 small-4">test1</div></div>'
        assert.equal(correct, rendered);
      });
    });

  });

  describe('Row', function() {
    var row;
    var column;
    beforeEach(function() {
      editor.clear();
      row = new Row(editor);
    });
    afterEach(function() {
      row.remove();
    });
    
    it('should haave immutable property class', function() {
      console.log(row.class)
      row.class = 'test';
      assert.equal('Row', row.class);
    });
    
    it('should be able to create new row', function() {
      assert.equal(true, row instanceof Row);
    });

    it('row element in child of editor', function() {
      assert.equal(editor.childrenHolder, row.el.parentElement);
    });

    it('should be able to add column to storage', function() {
      row.addColumn();
      assert.equal(2, row.storage.length);
    });

    it('should be able to remove column from storage', function() {
      assert.equal(1, row.storage.length);
      row.removeColumn(column);
      assert.equal(0, row.storage.length);
    });

    it('should remove itsef from DOM', function() {
      assert.equal(editor.childrenHolder, row.el.parentElement);
      row.remove();
      assert.equal(null, row.el.parentElement);
    });

    it('when removes itself - remove all columns from storage', function() {
      row.addColumn();
      assert.equal(2, row.storage.length);
      row.remove();
      assert.equal(0, row.storage.length);
    });

    it('shoul be able to create a row from serialized data', function() {
      editor.clear();
      row.remove();
      editor.addRow({"collapsed": false, "class": "", "id": "", "style": "", "columns":[{"content": "testword"}]});
      assert.equal(1, editor.storage.length);
      assert.equal('testword', $(editor.el).find('.column-content').html());
    })

    it('shoul be able to create row from loose serialized data', function() {
      editor.clear();
      editor.addRow({});
      assert.equal(1, editor.serialize(true).length);
    });

  });

  describe('Column', function() {
    var row;
    var column;
    beforeEach(function() {
      row = new Row(editor);
      column = row.storage[0];
    });
    afterEach(function() {
      editor.clear();
      row.remove();
    });

    it('should be able to create new column', function() {
      assert.equal(true, column instanceof Column);
    });

    it('column element is child of row', function() {
      assert.equal(row.childrenHolder, column.el.parentElement);
    });

    it('should be able to remove itself from storage', function() {
      assert.equal(1, row.storage.length);
      column.remove();
      assert.equal(0, row.storage.length);
    });

    it('should be able to remove itself from DOM', function() {
      assert.equal(row.childrenHolder, column.el.parentElement);
      column.remove();
      assert.equal(null, column.el.parentElement);
    });

    it('should removes column with row if there is only one column', function() {
      editor.clear();
      assert.equal(1, $(editor.el).find('.editor-column').length);
      column.remove();
      assert.equal(0, $(editor.el).find('.editor-column').length);
    });

    it('should build a correct column from data ', function() {
      row.addColumn({"content":"1", "size":{"large":"2", "medium":"3", "small":"4"}, "hide":{"small":false, "medium":false, "large":false}});
      var column =  $(editor.el).find('.editor-column').last();
      assert.equal("1", column.find('.column-content').html());
      assert.equal("2", column.attr('data-size-large'));
      assert.equal("3", column.attr('data-size-medium'));
      assert.equal("4", column.attr('data-size-small'));
      assert.equal(false, row.storage[0].model.state.hide.large);
      assert.equal(false, row.storage[0].model.state.hide.medium);
      assert.equal(false, row.storage[0].model.state.hide.small);
    });

  });

  describe('UI', function() {

    describe('Add rows', function() {

      it('Button is present on screen', function() {
        assert.equal(1, $(editor.el).find('.row-add').length);
      });

      it('Click on .row-add should add new row', function() {
        editor.clear();
        $(editor.el).find('.row-add').get(0).dispatchEvent(click);
        assert.equal(1, editor.storage.length);
      });

      it('Multiple click on .row-add should add multiple rows', function() {
        editor.clear();
        var button = $(editor.el).find('.row-add');
        button.get(0).dispatchEvent(click);
        button.get(0).dispatchEvent(click);
        assert.equal(2, editor.storage.length);
      });

    });

    describe('Remove rows', function() {

      it('Button is present row', function() {
        editor.clear();
        editor.addRow();
        assert.equal(1,  $(editor.el).find('.editor-row .row-remove').length);
      })

      it('Click on button removes row', function() {
        editor.clear();
        editor.addRow();
        $(editor.el).find('.row-remove').get(0).dispatchEvent(click);
        assert.equal(0, $(editor.el).find('.editor-row').length);
      })

      it('Click on button removes only parent row', function() {
        editor.clear();
        editor.addRow();
        editor.addRow();
        $(editor.el).find('.row-remove').last().parent().addClass('test-remove-row');
        $(editor.el).find('.test-remove-row .row-remove').get(0).dispatchEvent(click);
        assert.equal(1, $(editor.el).find('.editor-row').length);
      })

    });

    describe('Add columns', function() {
      it('Button is present on screen', function() {
        editor.clear();
        editor.addRow();
        assert.equal(1, $(editor.el).find('.column-add').length);
      });

      it('Click on button adds one column', function() {
        editor.clear();
        editor.addRow();
        $(editor.el).find('.column-add').first().get(0).dispatchEvent(click);
        assert.equal(2, $(editor.el).find('.editor-column').length);
      })

      it('Click on button fee times adds few columns', function() {
        editor.clear();
        editor.addRow();
        var button = $(editor.el).find('.column-add')
        button.first().get(0).dispatchEvent(click);
        button.first().get(0).dispatchEvent(click);
        assert.equal(3, $(editor.el).find('.editor-column').length);
      })

      it('Click on button create column in parrent columns', function() {
        editor.clear();
        editor.addRow();
        editor.addRow();
        var rows = $(editor.el).find('.editor-row');
        rows.last().find('.column-add').get(0).dispatchEvent(click);
        assert.equal(1, rows.first().find('.editor-column').length);
        assert.equal(2, rows.last().find('.editor-column').length);
      })

    });

    describe('Remove columns', function() {

      it('Button is present column', function() {
        editor.clear();
        editor.addRow();
        assert.equal(1, $(editor.el).find('.editor-column .column-remove').length);
      });

      it('Button removes column', function() {
        editor.clear();
        editor.addRow();
        $(editor.el).find('.editor-column .column-remove').get(0).dispatchEvent(click);
        assert.equal(0, $(editor.el).find('.editor-column').length);
      });

      it('Button removes only parent column', function() {
        editor.clear();
        editor.addRow();
        $(editor.el).find('.column-add').get(0).dispatchEvent(click);
        var columns = $(editor.el).find('.editor-column');
      });

    });

    describe('Breakpoints', function() {
      it('click on radio button should change breakpoint in editors model', function() {
        $(editor.el).find('#large').get(0).dispatchEvent(click);
        assert.equal('large', editor.model.get('breakpoint'));

        $(editor.el).find('#medium').get(0).dispatchEvent(click);
        assert.equal('medium', editor.model.get('breakpoint'));

        $(editor.el).find('#small').get(0).dispatchEvent(click);
        assert.equal('small', editor.model.get('breakpoint'));
      });
    });

    describe('Row attributes', function() {
      var event = document.createEvent('KeyboardEvent');
       // Sane browsers
      try {
        // Chrome, Safari, Firefox
        event = new Event('keyup', {
          'bubbles': true
        });
      } catch (e) {
        // PhantomJS (wat!)
        event = document.createEvent('KeyboardEvent');
        event.initEvent('keyup', true, false);
      }

      before(function() {

        editor.clear();
        editor.addRow();

        $(editor.el).find('.row-class-holder input').val('test-class').get(0).dispatchEvent(event);
        $(editor.el).find('.row-style-holder input').val('color:red').get(0).dispatchEvent(event);
        $(editor.el).find('.row-id-holder input').val('test-id').get(0).dispatchEvent(event);
      });

      it('should save values into rows model on keydown', function() {
        assert.equal('test-class', editor.storage[0].model.get('class'));
        assert.equal('color:red', editor.storage[0].model.get('style'));
        assert.equal('test-id', editor.storage[0].model.get('id'));
      });

      it('should apply values to DOM', function() {
        assert.equal(true, $(editor.el).find('.editor-row').hasClass('test-class'));
        assert.equal('color:red', $(editor.el).find('.editor-row').attr('style'));
        assert.equal('test-id', $(editor.el).find('.editor-row').attr('id'));
      });

    });

  });
}());