(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Editor = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./merge":7,"./row":8,"sortablejs":3,"tiny-model":4}],2:[function(require,module,exports){
var PubSub = function() {};

PubSub.prototype = {
  trigger: function(event, data) {
    if (!this.events || !this.events[event]) {
      return false;
    }

    var subscribers = this.events[event],
      len = subscribers ? subscribers.length : 0;

    while (len--) {
      subscribers[len].callback.call(subscribers[len].context, event, data);
    }

    return this;
  },
  on: function(event, func, context) {
    this.events || (this.events = {});
    this.events[event] || (this.events[event] = []);

    //if event was defined as a hash - convert to array representation
    if (typeof(this.events[event]) === 'function') {
      this.events[event] = [this.events[event]];
    }

    this.events[event].push({
      callback: func,
      context: context || this
    });

    return this;
  },
  off: function(event, func) {
    function remover(e, f, events) {
      for (i = 0; i < events[e].length; i++) {
        if (events[e][i].callback === f) {
          events[e].splice(i, 1);
        }
      }
    }
    if (arguments.length === 0) {
      this.events = {};
    } else if (arguments.length === 1) {
      if (typeof(arguments[0]) === 'string') {
        this.events[arguments[0]] = [];
      } else if (typeof(arguments[0]) === 'function') {
        for (var e in this.events) {
          remover(e, arguments[0], this.events);
        }
      }
    } else if (arguments.length === 2 && typeof(arguments[0]) === 'string' && typeof(arguments[1]) === 'function') {
      remover(event, func, this.events);
    }
  }
};

module.exports = PubSub;

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
/**!
 * TinyModel
 * @author romantaraban <rom.taraban@gmail.com>
 * @license MIT
 *
 * Model's event system is based on this this Publish/Subscribe implementataion
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['./node_modules/pubsub/index'], factory);
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require('pubsub'));
  } else {
    // Browser globals (root is window)
    root.TinyModel = factory(root.PubSub);
  }
}(this, function(PubSub) {
  "use strict";

  /**
   * Returns nested properties of an object. Throws an error when trying to access property of undefined object
   * @param {bool} obj, {string} ptop
   */
  var getDescentProp = function(obj, prop) {
    var path = prop.split('.');
    while (path.length) {
      obj = obj[path.shift()];
    }
    return obj;
  }

  var TinyModel = function(data) {
    this.state = data || {};
  };

  TinyModel.prototype = Object.create(PubSub.prototype);

  TinyModel.prototype.set = function() {
    if (typeof(arguments[0]) === 'string' && arguments.length > 1) {
      if (/\./.test(arguments[0])) {
        // split path into property names
        var path = arguments[0].split('.');
        // new property name
        var newPropName = path[path.length - 1];
        // new value to assing
        var newValue = arguments[1];
        // get parrent object of descent preperty or exit if it doesn't exist
        try {
          var parentProp = getDescentProp(this.state, arguments[0].replace(/\.(?:.(?!\.))+$/gim, ''));
        } catch (error) {
          throw error;
        }
        // check most descant parent property for type
        if (typeof(parentProp) === 'object') {
          // assing value to property
          if (parentProp[newPropName] === newValue) {
            return;
          }
          parentProp[newPropName] = newValue;
          // bubble event from descent property to top level
          for (var l = path.length, curPropPath; l > 0; l--) {
            curPropPath = path.slice(0, l).join('.');
            this.trigger('change:' + curPropPath, curPropPath, getDescentProp(this.state, curPropPath));
          }
        } else {
          // if not an object - then we can't set child properties to it, throw an error
          throw new Error('\'name\' is not an object');
        }
      } else {
        this.state[arguments[0]] = arguments[1];
        this.trigger('change:' + arguments[0], arguments[0], arguments[1]);
      }
    } else if (typeof(arguments[0]) === 'object') {
      var data = arguments[0];
      for (var prop in data) {
        if (data.hasOwnProperty(prop)) {
          this.state[prop] = data[prop];
          this.trigger('change:' + prop, prop, data[prop]);
        }
      }
    }
  };

  TinyModel.prototype.get = function(prop) {
    if (arguments.length > 1) {
      return Array.prototype.reduce.call(arguments, function(cache, el) {
        if (/\./.test(el)) {
          // get descent property
          try {
            cache[el.replace(/^.*(?:\.)/, '')] = getDescentProp(this.state, el);
          } catch (error) {
            throw new Error("Can\'t access property of undefined object," + error);
          }
        } else {
          cache[el] = this.state[el];
        }
        return cache;
      }.bind(this), {});
    } else {
      if (/\./.test(prop)) {
        // get descent property
        try {
          return getDescentProp(this.state, prop);
        } catch (error) {
          throw new Error("Can\'t access property of undefined object," + error);
        }
      } else {
        return this.state[prop];
      }
    }
  };

  TinyModel.prototype.remove = function(prop) {
    if (this.state[prop]) {
      var value = this.state[prop];
      delete this.state[prop];
      this.trigger('remove:' + prop, prop, value);
    }
  };

  TinyModel.prototype.reset = function() {
    for (var prop in this.state) {
      this.remove(prop);
    }
  };

  return TinyModel;

}));

},{"pubsub":5}],5:[function(require,module,exports){
/**!
 * PubSub
 * @author romantaraban <rom.taraban@gmail.com>
 * @license MIT
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.PubSub = factory();
  }
}(this, function() {
  "use strict";

  var PubSub = function() {};

  PubSub.prototype = {
    trigger: function() {
      var event = arguments[0];
      if (!this.events || !this.events[event]) {
        return false;
      }

      var subscribers = this.events[event];
      var len = subscribers ? subscribers.length : 0;

      while (len--) {
        subscribers[len].callback.apply(subscribers[len].context, arguments);
      }

      return this;
    },
    on: function(event, func, context) {
      this.events || (this.events = {});
      this.events[event] || (this.events[event] = []);

      //if event was defined as a hash - convert to array representation
      if (typeof(this.events[event]) === 'function') {
        this.events[event] = [this.events[event]];
      }

      this.events[event].push({
        callback: func,
        context: context || this
      });

      return this;
    },
    off: function(event, func) {
      function remover(e, f, events) {
        for (var i = 0; i < events[e].length; i++) {
          if (events[e][i].callback === f) {
            events[e].splice(i, 1);
          }
        }
      }
      if (arguments.length === 0) {
        this.events = {};
      } else if (arguments.length === 1) {
        if (typeof(arguments[0]) === 'string') {
          this.events[arguments[0]] = [];
        } else if (typeof(arguments[0]) === 'function') {
          for (var e in this.events) {
            remover(e, arguments[0], this.events);
          }
        }
      } else if (arguments.length === 2 && typeof(arguments[0]) === 'string' && typeof(arguments[1]) === 'function') {
        remover(event, func, this.events);
      }
    }
  };

  return PubSub;

}));

},{}],6:[function(require,module,exports){
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

},{"./merge":7,"pubsub":2,"tiny-model":4}],7:[function(require,module,exports){
/**
 * Merge. Helper for recursive object merging.
 * Accepts two or more object and recursively copies theirs properties into the first object.
 * @param {object} obj, [obj2, ...]
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
};

module.exports = merge;

},{}],8:[function(require,module,exports){
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

        if (checkEqualColumns(this.storage, 12)) {
          // create equal columns
          this.addColumn();
          justifyColumns(this.storage, 12);
        } else {
          // create simple column
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

    this.el.addEventListener('change', function(event) {
      if (event.target.classList.contains('row-collapse')) {
        this.model.set({collapsed: event.target.checked})
      }
    }.bind(this));
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
    var that = this;

    // create new column
    var column = new Column(this, options);

    // append to dom
    this.childrenHolder.appendChild(column.el);

    // listen to remove event
    column.on('remove', function() {
      that.removeColumn(column);
    });

    //add to internal storage
    this.storage.push(column);
  },
  removeColumn: function(column) {
    this.storage.splice(this.storage.indexOf(column), 1);
    column.el.parentElement.removeChild(column.el);

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

},{"./column":6,"./merge":7,"sortablejs":3,"tiny-model":4}]},{},[1])(1)
});
//# sourceMappingURL=editor.js.map