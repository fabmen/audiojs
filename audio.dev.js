/**
 * @fileoverview Main function src.
 */

// HTML5 Shiv. Must be in <head> to support older browsers.
document.createElement('audio');


/**
 * Doubles as the main function for users to create a player instance and also
 * the main library object.defaultPlaybackRate,playbackRate
 *
 * **ALIASES** audiojs, _V_ (deprecated)
 *
 * The `ajs` function can be used to initialize or retrieve a player.
 *
 *     var myPlayer = ajs('my_audio_id');
 *
 * @param  {String|Element} id      audio element or audio element ID
 * @param  {Object=} options        Optional options object for config/settings
 * @param  {Function=} ready        Optional ready callback
 * @return {ajs.Player}             A player instance
 * @namespace
 */
var ajs = function(id, options, ready){
  var tag; // Element of ID

  // Allow for element or ID to be passed in
  // String ID
  if (typeof id === 'string') {

    // Adjust for jQuery ID syntax
    if (id.indexOf('#') === 0) {
      id = id.slice(1);
    }

    // If a player instance has already been created for this ID return it.
    if (ajs.players[id]) {
      return ajs.players[id];

    // Otherwise get element for ID
    } else {
      tag = ajs.el(id);
    }

  // ID is a media element
  } else {
    tag = id;
  }

  // Check for a useable element
  if (!tag || !tag.nodeName) { // re: nodeName, could be a box div also
    throw new TypeError('The element or ID supplied is not valid. (audiojs)'); // Returns
  }

  // Element may have a player attr referring to an already created player instance.
  // If not, set up a new player and return the instance.
  return tag['player'] || new ajs.Player(tag, options, ready);
};

// Extended name, also available externally, window.audiojs
var audiojs = ajs;
window.audiojs = window.ajs = ajs;


ajs.ACCESS_PROTOCOL = ('https:' == document.location.protocol ? 'https://' : 'http://');

/**
 * Global Player instance options, surfaced from ajs.Player.prototype.options_
 * ajs.options = ajs.Player.prototype.options_
 * All options should use string keys so they avoid
 * renaming by closure compiler
 * @type {Object}
 */
ajs.options = {
  // Default order of fallback technology
  'techOrder': ['html5','flash'],
  // techOrder: ['flash','html5'],

  'html5': {},
  'flash': {},

  // Default of web browser is 300x0. Should rely on source width/height.
  'width': 300,
  'height': 30,
  // defaultVolume: 0.85,
  'defaultVolume': 0.00, // The freakin seaguls are driving me crazy!


  // Included control sets
  'children': {
    'mediaLoader': {},
    'loadingSpinner': {},
    'controlBar': {},
    'errorDisplay': {}
  },

  // Default message to show when a audio cannot be played.
  'notSupportedMessage': 'No compatible source was found for this audio.'
};


/**
 * Global player list
 * @type {Object}
 */
ajs.players = {};

/*!
 * Custom Universal Module Definition (UMD)
 *
 * audio.js will never be a non-browser lib so we can simplify UMD a bunch and
 * still support requirejs and browserify. This also needs to be closure
 * compiler compatible, so string keys are used.
 */
if (typeof define === 'function' && define['amd']) {
  define([], function(){ return audiojs; });

// checking that module is an object too because of umdjs/umd#35
} else if (typeof exports === 'object' && typeof module === 'object') {
  module['exports'] = audiojs;
}
/**
 * Core Object/Class for objects that use inheritance + contstructors
 *
 * To create a class that can be subclassed itself, extend the CoreObject class.
 *
 *     var Animal = CoreObject.extend();
 *     var Horse = Animal.extend();
 *
 * The constructor can be defined through the init property of an object argument.
 *
 *     var Animal = CoreObject.extend({
 *       init: function(name, sound){
 *         this.name = name;
 *       }
 *     });
 *
 * Other methods and properties can be added the same way, or directly to the
 * prototype.
 *
 *    var Animal = CoreObject.extend({
 *       init: function(name){
 *         this.name = name;
 *       },
 *       getName: function(){
 *         return this.name;
 *       },
 *       sound: '...'
 *    });
 *
 *    Animal.prototype.makeSound = function(){
 *      alert(this.sound);
 *    };
 *
 * To create an instance of a class, use the create method.
 *
 *    var fluffy = Animal.create('Fluffy');
 *    fluffy.getName(); // -> Fluffy
 *
 * Methods and properties can be overridden in subclasses.
 *
 *     var Horse = Animal.extend({
 *       sound: 'Neighhhhh!'
 *     });
 *
 *     var horsey = Horse.create('Horsey');
 *     horsey.getName(); // -> Horsey
 *     horsey.makeSound(); // -> Alert: Neighhhhh!
 *
 * @class
 * @constructor
 */
ajs.CoreObject = ajs['CoreObject'] = function(){};
// Manually exporting ajs['CoreObject'] here for Closure Compiler
// because of the use of the extend/create class methods
// If we didn't do this, those functions would get flattend to something like
// `a = ...` and `this.prototype` would refer to the global object instead of
// CoreObject

/**
 * Create a new object that inherits from this Object
 *
 *     var Animal = CoreObject.extend();
 *     var Horse = Animal.extend();
 *
 * @param {Object} props Functions and properties to be applied to the
 *                       new object's prototype
 * @return {ajs.CoreObject} An object that inherits from CoreObject
 * @this {*}
 */
ajs.CoreObject.extend = function(props){
  var init, subObj;

  props = props || {};
  // Set up the constructor using the supplied init method
  // or using the init of the parent object
  // Make sure to check the unobfuscated version for external libs
  init = props['init'] || props.init || this.prototype['init'] || this.prototype.init || function(){};
  // In Resig's simple class inheritance (previously used) the constructor
  //  is a function that calls `this.init.apply(arguments)`
  // However that would prevent us from using `ParentObject.call(this);`
  //  in a Child constuctor because the `this` in `this.init`
  //  would still refer to the Child and cause an inifinite loop.
  // We would instead have to do
  //    `ParentObject.prototype.init.apply(this, argumnents);`
  //  Bleh. We're not creating a _super() function, so it's good to keep
  //  the parent constructor reference simple.
  subObj = function(){
    init.apply(this, arguments);
  };

  // Inherit from this object's prototype
  subObj.prototype = ajs.obj.create(this.prototype);
  // Reset the constructor property for subObj otherwise
  // instances of subObj would have the constructor of the parent Object
  subObj.prototype.constructor = subObj;

  // Make the class extendable
  subObj.extend = ajs.CoreObject.extend;
  // Make a function for creating instances
  subObj.create = ajs.CoreObject.create;

  // Extend subObj's prototype with functions and other properties from props
  for (var name in props) {
    if (props.hasOwnProperty(name)) {
      subObj.prototype[name] = props[name];
    }
  }

  return subObj;
};

/**
 * Create a new instace of this Object class
 *
 *     var myAnimal = Animal.create();
 *
 * @return {ajs.CoreObject} An instance of a CoreObject subclass
 * @this {*}
 */
ajs.CoreObject.create = function(){
  // Create a new object that inherits from this object's prototype
  var inst = ajs.obj.create(this.prototype);

  // Apply this constructor function to the new object
  this.apply(inst, arguments);

  // Return the new object
  return inst;
};
/**
 * @fileoverview Event System (John Resig - Secrets of a JS Ninja http://jsninja.com/)
 * (Original book version wasn't completely usable, so fixed some things and made Closure Compiler compatible)
 * This should work very similarly to jQuery's events, however it's based off the book version which isn't as
 * robust as jquery's, so there's probably some differences.
 */

/**
 * Add an event listener to element
 * It stores the handler function in a separate cache object
 * and adds a generic handler to the element's event,
 * along with a unique id (guid) to the element.
 * @param  {Element|Object}   elem Element or object to bind listeners to
 * @param  {String}   type Type of event to bind to.
 * @param  {Function} fn   Event listener.
 * @private
 */
ajs.on = function(elem, type, fn){
  var data = ajs.getData(elem);

  // We need a place to store all our handler data
  if (!data.handlers) data.handlers = {};

  if (!data.handlers[type]) data.handlers[type] = [];

  if (!fn.guid) fn.guid = ajs.guid++;

  data.handlers[type].push(fn);

  if (!data.dispatcher) {
    data.disabled = false;

    data.dispatcher = function (event){

      if (data.disabled) return;
      event = ajs.fixEvent(event);

      var handlers = data.handlers[event.type];

      if (handlers) {
        // Copy handlers so if handlers are added/removed during the process it doesn't throw everything off.
        var handlersCopy = handlers.slice(0);

        for (var m = 0, n = handlersCopy.length; m < n; m++) {
          if (event.isImmediatePropagationStopped()) {
            break;
          } else {
            handlersCopy[m].call(elem, event);
          }
        }
      }
    };
  }

  if (data.handlers[type].length == 1) {
    if (document.addEventListener) {
      elem.addEventListener(type, data.dispatcher, false);
    } else if (document.attachEvent) {
      elem.attachEvent('on' + type, data.dispatcher);
    }
  }
};

/**
 * Removes event listeners from an element
 * @param  {Element|Object}   elem Object to remove listeners from
 * @param  {String=}   type Type of listener to remove. Don't include to remove all events from element.
 * @param  {Function} fn   Specific listener to remove. Don't incldue to remove listeners for an event type.
 * @private
 */
ajs.off = function(elem, type, fn) {
  // Don't want to add a cache object through getData if not needed
  if (!ajs.hasData(elem)) return;

  var data = ajs.getData(elem);

  // If no events exist, nothing to unbind
  if (!data.handlers) { return; }

  // Utility function
  var removeType = function(t){
     data.handlers[t] = [];
     ajs.cleanUpEvents(elem,t);
  };

  // Are we removing all bound events?
  if (!type) {
    for (var t in data.handlers) removeType(t);
    return;
  }

  var handlers = data.handlers[type];

  // If no handlers exist, nothing to unbind
  if (!handlers) return;

  // If no listener was proauded, remove all listeners for type
  if (!fn) {
    removeType(type);
    return;
  }

  // We're only removing a single handler
  if (fn.guid) {
    for (var n = 0; n < handlers.length; n++) {
      if (handlers[n].guid === fn.guid) {
        handlers.splice(n--, 1);
      }
    }
  }

  ajs.cleanUpEvents(elem, type);
};

/**
 * Clean up the listener cache and dispatchers
 * @param  {Element|Object} elem Element to clean up
 * @param  {String} type Type of event to clean up
 * @private
 */
ajs.cleanUpEvents = function(elem, type) {
  var data = ajs.getData(elem);

  // Remove the events of a particular type if there are none left
  if (data.handlers[type].length === 0) {
    delete data.handlers[type];
    // data.handlers[type] = null;
    // Setting to null was causing an error with data.handlers

    // Remove the meta-handler from the element
    if (document.removeEventListener) {
      elem.removeEventListener(type, data.dispatcher, false);
    } else if (document.detachEvent) {
      elem.detachEvent('on' + type, data.dispatcher);
    }
  }

  // Remove the events object if there are no types left
  if (ajs.isEmpty(data.handlers)) {
    delete data.handlers;
    delete data.dispatcher;
    delete data.disabled;

    // data.handlers = null;
    // data.dispatcher = null;
    // data.disabled = null;
  }

  // Finally remove the expando if there is no data left
  if (ajs.isEmpty(data)) {
    ajs.removeData(elem);
  }
};

/**
 * Fix a native event to have standard property values
 * @param  {Object} event Event object to fix
 * @return {Object}
 * @private
 */
