/**
 * Column class.
 * @part of Editor
 */

var Model = require('tiny-model');
var PubSub = require('pubsub');
var merge = require('./merge');

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

/**
 * Capitalize string
 * @param {string} str
 */
var capitalize = function(str) {
  return str.charAt(0).toUpperCase() + str.substring(1);
};

/**
 * Return current breakpoint of editor
 * @param {Editor object} editor
 */
var getBreakpoint = function(editor) {
  return editor.model.get('breakpoint');
};

var Column = function(parentRow, data) {
  // Set class name
  Object.defineProperty(this, 'class', {
    value: 'Column',
    configurable: false,
    writable: false
  });

  if (parentRow.class === 'Row') {
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

    // Set parent element
    this.parent = parentRow;
    this.editor = parentRow.parent;
    this.el = this.render();

    CKEDITOR.inline(this.el.getElementsByClassName('column-content')[0], {
      stylesSet: 'my_custom_style'
    });

    this.bindEvents();
  } else {
    throw new Error('Parent row should be specifid')
  }
};

Column.prototype = Object.create(PubSub.prototype);

Column.prototype.bindEvents = function() {
  this.model.on('change:size', function(event, name, value) {
    // set data-size attributes with single command
    merge(this.el.dataset, renderDataAttrs({size: value}));
  }, this);

  this.editor.model.on('change:breakpoint', function(event, name, breakpoint) {
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
      var breakpoint = getBreakpoint(this.editor);
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
      var breakpoint = getBreakpoint(this.editor);
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
        window.removeEventListener('mouseup', stopResizer, false);
        this.el.classList.remove('resizing');
      }.bind(this);
      this.el.classList.add('resizing');
      window.addEventListener('mousemove', resizer, false);
      window.addEventListener('mouseup', stopResizer, false);
      event.stopImmediatePropagation();
      event.preventDefault();
    }

  }.bind(this), false);

};

Column.prototype.render = function(data) {
  var template = '<div class="editor-column">' +
    '<div class="column-content" contenteditable>' + this.model.get('content') + '</div>' +
    '<div class="column-handle"></div>' +
    '<div class="column-remove"></div>' +
    '<div class="column-resize"></div>' +
    '<div class="column-hide ' + (this.model.get('hide.' + getBreakpoint(this.editor)) ? 'active' : '') + '"></div>' +
  '</div>'

  // create temp element, render column from template as innerHTML and return it
  var col = ((col = document.createElement('div')).innerHTML = template) && col.children[0];

  merge(col.dataset, renderDataAttrs({size: this.model.get('size')}));

  return col;
};

Column.prototype.remove = function() {
  this.model.off();
  this.trigger('remove');
};

module.exports = Column;
