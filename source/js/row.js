/**
 * Row class.
 * @partof Editor
 */

var Model = require('tiny-model');
var Column = require('./column');
var Sortable = require('sortablejs');
var merge = require('./merge');
var currentSortable;
/**
 * Check array of column for equal size
 * @param {array} columns
 * @param {number} colNumber
 * @return {bool}
 */
var checkEqualColumns = function(columns, colNumber) {
  return columns.length < 2 ? colNumber : columns.every(function(col) {
    var size = col.model.get('size')
    return size.large == size.medium && size.medium == size.small &&
      size.small == Math.round(colNumber / columns.length);
  });
};

/**
 * Set equal size to all columns
 * @param {array} columns
 * @param {number} colNumber
 * @return {void}
 */
var justifyColumns = function(columns, colNumber) {
  columns.forEach(function(col) {
    var size = {};
    size.large = size.medium = size.small = Math.round(colNumber / columns.length);
    col.model.set({size: size});
  }, this);
};

var Row = function(parentEditor, options) {

  // Define class name
  Object.defineProperty(this, 'class', {
    value: 'Row',
    configurable: false,
    writable: false
  });

  if (parentEditor.class === 'Editor') {
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
      } else if (event.target.className === 'column-add') {

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
    // remove all children, they will remove themself from this storage
    if (this.storage.length) {
      while (this.storage.length) {
        this.storage[0].remove();
      }
      return false;
    }

    // remove itself from editor storage
    if (this.parent.storage.indexOf(this) !== -1) {
      this.parent.storage.splice(this.parent.storage.indexOf(this), 1);
    }

    // then remove row from dom
    // check if it is a part of dom (in case if call this method twice)
    if (this.el.parentElement) {
      this.el.parentElement.removeChild(this.el);
    }
  }
};

module.exports = Row;