ajs.fixEvent = function(event) {

  function returnTrue() { return true; }
  function returnFalse() { return false; }

  // Test if fixing up is needed
  // Used to check if !event.stopPropagation instead of isPropagationStopped
  // But native events return true for stopPropagation, but don't have
  // other expected methods like isPropagationStopped. Seems to be a problem
  // with the Javascript Ninja code. So we're just overriding all events now.
  if (!event || !event.isPropagationStopped) {
    var old = event || window.event;

    event = {};
    // Clone the old object so that we can modify the values event = {};
    // IE8 Doesn't like when you mess with native event properties
    // Firefox returns false for event.hasOwnProperty('type') and other props
    //  which makes copying more difficult.
    // TODO: Probably best to create a whitelist of event props
    for (var key in old) {
      // Safari 6.0.3 warns you if you try to copy deprecated layerX/Y
      // Chrome warns you if you try to copy deprecated keyboardEvent.keyLocation
      if (key !== 'layerX' && key !== 'layerY' && key !== 'keyboardEvent.keyLocation') {
        // Chrome 32+ warns if you try to copy deprecated returnValue, but
        // we still want to if preventDefault isn't supported (IE8).
        if (!(key == 'returnValue' && old.preventDefault)) {
          event[key] = old[key];
        }
      }
    }

    // The event occurred on this element
    if (!event.target) {
      event.target = event.srcElement || document;
    }

    // Handle which other element the event is related to
    event.relatedTarget = event.fromElement === event.target ?
      event.toElement :
      event.fromElement;

    // Stop the default browser action
    event.preventDefault = function () {
      if (old.preventDefault) {
        old.preventDefault();
      }
      event.returnValue = false;
      event.isDefaultPrevented = returnTrue;
      event.defaultPrevented = true;
    };

    event.isDefaultPrevented = returnFalse;
    event.defaultPrevented = false;

    // Stop the event from bubbling
    event.stopPropagation = function () {
      if (old.stopPropagation) {
        old.stopPropagation();
      }
      event.cancelBubble = true;
      event.isPropagationStopped = returnTrue;
    };

    event.isPropagationStopped = returnFalse;

    // Stop the event from bubbling and executing other handlers
    event.stopImmediatePropagation = function () {
      if (old.stopImmediatePropagation) {
        old.stopImmediatePropagation();
      }
      event.isImmediatePropagationStopped = returnTrue;
      event.stopPropagation();
    };

    event.isImmediatePropagationStopped = returnFalse;

    // Handle mouse position
    if (event.clientX != null) {
      var doc = document.documentElement, body = document.body;

      event.pageX = event.clientX +
        (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
        (doc && doc.clientLeft || body && body.clientLeft || 0);
      event.pageY = event.clientY +
        (doc && doc.scrollTop || body && body.scrollTop || 0) -
        (doc && doc.clientTop || body && body.clientTop || 0);
    }

    // Handle key presses
    event.which = event.charCode || event.keyCode;

    // Fix button for mouse clicks:
    // 0 == left; 1 == middle; 2 == right
    if (event.button != null) {
      event.button = (event.button & 1 ? 0 :
        (event.button & 4 ? 1 :
          (event.button & 2 ? 2 : 0)));
    }
  }

  // Returns fixed-up instance
  return event;
};

/**
 * Trigger an event for an element
 * @param  {Element|Object} elem  Element to trigger an event on
 * @param  {String} event Type of event to trigger
 * @private
 */
ajs.trigger = function(elem, event) {
  // Fetches element data and a reference to the parent (for bubbling).
  // Don't want to add a data object to cache for every parent,
  // so checking hasData first.
  var elemData = (ajs.hasData(elem)) ? ajs.getData(elem) : {};
  var parent = elem.parentNode || elem.ownerDocument;
      // type = event.type || event,
      // handler;

  // If an event name was passed as a string, creates an event out of it
  if (typeof event === 'string') {
    event = { type:event, target:elem };
  }
  // Normalizes the event properties.
  event = ajs.fixEvent(event);

  // If the passed element has a dispatcher, executes the established handlers.
  if (elemData.dispatcher) {
    elemData.dispatcher.call(elem, event);
  }

  // Unless explicitly stopped or the event does not bubble (e.g. media events)
    // recursively calls this function to bubble the event up the DOM.
    if (parent && !event.isPropagationStopped() && event.bubbles !== false) {
    ajs.trigger(parent, event);

  // If at the top of the DOM, triggers the default action unless disabled.
  } else if (!parent && !event.defaultPrevented) {
    var targetData = ajs.getData(event.target);

    // Checks if the target has a default action for this event.
    if (event.target[event.type]) {
      // Temporarily disables event dispatching on the target as we have already executed the handler.
      targetData.disabled = true;
      // Executes the default action.
      if (typeof event.target[event.type] === 'function') {
        event.target[event.type]();
      }
      // Re-enables event dispatching.
      targetData.disabled = false;
    }
  }

  // Inform the triggerer if the default was prevented by returning false
  return !event.defaultPrevented;
  /* Original version of js ninja events wasn't complete.
   * We've since updated to the latest version, but keeping this around
   * for now just in case.
   */
  // // Added in attion to book. Book code was broke.
  // event = typeof event === 'object' ?
  //   event[ajs.expando] ?
  //     event :
  //     new ajs.Event(type, event) :
  //   new ajs.Event(type);

  // event.type = type;
  // if (handler) {
  //   handler.call(elem, event);
  // }

  // // Clean up the event in case it is being reused
  // event.result = undefined;
  // event.target = elem;
};

/**
 * Trigger a listener only once for an event
 * @param  {Element|Object}   elem Element or object to
 * @param  {String}   type
 * @param  {Function} fn
 * @private
 */
ajs.one = function(elem, type, fn) {
  var func = function(){
    ajs.off(elem, type, func);
    fn.apply(this, arguments);
  };
  func.guid = fn.guid = fn.guid || ajs.guid++;
  ajs.on(elem, type, func);
};
var hasOwnProp = Object.prototype.hasOwnProperty;

/**
 * Creates an element and applies properties.
 * @param  {String=} tagName    Name of tag to be created.
 * @param  {Object=} properties Element properties to be applied.
 * @return {Element}
 * @private
 */
ajs.createEl = function(tagName, properties){
  var el, propName;

  el = document.createElement(tagName || 'div');

  for (propName in properties){
    if (hasOwnProp.call(properties, propName)) {
      //el[propName] = properties[propName];
      // Not remembering why we were checking for dash
      // but using setAttribute means you have to use getAttribute

      // The check for dash checks for the aria-* attributes, like aria-label, aria-valuemin.
      // The additional check for "role" is because the default method for adding attributes does not
      // add the attribute "role". My guess is because it's not a valid attribute in some namespaces, although
      // browsers handle the attribute just fine. The W3C allows for aria-* attributes to be used in pre-HTML5 docs.
      // http://www.w3.org/TR/wai-aria-primer/#ariahtml. Using setAttribute gets around this problem.

       if (propName.indexOf('aria-') !== -1 || propName=='role') {
         el.setAttribute(propName, properties[propName]);
       } else {
         el[propName] = properties[propName];
       }
    }
  }
  return el;
};

/**
 * Uppercase the first letter of a string
 * @param  {String} string String to be uppercased
 * @return {String}
 * @private
 */
ajs.capitalize = function(string){
  return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 * Object functions container
 * @type {Object}
 * @private
 */
ajs.obj = {};

/**
 * Object.create shim for prototypal inheritance
 *
 * https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/create
 *
 * @function
 * @param  {Object}   obj Object to use as prototype
 * @private
 */
ajs.obj.create = Object.create || function(obj){
  //Create a new function called 'F' which is just an empty object.
  function F() {}

  //the prototype of the 'F' function should point to the
  //parameter of the anonymous function.
  F.prototype = obj;

  //create a new constructor function based off of the 'F' function.
  return new F();
};

/**
 * Loop through each property in an object and call a function
 * whose arguments are (key,value)
 * @param  {Object}   obj Object of properties
 * @param  {Function} fn  Function to be called on each property.
 * @this {*}
 * @private
 */
ajs.obj.each = function(obj, fn, context){
  for (var key in obj) {
    if (hasOwnProp.call(obj, key)) {
      fn.call(context || this, key, obj[key]);
    }
  }
};

/**
 * Merge two objects together and return the original.
 * @param  {Object} obj1
 * @param  {Object} obj2
 * @return {Object}
 * @private
 */
ajs.obj.merge = function(obj1, obj2){
  if (!obj2) { return obj1; }
  for (var key in obj2){
    if (hasOwnProp.call(obj2, key)) {
      obj1[key] = obj2[key];
    }
  }
  return obj1;
};

/**
 * Merge two objects, and merge any properties that are objects
 * instead of just overwriting one. Uses to merge options hashes
 * where deeper default settings are important.
 * @param  {Object} obj1 Object to override
 * @param  {Object} obj2 Overriding object
 * @return {Object}      New object. Obj1 and Obj2 will be untouched.
 * @private
 */
ajs.obj.deepMerge = function(obj1, obj2){
  var key, val1, val2;

  // make a copy of obj1 so we're not ovewriting original values.
  // like prototype.options_ and all sub options objects
  obj1 = ajs.obj.copy(obj1);

  for (key in obj2){
    if (hasOwnProp.call(obj2, key)) {
      val1 = obj1[key];
      val2 = obj2[key];

      // Check if both properties are pure objects and do a deep merge if so
      if (ajs.obj.isPlain(val1) && ajs.obj.isPlain(val2)) {
        obj1[key] = ajs.obj.deepMerge(val1, val2);
      } else {
        obj1[key] = obj2[key];
      }
    }
  }
  return obj1;
};

/**
 * Make a copy of the supplied object
 * @param  {Object} obj Object to copy
 * @return {Object}     Copy of object
 * @private
 */
ajs.obj.copy = function(obj){
  return ajs.obj.merge({}, obj);
};

/**
 * Check if an object is plain, and not a dom node or any object sub-instance
 * @param  {Object} obj Object to check
 * @return {Boolean}     True if plain, false otherwise
 * @private
 */
ajs.obj.isPlain = function(obj){
  return !!obj
    && typeof obj === 'object'
    && obj.toString() === '[object Object]'
    && obj.constructor === Object;
};

/**
 * Check if an object is Array
*  Since instanceof Array will not work on arrays created in another frame we need to use Array.isArray, but since IE8 does not support Array.isArray we need this shim
 * @param  {Object} obj Object to check
 * @return {Boolean}     True if plain, false otherwise
 * @private
 */
ajs.obj.isArray = Array.isArray || function(arr) {
  return Object.prototype.toString.call(arr) === '[object Array]';
};

/**
 * Bind (a.k.a proxy or Context). A simple method for changing the context of a function
   It also stores a unique id on the function so it can be easily removed from events
 * @param  {*}   context The object to bind as scope
 * @param  {Function} fn      The function to be bound to a scope
 * @param  {Number=}   uid     An optional unique ID for the function to be set
 * @return {Function}
 * @private
 */
ajs.bind = function(context, fn, uid) {
  // Make sure the function has a unique ID
  if (!fn.guid) { fn.guid = ajs.guid++; }

  // Create the new function that changes the context
  var ret = function() {
    return fn.apply(context, arguments);
  };

  // Allow for the ability to indiaudualize this function
  // Needed in the case where multiple objects might share the same prototype
  // IF both items add an event listener with the same function, then you try to remove just one
  // it will remove both because they both have the same guid.
  // when using this, you need to use the bind method when you remove the listener as well.
  // currently used in text tracks
  ret.guid = (uid) ? uid + '_' + fn.guid : fn.guid;

  return ret;
};

/**
 * Element Data Store. Allows for binding data to an element without putting it directly on the element.
 * Ex. Event listneres are stored here.
 * (also from jsninja.com, slightly modified and updated for closure compiler)
 * @type {Object}
 * @private
 */
ajs.cache = {};

/**
 * Unique ID for an element or function
 * @type {Number}
 * @private
 */
ajs.guid = 1;

/**
 * Unique attribute name to store an element's guid in
 * @type {String}
 * @constant
 * @private
 */
ajs.expando = 'adata' + (new Date()).getTime();

/**
 * Returns the cache object where data for an element is stored
 * @param  {Element} el Element to store data for.
 * @return {Object}
 * @private
 */
ajs.getData = function(el){
  var id = el[ajs.expando];
  if (!id) {
    id = el[ajs.expando] = ajs.guid++;
    ajs.cache[id] = {};
  }
  return ajs.cache[id];
};

/**
 * Returns the cache object where data for an element is stored
 * @param  {Element} el Element to store data for.
 * @return {Object}
 * @private
 */
ajs.hasData = function(el){
  var id = el[ajs.expando];
  return !(!id || ajs.isEmpty(ajs.cache[id]));
};

/**
 * Delete data for the element from the cache and the guid attr from getElementById
 * @param  {Element} el Remove data for an element
 * @private
 */
ajs.removeData = function(el){
  var id = el[ajs.expando];
  if (!id) { return; }
  // Remove all stored data
  // Changed to = null
  // http://coding.smashingmagazine.com/2012/11/05/writing-fast-memory-efficient-javascript/
  // ajs.cache[id] = null;
  delete ajs.cache[id];

  // Remove the expando property from the DOM node
  try {
    delete el[ajs.expando];
  } catch(e) {
    if (el.removeAttribute) {
      el.removeAttribute(ajs.expando);
    } else {
      // IE doesn't appear to support removeAttribute on the document element
      el[ajs.expando] = null;
    }
  }
};

/**
 * Check if an object is empty
 * @param  {Object}  obj The object to check for emptiness
 * @return {Boolean}
 * @private
 */
ajs.isEmpty = function(obj) {
  for (var prop in obj) {
    // Inlude null properties as empty.
    if (obj[prop] !== null) {
      return false;
    }
  }
  return true;
};

/**
 * Add a CSS class name to an element
 * @param {Element} element    Element to add class name to
 * @param {String} classToAdd Classname to add
 * @private
 */
ajs.addClass = function(element, classToAdd){
  if ((' '+element.className+' ').indexOf(' '+classToAdd+' ') == -1) {
    element.className = element.className === '' ? classToAdd : element.className + ' ' + classToAdd;
  }
};

/**
 * Remove a CSS class name from an element
 * @param {Element} element    Element to remove from class name
 * @param {String} classToAdd Classname to remove
 * @private
 */
ajs.removeClass = function(element, classToRemove){
  var classNames, i;

  if (element.className.indexOf(classToRemove) == -1) { return; }

  classNames = element.className.split(' ');

  // no arr.indexOf in ie8, and we don't want to add a big shim
  for (i = classNames.length - 1; i >= 0; i--) {
    if (classNames[i] === classToRemove) {
      classNames.splice(i,1);
    }
  }

  element.className = classNames.join(' ');
};

/**
 * Element for testing browser HTML5 audio capabilities
 * @type {Element}
 * @constant
 * @private
 */
ajs.TEST_aud = ajs.createEl('audio');

/**
 * Useragent for browser testing.
 * @type {String}
 * @constant
 * @private
 */
ajs.USER_AGENT = navigator.userAgent;

/**
 * Device is an iPhone
 * @type {Boolean}
 * @constant
 * @private
 */
ajs.IS_IPHONE = (/iPhone/i).test(ajs.USER_AGENT);
ajs.IS_IPAD = (/iPad/i).test(ajs.USER_AGENT);
ajs.IS_IPOD = (/iPod/i).test(ajs.USER_AGENT);
ajs.IS_IOS = ajs.IS_IPHONE || ajs.IS_IPAD || ajs.IS_IPOD;

ajs.IOS_VERSION = (function(){
  var match = ajs.USER_AGENT.match(/OS (\d+)_/i);
  if (match && match[1]) { return match[1]; }
})();

ajs.IS_ANDROID = (/Android/i).test(ajs.USER_AGENT);
ajs.ANDROID_VERSION = (function() {
  // This matches Android Major.Minor.Patch versions
  // ANDROID_VERSION is Major.Minor as a Number, if Minor isn't available, then only Major is returned
  var match = ajs.USER_AGENT.match(/Android (\d+)(?:\.(\d+))?(?:\.(\d+))*/i),
    major,
    minor;

  if (!match) {
    return null;
  }

  major = match[1] && parseFloat(match[1]);
  minor = match[2] && parseFloat(match[2]);

  if (major && minor) {
    return parseFloat(match[1] + '.' + match[2]);
  } else if (major) {
    return major;
  } else {
    return null;
  }
})();
// Old Android is defined as Version older than 2.3, and requiring a webkit version of the android browser
ajs.IS_OLD_ANDROID = ajs.IS_ANDROID && (/webkit/i).test(ajs.USER_AGENT) && ajs.ANDROID_VERSION < 2.3;

ajs.IS_FIREFOX = (/Firefox/i).test(ajs.USER_AGENT);
ajs.IS_CHROME = (/Chrome/i).test(ajs.USER_AGENT);

ajs.TOUCH_ENABLED = !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch);

/**
 * Get an element's attribute values, as defined on the HTML tag
 * Attributs are not the same as properties. They're defined on the tag
 * or with setAttribute (which shouldn't be used with HTML)
 * This will return true or false for boolean attributes.
 * @param  {Element} tag Element from which to get tag attributes
 * @return {Object}
 * @private
 */
ajs.getAttributeValues = function(tag){
  var obj, knownBooleans, attrs, attrName, attrVal;

  obj = {};

  // known boolean attributes
  // we can check for matching boolean properties, but older browsers
  // won't know about HTML5 boolean attributes that we still read from
  knownBooleans = ','+'autoplay,controls,loop,muted,default'+',';

  if (tag && tag.attributes && tag.attributes.length > 0) {
    attrs = tag.attributes;

    for (var i = attrs.length - 1; i >= 0; i--) {
      attrName = attrs[i].name;
      attrVal = attrs[i].value;

      // check for known booleans
      // the matching element property will return a value for typeof
      if (typeof tag[attrName] === 'boolean' || knownBooleans.indexOf(','+attrName+',') !== -1) {
        // the value of an included boolean attribute is typically an empty
        // string ('') which would equal false if we just check for a false value.
        // we also don't want support bad code like autoplay='false'
        attrVal = (attrVal !== null) ? true : false;
      }

      obj[attrName] = attrVal;
    }
  }

  return obj;
};

/**
 * Get the computed style value for an element
 * From http://robertnyman.com/2006/04/24/get-the-rendered-style-of-an-element/
 * @param  {Element} el        Element to get style value for
 * @param  {String} strCssRule Style name
 * @return {String}            Style value
 * @private
 */
ajs.getComputedDimension = function(el, strCssRule){
  var strValue = '';
  if(document.defaultView && document.defaultView.getComputedStyle){
    strValue = document.defaultView.getComputedStyle(el, '').getPropertyValue(strCssRule);

  } else if(el.currentStyle){
    // IE8 Width/Height support
    strValue = el['client'+strCssRule.substr(0,1).toUpperCase() + strCssRule.substr(1)] + 'px';
  }
  return strValue;
};

/**
 * Insert an element as the first child node of another
 * @param  {Element} child   Element to insert
 * @param  {[type]} parent Element to insert child into
 * @private
 */
ajs.insertFirst = function(child, parent){
  if (parent.firstChild) {
    parent.insertBefore(child, parent.firstChild);
  } else {
    parent.appendChild(child);
  }
};

/**
 * Object to hold browser support information
 * @type {Object}
 * @private
 */
ajs.browser = {};

/**
 * Shorthand for document.getElementById()
 * Also allows for CSS (jQuery) ID syntax. But nothing other than IDs.
 * @param  {String} id  Element ID
 * @return {Element}    Element with supplied ID
 * @private
 */
ajs.el = function(id){
  if (id.indexOf('#') === 0) {
    id = id.slice(1);
  }

  return document.getElementById(id);
};

/**
 * Format seconds as a time string, H:MM:SS or M:SS
 * Supplying a guide (in seconds) will force a number of leading zeros
 * to cover the length of the guide
 * @param  {Number} seconds Number of seconds to be turned into a string
 * @param  {Number} guide   Number (in seconds) to model the string after
 * @return {String}         Time formatted as H:MM:SS or M:SS
 * @private
 */
ajs.formatTime = function(seconds, guide) {
  // Default to using seconds as guide
  guide = guide || seconds;
  var s = Math.floor(seconds % 60),
      m = Math.floor(seconds / 60 % 60),
      h = Math.floor(seconds / 3600),
      gm = Math.floor(guide / 60 % 60),
      gh = Math.floor(guide / 3600);

  // handle invalid times
  if (isNaN(seconds) || seconds === Infinity) {
    // '-' is false for all relational operators (e.g. <, >=) so this setting
    // will add the minimum number of fields specified by the guide
    h = m = s = '-';
  }

  // Check if we need to show hours
  h = (h > 0 || gh > 0) ? h + ':' : '';

  // If hours are showing, we may need to add a leading zero.
  // Always show at least one digit of minutes.
  m = (((h || gm >= 10) && m < 10) ? '0' + m : m) + ':';

  // Check if leading zero is need for seconds
  s = (s < 10) ? '0' + s : s;

  return h + m + s;
};

// Attempt to block the ability to select text while dragging controls
ajs.blockTextSelection = function(){
  document.body.focus();
  document.onselectstart = function () { return false; };
};
// Turn off text selection blocking
ajs.unblockTextSelection = function(){ document.onselectstart = function () { return true; }; };

/**
 * Trim whitespace from the ends of a string.
 * @param  {String} string String to trim
 * @return {String}        Trimmed string
 * @private
 */
ajs.trim = function(str){
  return (str+'').replace(/^\s+|\s+$/g, '');
};

/**
 * Should round off a number to a decimal place
 * @param  {Number} num Number to round
 * @param  {Number} dec Number of decimal places to round to
 * @return {Number}     Rounded number
 * @private
 */
ajs.round = function(num, dec) {
  if (!dec) { dec = 0; }
  return Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
};

/**
 * Should create a fake TimeRange object
 * Mimics an HTML5 time range instance, which has functions that
 * return the start and end times for a range
 * TimeRanges are returned by the buffered() method
 * @param  {Number} start Start time in seconds
 * @param  {Number} end   End time in seconds
 * @return {Object}       Fake TimeRange object
 * @private
 */
ajs.createTimeRange = function(start, end){
  return {
    length: 1,
    start: function() { return start; },
    end: function() { return end; }
  };
};

/**
 * Simple http request for retrieving external files (e.g. text tracks)
 * @param  {String}    url             URL of resource
 * @param  {Function} onSuccess       Success callback
 * @param  {Function=} onError         Error callback
 * @param  {Boolean=}   withCredentials Flag which allow credentials
 * @private
 */
ajs.get = function(url, onSuccess, onError, withCredentials){
  var fileUrl, request, urlInfo, winLoc, crossOrigin;

  onError = onError || function(){};

  if (typeof XMLHttpRequest === 'undefined') {
    // Shim XMLHttpRequest for older IEs
    window.XMLHttpRequest = function () {
      try { return new window.ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch (e) {}
      try { return new window.ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch (f) {}
      try { return new window.ActiveXObject('Msxml2.XMLHTTP'); } catch (g) {}
      throw new Error('This browser does not support XMLHttpRequest.');
    };
  }

  request = new XMLHttpRequest();

  urlInfo = ajs.parseUrl(url);
  winLoc = window.location;
  // check if url is for another domain/origin
  // ie8 doesn't know location.origin, so we won't rely on it here
  crossOrigin = (urlInfo.protocol + urlInfo.host) !== (winLoc.protocol + winLoc.host);

  // Use XDomainRequest for IE if XMLHTTPRequest2 isn't available
  // 'withCredentials' is only available in XMLHTTPRequest2
  // Also XDomainRequest has a lot of gotchas, so only use if cross domain
  if(crossOrigin && window.XDomainRequest && !('withCredentials' in request)) {
    request = new window.XDomainRequest();
    request.onload = function() {
      onSuccess(request.responseText);
    };
    request.onerror = onError;
    // these blank handlers need to be set to fix ie9 http://cypressnorth.com/programming/internet-explorer-aborting-ajax-requests-fixed/
    request.onprogress = function() {};
    request.ontimeout = onError;

  // XMLHTTPRequest
  } else {
    fileUrl = (urlInfo.protocol == 'file:' || winLoc.protocol == 'file:');

    request.onreadystatechange = function() {
      if (request.readyState === 4) {
        if (request.status === 200 || fileUrl && request.status === 0) {
          onSuccess(request.responseText);
        } else {
          onError(request.responseText);
        }
      }
    };
  }

  // open the connection
  try {
    // Third arg is async, or ignored by XDomainRequest
    request.open('GET', url, true);
    // withCredentials only supported by XMLHttpRequest2
    if(withCredentials) {
      request.withCredentials = true;
    }
  } catch(e) {
    onError(e);
    return;
  }

  // send the request
  try {
    request.send();
  } catch(e) {
    onError(e);
  }
};

/**
 * Add to local storage (may removeable)
 * @private
 */
ajs.setLocalStorage = function(key, value){
  try {
    // IE was throwing errors referencing the var anywhere without this
    var localStorage = window.localStorage || false;
    if (!localStorage) { return; }
    localStorage[key] = value;
  } catch(e) {
    if (e.code == 22 || e.code == 1014) { // Webkit == 22 / Firefox == 1014
      ajs.log('LocalStorage Full (audioJS)', e);
    } else {
      if (e.code == 18) {
        ajs.log('LocalStorage not allowed (audioJS)', e);
      } else {
        ajs.log('LocalStorage Error (audioJS)', e);
      }
    }
  }
};

/**
 * Get abosolute version of relative URL. Used to tell flash correct URL.
 * http://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue
 * @param  {String} url URL to make absolute
 * @return {String}     Absolute URL
 * @private
 */
ajs.getAbsoluteURL = function(url){

  // Check if absolute URL
  if (!url.match(/^https?:\/\//)) {
    // Convert to absolute URL. Flash hosted off-site needs an absolute URL.
    url = ajs.createEl('div', {
      innerHTML: '<a href="'+url+'">x</a>'
    }).firstChild.href;
  }

  return url;
};


/**
 * Resolve and parse the elements of a URL
 * @param  {String} url The url to parse
 * @return {Object}     An object of url details
 */
ajs.parseUrl = function(url) {
  var div, a, addToBody, props, details;

  props = ['protocol', 'hostname', 'port', 'pathname', 'search', 'hash', 'host'];

  // add the url to an anchor and let the browser parse the URL
  a = ajs.createEl('a', { href: url });

  // IE8 (and 9?) Fix
  // ie8 doesn't parse the URL correctly until the anchor is actually
  // added to the body, and an innerHTML is needed to trigger the parsing
  addToBody = (a.host === '' && a.protocol !== 'file:');
  if (addToBody) {
    div = ajs.createEl('div');
    div.innerHTML = '<a href="'+url+'"></a>';
    a = div.firstChild;
    // prevent the div from affecting layout
    div.setAttribute('style', 'display:none; position:absolute;');
    document.body.appendChild(div);
  }

  // Copy the specific URL properties to a new object
  // This is also needed for IE8 because the anchor loses its
  // properties when it's removed from the dom
  details = {};
  for (var i = 0; i < props.length; i++) {
    details[props[i]] = a[props[i]];
  }

  if (addToBody) {
    document.body.removeChild(div);
  }

  return details;
};

// if there's no console then don't try to output messages
// they will still be stored in ajs.log.history
var _noop = function(){};
var _console = window['console'] || {
  'log': _noop,
  'warn': _noop,
  'error': _noop
};

/**
 * Log messags to the console and history based on the type of message
 *
 * @param  {String} type The type of message, or `null` for `log`
 * @param  {[type]} args The args to be passed to the log
 * @private
 */
function _logType(type, args){
  // convert args to an array to get array functions
  var argsArray = Array.prototype.slice.call(args);

  if (type) {
    // add the type to the front of the message
    argsArray.unshift(type.toUpperCase()+':');
  } else {
    // default to log with no prefix
    type = 'log';
  }

  // add to history
  ajs.log.history.push(argsArray);

  // add console prefix after adding to history
  argsArray.unshift('audioJS:');

  // call appropriate log function
  if (_console[type].apply) {
    _console[type].apply(_console, argsArray);
  } else {
    // ie8 doesn't allow error.apply, but it will just join() the array anyway
    _console[type](argsArray.join(' '));
  }
}

/**
 * Log plain debug messages
 */
ajs.log = function(){
  _logType(null, arguments);
};

/**
 * Keep a history of log messages
 * @type {Array}
 */
ajs.log.history = [];

/**
 * Log error messages
 */
ajs.log.error = function(){
  _logType('error', arguments);
};

/**
 * Log warning messages
 */
ajs.log.warn = function(){
  _logType('warn', arguments);
};

// Offset Left
// getBoundingClientRect technique from John Resig http://ejohn.org/blog/getboundingclientrect-is-awesome/
ajs.findPosition = function(el) {
  var box, docEl, body, clientLeft, scrollLeft, left, clientTop, scrollTop, top;

  if (el.getBoundingClientRect && el.parentNode) {
    box = el.getBoundingClientRect();
  }

  if (!box) {
    return {
      left: 0,
      top: 0
    };
  }

  docEl = document.documentElement;
  body = document.body;

  clientLeft = docEl.clientLeft || body.clientLeft || 0;
  scrollLeft = window.pageXOffset || body.scrollLeft;
  left = box.left + scrollLeft - clientLeft;

  clientTop = docEl.clientTop || body.clientTop || 0;
  scrollTop = window.pageYOffset || body.scrollTop;
  top = box.top + scrollTop - clientTop;

  // Android sometimes returns slightly off decimal values, so need to round
  return {
    left: ajs.round(left),
    top: ajs.round(top)
  };
};
/**
 * Utility functions namespace
 * @namespace
 * @type {Object}
 */
ajs.util = {};

/**
 * Merge two options objects, 
 * recursively merging any plain object properties as well.
 * Previously `deepMerge`
 * 
 * @param  {Object} obj1 Object to override values in
 * @param  {Object} obj2 Overriding object
 * @return {Object}      New object -- obj1 and obj2 will be untouched
 */
ajs.util.mergeOptions = function(obj1, obj2){
  var key, val1, val2;

  // make a copy of obj1 so we're not ovewriting original values.
  // like prototype.options_ and all sub options objects
  obj1 = ajs.obj.copy(obj1);

  for (key in obj2){
    if (obj2.hasOwnProperty(key)) {
      val1 = obj1[key];
      val2 = obj2[key];

      // Check if both properties are pure objects and do a deep merge if so
      if (ajs.obj.isPlain(val1) && ajs.obj.isPlain(val2)) {
        obj1[key] = ajs.util.mergeOptions(val1, val2);
      } else {
        obj1[key] = obj2[key];
      }
    }
  }
  return obj1;
};


/**
 * @fileoverview Player Component - Base class for all UI objects
 *
 */

/**
 * Base UI Component class
 *
 * Components are embeddable UI objects that are represented by both a
 * javascript object and an element in the DOM. They can be children of other
 * components, and can have many children themselves.
 *
 *     // adding a button to the player
 *     var button = player.addChild('button');
 *     button.el(); // -> button element
 *
 *     <div class="audio-js">
 *       <div class="ajs-button">Button</div>
 *     </div>
 *
 * Components are also event emitters.
 *
 *     button.on('click', function(){
 *       console.log('Button Clicked!');
 *     });
 *
 *     button.trigger('customevent');
 *
 * @param {Object} player  Main Player
 * @param {Object=} options
 * @class
 * @constructor
 * @extends ajs.CoreObject
 */
ajs.Component = ajs.CoreObject.extend({
  /**
   * the constructor function for the class
   *
   * @constructor
   */
  init: function(player, options, ready){
    this.player_ = player;

    // Make a copy of prototype.options_ to protect against overriding global defaults
    this.options_ = ajs.obj.copy(this.options_);

    // Updated options with supplied options
    options = this.options(options);

    // Get ID from options, element, or create using player ID and unique ID
    this.id_ = options['id'] || ((options['el'] && options['el']['id']) ? options['el']['id'] : player.id() + '_component_' + ajs.guid++ );

    this.name_ = options['name'] || null;

    // Create element if one wasn't proauded in options
    this.el_ = options['el'] || this.createEl();

    this.children_ = [];
    this.childIndex_ = {};
    this.childNameIndex_ = {};

    // Add any child components in options
    this.initChildren();

    this.ready(ready);
    // Don't want to trigger ready here or it will before init is actually
    // finished for all children that run this constructor

    if (options.reportTouchActivity !== false) {
      this.enableTouchActivity();
    }
  }
});

/**
 * Dispose of the component and all child components
 */
ajs.Component.prototype.dispose = function(){
  this.trigger({ type: 'dispose', 'bubbles': false });

  // Dispose all children.
  if (this.children_) {
    for (var i = this.children_.length - 1; i >= 0; i--) {
      if (this.children_[i].dispose) {
        this.children_[i].dispose();
      }
    }
  }

  // Delete child references
  this.children_ = null;
  this.childIndex_ = null;
  this.childNameIndex_ = null;

  // Remove all event listeners.
  this.off();

  // Remove element from DOM
  if (this.el_.parentNode) {
    this.el_.parentNode.removeChild(this.el_);
  }

  ajs.removeData(this.el_);
  this.el_ = null;
};

/**
 * Reference to main player instance
 *
 * @type {ajs.Player}
 * @private
 */
ajs.Component.prototype.player_ = true;

/**
 * Return the component's player
 *
 * @return {ajs.Player}
 */
ajs.Component.prototype.player = function(){
  return this.player_;
};

/**
 * The component's options object
 *
 * @type {Object}
 * @private
 */
ajs.Component.prototype.options_;

/**
 * Deep merge of options objects
 *
 * Whenever a property is an object on both options objects
 * the two properties will be merged using ajs.obj.deepMerge.
 *
 * This is used for merging options for child components. We
 * want it to be easy to override indiaudual options on a child
 * component without having to rewrite all the other default options.
 *
 *     Parent.prototype.options_ = {
 *       children: {
 *         'childOne': { 'foo': 'bar', 'asdf': 'fdsa' },
 *         'childTwo': {},
 *         'childThree': {}
 *       }
 *     }
 *     newOptions = {
 *       children: {
 *         'childOne': { 'foo': 'baz', 'abc': '123' }
 *         'childTwo': null,
 *         'childFour': {}
 *       }
 *     }
 *
 *     this.options(newOptions);
 *
 * RESULT
 *
 *     {
 *       children: {
 *         'childOne': { 'foo': 'baz', 'asdf': 'fdsa', 'abc': '123' },
 *         'childTwo': null, // Disabled. Won't be initialized.
 *         'childThree': {},
 *         'childFour': {}
 *       }
 *     }
 *
 * @param  {Object} obj Object of new option values
 * @return {Object}     A NEW object of this.options_ and obj merged
 */
ajs.Component.prototype.options = function(obj){
  if (obj === undefined) return this.options_;

  return this.options_ = ajs.util.mergeOptions(this.options_, obj);
};

/**
 * The DOM element for the component
 *
 * @type {Element}
 * @private
 */
ajs.Component.prototype.el_;

/**
 * Create the component's DOM element
 *
 * @param  {String=} tagName  Element's node type. e.g. 'div'
 * @param  {Object=} attributes An object of element attributes that should be set on the element
 * @return {Element}
 */
ajs.Component.prototype.createEl = function(tagName, attributes){
  return ajs.createEl(tagName, attributes);
};

/**
 * Get the component's DOM element
 *
 *     var domEl = myComponent.el();
 *
 * @return {Element}
 */
ajs.Component.prototype.el = function(){
  return this.el_;
};

/**
 * An optional element where, if defined, children will be inserted instead of
 * directly in `el_`
 *
 * @type {Element}
 * @private
 */
ajs.Component.prototype.contentEl_;

/**
 * Return the component's DOM element for embedding content.
 * Will either be el_ or a new element defined in createEl.
 *
 * @return {Element}
 */
ajs.Component.prototype.contentEl = function(){
  return this.contentEl_ || this.el_;
};

/**
 * The ID for the component
 *
 * @type {String}
 * @private
 */
ajs.Component.prototype.id_;

/**
 * Get the component's ID
 *
 *     var id = myComponent.id();
 *
 * @return {String}
 */
ajs.Component.prototype.id = function(){
  return this.id_;
};

/**
 * The name for the component. Often used to reference the component.
 *
 * @type {String}
 * @private
 */
ajs.Component.prototype.name_;

/**
 * Get the component's name. The name is often used to reference the component.
 *
 *     var name = myComponent.name();
 *
 * @return {String}
 */
ajs.Component.prototype.name = function(){
  return this.name_;
};

/**
 * Array of child components
 *
 * @type {Array}
 * @private
 */
ajs.Component.prototype.children_;

/**
 * Get an array of all child components
 *
 *     var kids = myComponent.children();
 *
 * @return {Array} The children
 */
ajs.Component.prototype.children = function(){
  return this.children_;
};

/**
 * Object of child components by ID
 *
 * @type {Object}
 * @private
 */
ajs.Component.prototype.childIndex_;

/**
 * Returns a child component with the proauded ID
 *
 * @return {ajs.Component}
 */
ajs.Component.prototype.getChildById = function(id){
  return this.childIndex_[id];
};

/**
 * Object of child components by name
 *
 * @type {Object}
 * @private
 */
ajs.Component.prototype.childNameIndex_;

/**
 * Returns a child component with the proauded name
 *
 * @return {ajs.Component}
 */
ajs.Component.prototype.getChild = function(name){
  return this.childNameIndex_[name];
};

/**
 * Adds a child component inside this component
 *
 *     myComponent.el();
 *     // -> <div class='my-component'></div>
 *     myComonent.children();
 *     // [empty array]
 *
 *     var myButton = myComponent.addChild('MyButton');
 *     // -> <div class='my-component'><div class="my-button">myButton<div></div>
 *     // -> myButton === myComonent.children()[0];
 *
 * Pass in options for child constructors and options for children of the child
 *
 *     var myButton = myComponent.addChild('MyButton', {
 *       text: 'Press Me',
 *       children: {
 *         buttonChildExample: {
 *           buttonChildOption: true
 *         }
 *       }
 *     });
 *
 * @param {String|ajs.Component} child The class name or instance of a child to add
 * @param {Object=} options Options, including options to be passed to children of the child.
 * @return {ajs.Component} The child component (created by this process if a string was used)
 * @suppress {accessControls|checkRegExp|checkTypes|checkVars|const|constantProperty|deprecated|duplicate|es5Strict|fileoverviewTags|globalThis|invalidCasts|missingProperties|nonStandardJsDocs|strictModuleDepCheck|undefinedNames|undefinedVars|unknownDefines|uselessCode|visibility}
 */
ajs.Component.prototype.addChild = function(child, options){
  var component, componentClass, componentName, componentId;

  // If string, create new component with options
  if (typeof child === 'string') {

    componentName = child;

    // Make sure options is at least an empty object to protect against errors
    options = options || {};

    // Assume name of set is a lowercased name of the UI Class (PlayButton, etc.)
    componentClass = options['componentClass'] || ajs.capitalize(componentName);

    // Set name through options
    options['name'] = componentName;

    // Create a new object & element for this controls set
    // If there's no .player_, this is a player
    // Closure Compiler throws an 'incomplete alias' warning if we use the ajs variable directly.
    // Every class should be exported, so this should never be a problem here.
    component = new window['audiojs'][componentClass](this.player_ || this, options);

  // child is a component instance
  } else {
    component = child;
  }

  this.children_.push(component);

  if (typeof component.id === 'function') {
    this.childIndex_[component.id()] = component;
  }

  // If a name wasn't used to create the component, check if we can use the
  // name function of the component
  componentName = componentName || (component.name && component.name());

  if (componentName) {
    this.childNameIndex_[componentName] = component;
  }

  // Add the UI object's element to the container div (box)
  // Having an element is not required
  if (typeof component['el'] === 'function' && component['el']()) {
    this.contentEl().appendChild(component['el']());
  }

  // Return so it can stored on parent object if desired.
  return component;
};

/**
 * Remove a child component from this component's list of children, and the
 * child component's element from this component's element
 *
 * @param  {ajs.Component} component Component to remove
 */
ajs.Component.prototype.removeChild = function(component){
  if (typeof component === 'string') {
    component = this.getChild(component);
  }

  if (!component || !this.children_) return;

  var childFound = false;
  for (var i = this.children_.length - 1; i >= 0; i--) {
    if (this.children_[i] === component) {
      childFound = true;
      this.children_.splice(i,1);
      break;
    }
  }

  if (!childFound) return;

  this.childIndex_[component.id] = null;
  this.childNameIndex_[component.name] = null;

  var compEl = component.el();
  if (compEl && compEl.parentNode === this.contentEl()) {
    this.contentEl().removeChild(component.el());
  }
};

/**
 * Add and initialize default child components from options
 *
 *     // when an instance of MyComponent is created, all children in options
 *     // will be added to the instance by their name strings and options
 *     MyComponent.prototype.options_.children = {
 *       myChildComponent: {
 *         myChildOption: true
 *       }
 *     }
 *
 *     // Or when creating the component
 *     var myComp = new MyComponent(player, {
 *       children: {
 *         myChildComponent: {
 *           myChildOption: true
 *         }
 *       }
 *     });
 *
 * The children option can also be an Array of child names or
 * child options objects (that also include a 'name' key).
 *
 *     var myComp = new MyComponent(player, {
 *       children: [
 *         'button',
 *         {
 *           name: 'button',
 *           someOtherOption: true
 *         }
 *       ]
 *     });
 *
 */
ajs.Component.prototype.initChildren = function(){
  var parent, children, child, name, opts;

  parent = this;
  children = this.options()['children'];

  if (children) {
    // Allow for an array of children details to passed in the options
    if (ajs.obj.isArray(children)) {
      for (var i = 0; i < children.length; i++) {
        child = children[i];

        if (typeof child == 'string') {
          name = child;
          opts = {};
        } else {
          name = child.name;
          opts = child;
        }

        parent[name] = parent.addChild(name, opts);
      }
    } else {
      ajs.obj.each(children, function(name, opts){
        // Allow for disabling default components
        // e.g. ajs.options['children']['posterImage'] = false
        if (opts === false) return;

        // Set property name on player. Could cause conflicts with other prop names, but it's worth making refs easy.
        parent[name] = parent.addChild(name, opts);
      });
    }
  }
};

/**
 * Allows sub components to stack CSS class names
 *
 * @return {String} The constructed class name
 */
ajs.Component.prototype.buildCSSClass = function(){
    // Child classes can include a function that does:
    // return 'CLASS NAME' + this._super();
    return '';
};

/* Events
============================================================================= */

/**
 * Add an event listener to this component's element
 *
 *     var myFunc = function(){
 *       var myPlayer = this;
 *       // Do something when the event is fired
 *     };
 *
 *     myPlayer.on("eventName", myFunc);
 *
 * The context will be the component.
 *
 * @param  {String}   type The event type e.g. 'click'
 * @param  {Function} fn   The event listener
 * @return {ajs.Component} self
 */
ajs.Component.prototype.on = function(type, fn){
  ajs.on(this.el_, type, ajs.bind(this, fn));
  return this;
};

/**
 * Remove an event listener from the component's element
 *
 *     myComponent.off("eventName", myFunc);
 *
 * @param  {String=}   type Event type. Without type it will remove all listeners.
 * @param  {Function=} fn   Event listener. Without fn it will remove all listeners for a type.
 * @return {ajs.Component}
 */
ajs.Component.prototype.off = function(type, fn){
  ajs.off(this.el_, type, fn);
  return this;
};

/**
 * Add an event listener to be triggered only once and then removed
 *
 * @param  {String}   type Event type
 * @param  {Function} fn   Event listener
 * @return {ajs.Component}
 */
ajs.Component.prototype.one = function(type, fn) {
  ajs.one(this.el_, type, ajs.bind(this, fn));
  return this;
};

/**
 * Trigger an event on an element
 *
 *     myComponent.trigger('eventName');
 *
 * @param  {String}       type  The event type to trigger, e.g. 'click'
 * @param  {Event|Object} event The event object to be passed to the listener
 * @return {ajs.Component}      self
 */
ajs.Component.prototype.trigger = function(type, event){
  ajs.trigger(this.el_, type, event);
  return this;
};

/* Ready
================================================================================ */
/**
 * Is the component loaded
 * This can mean different things depending on the component.
 *
 * @private
 * @type {Boolean}
 */
ajs.Component.prototype.isReady_;

/**
 * Trigger ready as soon as initialization is finished
 *
 * Allows for delaying ready. Override on a sub class prototype.
 * If you set this.isReadyOnInitFinish_ it will affect all components.
 * Specially used when waiting for the Flash player to asynchrnously load.
 *
 * @type {Boolean}
 * @private
 */
ajs.Component.prototype.isReadyOnInitFinish_ = true;

/**
 * List of ready listeners
 *
 * @type {Array}
 * @private
 */
ajs.Component.prototype.readyQueue_;

/**
 * Bind a listener to the component's ready state
 *
 * Different from event listeners in that if the ready event has already happend
 * it will trigger the function immediately.
 *
 * @param  {Function} fn Ready listener
 * @return {ajs.Component}
 */
ajs.Component.prototype.ready = function(fn){
  if (fn) {
    if (this.isReady_) {
      fn.call(this);
    } else {
      if (this.readyQueue_ === undefined) {
        this.readyQueue_ = [];
      }
      this.readyQueue_.push(fn);
    }
  }
  return this;
};

/**
 * Trigger the ready listeners
 *
 * @return {ajs.Component}
 */
ajs.Component.prototype.triggerReady = function(){
  this.isReady_ = true;

  var readyQueue = this.readyQueue_;

  if (readyQueue && readyQueue.length > 0) {

    for (var i = 0, j = readyQueue.length; i < j; i++) {
      readyQueue[i].call(this);
    }

    // Reset Ready Queue
    this.readyQueue_ = [];

    // Allow for using event listeners also, in case you want to do something everytime a source is ready.
    this.trigger('ready');
  }
};

/* Display
============================================================================= */

/**
 * Add a CSS class name to the component's element
 *
 * @param {String} classToAdd Classname to add
 * @return {ajs.Component}
 */
ajs.Component.prototype.addClass = function(classToAdd){
  ajs.addClass(this.el_, classToAdd);
  return this;
};

/**
 * Remove a CSS class name from the component's element
 *
 * @param {String} classToRemove Classname to remove
 * @return {ajs.Component}
 */
ajs.Component.prototype.removeClass = function(classToRemove){
  ajs.removeClass(this.el_, classToRemove);
  return this;
};

/**
 * Show the component element if hidden
 *
 * @return {ajs.Component}
 */
ajs.Component.prototype.show = function(){
  this.el_.style.display = 'block';
  return this;
};

/**
 * Hide the component element if currently showing
 *
 * @return {ajs.Component}
 */
ajs.Component.prototype.hide = function(){
  this.el_.style.display = 'none';
  return this;
};

/**
 * Lock an item in its visible state
 * To be used with fadeIn/fadeOut.
 *
 * @return {ajs.Component}
 * @private
 */
ajs.Component.prototype.lockShowing = function(){
  this.addClass('ajs-lock-showing');
  return this;
};

/**
 * Unlock an item to be hidden
 * To be used with fadeIn/fadeOut.
 *
 * @return {ajs.Component}
 * @private
 */
ajs.Component.prototype.unlockShowing = function(){
  this.removeClass('ajs-lock-showing');
  return this;
};

/**
 * Disable component by making it unshowable
 *
 * Currently private because we're movign towards more css-based states.
 * @private
 */
ajs.Component.prototype.disable = function(){
  this.hide();
  this.show = function(){};
};

/**
 * Set or get the width of the component (CSS values)
 *
 * Setting the audio tag dimension values only works with values in pixels.
 * Percent values will not work.
 * Some percents can be used, but width()/height() will return the number + %,
 * not the actual computed width/height.
 *
 * @param  {Number|String=} num   Optional width number
 * @param  {Boolean} skipListeners Skip the 'resize' event trigger
 * @return {ajs.Component} This component, when setting the width
 * @return {Number|String} The width, when getting
 */
ajs.Component.prototype.width = function(num, skipListeners){
  return this.dimension('width', num, skipListeners);
};

/**
 * Get or set the height of the component (CSS values)
 *
 * Setting the audio tag dimension values only works with values in pixels.
 * Percent values will not work.
 * Some percents can be used, but width()/height() will return the number + %,
 * not the actual computed width/height.
 *
 * @param  {Number|String=} num     New component height
 * @param  {Boolean=} skipListeners Skip the resize event trigger
 * @return {ajs.Component} This component, when setting the height
 * @return {Number|String} The height, when getting
 */
ajs.Component.prototype.height = function(num, skipListeners){
  return this.dimension('height', num, skipListeners);
};

/**
 * Set both width and height at the same time
 *
 * @param  {Number|String} width
 * @param  {Number|String} height
 * @return {ajs.Component} The component
 */
ajs.Component.prototype.dimensions = function(width, height){
  // Skip resize listeners on width for optimization
  return this.width(width, true).height(height);
};

/**
 * Get or set width or height
 *
 * This is the shared code for the width() and height() methods.
 * All for an integer, integer + 'px' or integer + '%';
 *
 * Known issue: Hidden elements officially have a width of 0. We're defaulting
 * to the style.width value and falling back to computedStyle which has the
 * hidden element issue. Info, but probably not an efficient fix:
 * http://www.foliotek.com/devblog/getting-the-width-of-a-hidden-element-with-jquery-using-width/
 *
 * @param  {String} widthOrHeight  'width' or 'height'
 * @param  {Number|String=} num     New dimension
 * @param  {Boolean=} skipListeners Skip resize event trigger
 * @return {ajs.Component} The component if a dimension was set
 * @return {Number|String} The dimension if nothing was set
 * @private
 */
ajs.Component.prototype.dimension = function(widthOrHeight, num, skipListeners){
  if (num !== undefined) {

    // Check if using css width/height (% or px) and adjust
    if ((''+num).indexOf('%') !== -1 || (''+num).indexOf('px') !== -1) {
      this.el_.style[widthOrHeight] = num;
    } else if (num === 'auto') {
      this.el_.style[widthOrHeight] = '';
    } else {
      this.el_.style[widthOrHeight] = num+'px';
    }

    // skipListeners allows us to avoid triggering the resize event when setting both width and height
    if (!skipListeners) { this.trigger('resize'); }

    // Return component
    return this;
  }

  // Not setting a value, so getting it
  // Make sure element exists
  if (!this.el_) return 0;

  // Get dimension value from style
  var val = this.el_.style[widthOrHeight];
  var pxIndex = val.indexOf('px');
  if (pxIndex !== -1) {
    // Return the pixel value with no 'px'
    return parseInt(val.slice(0,pxIndex), 10);

  // No px so using % or no style was set, so falling back to offsetWidth/height
  // If component has display:none, offset will return 0
  // TODO: handle display:none and no dimension style using px
  } else {

    return parseInt(this.el_['offset'+ajs.capitalize(widthOrHeight)], 10);

    // ComputedStyle version.
    // Only difference is if the element is hidden it will return
    // the percent value (e.g. '100%'')
    // instead of zero like offsetWidth returns.
    // var val = ajs.getComputedStyleValue(this.el_, widthOrHeight);
    // var pxIndex = val.indexOf('px');

    // if (pxIndex !== -1) {
    //   return val.slice(0, pxIndex);
    // } else {
    //   return val;
    // }
  }
};

/**
 * Fired when the width and/or height of the component changes
 * @event resize
 */
ajs.Component.prototype.onResize;

/**
 * Emit 'tap' events when touch events are supported
 *
 * This is used to support toggling the controls through a tap on the audio.
 *
 * We're requireing them to be enabled because otherwise every component would
 * have this extra overhead unnecessarily, on mobile devices where extra
 * overhead is especially bad.
 * @private
 */
ajs.Component.prototype.emitTapEvents = function(){
  var touchStart, firstTouch, touchTime, couldBeTap, noTap,
      xdiff, ydiff, touchDistance, tapMovementThreshold;

  // Track the start time so we can determine how long the touch lasted
  touchStart = 0;
  firstTouch = null;

  // Maximum movement allowed during a touch event to still be considered a tap
  tapMovementThreshold = 22;

  this.on('touchstart', function(event) {
    // If more than one finger, don't consider treating this as a click
    if (event.touches.length === 1) {
      firstTouch = event.touches[0];
      // Record start time so we can detect a tap vs. "touch and hold"
      touchStart = new Date().getTime();
      // Reset couldBeTap tracking
      couldBeTap = true;
    }
  });

  this.on('touchmove', function(event) {
    // If more than one finger, don't consider treating this as a click
    if (event.touches.length > 1) {
      couldBeTap = false;
    } else if (firstTouch) {
      // Some devices will throw touchmoves for all but the slightest of taps.
      // So, if we moved only a small distance, this could still be a tap
      xdiff = event.touches[0].pageX - firstTouch.pageX;
      ydiff = event.touches[0].pageY - firstTouch.pageY;
      touchDistance = Math.sqrt(xdiff * xdiff + ydiff * ydiff);
      if (touchDistance > tapMovementThreshold) {
        couldBeTap = false;
      }
    }
  });

  noTap = function(){
    couldBeTap = false;
  };
  // TODO: Listen to the original target. http://youtu.be/DujfpXOKUp8?t=13m8s
  this.on('touchleave', noTap);
  this.on('touchcancel', noTap);

  // When the touch ends, measure how long it took and trigger the appropriate
  // event
  this.on('touchend', function(event) {
    firstTouch = null;
    // Proceed only if the touchmove/leave/cancel event didn't happen
    if (couldBeTap === true) {
      // Measure how long the touch lasted
      touchTime = new Date().getTime() - touchStart;
      // The touch needs to be quick in order to consider it a tap
      if (touchTime < 250) {
        event.preventDefault(); // Don't let browser turn this into a click
        this.trigger('tap');
        // It may be good to copy the touchend event object and change the
        // type to tap, if the other event properties aren't exact after
        // ajs.fixEvent runs (e.g. event.target)
      }
    }
  });
};

/**
 * Report user touch activity when touch events occur
 *
 * User activity is used to determine when controls should show/hide. It's
 * relatively simple when it comes to mouse events, because any mouse event
 * should show the controls. So we capture mouse events that bubble up to the
 * player and report activity when that happens.
 *
 * With touch events it isn't as easy. We can't rely on touch events at the
 * player level, because a tap (touchstart + touchend) on the audio itself on
 * mobile devices is meant to turn controls off (and on). User activity is
 * checked asynchronously, so what could happen is a tap event on the audio
 * turns the controls off, then the touchend event bubbles up to the player,
 * which if it reported user activity, would turn the controls right back on.
 * (We also don't want to completely block touch events from bubbling up)
 *
 * Also a touchmove, touch+hold, and anything other than a tap is not supposed
 * to turn the controls back on on a mobile device.
 *
 * Here we're setting the default component behavior to report user activity
 * whenever touch events happen, and this can be turned off by components that
 * want touch events to act differently.
 */
ajs.Component.prototype.enableTouchActivity = function() {
  var report, touchHolding, touchEnd;

  // listener for reporting that the user is active
  report = ajs.bind(this.player(), this.player().reportUserActivity);

  this.on('touchstart', function() {
    report();
    // For as long as the they are touching the device or have their mouse down,
    // we consider them active even if they're not moving their finger or mouse.
    // So we want to continue to update that they are active
    clearInterval(touchHolding);
    // report at the same interval as activityCheck
    touchHolding = setInterval(report, 250);
  });

  touchEnd = function(event) {
    report();
    // stop the interval that maintains activity if the touch is holding
    clearInterval(touchHolding);
  };

  this.on('touchmove', report);
  this.on('touchend', touchEnd);
  this.on('touchcancel', touchEnd);
};

/* Button - Base class for all buttons
================================================================================ */
/**
 * Base class for all buttons
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
ajs.Button = ajs.Component.extend({
  /**
   * @constructor
   * @inheritDoc
   */
  init: function(player, options){
    ajs.Component.call(this, player, options);

    this.emitTapEvents();

    this.on('tap', this.onClick);
    this.on('click', this.onClick);
    this.on('focus', this.onFocus);
    this.on('blur', this.onBlur);
  }
});

ajs.Button.prototype.createEl = function(type, props){
  var el;

  // Add standard Aria and Tabindex info
  props = ajs.obj.merge({
    className: this.buildCSSClass(),
    'role': 'button',
    'aria-live': 'polite', // let the screen reader user know that the text of the button may change
    tabIndex: 0
  }, props);

  el = ajs.Component.prototype.createEl.call(this, type, props);

  // if innerHTML hasn't been overridden (bigPlayButton), add content elements
  if (!props.innerHTML) {
    this.contentEl_ = ajs.createEl('div', {
      className: 'ajs-control-content'
    });

    this.controlText_ = ajs.createEl('span', {
      className: 'ajs-control-text',
      innerHTML: this.buttonText || 'Need Text'
    });

    this.contentEl_.appendChild(this.controlText_);
    el.appendChild(this.contentEl_);
  }

  return el;
};

ajs.Button.prototype.buildCSSClass = function(){
  // TODO: Change ajs-control to ajs-button?
  return 'ajs-control ' + ajs.Component.prototype.buildCSSClass.call(this);
};

  // Click - Override with specific functionality for button
ajs.Button.prototype.onClick = function(){};

  // Focus - Add keyboard functionality to element
ajs.Button.prototype.onFocus = function(){
  ajs.on(document, 'keyup', ajs.bind(this, this.onKeyPress));
};

  // KeyPress (document level) - Trigger click when keys are pressed
ajs.Button.prototype.onKeyPress = function(event){
  // Check for space bar (32) or enter (13) keys
  if (event.which == 32 || event.which == 13) {
    event.preventDefault();
    this.onClick();
  }
};

// Blur - Remove keyboard triggers
ajs.Button.prototype.onBlur = function(){
  ajs.off(document, 'keyup', ajs.bind(this, this.onKeyPress));
};
/* Slider
================================================================================ */
/**
 * The base functionality for sliders like the volume bar and seek bar
 *
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
ajs.Slider = ajs.Component.extend({
  /** @constructor */
  init: function(player, options){
    ajs.Component.call(this, player, options);

    // Set property names to bar and handle to match with the child Slider class is looking for
    this.bar = this.getChild(this.options_['barName']);
    this.handle = this.getChild(this.options_['handleName']);

    this.on('mousedown', this.onMouseDown);
    this.on('touchstart', this.onMouseDown);
    this.on('focus', this.onFocus);
    this.on('blur', this.onBlur);
    this.on('click', this.onClick);

    this.player_.on('controlsvisible', ajs.bind(this, this.update));

    player.on(this.playerEvent, ajs.bind(this, this.update));

    this.boundEvents = {};
  }
});

