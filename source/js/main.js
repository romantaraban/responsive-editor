var Model = require('tiny-model');
var Sortable = require('sortablejs');

/**
 * Capitalize string
 * @param {string} str
 */
var capitalize = function(str) {
  return str.charAt(0).toUpperCase() + str.substring(1);
};

/**
 * Accepts two or more object and recursively copies theirs properties into the first object.
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
}

/**
 * Accepts object of form {test: {one: 1, two: 2}, result: {one: 1, two: 2}}
 * and retruns plain version {testOne: 1, testTwo: 2, resultOne: 1, resultTwo: 2}
 * Useful for setting multiple values to .dataset at once
 */
var renderDataAttrs = function(data) {
  var cache = {};
  for (var prefix in data) {
    for (var prop in data[prefix]) {
      cache[prefix + prop[0].toUpperCase() + prop.slice(1)] = data[prefix][prop];
    };
  };
  return cache;
};

var checkEqualColumns = function(columns, colNumber) {
  return columns.length < 2 ? colNumber : columns.every(function(col) {
    var size = col.model.get('size')
    return size.large == size.medium && size.medium == size.small &&
      size.small == Math.round(colNumber / columns.length);
  });
};

var justifyColumns = function(columns, colNumber) {
  columns.forEach(function(col) {
    var size = {};
    size.large = size.medium = size.small = Math.round(colNumber / columns.length);
    col.model.set({size: size});
  }, this);
};

var Editor = function(parent, data, options) {
  //init editor
  this.model = new Model(merge({
    colMinSize: 1,
    colNumber: 12,
    breakpoint: 'large',
    useIframe: true
  }, options));

  // create editor inside an iframe
  if (this.model.get('useIframe')) {
    this.frame = document.createElement('iframe');
    parent.appendChild(this.frame);
    this.holder = this.frame.contentWindow.document;
    this.frame.style.width = '100%';
    this.frame.style.border = 'none';
    this.holder.style.height = 'auto';
  } else {
    this.holder = document.createElement('div');
    parent.appendChild(this.holder);
  }

  this.holder.innerHTML = '' +
    '<link rel="stylesheet" href="' + this.model.get('cssPath') + '">' +
    '<div id="editor" class="responsive-editor break-' + this.model.get('breakpoint') + '">' +
      '<form>' +
        '<input type="radio" value="large" name="breakpoint" id="large" checked> <label for="large">large </label>' +
        '<input type="radio" value="medium" name="breakpoint" id="medium"> <label for="medium">medium </label>' +
        '<input type="radio" value="small" name="breakpoint" id="small"> <label for="small">small </label>' +
      '</form>' +
      '<div class="row-holder"></div>' +
      '<div class="row-add"></div>' +
    '</div>';

  this.el = this.holder.querySelector('#editor');
  this.childrenHolder = this.el.getElementsByClassName('row-holder')[0];

  var storage = this.storage = [];
  this.bindEvents();

  if (data) {
    this.buildFromSerialized(data);
  } else {
    this.addRow();
  }

  new Sortable(this.childrenHolder, {
    group: 'rows',
    handle: '.row-handle',
    draggable: '.editor-row',
    ghostClass: 'sortable-ghost',
    onUpdate: this.sortRows.bind(this)
  });
  //configCKEDITOR();
};

var currentSortable;

