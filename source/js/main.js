/**!
 * Responsive editor
 * @author romantaraban <rom.taraban@gmail.com>
 * @license MIT
 *
 * Editor for responsive content
 */

var Model = require('tiny-model');
var Sortable = require('sortablejs');
var merge = require('./merge');
var Row = require('./row');

var currentSortable;

// Config ckeditor
function configCKEDITOR() {
  CKEDITOR.disableAutoInline = true;
  CKEDITOR.stylesSet.add('my_custom_style', [
    // Inline styles.
    {
      name: 'button',
      element: 'span',
      attributes: {
        'class': 'button'
      }
    },
    {
      name: 'note text',
      element: 'p',
      attributes: {
        'class': 'note-text'
      }
    },
    {
      name: 'text priority',
      element: 'p',
      attributes: {
        'class': 'priority-block'
      }
    },
    {
      name: 'marker black',
      element: 'ul',
      attributes: {
        'class': 'black-marker'
      }
    },
    {
      name: 'clear both',
      element: 'p',
      attributes: {
        'class': 'clear-both'
      }
    }
  ]);
}

var Editor = function(parent, data, options) {
  Object.defineProperty(this, 'class', {
    value: 'Editor',
    configurable: false,
    writable: false
  });

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
  configCKEDITOR();
};

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

  /**
   * Sort columns acordently to data from sort event
   */
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
  serialize: function(toJSON) {
    var data = this.storage.map(function(row) {
      return merge({columns: row.storage.map(function(col) {
        // make data sanitation here
        return merge({}, col.model.state, {content: col.model.state.content});
      })}, row.model.state);
    });
    return toJSON ? data : JSON.stringify(data);
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
   * @return {string} html
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

module.exports = Editor;