ajs.Slider.prototype.createEl = function(type, props) {
  props = props || {};
  // Add the slider element class to all sub classes
  props.className = props.className + ' ajs-slider';
  props = ajs.obj.merge({
    'role': 'slider',
    'aria-valuenow': 0,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    tabIndex: 0
  }, props);

  return ajs.Component.prototype.createEl.call(this, type, props);
};

ajs.Slider.prototype.onMouseDown = function(event){
  event.preventDefault();
  ajs.blockTextSelection();

  this.boundEvents.move = ajs.bind(this, this.onMouseMove);
  this.boundEvents.end = ajs.bind(this, this.onMouseUp);

  ajs.on(document, 'mousemove', this.boundEvents.move);
  ajs.on(document, 'mouseup', this.boundEvents.end);
  ajs.on(document, 'touchmove', this.boundEvents.move);
  ajs.on(document, 'touchend', this.boundEvents.end);

  this.onMouseMove(event);
};

ajs.Slider.prototype.onMouseUp = function() {
  ajs.unblockTextSelection();
  ajs.off(document, 'mousemove', this.boundEvents.move, false);
  ajs.off(document, 'mouseup', this.boundEvents.end, false);
  ajs.off(document, 'touchmove', this.boundEvents.move, false);
  ajs.off(document, 'touchend', this.boundEvents.end, false);

  this.update();
};