Editor.prototype = {
  /**
   * Addjust heigth of an iframe editor
   */
  adjustEditorSize: function() {
    if (this.model.get('useIframe')) {
      this.frame.style.height = (Math.max(200, this.el.scrollHeight) + 100) + 'px';
    }
  },

  /**
   * Attach handlers to dom
   */
  bindEvents: function() {
    this.el.addEventListener('click', function(event) {
      if (event.target.className === 'row-add') {
        this.addRow();
      }

      if (event.target.name === 'breakpoint') {
        this.setBreakpoint(event.target.value);
      }
    }.bind(this), false);

    this.model.on('change:breakpoint', function(event, name, value) {
      this.el.classList.remove('break-small', 'break-medium', 'break-large');
      this.el.classList.add('break-' + value);
    }.bind(this));
  },

  /**
   * Create new row in end of editor
   */
  addRow: function(options) {
    this.storage.push(new Row(this, options))
  },

  sortRows: function(event) {
    currentSortable = this.storage[event.newIndex];
    this.storage[event.newIndex] = this.storage[event.oldIndex];
    this.storage[event.oldIndex] = currentSortable;
  },

  /**
   * Remove all content from editor
   */
  clear: function() {
    while (this.storage.length) {
      this.storage.pop().remove();
    }
  },

  /**
   * Serialize current state and return.
   * @param {bool} toJSON
   **/
  serialize: function(toSJON) {
    var data = this.storage.map(function(row) {
      return merge({columns: row.storage.map(function(col) {
        // make data sanitation here
        return merge({}, col.model.state, {content: col.model.state.content});
      })}, row.model.state);
    });
    return toSJON ? data : JSON.stringify(data);
  },

  /**
   * Remove previous content and fullfil editor with content based on array of data serialized JSON data object.
   * @param {array, string} data
   **/
  buildFromSerialized: function(data) {
    if (!(data instanceof Array)) {
      try {
        var data = JSON.parse(data);
      } catch (error) {
        throw new Error('Can\'t parse "' + data + '", ' + error);
      }
    }
    // if we have data - remove current data
    this.clear();
    while (data.length) {
      this.addRow(data.shift());
    }
  },

  /**
   * Parse serialized data and render it to HTML.
   */
  renderHTML: function() {
    return this.serialize(true).reduce(function(html, row) {
      html +=
        '<div class="row' +
        (row.collapsed ? ' collapse' : '') +
        (row.class ? ' ' + row.class : '') +
        '"' +
        (row.id ? 'id="' + row.id + '"' : '') +
        (row.style ? 'style="' + row.style + '"' : '') + '>';

      html += row.columns.reduce(function(colhtml, column) {
        colhtml += '<div class="columns' +
          ' large-' + (column.size.large || '') +
          ' medium-' + (column.size.medium || '') +
          ' small-' + (column.size.small || '') +
          (column.hide.large ? ' hide-for-large' : '') +
          (column.hide.medium ? ' hide-for-medium' : '') +
          (column.hide.small ? ' hide-for-small' : '') + '">';
        colhtml += column.content;
        colhtml += '</div>';
        return colhtml;
      }, '');

      html += '</div>';
      return html;
    }, '');
  },

  /**
   * Render content to specified html element
   */
  renderTo: function(target) {
    target.innerHTML = this.renderHTML();
  },

  /**
   * Set breakpoint to specific value
   * @param {string} breakpoint
   */
  setBreakpoint: function(breakpoint) {
    this.model.set('breakpoint', breakpoint)
  }
};

var Row = function(parentEditor, options) {
  if (parentEditor instanceof Editor) {
    if (options && options.columns) {
      var columns = options.columns;
      delete options.columns;
    }
    this.model = new Model(merge({
      collapsed: false,
      class: '',
      id: '',
      style: ''
    }, options));
    this.parent = parentEditor;
    this.el = this.render();
    this.childrenHolder = this.el.getElementsByClassName('row-columns-holder')[0];
    this.parent.childrenHolder.appendChild(this.el);
    this.bindEvents();
    this.storage = [];
    if (columns) {
      while (columns.length) {
        this.addColumn(columns.shift());
      }
    } else {
      this.addColumn();
    }

    var sorter = this.sortColumns.bind(this);
    new Sortable(this.childrenHolder, {
      group: 'column',
      handle: '.column-handle',
      draggable: '.editor-column',
      ghostClass: 'sortable-ghost',
      onAdd: sorter,
      onRemove: sorter,
      onUpdate: sorter
    });
  } else {
    throw new Error('Parent editor should be specified');
  }
};

Row.prototype = {
  bindEvents: function() {
    this.el.addEventListener('click', function(event) {

      if (event.target.className === 'row-remove') {
        this.remove();
      } else
      if (event.target.className === 'column-add') {

        if (checkEqualColumns(this.storage, 12)) { //create equal columns
          this.addColumn();
          justifyColumns(this.storage, 12);
        } else { //create simple column
          this.addColumn();
        }
      }
    }.bind(this));

    this.el.addEventListener('keyup', function(event) {
      var prefix;
      if (/^(style|class|id)$/.test(event.target.name)) {
        prefix = event.target.name === 'class' ? 'editor-row ' : '';
        this.model.set(event.target.name, event.target.value);
        this.el.setAttribute(event.target.name, prefix + event.target.value);
      }
    }.bind(this), false);
  },
  render: function(data) {
    var id = this.model.get('id') || '';
    var className = this.model.get('class') || '';
    var style = this.model.get('style') || '';

    var template = '' +
    '<div class="editor-row ' + className + '" id="' + id + '" ' + 'style="' + style + '">' +
      '<input class="row-collapse" type="checkbox" value="1">' +
      '<div class="row-handle"></div>' +
      '<div class="row-columns-holder"></div>' +
      '<div class="column-add"></div>' +
      '<div class="row-remove"></div>' +
      '<div class="row-style-holder"><input placeholder="style" name="style" value="' + style + '"></div>' +
      '<div class="row-class-holder"><input placeholder="class" name="class" value="' + className + '"></div>' +
      '<div class="row-id-holder"><input placeholder="id" name="id" value="' + id + '"></div>' +
    '</div>';

    // create temp element, render row from template as innerHTML and return it
    return ((row = document.createElement('div')).innerHTML = template) && row.children[0];

  },
  addColumn: function(options) {
    this.storage.push(new Column(this, options));
  },
  removeColumn: function(obj) {
    this.storage.splice(this.storage.indexOf(obj), 1);
    if (this.storage.length === 0) {
      this.remove();
    }
  },
  sortColumns: function(event) {
    event.stopPropagation();
    if (event.type === 'remove') {
      currentSortable = this.storage.splice(event.oldIndex, 1);
    }
    if (event.type === 'add') {
      this.storage.splice(event.newIndex, 0, currentSortable);
    }
    if (event.type === 'update') {
      currentSortable = this.storage[event.newIndex];
      this.storage[event.newIndex] = this.storage[event.oldIndex];
      this.storage[event.oldIndex] = currentSortable;
    }
  },
  remove: function() {
    // remove all children, they will remove themself from this storege
    while (this.storage.length) {
      this.storage[0].remove();
    }
    // then remove row from dom
    // check if it is a part of dom (in case if call this method twice)
    if (this.el.parentElement) {
      this.el.parentElement.removeChild(this.el);
    }
  }
};

