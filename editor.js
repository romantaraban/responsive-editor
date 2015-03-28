(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
/*
function configCKEDITOR() {
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
*/
// get SortableJS if it is already present on page, or require it.
var Sortable = window.Sortable || require('sortablejs');

var Editor = function(el, data, options) {
  //configCKEDITOR();
  this.cssPath = options.cssPath;
  //init editor
  this.colMinSize = 1;
  this.colNumber = 12;
  this.currentBreakpoint = 'large';
  this.frame = document.createElement('iframe');
  el.appendChild(this.frame);

  this.document = this.frame.contentWindow.document;

  this.frame.style.width = '100%';
  this.frame.style.border = 'none';
  this.document.body.style.height = 'auto';
  this.document.body.innerHTML = '<link rel="stylesheet" href="' + this.cssPath + '">' +
  '<div id="editor" class="responsive-editor break-' + this.currentBreakpoint + '">' +
    '<div class="row-add"></div>' +
  '</div>';

  this.el = this.document.getElementById('editor');

  //init rows;
  this.rows = new Sortable(this.el, {
    group: 'rows',
    handle: '.row-handle',
    draggable: '.editor-row',
    ghostClass: 'sortable-ghost'
  });
  this.adjustEditorSize();
  this.initHandlers();
  if (data) {
    this.buildFromSerialized(data);
  } else {
    this.createRow();
  }
};

Editor.prototype = {
  adjustEditorSize: function() {
    this.frame.style.height = (Math.max(200, this.el.scrollHeight) + 50) + 'px';
  },
  initHandlers: function() {
    //  add listners
    this.el.addEventListener('click', function(event) {
      //add Row;
      var target = event.target;
      var parentElement = target.parentElement;
      var col;
      if (target.classList.contains('row-add')) {
        this.createRow();
      }
      // remove Row;
      if (target.classList.contains('row-remove')) {
        parentElement.parentElement.removeChild(parentElement);
      }

      // toggle visibility
      if (target.classList.contains('column-hide')) {
        this.toggleVisibilityState(event);
      }
      // add Col;
      if (target.classList.contains('column-add')) {

        if (this.checkEqualColumns(parentElement)) { //create equal columns
          parentElement.insertBefore(this.createCol(), target);
          this.justifyColumns(parentElement);
        } else { //create simple column
          parentElement.insertBefore(this.createCol({
            small: this.colMinSize,
            medium: this.colMinSize,
            large: this.colMinSize,
            content: '<p></p>'
          }), target);
        }
      }
      // remove Col;
      if (event.target.classList.contains('column-remove')) {
        col = event.target.parentElement;
        row = col.parentElement;
        if (col.parentElement.querySelectorAll('.editor-column').length === 1) { //last column - remove row
          row.parentElement.removeChild(row);
        } else {
          if (this.checkEqualColumns(row)) { //remove equal columns
            row.removeChild(col);
            this.justifyColumns(row);
          } else { // simple remove column
            row.removeChild(col);
          }
        }
      }

    }.bind(this), false);

    //column resize
    this.el.addEventListener('mousedown', this.resizeColumn.bind(this), false);

  },
  createCol: function(_data) {
    var col = document.createElement('div');
    var colContent = document.createElement('div');
    var colHandle = document.createElement('div');
    var colRemove = document.createElement('div');
    var colResize = document.createElement('div');
    var colHide = document.createElement('div');
    var data = _data || {
      size: this.colMinSize,
      content: '<p></p>'
    };
    col.className = 'editor-column';
    col.dataset.large = data.large || 12;
    col.dataset.medium = data.medium || 12;
    col.dataset.small = data.small || 12;

    colHide.className = 'column-hide';
    col.dataset.hideLarge = data.hideLarge || 0;
    col.dataset.hideMedium = data.hideMedium || 0;
    col.dataset.hideSmall = data.hideSmall || 0;
    var correctName = this.currentBreakpoint[0].toUpperCase() + this.currentBreakpoint.substr(1);
    if (parseInt(data['hide' + correctName])) {
      colHide.classList.add('active');
    }

    colContent.className = 'column-content';
    colContent.setAttribute('contenteditable', 'true');
    colContent.innerHTML = unescape(data.content);

    CKEDITOR.inline(colContent, {
      stylesSet: 'my_custom_style'
    });
    col.addEventListener('dragend', function() {
      this.removeAttribute('draggable');
    }, false);

    colHandle.className = 'column-handle';
    colRemove.className = 'column-remove';
    colResize.className = 'column-resize';

    col.appendChild(colHandle);
    col.appendChild(colContent);
    col.appendChild(colResize);
    col.appendChild(colRemove);
    col.appendChild(colHide);
    this.adjustEditorSize();
    return col;
  },
  initColumns: function(row) {
    return new Sortable(row, {
      group: 'column',
      handle: '.column-handle',
      draggable: '.editor-column',
      ghostClass: 'sortable-ghost'

    });
  },
  createRow: function(data) {
    var row = document.createElement('div');
    var rowHandle = document.createElement('div');
    var rowAdd = document.createElement('div');
    var rowRemove = document.createElement('div');
    var rowCollapse = document.createElement('input');
    var rowStyle = document.createElement('div');
    var rowClass = document.createElement('div');
    var rowId = document.createElement('div');

    rowStyle.innerHTML = '<label>Style</label><input class="row-style">';
    rowClass.innerHTML = '<label>Class</label><input class="row-class">';
    rowId.innerHTML = '<label>id</label><input class="row-id">';
    rowStyle.className = 'row-class-holder';
    rowClass.className = 'row-style-holder';
    rowId.className = 'row-id-holder';

    row.className = 'editor-row';
    rowHandle.className = 'row-handle';
    rowAdd.className = 'column-add';
    rowRemove.className = 'row-remove';

    var styleInput = rowStyle.querySelector('.row-style');
    styleInput.addEventListener('keyup', function(event) {
      row.setAttribute('style', event.target.value);
    }, false);
    var classInput = rowClass.querySelector('.row-class');
    classInput.addEventListener('keyup', function(event) {
      row.setAttribute('class', 'editor-row' + ' ' + event.target.value);
    }, false);
    var idInput = rowId.querySelector('.row-id');
    idInput.addEventListener('keyup', function(event) {
      row.setAttribute('id', 'editor-row' + ' ' + event.target.value);
    }, false);

    rowCollapse.setAttribute('type', 'checkbox');
    rowCollapse.value = 1;

    if (data) {
      if (data.collapsed) {
        rowCollapse.setAttribute('checked', 'checked');
      }
      if (data.class && data.class !== 'undefined') {
        rowClass.querySelector('.row-class').value = data.class;
        row.setAttribute('style', data.class); // mutti class. pre: row.classList.add(data.class)
      }
      if (data.style && data.style !== 'undefined') {
        rowStyle.querySelector('.row-style').value = data.style;
        row.setAttribute('style', data.style);
      }
      if (data.id && data.id !== 'undefined') {
        rowId.querySelector('.row-id').value = data.id;
        row.setAttribute('style', data.id); // becouse
      }
    }
    row.appendChild(rowCollapse);
    row.appendChild(rowHandle);
    if (data && data.columns) { //build few columns from JSON
      [].forEach.call(data.columns, function(column) {
        row.appendChild(this.createCol(column));
      }.bind(this));
    } else { //build new column
      row.appendChild(this.createCol());
    }
    row.appendChild(rowAdd);
    row.appendChild(rowRemove);

    row.appendChild(rowStyle);
    row.appendChild(rowClass);
    row.appendChild(rowId);

    this.initColumns(row);
    this.el.insertBefore(row, this.el.getElementsByClassName('row-add')[0]);
    this.adjustEditorSize();
  },
  
  /**
   * Remove all content from editor
   */
  clear: function() {
    var rows = this.el.getElementsByClassName('editor-row');
    while (rows.length) {
      rows[0].parentElement.removeChild(rows[0]);
    }
  },

  /**
   * Serialize current state and return.
   * @param {bool} toJSON
   **/
  serialize: function(toJSON) {

    // serialization function
    function serializeCol(col) {

      return {
        content: escape(col.getElementsByClassName('column-content')[0].innerHTML),
        large: col.dataset.large || 1,
        medium: col.dataset.medium || col.dataset.large || 1,
        small: col.dataset.small || col.dataset.medium || col.dataset.large || 1,
        hideSmall: col.dataset.hideSmall || 0,
        hideMedium: col.dataset.hideMedium || 0,
        hideLarge: col.dataset.hideLarge || 0
      };
    }
    function serializeRow(row) {
      return {
        collapsed: row.querySelector('input').checked,
        class: row.querySelector('.row-class').value,
        id: row.querySelector('.row-id').value,
        style: row.querySelector('.row-style').value,
        columns: []
      };
    }

    // go thru rows and columns and serialize theme
    var result = Array.prototype.reduce.call(this.el.getElementsByClassName('editor-row'), function(data, row) {
      var serialized = serializeRow(row);
      serialized.columns = Array.prototype.reduce.call(row.getElementsByClassName('editor-column'), function(data, col) {
        return data.push(serializeCol(col)) && data;
      }, []);
      return data.push(serialized) && data;
    }, []);

    return toJSON ? result : JSON.stringify(result);
  },

  /**
   * Remove previous content and fullfil editor with content based on serialized JSON data object.
   * @param {object} data
   **/
  buildFromSerialized: function(data) {
    if (!(data instanceof Array)) {
      try {
        if (typeof(data) === 'string') {
          var data = JSON.parse(data);
        } else {
          throw new Error('cant parse data')
        }
      } catch (error) {
        console.log(error);
        return error;
      }
    }
    // if we have data - remove current data
    this.clear();
    while (data.length) {
      this.createRow(data.shift());
    }
  },

  changeBreakpoint: function(breakpoint) {
    this.currentBreakpoint = breakpoint;
    //            this.currentBreakpointIndex = ['small','medium','large'].indexOf(breakpoint);
    this.el.classList.remove('break-small', 'break-medium', 'break-large');
    this.el.classList.add('break-' + breakpoint);
    var correctName = this.currentBreakpoint[0].toUpperCase() + this.currentBreakpoint.substr(1);
    Array.prototype.forEach.call(this.el.querySelectorAll('.editor-column'), function(el, index) {
      var currentState = el.dataset['hide' + correctName];
      if (parseInt(currentState)) {
        el.querySelector('.column-hide').classList.add('active');
      } else {
        el.querySelector('.column-hide').classList.remove('active');
      }
    });
  },
  toggleVisibilityState: function(event) {
    event.target.classList.toggle('active');
    var parent = event.target.parentElement;
    var correctName = this.currentBreakpoint[0].toUpperCase() + this.currentBreakpoint.substr(1);
    var currentState = parent.dataset['hide' + correctName];
    parent.dataset['hide' + correctName] = parseInt(currentState) ? 0 : 1;
  },
  resizeColumn: function(event) {
    // resize target;
    var target = event.target.parentElement;
    if (event.target.classList.contains('column-content')) {
      //event.preventDefault();
      event.stopImmediatePropagation();
    }
    if (event.target.classList.contains('column-resize')) {
      var startPoint = event.clientX;
      var step = this.el.querySelector('.editor-row').clientWidth / 12;
      var startWidth = Number(target.dataset[this.currentBreakpoint] || 1);
      var rigthSide = target.getClientRects()[0].right;
      var resizer = function(event) {
        //return with limited to inverted size of targetso it can't be scaled in negaivesize.
        //Set step to 50px
        var additinalSize = Math.max(startWidth * -1, Math.round((event.clientX - rigthSide) / step));
        target.dataset[this.currentBreakpoint] = Math.max(1, startWidth + additinalSize);

      }.bind(this);
      var stopResizer = function(event) {
        this.el.removeEventListener('mousemove', resizer, false);
        this.el.removeEventListener('mousemove', stopResizer, false);
      }.bind(this);
      this.el.addEventListener('mousemove', resizer, false);
      this.el.addEventListener('mouseup', stopResizer, false);
      event.stopImmediatePropagation();
      event.preventDefault();
    }
    this.adjustEditorSize();
  },
  checkEqualColumns: function(row) {
    var columns = row.querySelectorAll('.editor-column');
    return [].every.call(columns, function(el) {
      return el.dataset.large == el.dataset.medium &&
        el.dataset.medium == el.dataset.small &&
        el.dataset.small == Math.round(this.colNumber / columns.length);
    }, this);
  },
  justifyColumns: function(row) {
    var columns = row.querySelectorAll('.editor-column');
    [].forEach.call(columns, function(el) {
      el.dataset.large = el.dataset.medium = el.dataset.small = Math.round(this.colNumber / columns.length);
    }, this);
  },

  /**
   * Parse serialized data and render it to HTML.
   */
  renderHTML: function() {
    var html = '';
    [].forEach.call(this.serialize(true), function(row) {
      html +=
        '<div class="row ' + ((row.collapsed) ? 'collapse' : '') + ' ' + row.class + '" id="' + row.id + '"' +
        (row.style ? 'style="' + row.style + '"' : '') + '>';
      [].forEach.call(row.columns, function(column) {
        html += '<div class="columns' +
          ((column.large) ? ' large-' + column.large : '') +
          ((column.medium) ? ' medium-' + column.medium : '') +
          ((column.small) ? ' small-' + column.small : '') +
          ((~~column.hideLarge) ? ' hide-for-large' : '') +
          ((~~column.hideMedium) ? ' hide-for-medium' : '') +
          ((~~column.hideSmall) ? ' hide-for-small' : '') + '">';
        html += unescape(column.content);
        html += '</div>';
      }.bind(this));
      html += '</div>';
    }.bind(this));
    return html;
  },
  renderTo: function(target) {
    target.innerHTML = this.renderHTML();
  }
};

module.exports = window.ResponsiveEditor = Editor;

},{"sortablejs":2}],2:[function(require,module,exports){
/**!
 * Sortable
 * @author	RubaXa   <trash@rubaxa.org>
 * @license MIT
 */


(function (factory) {
	"use strict";

	if (typeof define === "function" && define.amd) {
		define(factory);
	}
	else if (typeof module != "undefined" && typeof module.exports != "undefined") {
		module.exports = factory();
	}
	else if (typeof Package !== "undefined") {
		Sortable = factory();  // export for Meteor.js
	}
	else {
		/* jshint sub:true */
		window["Sortable"] = factory();
	}
})(function () {
	"use strict";

	var dragEl,
		ghostEl,
		cloneEl,
		rootEl,
		nextEl,

		scrollEl,
		scrollParentEl,

		lastEl,
		lastCSS,

		oldIndex,
		newIndex,

		activeGroup,
		autoScroll = {},

		tapEvt,
		touchEvt,

		expando = 'Sortable' + (new Date).getTime(),

		win = window,
		document = win.document,
		parseInt = win.parseInt,

		supportDraggable = !!('draggable' in document.createElement('div')),


		_silent = false,

		_dispatchEvent = function (rootEl, name, targetEl, fromEl, startIndex, newIndex) {
			var evt = document.createEvent('Event');

			evt.initEvent(name, true, true);

			evt.item = targetEl || rootEl;
			evt.from = fromEl || rootEl;
			evt.clone = cloneEl;

			evt.oldIndex = startIndex;
			evt.newIndex = newIndex;

			rootEl.dispatchEvent(evt);
		},

		_customEvents = 'onAdd onUpdate onRemove onStart onEnd onFilter onSort'.split(' '),

		noop = function () {},

		abs = Math.abs,
		slice = [].slice,

		touchDragOverListeners = [],

		_autoScroll = _throttle(function (/**Event*/evt, /**Object*/options, /**HTMLElement*/rootEl) {
			// Bug: https://bugzilla.mozilla.org/show_bug.cgi?id=505521
			if (rootEl && options.scroll) {
				var el,
					rect,
					sens = options.scrollSensitivity,
					speed = options.scrollSpeed,

					x = evt.clientX,
					y = evt.clientY,

					winWidth = window.innerWidth,
					winHeight = window.innerHeight,

					vx,
					vy
				;

				// Delect scrollEl
				if (scrollParentEl !== rootEl) {
					scrollEl = options.scroll;
					scrollParentEl = rootEl;

					if (scrollEl === true) {
						scrollEl = rootEl;

						do {
							if ((scrollEl.offsetWidth < scrollEl.scrollWidth) ||
								(scrollEl.offsetHeight < scrollEl.scrollHeight)
							) {
								break;
							}
							/* jshint boss:true */
						} while (scrollEl = scrollEl.parentNode);
					}
				}

				if (scrollEl) {
					el = scrollEl;
					rect = scrollEl.getBoundingClientRect();
					vx = (abs(rect.right - x) <= sens) - (abs(rect.left - x) <= sens);
					vy = (abs(rect.bottom - y) <= sens) - (abs(rect.top - y) <= sens);
				}


				if (!(vx || vy)) {
					vx = (winWidth - x <= sens) - (x <= sens);
					vy = (winHeight - y <= sens) - (y <= sens);

					/* jshint expr:true */
					(vx || vy) && (el = win);
				}


				if (autoScroll.vx !== vx || autoScroll.vy !== vy || autoScroll.el !== el) {
					autoScroll.el = el;
					autoScroll.vx = vx;
					autoScroll.vy = vy;

					clearInterval(autoScroll.pid);

					if (el) {
						autoScroll.pid = setInterval(function () {
							if (el === win) {
								win.scrollTo(win.scrollX + vx * speed, win.scrollY + vy * speed);
							} else {
								vy && (el.scrollTop += vy * speed);
								vx && (el.scrollLeft += vx * speed);
							}
						}, 24);
					}
				}
			}
		}, 30)
	;



	/**
	 * @class  Sortable
	 * @param  {HTMLElement}  el
	 * @param  {Object}       [options]
	 */
	function Sortable(el, options) {
		this.el = el; // root element
		this.options = options = (options || {});


		// Default options
		var defaults = {
			group: Math.random(),
			sort: true,
			disabled: false,
			store: null,
			handle: null,
			scroll: true,
			scrollSensitivity: 30,
			scrollSpeed: 10,
			draggable: /[uo]l/i.test(el.nodeName) ? 'li' : '>*',
			ghostClass: 'sortable-ghost',
			ignore: 'a, img',
			filter: null,
			animation: 0,
			setData: function (dataTransfer, dragEl) {
				dataTransfer.setData('Text', dragEl.textContent);
			},
			dropBubble: false,
			dragoverBubble: false
		};


		// Set default options
		for (var name in defaults) {
			!(name in options) && (options[name] = defaults[name]);
		}


		var group = options.group;

		if (!group || typeof group != 'object') {
			group = options.group = { name: group };
		}


		['pull', 'put'].forEach(function (key) {
			if (!(key in group)) {
				group[key] = true;
			}
		});


		// Define events
		_customEvents.forEach(function (name) {
			options[name] = _bind(this, options[name] || noop);
			_on(el, name.substr(2).toLowerCase(), options[name]);
		}, this);


		// Export options
		options.groups = ' ' + group.name + (group.put.join ? ' ' + group.put.join(' ') : '') + ' ';
		el[expando] = options;


		// Bind all private methods
		for (var fn in this) {
			if (fn.charAt(0) === '_') {
				this[fn] = _bind(this, this[fn]);
			}
		}


		// Bind events
		_on(el, 'mousedown', this._onTapStart);
		_on(el, 'touchstart', this._onTapStart);

		_on(el, 'dragover', this);
		_on(el, 'dragenter', this);

		touchDragOverListeners.push(this._onDragOver);

		// Restore sorting
		options.store && this.sort(options.store.get(this));
	}


	Sortable.prototype = /** @lends Sortable.prototype */ {
		constructor: Sortable,


		_dragStarted: function () {
			if (rootEl && dragEl) {
				// Apply effect
				_toggleClass(dragEl, this.options.ghostClass, true);

				Sortable.active = this;

				// Drag start event
				_dispatchEvent(rootEl, 'start', dragEl, rootEl, oldIndex);
			}
		},


		_onTapStart: function (/**Event|TouchEvent*/evt) {
			var type = evt.type,
				touch = evt.touches && evt.touches[0],
				target = (touch || evt).target,
				originalTarget = target,
				options =  this.options,
				el = this.el,
				filter = options.filter;

			if (type === 'mousedown' && evt.button !== 0 || options.disabled) {
				return; // only left button or enabled
			}

			target = _closest(target, options.draggable, el);

			if (!target) {
				return;
			}

			// get the index of the dragged element within its parent
			oldIndex = _index(target);

			// Check filter
			if (typeof filter === 'function') {
				if (filter.call(this, evt, target, this)) {
					_dispatchEvent(originalTarget, 'filter', target, el, oldIndex);
					evt.preventDefault();
					return; // cancel dnd
				}
			}
			else if (filter) {
				filter = filter.split(',').some(function (criteria) {
					criteria = _closest(originalTarget, criteria.trim(), el);

					if (criteria) {
						_dispatchEvent(criteria, 'filter', target, el, oldIndex);
						return true;
					}
				});

				if (filter) {
					evt.preventDefault();
					return; // cancel dnd
				}
			}


			if (options.handle && !_closest(originalTarget, options.handle, el)) {
				return;
			}


			// Prepare `dragstart`
			if (target && !dragEl && (target.parentNode === el)) {
				tapEvt = evt;

				rootEl = this.el;
				dragEl = target;
				nextEl = dragEl.nextSibling;
				activeGroup = this.options.group;

				dragEl.draggable = true;

				// Disable "draggable"
				options.ignore.split(',').forEach(function (criteria) {
					_find(target, criteria.trim(), _disableDraggable);
				});

				if (touch) {
					// Touch device support
					tapEvt = {
						target: target,
						clientX: touch.clientX,
						clientY: touch.clientY
					};

					this._onDragStart(tapEvt, 'touch');
					evt.preventDefault();
				}

				_on(document, 'mouseup', this._onDrop);
				_on(document, 'touchend', this._onDrop);
				_on(document, 'touchcancel', this._onDrop);

				_on(dragEl, 'dragend', this);
				_on(rootEl, 'dragstart', this._onDragStart);

				if (!supportDraggable) {
					this._onDragStart(tapEvt, true);
				}

				try {
					if (document.selection) {
						document.selection.empty();
					} else {
						window.getSelection().removeAllRanges();
					}
				} catch (err) {
				}
			}
		},

		_emulateDragOver: function () {
			if (touchEvt) {
				_css(ghostEl, 'display', 'none');

				var target = document.elementFromPoint(touchEvt.clientX, touchEvt.clientY),
					parent = target,
					groupName = ' ' + this.options.group.name + '',
					i = touchDragOverListeners.length;

				if (parent) {
					do {
						if (parent[expando] && parent[expando].groups.indexOf(groupName) > -1) {
							while (i--) {
								touchDragOverListeners[i]({
									clientX: touchEvt.clientX,
									clientY: touchEvt.clientY,
									target: target,
									rootEl: parent
								});
							}

							break;
						}

						target = parent; // store last element
					}
					/* jshint boss:true */
					while (parent = parent.parentNode);
				}

				_css(ghostEl, 'display', '');
			}
		},


		_onTouchMove: function (/**TouchEvent*/evt) {
			if (tapEvt) {
				var touch = evt.touches ? evt.touches[0] : evt,
					dx = touch.clientX - tapEvt.clientX,
					dy = touch.clientY - tapEvt.clientY,
					translate3d = evt.touches ? 'translate3d(' + dx + 'px,' + dy + 'px,0)' : 'translate(' + dx + 'px,' + dy + 'px)';

				touchEvt = touch;

				_css(ghostEl, 'webkitTransform', translate3d);
				_css(ghostEl, 'mozTransform', translate3d);
				_css(ghostEl, 'msTransform', translate3d);
				_css(ghostEl, 'transform', translate3d);

				evt.preventDefault();
			}
		},


		_onDragStart: function (/**Event*/evt, /**boolean*/useFallback) {
			var dataTransfer = evt.dataTransfer,
				options = this.options;

			this._offUpEvents();

			if (activeGroup.pull == 'clone') {
				cloneEl = dragEl.cloneNode(true);
				_css(cloneEl, 'display', 'none');
				rootEl.insertBefore(cloneEl, dragEl);
			}

			if (useFallback) {
				var rect = dragEl.getBoundingClientRect(),
					css = _css(dragEl),
					ghostRect;

				ghostEl = dragEl.cloneNode(true);

				_css(ghostEl, 'top', rect.top - parseInt(css.marginTop, 10));
				_css(ghostEl, 'left', rect.left - parseInt(css.marginLeft, 10));
				_css(ghostEl, 'width', rect.width);
				_css(ghostEl, 'height', rect.height);
				_css(ghostEl, 'opacity', '0.8');
				_css(ghostEl, 'position', 'fixed');
				_css(ghostEl, 'zIndex', '100000');

				rootEl.appendChild(ghostEl);

				// Fixing dimensions.
				ghostRect = ghostEl.getBoundingClientRect();
				_css(ghostEl, 'width', rect.width * 2 - ghostRect.width);
				_css(ghostEl, 'height', rect.height * 2 - ghostRect.height);

				if (useFallback === 'touch') {
					// Bind touch events
					_on(document, 'touchmove', this._onTouchMove);
					_on(document, 'touchend', this._onDrop);
					_on(document, 'touchcancel', this._onDrop);
				} else {
					// Old brwoser
					_on(document, 'mousemove', this._onTouchMove);
					_on(document, 'mouseup', this._onDrop);
				}

				this._loopId = setInterval(this._emulateDragOver, 150);
			}
			else {
				if (dataTransfer) {
					dataTransfer.effectAllowed = 'move';
					options.setData && options.setData.call(this, dataTransfer, dragEl);
				}

				_on(document, 'drop', this);
			}

			setTimeout(this._dragStarted, 0);
		},

		_onDragOver: function (/**Event*/evt) {
			var el = this.el,
				target,
				dragRect,
				revert,
				options = this.options,
				group = options.group,
				groupPut = group.put,
				isOwner = (activeGroup === group),
				canSort = options.sort;

			if (!dragEl) {
				return;
			}

			if (evt.preventDefault !== void 0) {
				evt.preventDefault();
				!options.dragoverBubble && evt.stopPropagation();
			}

			if (activeGroup && !options.disabled &&
				(isOwner
					? canSort || (revert = !rootEl.contains(dragEl))
					: activeGroup.pull && groupPut && (
						(activeGroup.name === group.name) || // by Name
						(groupPut.indexOf && ~groupPut.indexOf(activeGroup.name)) // by Array
					)
				) &&
				(evt.rootEl === void 0 || evt.rootEl === this.el)
			) {
				// Smart auto-scrolling
				_autoScroll(evt, options, this.el);

				if (_silent) {
					return;
				}

				target = _closest(evt.target, options.draggable, el);
				dragRect = dragEl.getBoundingClientRect();


				if (revert) {
					_cloneHide(true);

					if (cloneEl || nextEl) {
						rootEl.insertBefore(dragEl, cloneEl || nextEl);
					}
					else if (!canSort) {
						rootEl.appendChild(dragEl);
					}

					return;
				}


				if ((el.children.length === 0) || (el.children[0] === ghostEl) ||
					(el === evt.target) && (target = _ghostInBottom(el, evt))
				) {
					if (target) {
						if (target.animated) {
							return;
						}
						targetRect = target.getBoundingClientRect();
					}

					_cloneHide(isOwner);

					el.appendChild(dragEl);
					this._animate(dragRect, dragEl);
					target && this._animate(targetRect, target);
				}
				else if (target && !target.animated && target !== dragEl && (target.parentNode[expando] !== void 0)) {
					if (lastEl !== target) {
						lastEl = target;
						lastCSS = _css(target);
					}


					var targetRect = target.getBoundingClientRect(),
						width = targetRect.right - targetRect.left,
						height = targetRect.bottom - targetRect.top,
						floating = /left|right|inline/.test(lastCSS.cssFloat + lastCSS.display),
						isWide = (target.offsetWidth > dragEl.offsetWidth),
						isLong = (target.offsetHeight > dragEl.offsetHeight),
						halfway = (floating ? (evt.clientX - targetRect.left) / width : (evt.clientY - targetRect.top) / height) > 0.5,
						nextSibling = target.nextElementSibling,
						after
					;

					_silent = true;
					setTimeout(_unsilent, 30);

					_cloneHide(isOwner);

					if (floating) {
						after = (target.previousElementSibling === dragEl) && !isWide || halfway && isWide;
					} else {
						after = (nextSibling !== dragEl) && !isLong || halfway && isLong;
					}

					if (after && !nextSibling) {
						el.appendChild(dragEl);
					} else {
						target.parentNode.insertBefore(dragEl, after ? nextSibling : target);
					}

					this._animate(dragRect, dragEl);
					this._animate(targetRect, target);
				}
			}
		},

		_animate: function (prevRect, target) {
			var ms = this.options.animation;

			if (ms) {
				var currentRect = target.getBoundingClientRect();

				_css(target, 'transition', 'none');
				_css(target, 'transform', 'translate3d('
					+ (prevRect.left - currentRect.left) + 'px,'
					+ (prevRect.top - currentRect.top) + 'px,0)'
				);

				target.offsetWidth; // repaint

				_css(target, 'transition', 'all ' + ms + 'ms');
				_css(target, 'transform', 'translate3d(0,0,0)');

				clearTimeout(target.animated);
				target.animated = setTimeout(function () {
					_css(target, 'transition', '');
					_css(target, 'transform', '');
					target.animated = false;
				}, ms);
			}
		},

		_offUpEvents: function () {
			_off(document, 'mouseup', this._onDrop);
			_off(document, 'touchmove', this._onTouchMove);
			_off(document, 'touchend', this._onDrop);
			_off(document, 'touchcancel', this._onDrop);
		},

		_onDrop: function (/**Event*/evt) {
			var el = this.el,
				options = this.options;

			clearInterval(this._loopId);
			clearInterval(autoScroll.pid);

			// Unbind events
			_off(document, 'drop', this);
			_off(document, 'mousemove', this._onTouchMove);
			_off(el, 'dragstart', this._onDragStart);

			this._offUpEvents();

			if (evt) {
				evt.preventDefault();
				!options.dropBubble && evt.stopPropagation();

				ghostEl && ghostEl.parentNode.removeChild(ghostEl);

				if (dragEl) {
					_off(dragEl, 'dragend', this);

					_disableDraggable(dragEl);
					_toggleClass(dragEl, this.options.ghostClass, false);

					if (rootEl !== dragEl.parentNode) {
						newIndex = _index(dragEl);

						// drag from one list and drop into another
						_dispatchEvent(dragEl.parentNode, 'sort', dragEl, rootEl, oldIndex, newIndex);
						_dispatchEvent(rootEl, 'sort', dragEl, rootEl, oldIndex, newIndex);

						// Add event
						_dispatchEvent(dragEl, 'add', dragEl, rootEl, oldIndex, newIndex);

						// Remove event
						_dispatchEvent(rootEl, 'remove', dragEl, rootEl, oldIndex, newIndex);
					}
					else {
						// Remove clone
						cloneEl && cloneEl.parentNode.removeChild(cloneEl);

						if (dragEl.nextSibling !== nextEl) {
							// Get the index of the dragged element within its parent
							newIndex = _index(dragEl);

							// drag & drop within the same list
							_dispatchEvent(rootEl, 'update', dragEl, rootEl, oldIndex, newIndex);
							_dispatchEvent(rootEl, 'sort', dragEl, rootEl, oldIndex, newIndex);
						}
					}

					// Drag end event
					Sortable.active && _dispatchEvent(rootEl, 'end', dragEl, rootEl, oldIndex, newIndex);
				}

				// Nulling
				rootEl =
				dragEl =
				ghostEl =
				nextEl =
				cloneEl =

				scrollEl =
				scrollParentEl =

				tapEvt =
				touchEvt =

				lastEl =
				lastCSS =

				activeGroup =
				Sortable.active = null;

				// Save sorting
				this.save();
			}
		},


		handleEvent: function (/**Event*/evt) {
			var type = evt.type;

			if (type === 'dragover' || type === 'dragenter') {
				this._onDragOver(evt);
				_globalDragOver(evt);
			}
			else if (type === 'drop' || type === 'dragend') {
				this._onDrop(evt);
			}
		},


		/**
		 * Serializes the item into an array of string.
		 * @returns {String[]}
		 */
		toArray: function () {
			var order = [],
				el,
				children = this.el.children,
				i = 0,
				n = children.length;

			for (; i < n; i++) {
				el = children[i];
				if (_closest(el, this.options.draggable, this.el)) {
					order.push(el.getAttribute('data-id') || _generateId(el));
				}
			}

			return order;
		},


		/**
		 * Sorts the elements according to the array.
		 * @param  {String[]}  order  order of the items
		 */
		sort: function (order) {
			var items = {}, rootEl = this.el;

			this.toArray().forEach(function (id, i) {
				var el = rootEl.children[i];

				if (_closest(el, this.options.draggable, rootEl)) {
					items[id] = el;
				}
			}, this);

			order.forEach(function (id) {
				if (items[id]) {
					rootEl.removeChild(items[id]);
					rootEl.appendChild(items[id]);
				}
			});
		},


		/**
		 * Save the current sorting
		 */
		save: function () {
			var store = this.options.store;
			store && store.set(this);
		},


		/**
		 * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
		 * @param   {HTMLElement}  el
		 * @param   {String}       [selector]  default: `options.draggable`
		 * @returns {HTMLElement|null}
		 */
		closest: function (el, selector) {
			return _closest(el, selector || this.options.draggable, this.el);
		},


		/**
		 * Set/get option
		 * @param   {string} name
		 * @param   {*}      [value]
		 * @returns {*}
		 */
		option: function (name, value) {
			var options = this.options;

			if (value === void 0) {
				return options[name];
			} else {
				options[name] = value;
			}
		},


		/**
		 * Destroy
		 */
		destroy: function () {
			var el = this.el, options = this.options;

			_customEvents.forEach(function (name) {
				_off(el, name.substr(2).toLowerCase(), options[name]);
			});

			_off(el, 'mousedown', this._onTapStart);
			_off(el, 'touchstart', this._onTapStart);

			_off(el, 'dragover', this);
			_off(el, 'dragenter', this);

			//remove draggable attributes
			Array.prototype.forEach.call(el.querySelectorAll('[draggable]'), function (el) {
				el.removeAttribute('draggable');
			});

			touchDragOverListeners.splice(touchDragOverListeners.indexOf(this._onDragOver), 1);

			this._onDrop();

			this.el = null;
		}
	};


	function _cloneHide(state) {
		if (cloneEl && (cloneEl.state !== state)) {
			_css(cloneEl, 'display', state ? 'none' : '');
			!state && cloneEl.state && rootEl.insertBefore(cloneEl, dragEl);
			cloneEl.state = state;
		}
	}


	function _bind(ctx, fn) {
		var args = slice.call(arguments, 2);
		return	fn.bind ? fn.bind.apply(fn, [ctx].concat(args)) : function () {
			return fn.apply(ctx, args.concat(slice.call(arguments)));
		};
	}


	function _closest(/**HTMLElement*/el, /**String*/selector, /**HTMLElement*/ctx) {
		if (el) {
			ctx = ctx || document;
			selector = selector.split('.');

			var tag = selector.shift().toUpperCase(),
				re = new RegExp('\\s(' + selector.join('|') + ')\\s', 'g');

			do {
				if (
					(tag === '>*' && el.parentNode === ctx) || (
						(tag === '' || el.nodeName.toUpperCase() == tag) &&
						(!selector.length || ((' ' + el.className + ' ').match(re) || []).length == selector.length)
					)
				) {
					return el;
				}
			}
			while (el !== ctx && (el = el.parentNode));
		}

		return null;
	}


	function _globalDragOver(/**Event*/evt) {
		evt.dataTransfer.dropEffect = 'move';
		evt.preventDefault();
	}


	function _on(el, event, fn) {
		el.addEventListener(event, fn, false);
	}


	function _off(el, event, fn) {
		el.removeEventListener(event, fn, false);
	}


	function _toggleClass(el, name, state) {
		if (el) {
			if (el.classList) {
				el.classList[state ? 'add' : 'remove'](name);
			}
			else {
				var className = (' ' + el.className + ' ').replace(/\s+/g, ' ').replace(' ' + name + ' ', '');
				el.className = className + (state ? ' ' + name : '');
			}
		}
	}


	function _css(el, prop, val) {
		var style = el && el.style;

		if (style) {
			if (val === void 0) {
				if (document.defaultView && document.defaultView.getComputedStyle) {
					val = document.defaultView.getComputedStyle(el, '');
				}
				else if (el.currentStyle) {
					val = el.currentStyle;
				}

				return prop === void 0 ? val : val[prop];
			}
			else {
				if (!(prop in style)) {
					prop = '-webkit-' + prop;
				}

				style[prop] = val + (typeof val === 'string' ? '' : 'px');
			}
		}
	}


	function _find(ctx, tagName, iterator) {
		if (ctx) {
			var list = ctx.getElementsByTagName(tagName), i = 0, n = list.length;

			if (iterator) {
				for (; i < n; i++) {
					iterator(list[i], i);
				}
			}

			return list;
		}

		return [];
	}


	function _disableDraggable(el) {
		el.draggable = false;
	}


	function _unsilent() {
		_silent = false;
	}


	/** @returns {HTMLElement|false} */
	function _ghostInBottom(el, evt) {
		var lastEl = el.lastElementChild, rect = lastEl.getBoundingClientRect();
		return (evt.clientY - (rect.top + rect.height) > 5) && lastEl; // min delta
	}


	/**
	 * Generate id
	 * @param   {HTMLElement} el
	 * @returns {String}
	 * @private
	 */
	function _generateId(el) {
		var str = el.tagName + el.className + el.src + el.href + el.textContent,
			i = str.length,
			sum = 0;

		while (i--) {
			sum += str.charCodeAt(i);
		}

		return sum.toString(36);
	}

	/**
	 * Returns the index of an element within its parent
	 * @param el
	 * @returns {number}
	 * @private
	 */
	function _index(/**HTMLElement*/el) {
		var index = 0;
		while (el && (el = el.previousElementSibling)) {
			if (el.nodeName.toUpperCase() !== 'TEMPLATE') {
				index++;
			}
		}
		return index;
	}

	function _throttle(callback, ms) {
		var args, _this;

		return function () {
			if (args === void 0) {
				args = arguments;
				_this = this;

				setTimeout(function () {
					if (args.length === 1) {
						callback.call(_this, args[0]);
					} else {
						callback.apply(_this, args);
					}

					args = void 0;
				}, ms);
			}
		};
	}


	// Export utils
	Sortable.utils = {
		on: _on,
		off: _off,
		css: _css,
		find: _find,
		bind: _bind,
		is: function (el, selector) {
			return !!_closest(el, selector, el);
		},
		throttle: _throttle,
		closest: _closest,
		toggleClass: _toggleClass,
		dispatchEvent: _dispatchEvent,
		index: _index
	};


	Sortable.version = '1.1.1';


	/**
	 * Create sortable instance
	 * @param {HTMLElement}  el
	 * @param {Object}      [options]
	 */
	Sortable.create = function (el, options) {
		return new Sortable(el, options);
	};

	// Export
	return Sortable;
});

},{}]},{},[1]);

//# sourceMappingURL=editor.js.map