ajs.Slider.prototype.update = function(){
  // In VolumeBar init we have a setTimeout for update that pops and update to the end of the
  // execution stack. The player is destroyed before then update will cause an error
  if (!this.el_) return;

  // If scrubbing, we could use a cached value to make the handle keep up with the user's mouse.
  // On HTML5 browsers scrubbing is really smooth, but some flash players are slow, so we might want to utilize this later.
  // var progress =  (this.player_.scrubbing) ? this.player_.getCache().currentTime / this.player_.duration() : this.player_.currentTime() / this.player_.duration();

  var barProgress,
      progress = this.getPercent(),
      handle = this.handle,
      bar = this.bar;

  // Protect against no duration and other division issues
  if (isNaN(progress)) { progress = 0; }

  barProgress = progress;

  // If there is a handle, we need to account for the handle in our calculation for progress bar
  // so that it doesn't fall short of or extend past the handle.
  if (handle) {

    var box = this.el_,
        boxWidth = box.offsetWidth,

        handleWidth = handle.el().offsetWidth,

        // The width of the handle in percent of the containing box
        // In IE, widths may not be ready yet causing NaN
        handlePercent = (handleWidth) ? handleWidth / boxWidth : 0,

        // Get the adjusted size of the box, considering that the handle's center never touches the left or right side.
        // There is a margin of half the handle's width on both sides.
        boxAdjustedPercent = 1 - handlePercent,

        // Adjust the progress that we'll use to set widths to the new adjusted box width
        adjustedProgress = progress * boxAdjustedPercent;

    // The bar does reach the left side, so we need to account for this in the bar's width
    barProgress = adjustedProgress + (handlePercent / 2);

    // Move the handle from the left based on the adjected progress
    handle.el().style.left = ajs.round(adjustedProgress * 100, 2) + '%';
  }

  // Set the new bar width
  bar.el().style.width = ajs.round(barProgress * 100, 2) + '%';
};

ajs.Slider.prototype.calculateDistance = function(event){
  var el, box, boxX, boxY, boxW, boxH, handle, pageX, pageY;

  el = this.el_;
  box = ajs.findPosition(el);
  boxW = boxH = el.offsetWidth;
  handle = this.handle;

  if (this.options_.vertical) {
    boxY = box.top;

    if (event.changedTouches) {
      pageY = event.changedTouches[0].pageY;
    } else {
      pageY = event.pageY;
    }

    if (handle) {
      var handleH = handle.el().offsetHeight;
      // Adjusted X and Width, so handle doesn't go outside the bar
      boxY = boxY + (handleH / 2);
      boxH = boxH - handleH;
    }

    // Percent that the click is through the adjusted area
    return Math.max(0, Math.min(1, ((boxY - pageY) + boxH) / boxH));

  } else {
    boxX = box.left;

    if (event.changedTouches) {
      pageX = event.changedTouches[0].pageX;
    } else {
      pageX = event.pageX;
    }

    if (handle) {
      var handleW = handle.el().offsetWidth;

      // Adjusted X and Width, so handle doesn't go outside the bar
      boxX = boxX + (handleW / 2);
      boxW = boxW - handleW;
    }

    // Percent that the click is through the adjusted area
    return Math.max(0, Math.min(1, (pageX - boxX) / boxW));
  }
};

ajs.Slider.prototype.onFocus = function(){
  ajs.on(document, 'keyup', ajs.bind(this, this.onKeyPress));
};

ajs.Slider.prototype.onKeyPress = function(event){
  if (event.which == 37) { // Left Arrow
    event.preventDefault();
    this.stepBack();
  } else if (event.which == 39) { // Right Arrow
    event.preventDefault();
    this.stepForward();
  }
};

ajs.Slider.prototype.onBlur = function(){
  ajs.off(document, 'keyup', ajs.bind(this, this.onKeyPress));
};

/**
 * Listener for click events on slider, used to prevent clicks
 *   from bubbling up to parent elements like button menus.
 * @param  {Object} event Event object
 */
ajs.Slider.prototype.onClick = function(event){
  event.stopImmediatePropagation();
  event.preventDefault();
};

/**
 * SeekBar Behavior includes play progress bar, and seek handle
 * Needed so it can determine seek position based on handle position/size
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
ajs.SliderHandle = ajs.Component.extend();

/**
 * Default value of the slider
 *
 * @type {Number}
 * @private
 */
ajs.SliderHandle.prototype.defaultValue = 0;

/** @inheritDoc */
ajs.SliderHandle.prototype.createEl = function(type, props) {
  props = props || {};
  // Add the slider element class to all sub classes
  props.className = props.className + ' ajs-slider-handle';
  props = ajs.obj.merge({
    innerHTML: '<span class="ajs-control-text">'+this.defaultValue+'</span>'
  }, props);

  return ajs.Component.prototype.createEl.call(this, 'div', props);
};

/**
 * Custom MediaError to mimic the HTML5 MediaError
 * @param {Number} code The media error code
 */
ajs.MediaError = function(code){
  if (typeof code === 'number') {
    this.code = code;
  } else if (typeof code === 'string') {
    // default code is zero, so this is a custom error
    this.message = code;
  } else if (typeof code === 'object') { // object
    ajs.obj.merge(this, code);
  }

  if (!this.message) {
    this.message = ajs.MediaError.defaultMessages[this.code] || '';
  }
};

/**
 * The error code that refers two one of the defined
 * MediaError types
 * @type {Number}
 */
ajs.MediaError.prototype.code = 0;

/**
 * An optional message to be shown with the error.
 * Message is not part of the HTML5 audio spec
 * but allows for more informative custom errors.
 * @type {String}
 */
ajs.MediaError.prototype.message = '';

/**
 * An optional status code that can be set by plugins
 * to allow even more detail about the error.
 * For example the HLS plugin might proaude the specific
 * HTTP status code that was returned when the error
 * occurred, then allowing a custom error overlay
 * to display more information.
 * @type {[type]}
 */
ajs.MediaError.prototype.status = null;

ajs.MediaError.errorTypes = [
  'MEDIA_ERR_CUSTOM',            // = 0
  'MEDIA_ERR_ABORTED',           // = 1
  'MEDIA_ERR_NETWORK',           // = 2
  'MEDIA_ERR_DECODE',            // = 3
  'MEDIA_ERR_SRC_NOT_SUPPORTED', // = 4
  'MEDIA_ERR_ENCRYPTED'          // = 5
];

ajs.MediaError.defaultMessages = {
  1: 'You aborted the audio playback',
  2: 'A network error caused the audio download to fail part-way.',
  3: 'The audio playback was aborted due to a corruption problem or because the audio used features your browser did not support.',
  4: 'The audio could not be loaded, either because the server or network failed or because the format is not supported.',
  5: 'The audio is encrypted and we do not have the keys to decrypt it.'
};

// Add types as properties on MediaError
// e.g. MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED = 4;
for (var errNum = 0; errNum < ajs.MediaError.errorTypes.length; errNum++) {
  ajs.MediaError[ajs.MediaError.errorTypes[errNum]] = errNum;
  // values should be accessible on both the class and instance
  ajs.MediaError.prototype[ajs.MediaError.errorTypes[errNum]] = errNum;
}

/**
 * An instance of the `ajs.Player` class is created when any of the audio.js setup methods are used to initialize a audio.
 *
 * ```js
 * var myPlayer = audiojs('example_audio_1');
 * ```
 *
 * In the follwing example, the `data-setup` attribute tells the audio.js library to create a player instance when the library is ready.
 *
 * ```html
 * <audio id="example_audio_1" data-setup='{}' controls>
 *   <source src="my-source.mp3" type="audio/mp3">
 * </audio>
 * ```
 *
 * After an instance has been created it can be accessed globally using `audio('example_audio_1')`.
 *
 * @class
 * @extends ajs.Component
 */
ajs.Player = ajs.Component.extend({

  /**
   * player's constructor function
   *
   * @constructs
   * @method init
   * @param {Element} tag        The original audio tag used for configuring options
   * @param {Object=} options    Player options
   * @param {Function=} ready    Ready callback function
   */
  init: function(tag, options, ready){
    this.tag = tag; // Store the original tag used to set options

    // Make sure tag ID exists
    tag.id = tag.id || 'ajs_audio_' + ajs.guid++;

    // Set Options
    // The options argument overrides options set in the audio tag
    // which overrides globally set options.
    // This latter part coincides with the load order
    // (tag must exist before Player)
    options = ajs.obj.merge(this.getTagSettings(tag), options);

    // Cache for audio property values.
    this.cache_ = {};

    // Set controls
    this.controls_ = options['controls'];
    // Original tag settings stored in options
    // now remove immediately so native controls don't flash.
    // May be turned back on by HTML5 tech if nativeControlsForTouch is true
    tag.controls = false;

    // we don't want the player to report touch activity on itself
    // see enableTouchActivity in Component
    options.reportTouchActivity = false;

    // Run base component initializing with new options.
    // Builds the element through createEl()
    // Inits and embeds any child components in opts
    ajs.Component.call(this, this, options, ready);

    // Update controls className. Can't do this when the controls are initially
    // set because the element doesn't exist yet.
    if (this.controls()) {
      this.addClass('ajs-controls-enabled');
    } else {
      this.addClass('ajs-controls-disabled');
    }

    // TODO: Make this smarter. Toggle user state between touching/mousing
    // using events, since devices can have both touch and mouse events.
    // if (ajs.TOUCH_ENABLED) {
    //   this.addClass('ajs-touch-enabled');
    // }

    // Make player easily findable by ID
    ajs.players[this.id_] = this;

    if (options['plugins']) {
      ajs.obj.each(options['plugins'], function(key, val){
        this[key](val);
      }, this);
    }

    this.listenForUserActivity();
  }
});

/**
 * Player instance options, surfaced using ajs.options
 * ajs.options = ajs.Player.prototype.options_
 * Make changes in ajs.options, not here.
 * All options should use string keys so they avoid
 * renaming by closure compiler
 * @type {Object}
 * @private
 */
ajs.Player.prototype.options_ = ajs.options;

/**
 * Destroys the audio player and does any necessary cleanup
 *
 *     myPlayer.dispose();
 *
 * This is especially helpful if you are dynamically adding and removing audios
 * to/from the DOM.
 */
ajs.Player.prototype.dispose = function(){
  this.trigger('dispose');
  // prevent dispose from being called twice
  this.off('dispose');

  // Kill reference to this player
  ajs.players[this.id_] = null;
  if (this.tag && this.tag['player']) { this.tag['player'] = null; }
  if (this.el_ && this.el_['player']) { this.el_['player'] = null; }

  // Ensure that tracking progress and time progress will stop and plater deleted
  this.stopTrackingProgress();
  this.stopTrackingCurrentTime();

  if (this.tech) { this.tech.dispose(); }

  // Component dispose
  ajs.Component.prototype.dispose.call(this);
};

ajs.Player.prototype.getTagSettings = function(tag){
  var options = {
    'sources': []
  };

  ajs.obj.merge(options, ajs.getAttributeValues(tag));

  // Get tag children settings
  if (tag.hasChildNodes()) {
    var children, child, childName, i, j;

    children = tag.childNodes;

    for (i=0,j=children.length; i<j; i++) {
      child = children[i];
      // Change case needed: http://ejohn.org/blog/nodename-case-sensitivity/
      childName = child.nodeName.toLowerCase();
      if (childName === 'source') {
        options['sources'].push(ajs.getAttributeValues(child));
      } 
    }
  }

  return options;
};

ajs.Player.prototype.createEl = function(){
  var el = this.el_ = ajs.Component.prototype.createEl.call(this, 'div');
  var tag = this.tag;

  // Remove width/height attrs from tag so CSS can make it 100% width/height
  tag.removeAttribute('width');
  tag.removeAttribute('height');
  // Empty audio tag tracks so the built-in player doesn't use them also.
  // This may not be fast enough to stop HTML5 browsers from reading the tags
  // so we'll need to turn off any default tracks if we're manually doing
  // captions and subtitles. audioElement.textTracks
  if (tag.hasChildNodes()) {
    var nodes, nodesLength, i, node, nodeName, removeNodes;

    nodes = tag.childNodes;
    nodesLength = nodes.length;
    removeNodes = [];

    while (nodesLength--) {
      node = nodes[nodesLength];
      nodeName = node.nodeName.toLowerCase();
      
    }

    for (i=0; i<removeNodes.length; i++) {
      tag.removeChild(removeNodes[i]);
    }
  }

  // Give audio tag ID and class to player div
  // ID will now reference player box, not the audio tag
  el.id = tag.id;
  el.className = tag.className;

  // Update tag id/class for use as HTML5 playback tech
  // Might think we should do this after embedding in container so .ajs-tech class
  // doesn't flash 100% width/height, but class only applies with .audio-js parent
  tag.id += '_html5_api';
  tag.className = 'ajs-tech';

  // Make player findable on elements
  tag['player'] = el['player'] = this;
  // Default state of audio is paused
  this.addClass('ajs-paused');

  // Make box use width/height of tag, or rely on default implementation
  // Enforce with CSS since width/height attrs don't work on divs
  this.width(this.options_['width'], true); // (true) Skip resize listener on load
  this.height(this.options_['height'], true);

  // Wrap audio tag in div (el/box) container
  if (tag.parentNode) {
    tag.parentNode.insertBefore(el, tag);
  }
  ajs.insertFirst(tag, el); // Breaks iPhone, fixed in HTML5 setup.

  // The event listeners need to be added before the children are added
  // in the component init because the tech (loaded with mediaLoader) may
  // fire events, like loadstart, that these events need to capture.
  // Long term it might be better to expose a way to do this in component.init
  // like component.initEventListeners() that runs between el creation and
  // adding children
  this.el_ = el;
  this.on('loadstart', this.onLoadStart);
  this.on('ended', this.onEnded);
  this.on('play', this.onPlay);
  this.on('firstplay', this.onFirstPlay);
  this.on('pause', this.onPause);
  this.on('progress', this.onProgress);
  this.on('durationchange', this.onDurationChange);
  

  return el;
};