var Column = function(parentRow, data) {
  if (parentRow instanceof Row) {
    this.model = new Model(merge({
      size: {
        small: 12,
        medium: 12,
        large: 12
      },
      hide: {
        small: false,
        medium: false,
        large: false
      },
      content: '<p>&nbsp;</p>',
    }, data));
    //set parrent element
    this.parent = parentRow;
    this.el = this.render();
    this.parent.childrenHolder.appendChild(this.el);
    this.bindEvents();
  } else {
    throw new Error('Parent row should be specifid')
  }
};

Column.prototype = {
  bindEvents: function() {
    this.model.on('change:size', function(event, name, value) {
      // set data-size attributes with single command
      merge(this.el.dataset, renderDataAttrs({size: value}));
    }, this);

    this.parent.parent.model.on('change:breakpoint', function(event, name, breakpoint) {
      var currentState = !!this.model.get('hide.' + breakpoint);
      if (currentState) {
        this.el.querySelector('.column-hide').classList.add('active');
      } else {
        this.el.querySelector('.column-hide').classList.remove('active');
      }
    }.bind(this));

    this.el.addEventListener('keyup', function(event) {
      if (event.target.classList.contains('column-content')) {
        this.model.set({content: event.target.innerHTML})
      }
    }.bind(this));

    this.el.addEventListener('click', function(event) {
      if (event.target.className === 'column-remove') {
        this.remove();
      }
      if (event.target.classList.contains('column-hide')) {
        event.target.classList.toggle('active');
        var parent = event.target.parentElement;
        var breakpoint = this.parent.parent.model.get('breakpoint');
        var value = this.model.get('hide.' + breakpoint);
        this.model.set('hide.' + breakpoint, !value);
        this.el.dataset['hide' + capitalize(breakpoint)] = !value;
      }
    }.bind(this), false);

    this.el.addEventListener('mousedown', function(event) {
      // resize target;
      var target = event.target.parentElement;
      if (event.target.classList.contains('column-content')) {
        event.stopImmediatePropagation();
      }
      if (event.target.classList.contains('column-resize')) {
        var startPoint = event.clientX;
        var breakpoint = this.parent.parent.model.get('breakpoint');
        var step = this.parent.el.clientWidth / 12;
        var startWidth = Number(this.model.get('size.' + breakpoint) || 1);
        var rigthSide = target.getClientRects()[0].right;
        var resizer = function(event) {
          //return with limited to inverted size of targetso it can't be scaled in negaivesize.
          //Set step to 50px
          var additinalSize = Math.max(startWidth * -1, Math.round((event.clientX - rigthSide) / step));
          this.model.set('size.' + breakpoint, Math.min(12, Math.max(1, startWidth + additinalSize)));

        }.bind(this);
        var stopResizer = function(event) {
          window.removeEventListener('mousemove', resizer, false);
          window.removeEventListener('mousemove', stopResizer, false);
          this.el.classList.remove('resizing');
        }.bind(this);
        this.el.classList.add('resizing');
        window.addEventListener('mousemove', resizer, false);
        window.addEventListener('mouseup', stopResizer, false);
        event.stopImmediatePropagation();
        event.preventDefault();
      }

    }.bind(this), false);

  },
  render: function(data) {
    var template = '<div class="editor-column">' +
      '<div class="column-content" contenteditable>' + this.model.get('content') + '</div>' +
      '<div class="column-handle"></div>' +
      '<div class="column-remove"></div>' +
      '<div class="column-resize"></div>' +
      '<div class="column-hide ' + (this.model.get('hide.' + this.parent.parent.model.get('breakpoint')) ? 'active' : '') + '"></div>' +
    '</div>'

    // create temp element, render column from template as innerHTML and return it
    var col = ((col = document.createElement('div')).innerHTML = template) && col.children[0];

    merge(col.dataset, renderDataAttrs({size: this.model.get('size')}));

    //  CKEDITOR.inline(colContent, {
    //    stylesSet: 'my_custom_style'
    //  });

    return col;
  },
  remove: function() {
    this.model.off();
    this.el.parentElement.removeChild(this.el);
    this.parent.removeColumn(this);
  }
};

//for test purposes
window.Editor = Editor;
window.Row = Row;
window.Column = Column;

module.exports = Editor;