// /* Media Technology (tech)
// ================================================================================ */
// Load/Create an instance of playback technlogy including element and API methods
// And append playback element in player div.
ajs.Player.prototype.loadTech = function(techName, source){

  // Pause and remove current playback technology
  if (this.tech) {
    this.unloadTech();
  }

  // get rid of the HTML5 audio tag as soon as we are using another tech
  if (techName !== 'Html5' && this.tag) {
    ajs.Html5.disposeMediaElement(this.tag);
    this.tag = null;
  }

  this.techName = techName;

  // Turn off API access because we're loading a new tech that might load asynchronously
  this.isReady_ = false;

  var techReady = function(){
    this.player_.triggerReady();

    // Manually track progress in cases where the browser/flash player doesn't report it.
    if (!this.features['progressEvents']) {
      this.player_.manualProgressOn();
    }

    // Manually track timeudpates in cases where the browser/flash player doesn't report it.
    if (!this.features['timeupdateEvents']) {
      this.player_.manualTimeUpdatesOn();
    }
  };

  // Grab tech-specific options from player options and add source and parent element to use.
  var techOptions = ajs.obj.merge({ 'source': source, 'parentEl': this.el_ }, this.options_[techName.toLowerCase()]);

  if (source) {
    if (source.src == this.cache_.src && this.cache_.currentTime > 0) {
      techOptions['startTime'] = this.cache_.currentTime;
    }

    this.cache_.src = source.src;
  }

  // Initialize tech instance
  this.tech = new window['audiojs'][techName](this, techOptions);

  this.tech.ready(techReady);
};

ajs.Player.prototype.unloadTech = function(){
  this.isReady_ = false;
  this.tech.dispose();

  // Turn off any manual progress or timeupdate tracking
  if (this.manualProgress) { this.manualProgressOff(); }

  if (this.manualTimeUpdates) { this.manualTimeUpdatesOff(); }

  this.tech = false;
};

// There's many issues around changing the size of a Flash (or other plugin) object.
// First is a plugin reload issue in Firefox that has been around for 11 years: https://bugzilla.mozilla.org/show_bug.cgi?id=90268
//
// To get around this, we're unloading the tech, caching source and currentTime values, and reloading the tech once the plugin is resized.
// reloadTech: function(betweenFn){
//   ajs.log('unloadingTech')
//   this.unloadTech();
//   ajs.log('unloadedTech')
//   if (betweenFn) { betweenFn.call(); }
//   ajs.log('LoadingTech')
//   this.loadTech(this.techName, { src: this.cache_.src })
//   ajs.log('loadedTech')
// },

/* Fallbacks for unsupported event types
================================================================================ */
// Manually trigger progress events based on changes to the buffered amount
// Many flash players and older HTML5 browsers don't send progress or progress-like events
ajs.Player.prototype.manualProgressOn = function(){
  this.manualProgress = true;

  // Trigger progress watching when a source begins loading
  this.trackProgress();

  // Watch for a native progress event call on the tech element
  // In HTML5, some older versions don't support the progress event
  // So we're assuming they don't, and turning off manual progress if they do.
  // As opposed to doing user agent detection
  if (this.tech) {
    this.tech.one('progress', function(){

      // Update known progress support for this playback technology
      this.features['progressEvents'] = true;

      // Turn off manual progress tracking
      this.player_.manualProgressOff();
    });
  }
};

ajs.Player.prototype.manualProgressOff = function(){
  this.manualProgress = false;
  this.stopTrackingProgress();
};

ajs.Player.prototype.trackProgress = function(){

  this.progressInterval = setInterval(ajs.bind(this, function(){
    // Don't trigger unless buffered amount is greater than last time
    // log(this.cache_.bufferEnd, this.buffered().end(0), this.duration())
    /* TODO: update for multiple buffered regions */
    if (this.cache_.bufferEnd < this.buffered().end(0)) {
      this.trigger('progress');
    } else if (this.bufferedPercent() == 1) {
      this.stopTrackingProgress();
      this.trigger('progress'); // Last update
    }
  }), 500);
};
ajs.Player.prototype.stopTrackingProgress = function(){ clearInterval(this.progressInterval); };

/*! Time Tracking -------------------------------------------------------------- */
ajs.Player.prototype.manualTimeUpdatesOn = function(){
  this.manualTimeUpdates = true;

  this.on('play', this.trackCurrentTime);
  this.on('pause', this.stopTrackingCurrentTime);
  // timeupdate is also called by .currentTime whenever current time is set

  // Watch for native timeupdate event
  if (this.tech) {
    this.tech.one('timeupdate', function(){
      // Update known progress support for this playback technology
      this.features['timeupdateEvents'] = true;
      // Turn off manual progress tracking
      this.player_.manualTimeUpdatesOff();
    });
  }
};

ajs.Player.prototype.manualTimeUpdatesOff = function(){
  this.manualTimeUpdates = false;
  this.stopTrackingCurrentTime();
  this.off('play', this.trackCurrentTime);
  this.off('pause', this.stopTrackingCurrentTime);
};

ajs.Player.prototype.trackCurrentTime = function(){
  if (this.currentTimeInterval) { this.stopTrackingCurrentTime(); }
  this.currentTimeInterval = setInterval(ajs.bind(this, function(){
    this.trigger('timeupdate');
  }), 250); // 42 = 24 fps // 250 is what Webkit uses // FF uses 15
};

// Turn off play progress tracking (when paused or dragging)
ajs.Player.prototype.stopTrackingCurrentTime = function(){
  clearInterval(this.currentTimeInterval);

  // #1002 - if the audio ends right before the next timeupdate would happen,
  // the progress bar won't make it all the way to the end
  this.trigger('timeupdate');
};
// /* Player event handlers (how the player reacts to certain events)
// ================================================================================ */

/**
 * Fired when the user agent begins looking for media data
 * @event loadstart
 */
ajs.Player.prototype.onLoadStart = function() {
  // TODO: Update to use `emptied` event instead. See #1277.

  // reset the error state
  this.error(null);

  // If it's already playing we want to trigger a firstplay event now.
  // The firstplay event relies on both the play and loadstart events
  // which can happen in any order for a new source
  if (!this.paused()) {
    this.trigger('firstplay');
  } else {
    // reset the hasStarted state
    this.hasStarted(false);
    this.one('play', function(){
      this.hasStarted(true);
    });
  }
};

ajs.Player.prototype.hasStarted_ = false;

ajs.Player.prototype.hasStarted = function(hasStarted){
  if (hasStarted !== undefined) {
    // only update if this is a new value
    if (this.hasStarted_ !== hasStarted) {
      this.hasStarted_ = hasStarted;
      if (hasStarted) {
        this.addClass('ajs-has-started');
        // trigger the firstplay event if this newly has played
        this.trigger('firstplay');
      } else {
        this.removeClass('ajs-has-started');
      }
    }
    return this;
  }
  return this.hasStarted_;
};

/**
 * Fired when the player has initial duration and dimension information
 * @event loadedmetadata
 */
ajs.Player.prototype.onLoadedMetaData;

/**
 * Fired when the player has downloaded data at the current playback position
 * @event loadeddata
 */
ajs.Player.prototype.onLoadedData;

/**
 * Fired when the player has finished downloading the source data
 * @event loadedalldata
 */
ajs.Player.prototype.onLoadedAllData;

/**
 * Fired whenever the media begins or resumes playback
 * @event play
 */
ajs.Player.prototype.onPlay = function(){
  ajs.removeClass(this.el_, 'ajs-paused');
  ajs.addClass(this.el_, 'ajs-playing');
};

/**
 * Fired the first time a audio is played
 *
 * Not part of the HLS spec, and we're not sure if this is the best
 * implementation yet, so use sparingly. If you don't have a reason to
 * prevent playback, use `myPlayer.one('play');` instead.
 *
 * @event firstplay
 */
ajs.Player.prototype.onFirstPlay = function(){
    //If the first starttime attribute is specified
    //then we will start at the given offset in seconds
    if(this.options_['starttime']){
      this.currentTime(this.options_['starttime']);
    }

    this.addClass('ajs-has-started');
};

/**
 * Fired whenever the media has been paused
 * @event pause
 */
ajs.Player.prototype.onPause = function(){
  ajs.removeClass(this.el_, 'ajs-playing');
  ajs.addClass(this.el_, 'ajs-paused');
};

/**
 * Fired when the current playback position has changed
 *
 * During playback this is fired every 15-250 milliseconds, depnding on the
 * playback technology in use.
 * @event timeupdate
 */
ajs.Player.prototype.onTimeUpdate;

/**
 * Fired while the user agent is downloading media data
 * @event progress
 */
ajs.Player.prototype.onProgress = function(){
  // Add custom event for when source is finished downloading.
  if (this.bufferedPercent() == 1) {
    this.trigger('loadedalldata');
  }
};

/**
 * Fired when the end of the media resource is reached (currentTime == duration)
 * @event ended
 */
ajs.Player.prototype.onEnded = function(){
  if (this.options_['loop']) {
    this.currentTime(0);
    this.play();
  }
};

/**
 * Fired when the duration of the media resource is first known or changed
 * @event durationchange
 */
ajs.Player.prototype.onDurationChange = function(){
  // Allows for cacheing value instead of asking player each time.
  // We need to get the techGet response and check for a value so we don't
  // accidentally cause the stack to blow up.
  var duration = this.techGet('duration');
  if (duration) {
    if (duration < 0) {
      duration = Infinity;
    }
    this.duration(duration);
    // Determine if the stream is live and propagate styles down to UI.
    if (duration === Infinity) {
      this.addClass('ajs-live');
    } else {
      this.removeClass('ajs-live');
    }
  }
};

/**
 * Fired when the volume changes
 * @event volumechange
 */
ajs.Player.prototype.onVolumeChange;


// /* Player API
// ================================================================================ */

/**
 * Object for cached values.
 * @private
 */
ajs.Player.prototype.cache_;

ajs.Player.prototype.getCache = function(){
  return this.cache_;
};

// Pass values to the playback tech
ajs.Player.prototype.techCall = function(method, arg){
  // If it's not ready yet, call method when it is
  if (this.tech && !this.tech.isReady_) {
    this.tech.ready(function(){
      this[method](arg);
    });

  // Otherwise call method now
  } else {
    try {
      this.tech[method](arg);
    } catch(e) {
      ajs.log(e);
      throw e;
    }
  }
};

// Get calls can't wait for the tech, and sometimes don't need to.
ajs.Player.prototype.techGet = function(method){
  if (this.tech && this.tech.isReady_) {

    // Flash likes to die and reload when you hide or reposition it.
    // In these cases the object methods go away and we get errors.
    // When that happens we'll catch the errors and inform tech that it's not ready any more.
    try {
      return this.tech[method]();
    } catch(e) {
      // When building additional tech libs, an expected method may not be defined yet
      if (this.tech[method] === undefined) {
        ajs.log('audio.js: ' + method + ' method not defined for '+this.techName+' playback technology.', e);
      } else {
        // When a method isn't available on the object it throws a TypeError
        if (e.name == 'TypeError') {
          ajs.log('audio.js: ' + method + ' unavailable on '+this.techName+' playback technology element.', e);
          this.tech.isReady_ = false;
        } else {
          ajs.log(e);
        }
      }
      throw e;
    }
  }

  return;
};

/**
 * start media playback
 *
 *     myPlayer.play();
 *
 * @return {ajs.Player} self
 */
ajs.Player.prototype.play = function(){
  this.techCall('play');
  return this;
};

/**
 * Pause the audio playback
 *
 *     myPlayer.pause();
 *
 * @return {ajs.Player} self
 */
ajs.Player.prototype.pause = function(){
  this.techCall('pause');
  return this;
};

/**
 * Check if the player is paused
 *
 *     var isPaused = myPlayer.paused();
 *     var isPlaying = !myPlayer.paused();
 *
 * @return {Boolean} false if the media is currently playing, or true otherwise
 */
ajs.Player.prototype.paused = function(){
  // The initial state of paused should be true (in Safari it's actually false)
  return (this.techGet('paused') === false) ? false : true;
};

/**
 * Get or set the current time (in seconds)
 *
 *     // get
 *     var whereYouAt = myPlayer.currentTime();
 *
 *     // set
 *     myPlayer.currentTime(120); // 2 minutes into the audio
 *
 * @param  {Number|String=} seconds The time to seek to
 * @return {Number}        The time in seconds, when not setting
 * @return {ajs.Player}    self, when the current time is set
 */
ajs.Player.prototype.currentTime = function(seconds){
  if (seconds !== undefined) {

    this.techCall('setCurrentTime', seconds);

    // improve the accuracy of manual timeupdates
    if (this.manualTimeUpdates) { this.trigger('timeupdate'); }

    return this;
  }

  // cache last currentTime and return. default to 0 seconds
  //
  // Caching the currentTime is meant to prevent a massive amount of reads on the tech's
  // currentTime when scrubbing, but may not proaude much performace benefit afterall.
  // Should be tested. Also something has to read the actual current time or the cache will
  // never get updated.
  return this.cache_.currentTime = (this.techGet('currentTime') || 0);
};

/**
 * Get the length in time of the audio in seconds
 *
 *     var lengthOfaudio = myPlayer.duration();
 *
 * **NOTE**: The audio must have started loading before the duration can be
 * known, and in the case of Flash, may not be known until the audio starts
 * playing.
 *
 * @return {Number} The duration of the audio in seconds
 */
ajs.Player.prototype.duration = function(seconds){
  if (seconds !== undefined) {

    // cache the last set value for optimiized scrubbing (esp. Flash)
    this.cache_.duration = parseFloat(seconds);

    return this;
  }

  if (this.cache_.duration === undefined) {
    this.onDurationChange();
  }

  return this.cache_.duration || 0;
};

// Calculates how much time is left. Not in spec, but useful.
ajs.Player.prototype.remainingTime = function(){
  return this.duration() - this.currentTime();
};

// http://dev.w3.org/html5/spec/audio.html#dom-media-buffered
// Buffered returns a timerange object.
// Kind of like an array of portions of the audio that have been downloaded.
// So far no browsers return more than one range (portion)

/**
 * Get a TimeRange object with the times of the audio that have been downloaded
 *
 * If you just want the percent of the audio that's been downloaded,
 * use bufferedPercent.
 *
 *     // Number of different ranges of time have been buffered. Usually 1.
 *     numberOfRanges = bufferedTimeRange.length,
 *
 *     // Time in seconds when the first range starts. Usually 0.
 *     firstRangeStart = bufferedTimeRange.start(0),
 *
 *     // Time in seconds when the first range ends
 *     firstRangeEnd = bufferedTimeRange.end(0),
 *
 *     // Length in seconds of the first time range
 *     firstRangeLength = firstRangeEnd - firstRangeStart;
 *
 * @return {Object} A mock TimeRange object (following HTML spec)
 */
ajs.Player.prototype.buffered = function(){
  var buffered = this.techGet('buffered'),
      start = 0,
      buflast = buffered.length - 1,
      // Default end to 0 and store in values
      end = this.cache_.bufferEnd = this.cache_.bufferEnd || 0;

  if (buffered && buflast >= 0 && buffered.end(buflast) !== end) {
    end = buffered.end(buflast);
    // Storing values allows them be overridden by setBufferedFromProgress
    this.cache_.bufferEnd = end;
  }

  return ajs.createTimeRange(start, end);
};

/**
 * Get the percent (as a decimal) of the audio that's been downloaded
 *
 *     var howMuchIsDownloaded = myPlayer.bufferedPercent();
 *
 * 0 means none, 1 means all.
 * (This method isn't in the HTML5 spec, but it's very convenient)
 *
 * @return {Number} A decimal between 0 and 1 representing the percent
 */
ajs.Player.prototype.bufferedPercent = function(){
  return (this.duration()) ? this.buffered().end(0) / this.duration() : 0;
};

/**
 * Get or set the current volume of the media
 *
 *     // get
 *     var howLoudIsIt = myPlayer.volume();
 *
 *     // set
 *     myPlayer.volume(0.5); // Set volume to half
 *
 * 0 is off (muted), 1.0 is all the way up, 0.5 is half way.
 *
 * @param  {Number} percentAsDecimal The new volume as a decimal percent
 * @return {Number}                  The current volume, when getting
 * @return {ajs.Player}              self, when setting
 */
ajs.Player.prototype.volume = function(percentAsDecimal){
  var vol;

  if (percentAsDecimal !== undefined) {
    vol = Math.max(0, Math.min(1, parseFloat(percentAsDecimal))); // Force value to between 0 and 1
    this.cache_.volume = vol;
    this.techCall('setVolume', vol);
    ajs.setLocalStorage('volume', vol);
    return this;
  }

  // Default to 1 when returning current volume.
  vol = parseFloat(this.techGet('volume'));
  return (isNaN(vol)) ? 1 : vol;
};


/**
 * Get the current muted state, or turn mute on or off
 *
 *     // get
 *     var isVolumeMuted = myPlayer.muted();
 *
 *     // set
 *     myPlayer.muted(true); // mute the volume
 *
 * @param  {Boolean=} muted True to mute, false to unmute
 * @return {Boolean} True if mute is on, false if not, when getting
 * @return {ajs.Player} self, when setting mute
 */
ajs.Player.prototype.muted = function(muted){
  if (muted !== undefined) {
    this.techCall('setMuted', muted);
    return this;
  }
  return this.techGet('muted') || false; // Default to false
};



ajs.Player.prototype.selectSource = function(sources){

  // Loop through each playback technology in the options order
  for (var i=0,j=this.options_['techOrder'];i<j.length;i++) {
    var techName = ajs.capitalize(j[i]),
        tech = window['audiojs'][techName];

    // Check if the current tech is defined before continuing
    if (!tech) {
      ajs.log.error('The "' + techName + '" tech is undefined. Skipped browser support check for that tech.');
      continue;
    }

    // Check if the browser supports this technology
    if (tech.isSupported()) {
      // Loop through each source object
      for (var a=0,b=sources;a<b.length;a++) {
        var source = b[a];

        // Check if source can be played with this technology
        if (tech['canPlaySource'](source)) {
          return { source: source, tech: techName };
        }
      }
    }
  }

  return false;
};

/**
 * The source function updates the audio source
 *
 * There are three types of variables you can pass as the argument.
 *
 * **URL String**: A URL to the the audio file. Use this method if you are sure
 * the current playback technology (HTML5/Flash) can support the source you
 * proaude. Currently only mp3 files can be used in both HTML5 and Flash.
 *
 *     myPlayer.src("http://www.example.com/path/to/audio.mp3");
 *
 * **Source Object (or element):** A javascript object containing information
 * about the source file. Use this method if you want the player to determine if
 * it can support the file using the type information.
 *
 *     myPlayer.src({ type: "audio/mp3", src: "http://www.example.com/path/to/audio.mp3" });
 *
 * **Array of Source Objects:** To proaude multiple versions of the source so
 * that it can be played using HTML5 across browsers you can use an array of
 * source objects. audio.js will detect which version is supported and load that
 * file.
 *
 *     myPlayer.src([
 *       { type: "audio/mp3", src: "http://www.example.com/path/to/audio.mp3" },
 *       { type: "audio/webm", src: "http://www.example.com/path/to/audio.webm" },
 *       { type: "audio/ogg", src: "http://www.example.com/path/to/audio.ogv" }
 *     ]);
 *
 * @param  {String|Object|Array=} source The source URL, object, or array of sources
 * @return {String} The current audio source when getting
 * @return {String} The player when setting
 */
ajs.Player.prototype.src = function(source){
  if (source === undefined) {
    return this.techGet('src');
  }

  // Case: Array of source objects to choose from and pick the best to play
  if (ajs.obj.isArray(source)) {

    var sourceTech = this.selectSource(source),
        techName;

    if (sourceTech) {
        source = sourceTech.source;
        techName = sourceTech.tech;

      // If this technology is already loaded, set source
      if (techName == this.techName) {
        this.src(source); // Passing the source object
      // Otherwise load this technology with chosen source
      } else {
        this.loadTech(techName, source);
      }
    } else {
      // this.el_.appendChild(ajs.createEl('p', {
      //   innerHTML: this.options()['notSupportedMessage']
      // }));
      this.error({ code: 4, message: this.options()['notSupportedMessage'] });
      this.triggerReady(); // we could not find an appropriate tech, but let's still notify the delegate that this is it
    }

  // Case: Source object { src: '', type: '' ... }
  } else if (source instanceof Object) {

    if (window['audiojs'][this.techName]['canPlaySource'](source)) {
      this.src(source.src);
    } else {
      // Send through tech loop to check for a compatible technology.
      this.src([source]);
    }

  // Case: URL String (http://myaudio...)
  } else {
    // Cache for getting last set source
    this.cache_.src = source;

    if (!this.isReady_) {
      this.ready(function(){
        this.src(source);
      });
    } else {
      this.techCall('src', source);
      if (this.options_['preload'] == 'auto') {
        this.load();
      }
      if (this.options_['autoplay']) {
        this.play();
      }
    }
  }

  return this;
};

// Begin loading the src data
// http://dev.w3.org/html5/spec/audio.html#dom-media-load
ajs.Player.prototype.load = function(){
  this.techCall('load');
  return this;
};

// http://dev.w3.org/html5/spec/audio.html#dom-media-currentsrc
ajs.Player.prototype.currentSrc = function(){
  return this.techGet('currentSrc') || this.cache_.src || '';
};

// Attributes/Options
ajs.Player.prototype.preload = function(value){
  if (value !== undefined) {
    this.techCall('setPreload', value);
    this.options_['preload'] = value;
    return this;
  }
  return this.techGet('preload');
};
ajs.Player.prototype.autoplay = function(value){
  if (value !== undefined) {
    this.techCall('setAutoplay', value);
    this.options_['autoplay'] = value;
    return this;
  }
  return this.techGet('autoplay', value);
};
ajs.Player.prototype.loop = function(value){
  if (value !== undefined) {
    this.techCall('setLoop', value);
    this.options_['loop'] = value;
    return this;
  }
  return this.techGet('loop');
};



/**
 * Whether or not the controls are showing
 * @type {Boolean}
 * @private
 */
ajs.Player.prototype.controls_;

/**
 * Get or set whether or not the controls are showing.
 * @param  {Boolean} controls Set controls to showing or not
 * @return {Boolean}    Controls are showing
 */
ajs.Player.prototype.controls = function(bool){
  if (bool !== undefined) {
    bool = !!bool; // force boolean
    // Don't trigger a change event unless it actually changed
    if (this.controls_ !== bool) {
      this.controls_ = bool;
      if (bool) {
        this.removeClass('ajs-controls-disabled');
        this.addClass('ajs-controls-enabled');
        this.trigger('controlsenabled');
      } else {
        this.removeClass('ajs-controls-enabled');
        this.addClass('ajs-controls-disabled');
        this.trigger('controlsdisabled');
      }
    }
    return this;
  }
  return this.controls_;
};

ajs.Player.prototype.usingNativeControls_;

/**
 * Toggle native controls on/off. Native controls are the controls built into
 * devices (e.g. default iPhone controls), Flash, or other techs
 * (e.g. Vimeo Controls)
 *
 * **This should only be set by the current tech, because only the tech knows
 * if it can support native controls**
 *
 * @param  {Boolean} bool    True signals that native controls are on
 * @return {ajs.Player}      Returns the player
 * @private
 */
ajs.Player.prototype.usingNativeControls = function(bool){
  if (bool !== undefined) {
    bool = !!bool; // force boolean
    // Don't trigger a change event unless it actually changed
    if (this.usingNativeControls_ !== bool) {
      this.usingNativeControls_ = bool;
      if (bool) {
        this.addClass('ajs-using-native-controls');

        /**
         * player is using the native device controls
         *
         * @event usingnativecontrols
         * @memberof ajs.Player
         * @instance
         * @private
         */
        this.trigger('usingnativecontrols');
      } else {
        this.removeClass('ajs-using-native-controls');

        /**
         * player is using the custom HTML controls
         *
         * @event usingcustomcontrols
         * @memberof ajs.Player
         * @instance
         * @private
         */
        this.trigger('usingcustomcontrols');
      }
    }
    return this;
  }
  return this.usingNativeControls_;
};

/**
 * Store the current media error
 * @type {Object}
 * @private
 */
ajs.Player.prototype.error_ = null;

/**
 * Set or get the current MediaError
 * @param  {*} err A MediaError or a String/Number to be turned into a MediaError
 * @return {ajs.MediaError|null}     when getting
 * @return {ajs.Player}              when setting
 */
ajs.Player.prototype.error = function(err){
  if (err === undefined) {
    return this.error_;
  }

  // restoring to default
  if (err === null) {
    this.error_ = err;
    this.removeClass('ajs-error');
    return this;
  }

  // error instance
  if (err instanceof ajs.MediaError) {
    this.error_ = err;
  } else {
    this.error_ = new ajs.MediaError(err);
  }

  // fire an error event on the player
  this.trigger('error');

  // add the ajs-error classname to the player
  this.addClass('ajs-error');

  // log the name of the error type and any message
  // ie8 just logs "[object object]" if you just log the error object
  ajs.log.error('(CODE:'+this.error_.code+' '+ajs.MediaError.errorTypes[this.error_.code]+')', this.error_.message, this.error_);

  return this;
};

ajs.Player.prototype.ended = function(){ return this.techGet('ended'); };
ajs.Player.prototype.seeking = function(){ return this.techGet('seeking'); };

// When the player is first initialized, trigger activity so components
// like the control bar show themselves if needed
ajs.Player.prototype.userActivity_ = true;
ajs.Player.prototype.reportUserActivity = function(event){
  this.userActivity_ = true;
};

ajs.Player.prototype.userActive_ = true;
ajs.Player.prototype.userActive = function(bool){
  if (bool !== undefined) {
    bool = !!bool;
    if (bool !== this.userActive_) {
      this.userActive_ = bool;
      if (bool) {
        // If the user was inactive and is now active we want to reset the
        // inactivity timer
        this.userActivity_ = true;
        this.removeClass('ajs-user-inactive');
        this.addClass('ajs-user-active');
        this.trigger('useractive');
      } else {
        // We're switching the state to inactive manually, so erase any other
        // activity
        this.userActivity_ = false;

        // Chrome/Safari/IE have bugs where when you change the cursor it can
        // trigger a mousemove event. This causes an issue when you're hiding
        // the cursor when the user is inactive, and a mousemove signals user
        // activity. Making it impossible to go into inactive mode. Specifically
        // this happens in fullscreen when we really need to hide the cursor.
        //
        // When this gets resolved in ALL browsers it can be removed
        // https://code.google.com/p/chromium/issues/detail?id=103041
        if(this.tech) {
          this.tech.one('mousemove', function(e){
            e.stopPropagation();
            e.preventDefault();
          });
        }

        this.removeClass('ajs-user-active');
        this.addClass('ajs-user-inactive');
        this.trigger('userinactive');
      }
    }
    return this;
  }
  return this.userActive_;
};

ajs.Player.prototype.listenForUserActivity = function(){
  var onActivity, onMouseMove, onMouseDown, mouseInProgress, onMouseUp,
      activityCheck, inactivityTimeout, lastMoveX, lastMoveY;

  onActivity = ajs.bind(this, this.reportUserActivity);

  onMouseMove = function(e) {
    // #1068 - Prevent mousemove spamming
    // Chrome Bug: https://code.google.com/p/chromium/issues/detail?id=366970
    if(e.screenX != lastMoveX || e.screenY != lastMoveY) {
      lastMoveX = e.screenX;
      lastMoveY = e.screenY;
      onActivity();
    }
  };

  onMouseDown = function() {
    onActivity();
    // For as long as the they are touching the device or have their mouse down,
    // we consider them active even if they're not moving their finger or mouse.
    // So we want to continue to update that they are active
    clearInterval(mouseInProgress);
    // Setting userActivity=true now and setting the interval to the same time
    // as the activityCheck interval (250) should ensure we never miss the
    // next activityCheck
    mouseInProgress = setInterval(onActivity, 250);
  };

  onMouseUp = function(event) {
    onActivity();
    // Stop the interval that maintains activity if the mouse/touch is down
    clearInterval(mouseInProgress);
  };

  // Any mouse movement will be considered user activity
  this.on('mousedown', onMouseDown);
  this.on('mousemove', onMouseMove);
  this.on('mouseup', onMouseUp);

  // Listen for keyboard navigation
  // Shouldn't need to use inProgress interval because of key repeat
  this.on('keydown', onActivity);
  this.on('keyup', onActivity);

  // Run an interval every 250 milliseconds instead of stuffing everything into
  // the mousemove/touchmove function itself, to prevent performance degradation.
  // `this.reportUserActivity` simply sets this.userActivity_ to true, which
  // then gets picked up by this loop
  // http://ejohn.org/blog/learning-from-twitter/
  activityCheck = setInterval(ajs.bind(this, function() {
    // Check to see if mouse/touch activity has happened
    if (this.userActivity_) {
      // Reset the activity tracker
      this.userActivity_ = false;

      // If the user state was inactive, set the state to active
      this.userActive(true);

      // Clear any existing inactivity timeout to start the timer over
      clearTimeout(inactivityTimeout);

      // In X seconds, if no more activity has occurred the user will be
      // considered inactive
      inactivityTimeout = setTimeout(ajs.bind(this, function() {
        // Protect against the case where the inactivityTimeout can trigger just
        // before the next user activity is picked up by the activityCheck loop
        // causing a flicker
        if (!this.userActivity_) {
          this.userActive(false);
        }
      }), 2000);
    }
  }), 250);

  // Clean up the intervals when we kill the player
  this.on('dispose', function(){
    clearInterval(activityCheck);
    clearTimeout(inactivityTimeout);
  });
};

// Methods to add support for
// networkState: function(){ return this.techCall('networkState'); },
// readyState: function(){ return this.techCall('readyState'); },
// initialTime: function(){ return this.techCall('initialTime'); },
// startOffsetTime: function(){ return this.techCall('startOffsetTime'); },
// played: function(){ return this.techCall('played'); },
// seekable: function(){ return this.techCall('seekable'); },
// audioWidth: function(){ return this.techCall('audioWidth'); },
// audioHeight: function(){ return this.techCall('audioHeight'); },
// defaultPlaybackRate: function(){ return this.techCall('defaultPlaybackRate'); },
// mediaGroup: function(){ return this.techCall('mediaGroup'); },
// controller: function(){ return this.techCall('controller'); },
// defaultMuted: function(){ return this.techCall('defaultMuted'); }

// TODO
// currentSrcList: the array of sources including other formats and bitrates
// playList: array of source lists in order of playback
/**
 * Container of main controls
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 * @extends ajs.Component
 */
ajs.ControlBar = ajs.Component.extend();

ajs.ControlBar.prototype.options_ = {
  loadEvent: 'play',
  children: {
    'playToggle': {},
    'currentTimeDisplay': {},
    'timedivider': {},
    'durationDisplay': {},
    'remainingTimeDisplay': {},
    'progressControl': {},
    'volumeControl': {},
    'muteToggle': {}
  }
};

ajs.ControlBar.prototype.createEl = function(){
  return ajs.createEl('div', {
    className: 'ajs-control-bar'
  });
};

/**
 * Button to toggle between play and pause
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
ajs.PlayToggle = ajs.Button.extend({
  /** @constructor */
  init: function(player, options){
    ajs.Button.call(this, player, options);

    player.on('play', ajs.bind(this, this.onPlay));
    player.on('pause', ajs.bind(this, this.onPause));
  }
});

ajs.PlayToggle.prototype.buttonText = 'Play';

ajs.PlayToggle.prototype.buildCSSClass = function(){
  return 'ajs-play-control ' + ajs.Button.prototype.buildCSSClass.call(this);
};

// OnClick - Toggle between play and pause
ajs.PlayToggle.prototype.onClick = function(){
  if (this.player_.paused()) {
    this.player_.play();
  } else {
    this.player_.pause();
  }
};

  // OnPlay - Add the ajs-playing class to the element so it can change appearance
ajs.PlayToggle.prototype.onPlay = function(){
  ajs.removeClass(this.el_, 'ajs-paused');
  ajs.addClass(this.el_, 'ajs-playing');
  this.el_.children[0].children[0].innerHTML = 'Pause'; // change the button text to "Pause"
};

  // OnPause - Add the ajs-paused class to the element so it can change appearance
ajs.PlayToggle.prototype.onPause = function(){
  ajs.removeClass(this.el_, 'ajs-playing');
  ajs.addClass(this.el_, 'ajs-paused');
  this.el_.children[0].children[0].innerHTML = 'Play'; // change the button text to "Play"
};
/**
 * Displays the current time
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
ajs.CurrentTimeDisplay = ajs.Component.extend({
  /** @constructor */
  init: function(player, options){
    ajs.Component.call(this, player, options);

    player.on('timeupdate', ajs.bind(this, this.updateContent));
  }
});

ajs.CurrentTimeDisplay.prototype.createEl = function(){
  var el = ajs.Component.prototype.createEl.call(this, 'div', {
    className: 'ajs-current-time ajs-time-controls ajs-control'
  });

  this.contentEl_ = ajs.createEl('div', {
    className: 'ajs-current-time-display',
    innerHTML: '<span class="ajs-control-text">Current Time </span>' + '0:00', // label the current time for screen reader users
    'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
  });

  el.appendChild(this.contentEl_);
  return el;
};

ajs.CurrentTimeDisplay.prototype.updateContent = function(){
  // Allows for smooth scrubbing, when player can't keep up.
  var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
  this.contentEl_.innerHTML = '<span class="ajs-control-text">Current Time </span>' + ajs.formatTime(time, this.player_.duration());
};

/**
 * Displays the duration
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
ajs.DurationDisplay = ajs.Component.extend({
  /** @constructor */
  init: function(player, options){
    ajs.Component.call(this, player, options);

    // this might need to be changed to 'durationchange' instead of 'timeupdate' eventually,
    // however the durationchange event fires before this.player_.duration() is set,
    // so the value cannot be written out using this method.
    // Once the order of durationchange and this.player_.duration() being set is figured out,
    // this can be updated.
    player.on('timeupdate', ajs.bind(this, this.updateContent));
  }
});

ajs.DurationDisplay.prototype.createEl = function(){
  var el = ajs.Component.prototype.createEl.call(this, 'div', {
    className: 'ajs-duration ajs-time-controls ajs-control'
  });

  this.contentEl_ = ajs.createEl('div', {
    className: 'ajs-duration-display',
    innerHTML: '<span class="ajs-control-text">Duration Time </span>' + '0:00', // label the duration time for screen reader users
    'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
  });

  el.appendChild(this.contentEl_);
  return el;
};

ajs.DurationDisplay.prototype.updateContent = function(){
  var duration = this.player_.duration();
  if (duration) {
      this.contentEl_.innerHTML = '<span class="ajs-control-text">Duration Time </span>' + ajs.formatTime(duration); // label the duration time for screen reader users
  }
};

/**
 * The separator between the current time and duration
 *
 * Can be hidden if it's not needed in the design.
 *
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
ajs.Timedivider = ajs.Component.extend({
  /** @constructor */
  init: function(player, options){
    ajs.Component.call(this, player, options);
  }
});

ajs.Timedivider.prototype.createEl = function(){
  return ajs.Component.prototype.createEl.call(this, 'div', {
    className: 'ajs-time-divider',
    innerHTML: '<div><span>/</span></div>'
  });
};

/**
 * Displays the time left in the audio
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
ajs.RemainingTimeDisplay = ajs.Component.extend({
  /** @constructor */
  init: function(player, options){
    ajs.Component.call(this, player, options);

    player.on('timeupdate', ajs.bind(this, this.updateContent));
  }
});

ajs.RemainingTimeDisplay.prototype.createEl = function(){
  var el = ajs.Component.prototype.createEl.call(this, 'div', {
    className: 'ajs-remaining-time ajs-time-controls ajs-control'
  });

  this.contentEl_ = ajs.createEl('div', {
    className: 'ajs-remaining-time-display',
    innerHTML: '<span class="ajs-control-text">Remaining Time </span>' + '-0:00', // label the remaining time for screen reader users
    'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
  });

  el.appendChild(this.contentEl_);
  return el;
};

ajs.RemainingTimeDisplay.prototype.updateContent = function(){
  if (this.player_.duration()) {
    this.contentEl_.innerHTML = '<span class="ajs-control-text">Remaining Time </span>' + '-'+ ajs.formatTime(this.player_.remainingTime());
  }

  // Allows for smooth scrubbing, when player can't keep up.
  // var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
  // this.contentEl_.innerHTML = ajs.formatTime(time, this.player_.duration());
};

/**
 * The Progress Control component contains the seek bar, load progress,
 * and play progress
 *
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
ajs.ProgressControl = ajs.Component.extend({
  /** @constructor */
  init: function(player, options){
    ajs.Component.call(this, player, options);
  }
});

ajs.ProgressControl.prototype.options_ = {
  children: {
    'seekBar': {}
  }
};

ajs.ProgressControl.prototype.createEl = function(){
  return ajs.Component.prototype.createEl.call(this, 'div', {
    className: 'ajs-progress-control ajs-control'
  });
};

/**
 * Seek Bar and holder for the progress bars
 *
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
ajs.SeekBar = ajs.Slider.extend({
  /** @constructor */
  init: function(player, options){
    ajs.Slider.call(this, player, options);
    player.on('timeupdate', ajs.bind(this, this.updateARIAAttributes));
    player.ready(ajs.bind(this, this.updateARIAAttributes));
  }
});

ajs.SeekBar.prototype.options_ = {
  children: {
    'loadProgressBar': {},
    'playProgressBar': {},
    'seekHandle': {}
  },
  'barName': 'playProgressBar',
  'handleName': 'seekHandle'
};

ajs.SeekBar.prototype.playerEvent = 'timeupdate';

ajs.SeekBar.prototype.createEl = function(){
  return ajs.Slider.prototype.createEl.call(this, 'div', {
    className: 'ajs-progress-holder',
    'aria-label': 'audio progress bar'
  });
};

ajs.SeekBar.prototype.updateARIAAttributes = function(){
    // Allows for smooth scrubbing, when player can't keep up.
    var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
    this.el_.setAttribute('aria-valuenow',ajs.round(this.getPercent()*100, 2)); // machine readable value of progress bar (percentage complete)
    this.el_.setAttribute('aria-valuetext',ajs.formatTime(time, this.player_.duration())); // human readable value of progress bar (time complete)
};

ajs.SeekBar.prototype.getPercent = function(){
  return this.player_.currentTime() / this.player_.duration();
};

ajs.SeekBar.prototype.onMouseDown = function(event){
  ajs.Slider.prototype.onMouseDown.call(this, event);

  this.player_.scrubbing = true;

  this.audioWasPlaying = !this.player_.paused();
  this.player_.pause();
};

ajs.SeekBar.prototype.onMouseMove = function(event){
  var newTime = this.calculateDistance(event) * this.player_.duration();

  // Don't let audio end while scrubbing.
  if (newTime == this.player_.duration()) { newTime = newTime - 0.1; }

  // Set new time (tell player to seek to new time)
  this.player_.currentTime(newTime);
};

ajs.SeekBar.prototype.onMouseUp = function(event){
  ajs.Slider.prototype.onMouseUp.call(this, event);

  this.player_.scrubbing = false;
  if (this.audioWasPlaying) {
    this.player_.play();
  }
};

ajs.SeekBar.prototype.stepForward = function(){
  this.player_.currentTime(this.player_.currentTime() + 5); // more quickly fast forward for keyboard-only users
};

ajs.SeekBar.prototype.stepBack = function(){
  this.player_.currentTime(this.player_.currentTime() - 5); // more quickly rewind for keyboard-only users
};


/**
 * Shows load progress
 *
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
ajs.LoadProgressBar = ajs.Component.extend({
  /** @constructor */
  init: function(player, options){
    ajs.Component.call(this, player, options);
    player.on('progress', ajs.bind(this, this.update));
  }
});

ajs.LoadProgressBar.prototype.createEl = function(){
  return ajs.Component.prototype.createEl.call(this, 'div', {
    className: 'ajs-load-progress',
    innerHTML: '<span class="ajs-control-text">Loaded: 0%</span>'
  });
};

ajs.LoadProgressBar.prototype.update = function(){
  if (this.el_.style) { this.el_.style.width = ajs.round(this.player_.bufferedPercent() * 100, 2) + '%'; }
};


/**
 * Shows play progress
 *
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
ajs.PlayProgressBar = ajs.Component.extend({
  /** @constructor */
  init: function(player, options){
    ajs.Component.call(this, player, options);
  }
});

ajs.PlayProgressBar.prototype.createEl = function(){
  return ajs.Component.prototype.createEl.call(this, 'div', {
    className: 'ajs-play-progress',
    innerHTML: '<span class="ajs-control-text">Progress: 0%</span>'
  });
};

/**
 * The Seek Handle shows the current position of the playhead during playback,
 * and can be dragged to adjust the playhead.
 *
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
ajs.SeekHandle = ajs.SliderHandle.extend({
  init: function(player, options) {
    ajs.SliderHandle.call(this, player, options);
    player.on('timeupdate', ajs.bind(this, this.updateContent));
  }
});

/**
 * The default value for the handle content, which may be read by screen readers
 *
 * @type {String}
 * @private
 */
ajs.SeekHandle.prototype.defaultValue = '00:00';

/** @inheritDoc */
ajs.SeekHandle.prototype.createEl = function() {
  return ajs.SliderHandle.prototype.createEl.call(this, 'div', {
    className: 'ajs-seek-handle',
    'aria-live': 'off'
  });
};

ajs.SeekHandle.prototype.updateContent = function() {
  var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
  this.el_.innerHTML = '<span class="ajs-control-text">' + ajs.formatTime(time, this.player_.duration()) + '</span>';
};
/**
 * The component for controlling the volume level
 *
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
ajs.VolumeControl = ajs.Component.extend({
  /** @constructor */
  init: function(player, options){
    ajs.Component.call(this, player, options);

    // hide volume controls when they're not supported by the current tech
    if (player.tech && player.tech.features && player.tech.features['volumeControl'] === false) {
      this.addClass('ajs-hidden');
    }
    player.on('loadstart', ajs.bind(this, function(){
      if (player.tech.features && player.tech.features['volumeControl'] === false) {
        this.addClass('ajs-hidden');
      } else {
        this.removeClass('ajs-hidden');
      }
    }));
  }
});

ajs.VolumeControl.prototype.options_ = {
  children: {
    'volumeBar': {}
  }
};

ajs.VolumeControl.prototype.createEl = function(){
  return ajs.Component.prototype.createEl.call(this, 'div', {
    className: 'ajs-volume-control ajs-control'
  });
};

/**
 * The bar that contains the volume level and can be clicked on to adjust the level
 *
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
ajs.VolumeBar = ajs.Slider.extend({
  /** @constructor */
  init: function(player, options){
    ajs.Slider.call(this, player, options);
    player.on('volumechange', ajs.bind(this, this.updateARIAAttributes));
    player.ready(ajs.bind(this, this.updateARIAAttributes));
  }
});

ajs.VolumeBar.prototype.updateARIAAttributes = function(){
  // Current value of volume bar as a percentage
  this.el_.setAttribute('aria-valuenow',ajs.round(this.player_.volume()*100, 2));
  this.el_.setAttribute('aria-valuetext',ajs.round(this.player_.volume()*100, 2)+'%');
};

ajs.VolumeBar.prototype.options_ = {
  children: {
    'volumeLevel': {},
    'volumeHandle': {}
  },
  'barName': 'volumeLevel',
  'handleName': 'volumeHandle'
};

ajs.VolumeBar.prototype.playerEvent = 'volumechange';

ajs.VolumeBar.prototype.createEl = function(){
  return ajs.Slider.prototype.createEl.call(this, 'div', {
    className: 'ajs-volume-bar',
    'aria-label': 'volume level'
  });
};

ajs.VolumeBar.prototype.onMouseMove = function(event) {
  if (this.player_.muted()) {
    this.player_.muted(false);
  }

  this.player_.volume(this.calculateDistance(event));
};

ajs.VolumeBar.prototype.getPercent = function(){
  if (this.player_.muted()) {
    return 0;
  } else {
    return this.player_.volume();
  }
};

ajs.VolumeBar.prototype.stepForward = function(){
  this.player_.volume(this.player_.volume() + 0.1);
};

ajs.VolumeBar.prototype.stepBack = function(){
  this.player_.volume(this.player_.volume() - 0.1);
};

/**
 * Shows volume level
 *
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
ajs.VolumeLevel = ajs.Component.extend({
  /** @constructor */
  init: function(player, options){
    ajs.Component.call(this, player, options);
  }
});

ajs.VolumeLevel.prototype.createEl = function(){
  return ajs.Component.prototype.createEl.call(this, 'div', {
    className: 'ajs-volume-level',
    innerHTML: '<span class="ajs-control-text"></span>'
  });
};

/**
 * The volume handle can be dragged to adjust the volume level
 *
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
 ajs.VolumeHandle = ajs.SliderHandle.extend();

 ajs.VolumeHandle.prototype.defaultValue = '00:00';

 /** @inheritDoc */
 ajs.VolumeHandle.prototype.createEl = function(){
   return ajs.SliderHandle.prototype.createEl.call(this, 'div', {
     className: 'ajs-volume-handle'
   });
 };
/**
 * A button component for muting the audio
 *
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
ajs.MuteToggle = ajs.Button.extend({
  /** @constructor */
  init: function(player, options){
    ajs.Button.call(this, player, options);

    player.on('volumechange', ajs.bind(this, this.update));

    // hide mute toggle if the current tech doesn't support volume control
    if (player.tech && player.tech.features && player.tech.features['volumeControl'] === false) {
      this.addClass('ajs-hidden');
    }
    player.on('loadstart', ajs.bind(this, function(){
      if (player.tech.features && player.tech.features['volumeControl'] === false) {
        this.addClass('ajs-hidden');
      } else {
        this.removeClass('ajs-hidden');
      }
    }));
  }
});

ajs.MuteToggle.prototype.createEl = function(){
  return ajs.Button.prototype.createEl.call(this, 'div', {
    className: 'ajs-mute-control ajs-control',
    innerHTML: '<div><span class="ajs-control-text">Mute</span></div>'
  });
};

ajs.MuteToggle.prototype.onClick = function(){
  this.player_.muted( this.player_.muted() ? false : true );
};

ajs.MuteToggle.prototype.update = function(){
  var vol = this.player_.volume(),
      level = 3;

  if (vol === 0 || this.player_.muted()) {
    level = 0;
  } else if (vol < 0.33) {
    level = 1;
  } else if (vol < 0.67) {
    level = 2;
  }

  // Don't rewrite the button text if the actual text doesn't change.
  // This causes unnecessary and confusing information for screen reader users.
  // This check is needed because this function gets called every time the volume level is changed.
  if(this.player_.muted()){
      if(this.el_.children[0].children[0].innerHTML!='Unmute'){
          this.el_.children[0].children[0].innerHTML = 'Unmute'; // change the button text to "Unmute"
      }
  } else {
      if(this.el_.children[0].children[0].innerHTML!='Mute'){
          this.el_.children[0].children[0].innerHTML = 'Mute'; // change the button text to "Mute"
      }
  }

  /* TODO improve muted icon classes */
  for (var i = 0; i < 4; i++) {
    ajs.removeClass(this.el_, 'ajs-vol-'+i);
  }
  ajs.addClass(this.el_, 'ajs-vol-'+level);
};
/* Loading Spinner
================================================================================ */
/**
 * Loading spinner for waiting events
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
ajs.LoadingSpinner = ajs.Component.extend({
  /** @constructor */
  init: function(player, options){
    ajs.Component.call(this, player, options);

    player.on('canplay', ajs.bind(this, this.hide));
    player.on('canplaythrough', ajs.bind(this, this.hide));
    player.on('playing', ajs.bind(this, this.hide));
    player.on('seeking', ajs.bind(this, this.show));

    // in some browsers seeking does not trigger the 'playing' event,
    // so we also need to trap 'seeked' if we are going to set a
    // 'seeking' event
    player.on('seeked', ajs.bind(this, this.hide));

    player.on('ended', ajs.bind(this, this.hide));

    // Not showing spinner on stalled any more. Browsers may stall and then not trigger any events that would remove the spinner.
    // Checked in Chrome 16 and Safari 5.1.2. http://help.audiojs.com/discussions/problems/883-why-is-the-download-progress-showing
    // player.on('stalled', ajs.bind(this, this.show));

    player.on('waiting', ajs.bind(this, this.show));
  }
});

ajs.LoadingSpinner.prototype.createEl = function(){
  return ajs.Component.prototype.createEl.call(this, 'div', {
    className: 'ajs-loading-spinner'
  });
};


/**
 * Display that an error has occurred making the audio unplayable
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
ajs.ErrorDisplay = ajs.Component.extend({
  init: function(player, options){
    ajs.Component.call(this, player, options);

    this.update();
    player.on('error', ajs.bind(this, this.update));
  }
});

ajs.ErrorDisplay.prototype.createEl = function(){
  var el = ajs.Component.prototype.createEl.call(this, 'div', {
    className: 'ajs-error-display'
  });

  this.contentEl_ = ajs.createEl('div');
  el.appendChild(this.contentEl_);

  return el;
};

ajs.ErrorDisplay.prototype.update = function(){
  if (this.player().error()) {
    this.contentEl_.innerHTML = this.player().error().message;
  }
};
/**
 * @fileoverview Media Technology Controller - Base class for media playback
 * technology controllers like Flash and HTML5
 */

/**
 * Base class for media (HTML5 audio, Flash) controllers
 * @param {ajs.Player|Object} player  Central player instance
 * @param {Object=} options Options object
 * @constructor
 */
ajs.MediaTechController = ajs.Component.extend({
  /** @constructor */
  init: function(player, options, ready){
    options = options || {};
    // we don't want the tech to report user activity automatically.
    // This is done manually in addControlsListeners
    options.reportTouchActivity = false;
    ajs.Component.call(this, player, options, ready);

    this.initControlsListeners();
  }
});

/**
 * Set up click and touch listeners for the playback element
 * On desktops, a click on the audio itself will toggle playback,
 * on a mobile device a click on the audio toggles controls.
 * (toggling controls is done by toggling the user state between active and
 * inactive)
 *
 * A tap can signal that a user has become active, or has become inactive
 * e.g. a quick tap on an iPhone movie should reveal the controls. Another
 * quick tap should hide them again (signaling the user is in an inactive
 * viewing state)
 *
 * In addition to this, we still want the user to be considered inactive after
 * a few seconds of inactivity.
 *
 * Note: the only part of iOS interaction we can't mimic with this setup
 * is a touch and hold on the audio element counting as activity in order to
 * keep the controls showing, but that shouldn't be an issue. A touch and hold on
 * any controls will still keep the user active
 */
ajs.MediaTechController.prototype.initControlsListeners = function(){
  var player, tech, activateControls, deactivateControls;

  tech = this;
  player = this.player();

  var activateControls = function(){
    if (player.controls() && !player.usingNativeControls()) {
      tech.addControlsListeners();
    }
  };

  deactivateControls = ajs.bind(tech, tech.removeControlsListeners);

  // Set up event listeners once the tech is ready and has an element to apply
  // listeners to
  this.ready(activateControls);
  player.on('controlsenabled', activateControls);
  player.on('controlsdisabled', deactivateControls);
};

ajs.MediaTechController.prototype.addControlsListeners = function(){
  var userWasActive;

  // Some browsers (Chrome & IE) don't trigger a click on a flash swf, but do
  // trigger mousedown/up.
  // http://stackoverflow.com/questions/1444562/javascript-onclick-event-over-flash-object
  // Any touch events are set to block the mousedown event from happening
  this.on('mousedown', this.onClick);

  // If the controls were hidden we don't want that to change without a tap event
  // so we'll check if the controls were already showing before reporting user
  // activity
  this.on('touchstart', function(event) {
    // Stop the mouse events from also happening
    event.preventDefault();
    userWasActive = this.player_.userActive();
  });

  this.on('touchmove', function(event) {
    if (userWasActive){
      this.player().reportUserActivity();
    }
  });

  // Turn on component tap events
  this.emitTapEvents();

  // The tap listener needs to come after the touchend listener because the tap
  // listener cancels out any reportedUserActivity when setting userActive(false)
  this.on('tap', this.onTap);
};

/**
 * Remove the listeners used for click and tap controls. This is needed for
 * toggling to controls disabled, where a tap/touch should do nothing.
 */
ajs.MediaTechController.prototype.removeControlsListeners = function(){
  // We don't want to just use `this.off()` because there might be other needed
  // listeners added by techs that extend this.
  this.off('tap');
  this.off('touchstart');
  this.off('touchmove');
  this.off('touchleave');
  this.off('touchcancel');
  this.off('touchend');
  this.off('click');
  this.off('mousedown');
};

/**
 * Handle a click on the media element. By default will play/pause the media.
 */
ajs.MediaTechController.prototype.onClick = function(event){
  // We're using mousedown to detect clicks thanks to Flash, but mousedown
  // will also be triggered with right-clicks, so we need to prevent that
  if (event.button !== 0) return;

  // When controls are disabled a click should not toggle playback because
  // the click is considered a control
  if (this.player().controls()) {
    if (this.player().paused()) {
      this.player().play();
    } else {
      this.player().pause();
    }
  }
};

/**
 * Handle a tap on the media element. By default it will toggle the user
 * activity state, which hides and shows the controls.
 */
ajs.MediaTechController.prototype.onTap = function(){
  this.player().userActive(!this.player().userActive());
};



ajs.MediaTechController.prototype.features = {
  'volumeControl': true,

  // Optional events that we can manually mimic with timers
  // currently not triggered by audio-js-swf
  'progressEvents': false,
  'timeupdateEvents': false
};

ajs.media = {};

/**
 * List of default API methods for any MediaTechController
 * @type {String}
 */
ajs.media.ApiMethods = 'play,pause,paused,currentTime,setCurrentTime,duration,buffered,volume,setVolume,muted,setMuted,width,height,src,load,currentSrc,preload,setPreload,autoplay,setAutoplay,loop,setLoop,error,networkState,readyState,seeking,initialTime,startOffsetTime,played,seekable,ended,audioWidth,audioHeight,mediaGroup,controller,controls,defaultMuted'.split(',');
// Create placeholder methods for each that warn when a method isn't supported by the current playback technology

function createMethod(methodName){
  return function(){
    throw new Error('The "'+methodName+'" method is not available on the playback technology\'s API');
  };
}

for (var i = ajs.media.ApiMethods.length - 1; i >= 0; i--) {
  var methodName = ajs.media.ApiMethods[i];
  ajs.MediaTechController.prototype[ajs.media.ApiMethods[i]] = createMethod(methodName);
}
/**
 * @fileoverview HTML5 Media Controller - Wrapper for HTML5 Media API
 */

/**
 * HTML5 Media Controller - Wrapper for HTML5 Media API
 * @param {ajs.Player|Object} player
 * @param {Object=} options
 * @param {Function=} ready
 * @constructor
 */
ajs.Html5 = ajs.MediaTechController.extend({
  /** @constructor */
  init: function(player, options, ready){
    // volume cannot be changed from 1 on iOS
    this.features['volumeControl'] = ajs.Html5.canControlVolume();

    

    // In iOS, if you move a audio element in the DOM, it breaks audio playback.
    this.features['movingMediaElementInDOM'] = !ajs.IS_IOS;
    ajs.MediaTechController.call(this, player, options, ready);
    this.setupTriggers();

    var source = options['source'];

    // If the element source is already set, we may have missed the loadstart event, and want to trigger it.
    // We don't want to set the source again and interrupt playback.
    if (source && this.el_.currentSrc === source.src && this.el_.networkState > 0) {
      player.trigger('loadstart');
    // Otherwise set the source if one was proauded.
    } else if (source) {
      this.el_.src = source.src;
    }

    // Determine if native controls should be used
    // Our goal should be to get the custom controls on mobile solid everywhere
    // so we can remove this all together. Right now this will block custom
    // controls on touch enabled laptops like the Chrome Pixel
    if (ajs.TOUCH_ENABLED && player.options()['nativeControlsForTouch'] !== false) {
      this.useNativeControls();
    }

    // Chrome and Safari both have issues with autoplay.
    // In Safari (5.1.1), when we move the audio element into the container div, autoplay doesn't work.
    // In Chrome (15), if you have autoplay + a poster + no controls, the audio gets hidden (but audio plays)
    // This fixes both issues. Need to wait for API, so it updates displays correctly
    player.ready(function(){
      if (this.tag && this.options_['autoplay'] && this.paused()) {
                this.play();
      }
    });

    this.triggerReady();
  }
});

ajs.Html5.prototype.dispose = function(){
  ajs.MediaTechController.prototype.dispose.call(this);
};

ajs.Html5.prototype.createEl = function(){
  var player = this.player_,
      // If possible, reuse original tag for HTML5 playback technology element
      el = player.tag,
      newEl,
      clone;

  // Check if this browser supports moving the element into the box.
  // On the iPhone audio will break if you move the element,
  // So we have to create a brand new element.
  if (!el || this.features['movingMediaElementInDOM'] === false) {

    // If the original tag is still there, clone and remove it.
    if (el) {
      clone = el.cloneNode(false);
      ajs.Html5.disposeMediaElement(el);
      el = clone;
      player.tag = null;
    } else {
      el = ajs.createEl('audio', {
        id:player.id() + '_html5_api',
        className:'ajs-tech'
      });
    }
    // associate the player with the new tag
    el['player'] = player;

    ajs.insertFirst(el, player.el());
  }

  // Update specific tag settings, in case they were overridden
  var attrs = ['autoplay','preload','loop','muted'];
  for (var i = attrs.length - 1; i >= 0; i--) {
    var attr = attrs[i];
    if (player.options_[attr] !== null) {
      el[attr] = player.options_[attr];
    }
  }

  return el;
  // jenniisawesome = true;
};

// Make audio events trigger player events
// May seem verbose here, but makes other APIs possible.
// Triggers removed using this.off when disposed
ajs.Html5.prototype.setupTriggers = function(){
  for (var i = ajs.Html5.Events.length - 1; i >= 0; i--) {
    ajs.on(this.el_, ajs.Html5.Events[i], ajs.bind(this, this.eventHandler));
  }
};

ajs.Html5.prototype.eventHandler = function(evt){
  // In the case of an error, set the error prop on the player
  // and let the player handle triggering the event.
  if (evt.type == 'error') {
    this.player().error(this.error().code);

  // in some cases we pass the event directly to the player
  } else {
    // No need for media events to bubble up.
    evt.bubbles = false;

    this.player().trigger(evt);
  }
};

ajs.Html5.prototype.useNativeControls = function(){
  var tech, player, controlsOn, controlsOff, cleanUp;

  tech = this;
  player = this.player();

  // If the player controls are enabled turn on the native controls
  tech.setControls(player.controls());

  // Update the native controls when player controls state is updated
  controlsOn = function(){
    tech.setControls(true);
  };
  controlsOff = function(){
    tech.setControls(false);
  };
  player.on('controlsenabled', controlsOn);
  player.on('controlsdisabled', controlsOff);

  // Clean up when not using native controls anymore
  cleanUp = function(){
    player.off('controlsenabled', controlsOn);
    player.off('controlsdisabled', controlsOff);
  };
  tech.on('dispose', cleanUp);
  player.on('usingcustomcontrols', cleanUp);

  // Update the state of the player to using native controls
  player.usingNativeControls(true);
};


ajs.Html5.prototype.play = function(){ this.el_.play(); };
ajs.Html5.prototype.pause = function(){ this.el_.pause(); };
ajs.Html5.prototype.paused = function(){ return this.el_.paused; };

ajs.Html5.prototype.currentTime = function(){ return this.el_.currentTime; };
ajs.Html5.prototype.setCurrentTime = function(seconds){
  try {
    this.el_.currentTime = seconds;
  } catch(e) {
    ajs.log(e, 'audio is not ready. (audio.js)');
    // this.warning(audioJS.warnings.audioNotReady);
  }
};

ajs.Html5.prototype.duration = function(){ return this.el_.duration || 0; };
ajs.Html5.prototype.buffered = function(){ return this.el_.buffered; };

ajs.Html5.prototype.volume = function(){ return this.el_.volume; };
ajs.Html5.prototype.setVolume = function(percentAsDecimal){ this.el_.volume = percentAsDecimal; };
ajs.Html5.prototype.muted = function(){ return this.el_.muted; };
ajs.Html5.prototype.setMuted = function(muted){ this.el_.muted = muted; };

ajs.Html5.prototype.width = function(){ return this.el_.offsetWidth; };
ajs.Html5.prototype.height = function(){ return this.el_.offsetHeight; };


ajs.Html5.prototype.src = function(src){ this.el_.src = src; };
ajs.Html5.prototype.load = function(){ this.el_.load(); };
ajs.Html5.prototype.currentSrc = function(){ return this.el_.currentSrc; };


ajs.Html5.prototype.preload = function(){ return this.el_.preload; };
ajs.Html5.prototype.setPreload = function(val){ this.el_.preload = val; };

ajs.Html5.prototype.autoplay = function(){ return this.el_.autoplay; };
ajs.Html5.prototype.setAutoplay = function(val){ this.el_.autoplay = val; };

ajs.Html5.prototype.controls = function(){ return this.el_.controls; };
ajs.Html5.prototype.setControls = function(val){ this.el_.controls = !!val; };

ajs.Html5.prototype.loop = function(){ return this.el_.loop; };
ajs.Html5.prototype.setLoop = function(val){ this.el_.loop = val; };

ajs.Html5.prototype.error = function(){ return this.el_.error; };
ajs.Html5.prototype.seeking = function(){ return this.el_.seeking; };
ajs.Html5.prototype.ended = function(){ return this.el_.ended; };
ajs.Html5.prototype.defaultMuted = function(){ return this.el_.defaultMuted; };


/* HTML5 Support Testing ---------------------------------------------------- */

ajs.Html5.isSupported = function(){
  // ie9 with no Media Player is a LIAR! (#984)
  try {
    ajs.TEST_aud['volume'] = 0.5;
  } catch (e) {
    return false;
  }

  return !!ajs.TEST_aud.canPlayType;
};

ajs.Html5.canPlaySource = function(srcObj){
  // IE9 on Windows 7 without MediaPlayer throws an error here
  // https://github.com/audiojs/audio.js/issues/519
  try {
    return !!ajs.TEST_aud.canPlayType(srcObj.type);
  } catch(e) {
    return '';
  }
  // TODO: Check Type
  // If no Type, check ext
  // Check Media Type
};

ajs.Html5.canControlVolume = function(){
  var volume =  ajs.TEST_aud.volume;
  ajs.TEST_aud.volume = (volume / 2) + 0.1;
  return volume !== ajs.TEST_aud.volume;
};


// HTML5 Feature detection and Device Fixes --------------------------------- //
(function() {
  var canPlayType,
      mpegurlRE = /^application\/(?:x-|vnd\.apple\.)mpegurl/i,
      mp3RE = /^audio\/mp3/i;

  ajs.Html5.patchCanPlayType = function() {
    // Android 4.0 and above can play HLS to some extent but it reports being unable to do so
    if (ajs.ANDROID_VERSION >= 4.0) {
      if (!canPlayType) {
        canPlayType = ajs.TEST_aud.constructor.prototype.canPlayType;
      }

      ajs.TEST_aud.constructor.prototype.canPlayType = function(type) {
        if (type && mpegurlRE.test(type)) {
          return 'maybe';
        }
        return canPlayType.call(this, type);
      };
    }

    // Override Android 2.2 and less canPlayType method which is broken
    if (ajs.IS_OLD_ANDROID) {
      if (!canPlayType) {
        canPlayType = ajs.TEST_aud.constructor.prototype.canPlayType;
      }

      ajs.TEST_aud.constructor.prototype.canPlayType = function(type){
        if (type && mp3RE.test(type)) {
          return 'maybe';
        }
        return canPlayType.call(this, type);
      };
    }
  };

  ajs.Html5.unpatchCanPlayType = function() {
    var r = ajs.TEST_aud.constructor.prototype.canPlayType;
    ajs.TEST_aud.constructor.prototype.canPlayType = canPlayType;
    canPlayType = null;
    return r;
  };

  // by default, patch the audio element
  ajs.Html5.patchCanPlayType();
})();

// List of all HTML5 events (various uses).
ajs.Html5.Events = 'loadstart,suspend,abort,error,emptied,stalled,loadedmetadata,loadeddata,canplay,canplaythrough,playing,waiting,seeking,seeked,ended,durationchange,timeupdate,progress,play,pause,volumechange'.split(',');

ajs.Html5.disposeMediaElement = function(el){
  if (!el) { return; }

  el['player'] = null;

  if (el.parentNode) {
    el.parentNode.removeChild(el);
  }

  // remove any child track or source nodes to prevent their loading
  while(el.hasChildNodes()) {
    el.removeChild(el.firstChild);
  }

  // remove any src reference. not setting `src=''` because that causes a warning
  // in firefox
  el.removeAttribute('src');

  // force the media element to update its loading state by calling load()
  // however IE on Windows 7N has a bug that throws an error so need a try/catch (#793)
  if (typeof el.load === 'function') {
    // wrapping in an iife so it's not deoptimized (#1060#discussion_r10324473)
    (function() {
      try {
        el.load();
      } catch (e) {
        // not supported
      }
    })();
  }
};
/**
 * @fileoverview audioJS-SWF - Custom Flash Player with HTML5-ish API
 * https://github.com/neolao/mp3-player
 * Not using setupTriggers. Using global onEvent func to distribute events
 */

/**
 * Flash Media Controller - Wrapper for fallback SWF API
 *
 * @param {ajs.Player} player
 * @param {Object=} options
 * @param {Function=} ready
 * @constructor
 */
ajs.Flash = ajs.MediaTechController.extend({
  /** @constructor */
  init: function(player, options, ready){
    ajs.MediaTechController.call(this, player, options, ready);
    
    var source = options['source'],

        // Which element to embed in
        parentEl = options['parentEl'],

        // Create a temporary element to be replaced by swf object
        placeHolder = this.el_ = ajs.createEl('div', { id: player.id() + '_temp_flash' }),

        // Generate ID for swf object
        objId = player.id()+'_flash_api',

        // Store player options in local var for optimization
        // TODO: switch to using player methods instead of options
        // e.g. player.autoplay();
        playerOptions = player.options_,

        // Merge default flashvars with ones passed in to init
        flashVars = {

          // SWF Callback Functions
          'listener': "audiojs.Flash['listener']",
          'interval': '500',
          'useexternalinterface':1
          // Player Settings
          
        },

        // Merge default parames with ones passed in
        params = ajs.obj.merge( options['params']),

        // Merge default attributes with ones passed in
        attributes = ajs.obj.merge({
          'id': objId,
          'name': objId, // Both ID and Name needed or swf to identifty itself
          'class': 'ajs-tech'
        }, options['attributes']),

        lastSeekTarget
    ;

    // If source was supplied pass as a flash var.
    /*if (source) {
      if (source.type && ajs.Flash.isStreamingType(source.type)) {
        var parts = ajs.Flash.streamToParts(source.src);
        flashVars['rtmpConnection'] = encodeURIComponent(parts.connection);
        flashVars['rtmpStream'] = encodeURIComponent(parts.stream);
      }
      else {
        flashVars['src'] = encodeURIComponent(ajs.getAbsoluteURL(source.src));
      }
    }
*/
    this['setCurrentTime'] = function(time){
      lastSeekTarget = time;
      this.el_.ajs_setProperty('currentTime', time);
    };
    this['currentTime'] = function(time){
      // when seeking make the reported time keep up with the requested time
      // by reading the time we're seeking to
      if (this.seeking()) {
        return lastSeekTarget;
      }
      return this.el_.ajs_getProperty('currentTime');
    };

    // Add placeholder to player div
    ajs.insertFirst(placeHolder, parentEl);

    // Having issues with Flash reloading on certain page actions (hide/resize/fullscreen) in certain browsers
    // This allows resetting the playhead when we catch the reload
    if (options['startTime']) {
      this.ready(function(){
        this.load();
        this.play();
        this.currentTime(options['startTime']);
      });
    }

    // firefox doesn't bubble mousemove events to parent. audiojs/audio-js-swf#37
    // bugzilla bug: https://bugzilla.mozilla.org/show_bug.cgi?id=836786
    if (ajs.IS_FIREFOX) {
      this.ready(function(){
        ajs.on(this.el(), 'mousemove', ajs.bind(this, function(){
          // since it's a custom event, don't bubble higher than the player
          this.player().trigger({ 'type':'mousemove', 'bubbles': false });
        }));
      });
    }
    
    // native click events on the SWF aren't triggered on IE11, Win8.1RT
    // use stageclick events triggered from inside the SWF instead
    player.on('stageclick', player.reportUserActivity);

      ajs.Flash.embed(options['swf'], placeHolder, flashVars, params, attributes);
   ajs.Flash.checkReady(this); 
  }
});
ajs.Flash['listener']=new Object();
ajs.Flash['listener'].onInit = function()
            {
                this.position = 0;
            };
        
 ajs.Flash['listener'].onUpdate = function()
        {
           var isPlaying = this.isPlaying;
           var url = this.url;
           var volume = this.volume;
           var position = this.position;
           var duration = this.duration;
        };
ajs.Flash.prototype.dispose = function(){
  ajs.MediaTechController.prototype.dispose.call(this);
};

ajs.Flash.prototype.play = function(){
if (this.listener.url == "undefined") {
                 this.el_.SetVariable("method:setUrl", this.src());
                }
  this.el_.SetVariable("method:play", "");
};

ajs.Flash.prototype.pause = function(){
  this.el_.SetVariable("method:pause", "");
};
ajs.Flash.prototype.setCurrentTime = function(){
  this.el_.SetVariable("method:setPosition", "");
};
ajs.Flash.prototype.setVolume = function(){
  this.el_.SetVariable("method:setVolume", "");
};
ajs.Flash.prototype.paused = function(){ return !this.listener.isPlaying; };

ajs.Flash.prototype.currentTime = function(){ return this.listener.position; };
ajs.Flash.prototype.setCurrentTime = function(seconds){
  try {
    this.el_.currentTime = seconds;
  } catch(e) {
    ajs.log(e, 'audio is not ready. (audio.js)');
    // this.warning(audioJS.warnings.audioNotReady);
  }
};

ajs.Flash.prototype.duration = function(){ return this.listener.duration || 0; };

ajs.Flash.prototype.volume = function(){ return this.listener.volume; };
ajs.Flash.prototype.setVolume = function(percentAsDecimal){ this.el_.volume = percentAsDecimal; };
ajs.Flash.prototype.muted = function(){ return this.el_.muted; };
ajs.Flash.prototype.setMuted = function(muted){ this.el_.muted = muted; };

ajs.Flash.prototype.src = function(src){
  if (src === undefined) {
    return this.currentSrc();
  }

  if (ajs.Flash.isStreamingSrc(src)) {
    src = ajs.Flash.streamToParts(src);
    this.setRtmpConnection(src.connection);
    this.setRtmpStream(src.stream);
  } else {
    // Make sure source URL is abosolute.
    src = ajs.getAbsoluteURL(src);
    this.el_.ajs_src(src);
  }

  // Currently the SWF doesn't autoplay if you load a source later.
  // e.g. Load player w/ no source, wait 2s, set src.
  if (this.player_.autoplay()) {
    var tech = this;
    setTimeout(function(){ tech.play(); }, 0);
  }
};

ajs.Flash.prototype.currentSrc = function(){
  var src = this.el_.ajs_getProperty('currentSrc');
  // no src, check and see if RTMP
  if (src == null) {
    var connection = this['rtmpConnection'](),
        stream = this['rtmpStream']();

    if (connection && stream) {
      src = ajs.Flash.streamFromParts(connection, stream);
    }
  }
  return src;
};

ajs.Flash.prototype.load = function(){
  this.el_.ajs_load();
};




ajs.Flash.prototype.buffered = function(){
  return ajs.createTimeRange(0, this.el_.ajs_getProperty('buffered'));
};

// List of all HTML5 events (various uses).
ajs.Flash.Events = 'loadstart,canplay,playing,seeking,seeked,ended,durationchange,timeupdate,progress,play,pause,volumechange'.split(',');

// Make audio events trigger player events
// May seem verbose here, but makes other APIs possible.
// Triggers removed using this.off when disposed
ajs.Flash.prototype.setupTriggers = function(){
  for (var i = ajs.Flash.Events.length - 1; i >= 0; i--) {
    ajs.on(this.el_, ajs.Flash.Events[i], ajs.bind(this, this.eventHandler));
  }
};

ajs.Flash.prototype.eventHandler = function(evt){
  // In the case of an error, set the error prop on the player
  // and let the player handle triggering the event.
  if (evt.type == 'error') {
    this.player().error(this.error().code);

  // in some cases we pass the event directly to the player
  } else {
    // No need for media events to bubble up.
    evt.bubbles = false;

    this.player().trigger(evt);
  }
};


/* Flash Support Testing -------------------------------------------------------- */

ajs.Flash.isSupported = function(){
  return ajs.Flash.version()[0] >= 10;
  // return swfobject.hasFlashPlayerVersion('10');
};

ajs.Flash.canPlaySource = function(srcObj){
  var type;

  if (!srcObj.type) {
    return '';
  }

  type = srcObj.type.replace(/;.*/,'').toLowerCase();
  if (type in ajs.Flash.formats || type in ajs.Flash.streamingFormats) {
    return 'maybe';
  }
};

ajs.Flash.formats = {
  'audio/flv': 'FLV',
  'audio/x-flv': 'FLV',
  'audio/mp3': 'mp3',
  
};

ajs.Flash.streamingFormats = {
  'rtmp/mp3': 'mp3',
  'rtmp/flv': 'FLV'
};

ajs.Flash['onReady'] = function(currSwf){
  var el = ajs.el(currSwf);

  // Get player from box
  // On firefox reloads, el might already have a player
  var player = el['player'] || el.parentNode['player'],
      tech = player.tech;

  // Reference player on tech element
  el['player'] = player;

  // Update reference to playback technology element
  tech.el_ = el;

  ajs.Flash.checkReady(tech);
};

// The SWF isn't alwasy ready when it says it is. Sometimes the API functions still need to be added to the object.
// If it's not ready, we set a timeout to check again shortly.
ajs.Flash.checkReady = function(tech){

  // Check if API property exists
  if (tech.player_.listener.position!==undefined) {

    // If so, tell tech it's ready
    tech.triggerReady();

  // Otherwise wait longer.
  } else {

    setTimeout(function(){
      ajs.Flash.checkReady(tech);
    }, 50);

  }
};

// Trigger events from the swf on the player
ajs.Flash['onEvent'] = function(swfID, eventName){
  var player = ajs.el(swfID)['player'];
  player.trigger(eventName);
};

// Log errors from the swf
ajs.Flash['onError'] = function(swfID, err){
  var player = ajs.el(swfID)['player'];
  var msg = 'FLASH: '+err;

  if (err == 'srcnotfound') {
    player.error({ code: 4, message: msg });

  // errors we haven't categorized into the media errors
  } else {
    player.error(msg);
  }
};

// Flash Version Check
ajs.Flash.version = function(){
  var version = '0,0,0';

  // IE
  try {
    version = new window.ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];

  // other browsers
  } catch(e) {
    try {
      if (navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin){
        version = (navigator.plugins['Shockwave Flash 2.0'] || navigator.plugins['Shockwave Flash']).description.replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];
      }
    } catch(err) {}
  }
  return version.split(',');
};

// Flash embedding method. Only used in non-iframe mode
ajs.Flash.embed = function(swf, placeHolder, flashVars, params, attributes){
  var code = ajs.Flash.getEmbedCode(swf, flashVars, params, attributes),

      // Get element by embedding code and retrieving created element
      obj = ajs.createEl('div', { innerHTML: code }).childNodes[0],

      par = placeHolder.parentNode
  ;

  placeHolder.parentNode.replaceChild(obj, placeHolder);

  // IE6 seems to have an issue where it won't initialize the swf object after injecting it.
  // This is a dumb fix
  var newObj = par.childNodes[0];
  setTimeout(function(){
    newObj.style.display = 'block';
  }, 1000);

  return obj;

};

ajs.Flash.getEmbedCode = function(swf, flashVars, params, attributes){

  var objTag = '<object type="application/x-shockwave-flash"',
      flashVarsString = '',
      paramsString = '',
      attrsString = '';

  // Convert flash vars to string
  if (flashVars) {
    ajs.obj.each(flashVars, function(key, val){
      flashVarsString += (key + '=' + val + '&amp;');
    });
  }

  // Add swf, flashVars, and other default params
  params = ajs.obj.merge({
    'movie': swf,
    'FlashVars': flashVarsString,
    'AllowScriptAccess': 'always'
  }, params);

  // Create param tags string
  ajs.obj.each(params, function(key, val){
    paramsString += '<param name="'+key+'" value="'+val+'" />';
  });

  attributes = ajs.obj.merge({
    // Add swf to attributes (need both for IE and Others to work)
    'data': swf,

    // Default to 100% width/height
    'width': '100%',
    'height': '100%'

  }, attributes);

  // Create Attributes string
  ajs.obj.each(attributes, function(key, val){
    attrsString += (key + '="' + val + '" ');
  });

  return objTag + attrsString + '>' + paramsString + '</object>';
};

ajs.Flash.streamFromParts = function(connection, stream) {
  return connection + '&' + stream;
};

ajs.Flash.streamToParts = function(src) {
  var parts = {
    connection: '',
    stream: ''
  };

  if (! src) {
    return parts;
  }

  // Look for the normal URL separator we expect, '&'.
  // If found, we split the URL into two pieces around the
  // first '&'.
  var connEnd = src.indexOf('&');
  var streamBegin;
  if (connEnd !== -1) {
    streamBegin = connEnd + 1;
  }
  else {
    // If there's not a '&', we use the last '/' as the delimiter.
    connEnd = streamBegin = src.lastIndexOf('/') + 1;
    if (connEnd === 0) {
      // really, there's not a '/'?
      connEnd = streamBegin = src.length;
    }
  }
  parts.connection = src.substring(0, connEnd);
  parts.stream = src.substring(streamBegin, src.length);

  return parts;
};

ajs.Flash.isStreamingType = function(srcType) {
  return srcType in ajs.Flash.streamingFormats;
};

// RTMP has four variations, any string starting
// with one of these protocols should be valid
ajs.Flash.RTMP_RE = /^rtmp[set]?:\/\//i;

ajs.Flash.isStreamingSrc = function(src) {
  return ajs.Flash.RTMP_RE.test(src);
};
/**
 * The Media Loader is the component that decides which playback technology to load
 * when the player is initialized.
 *
 * @constructor
 */
ajs.MediaLoader = ajs.Component.extend({
  /** @constructor */
  init: function(player, options, ready){
    ajs.Component.call(this, player, options, ready);

    // If there are no sources when the player is initialized,
    // load the first supported playback technology.
    if (!player.options_['sources'] || player.options_['sources'].length === 0) {
      for (var i=0,j=player.options_['techOrder']; i<j.length; i++) {
        var techName = ajs.capitalize(j[i]),
            tech = window['audiojs'][techName];

        // Check if the browser supports this technology
        if (tech && tech.isSupported()) {
          player.loadTech(techName);
          break;
        }
      }
    } else {
      // // Loop through playback technologies (HTML5, Flash) and check for support.
      // // Then load the best source.
      // // A few assumptions here:
      // //   All playback technologies respect preload false.
      player.src(player.options_['sources']);
    }
  }
});

/**
 * @fileoverview Add JSON support
 * @suppress {undefinedVars}
 * (Compiler doesn't like JSON not being declared)
 */

/**
 * Javascript JSON implementation
 * (Parse Method Only)
 * https://github.com/douglascrockford/JSON-js/blob/master/json2.js
 * Only using for parse method when parsing data-setup attribute JSON.
 * @suppress {undefinedVars}
 * @namespace
 * @private
 */
ajs.JSON;

if (typeof window.JSON !== 'undefined' && window.JSON.parse === 'function') {
  ajs.JSON = window.JSON;

} else {
  ajs.JSON = {};

  var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

  /**
   * parse the json
   *
   * @memberof ajs.JSON
   * @param {String} text The JSON string to parse
   * @param {Function=} [reviver] Optional function that can transform the results
   * @return {Object|Array} The parsed JSON
   */
  ajs.JSON.parse = function (text, reviver) {
      var j;

      function walk(holder, key) {
          var k, v, value = holder[key];
          if (value && typeof value === 'object') {
              for (k in value) {
                  if (Object.prototype.hasOwnProperty.call(value, k)) {
                      v = walk(value, k);
                      if (v !== undefined) {
                          value[k] = v;
                      } else {
                          delete value[k];
                      }
                  }
              }
          }
          return reviver.call(holder, key, value);
      }
      text = String(text);
      cx.lastIndex = 0;
      if (cx.test(text)) {
          text = text.replace(cx, function (a) {
              return '\\u' +
                  ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
          });
      }

      if (/^[\],:{}\s]*$/
              .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                  .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                  .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

          j = eval('(' + text + ')');

          return typeof reviver === 'function' ?
              walk({'': j}, '') : j;
      }

      throw new SyntaxError('JSON.parse(): invalid or malformed JSON data');
  };
}
/**
 * @fileoverview Functions for automatically setting up a player
 * based on the data-setup attribute of the audio tag
 */

// Automatically set up any tags that have a data-setup attribute
ajs.autoSetup = function(){
  var options, aud, player,
      auds = document.getElementsByTagName('audio');

  // Check if any media elements exist
  if (auds && auds.length > 0) {

    for (var i=0,j=auds.length; i<j; i++) {
      aud = auds[i];

      // Check if element exists, has getAttribute func.
      // IE seems to consider typeof el.getAttribute == 'object' instead of 'function' like expected, at least when loading the player immediately.
      if (aud && aud.getAttribute) {

        // Make sure this player hasn't already been set up.
        if (aud['player'] === undefined) {
          options = aud.getAttribute('data-setup');

          // Check if data-setup attr exists.
          // We only auto-setup if they've added the data-setup attr.
          if (options !== null) {

            // Parse options JSON
            // If empty string, make it a parsable json object.
            options = ajs.JSON.parse(options || '{}');

            // Create new audio.js instance.
            player = audiojs(aud, options);
          }
        }

      // If getAttribute isn't defined, we need to wait for the DOM.
      } else {
        ajs.autoSetupTimeout(1);
        break;
      }
    }

  // No audios were found, so keep looping unless page is finisehd loading.
  } else if (!ajs.windowLoaded) {
    ajs.autoSetupTimeout(1);
  }
};

// Pause to let the DOM keep processing
ajs.autoSetupTimeout = function(wait){
  setTimeout(ajs.autoSetup, wait);
};

if (document.readyState === 'complete') {
  ajs.windowLoaded = true;
} else {
  ajs.one(window, 'load', function(){
    ajs.windowLoaded = true;
  });
}

// Run Auto-load players
// You have to wait at least once in case this script is loaded after your audio in the DOM (weird behavior only with minified version)
ajs.autoSetupTimeout(1);
/**
 * the method for registering a audio.js plugin
 *
 * @param  {String} name The name of the plugin
 * @param  {Function} init The function that is run when the player inits
 */
ajs.plugin = function(name, init){
  ajs.Player.prototype[name] = init;
};
