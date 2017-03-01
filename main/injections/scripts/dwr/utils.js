myDwr.util._escapeHtml = true;

myDwr.util.setEscapeHtml = function(escapeHtml) {
  myDwr.util._escapeHtml = escapeHtml;
}

myDwr.util._shouldEscapeHtml = function(options) {
  if (options && options.escapeHtml != null) {
    return options.escapeHtml;
  }
  return myDwr.util._escapeHtml;
}

myDwr.util.escapeHtml = function(original) {
  var div = document.createElement('div');
  var text = document.createTextNode(original);
  div.appendChild(text);
  return div.innerHTML;
}

myDwr.util.unescapeHtml = function(original) {
  var div = document.createElement('div');
  div.innerHTML = original.replace(/<\/?[^>]+>/gi, '');
  return div.childNodes[0] ? div.childNodes[0].nodeValue : '';
}

myDwr.util.replaceXmlCharacters = function(original) {
  original = original.replace("&", "+");
  original = original.replace("<", "\u2039");
  original = original.replace(">", "\u203A");
  original = original.replace("\'", "\u2018");
  original = original.replace("\"", "\u201C");
  return original;
}

myDwr.util.containsXssRiskyCharacters = function(original) {
  return (original.indexOf('&') != -1
  || original.indexOf('<') != -1
  || original.indexOf('>') != -1
  || original.indexOf('\'') != -1
  || original.indexOf('\"') != -1);
}

myDwr.util.onReturn = function(event, action) {
  if (!event) event = window.event;
  if (event && event.keyCode && event.keyCode == 13) action();
};

myDwr.util.selectRange = function(ele, start, end) {
  ele = myDwr.util._getElementById(ele, "selectRange()");
  if (ele == null) return;
  if (ele.setSelectionRange) {
    ele.setSelectionRange(start, end);
  }
  else if (ele.createTextRange) {
    var range = ele.createTextRange();
    range.moveStart("character", start);
    range.moveEnd("character", end - ele.value.length);
    range.select();
  }
  ele.focus();
};

if (document.getElementById) {
  myDwr.util.byId = function() {
    var elements = new Array();
    for (var i = 0; i < arguments.length; i++) {
      var element = arguments[i];
      if (typeof element == 'string') {
        element = document.getElementById(element);
      }
      if (arguments.length == 1) {
        return element;
      }
      elements.push(element);
    }
    return elements;
  };
}
else if (document.all) {
  myDwr.util.byId = function() {
    var elements = new Array();
    for (var i = 0; i < arguments.length; i++) {
      var element = arguments[i];
      if (typeof element == 'string') {
        element = document.all[element];
      }
      if (arguments.length == 1) {
        return element;
      }
      elements.push(element);
    }
    return elements;
  };
}

var $;
if (!$) {
  $ = myDwr.util.byId;
}

myDwr.util.toDescriptiveString = function(data, showLevels, options) {
  if (showLevels === undefined) showLevels = 1;
  var opt = {};
  if (myDwr.util._isObject(options)) opt = options;
  var defaultoptions = {
    escapeHtml:false,
    baseIndent: "",
    childIndent: "\u00A0\u00A0",
    lineTerminator: "\n",
    oneLineMaxItems: 5,
    shortStringMaxLength: 13,
    propertyNameMaxLength: 30
  };
  for (var p in defaultoptions) if (!(p in opt)) opt[p] = defaultoptions[p];
  if (typeof options == "number") {
    var baseDepth = options;
    opt.baseIndent = myDwr.util._indent2(baseDepth, opt);
  }

  var skipDomProperties = {
    document:true, ownerDocument:true,
    all:true,
    parentElement:true, parentNode:true, offsetParent:true,
    children:true, firstChild:true, lastChild:true,
    previousSibling:true, nextSibling:true,
    innerHTML:true, outerHTML:true,
    innerText:true, outerText:true, textContent:true,
    attributes:true,
    style:true, currentStyle:true, runtimeStyle:true,
    parentTextEdit:true
  };

  function recursive(data, showLevels, indentDepth, options) {
    var reply = "";
    try {
      // string
      if (typeof data == "string") {
        var str = data;
        if (showLevels == 0 && str.length > options.shortStringMaxLength)
          str = str.substring(0, options.shortStringMaxLength-3) + "...";
        if (options.escapeHtml) {
          // Do the escape separately for every line as escapeHtml() on some
          // browsers (IE) will strip line breaks and we want to preserve them
          var lines = str.split("\n");
          for (var i = 0; i < lines.length; i++) lines[i] = myDwr.util.escapeHtml(lines[i]);
          str = lines.join("\n");
        }
        if (showLevels == 0) { // Short format
          str = str.replace(/\n|\r|\t/g, function(ch) {
            switch (ch) {
              case "\n": return "\\n";
              case "\r": return "";
              case "\t": return "\\t";
            }
          });
        }
        else { // Long format
          str = str.replace(/\n|\r|\t/g, function(ch) {
            switch (ch) {
              case "\n": return options.lineTerminator + indent(indentDepth+1, options);
              case "\r": return "";
              case "\t": return "\\t";
            }
          });
        }
        reply = '"' + str + '"';
      }

      // function
      else if (typeof data == "function") {
        reply = "function";
      }

      // Array
      else if (myDwr.util._isArray(data)) {
        if (showLevels == 0) { // Short format (don't show items)
          if (data.length > 0)
            reply = "[...]";
          else
            reply = "[]";
        }
        else { // Long format (show items)
          var strarr = [];
          strarr.push("[");
          var count = 0;
          for (var i = 0; i < data.length; i++) {
            if (! (i in data)) continue;
            var itemvalue = data[i];
            if (count > 0) strarr.push(", ");
            if (showLevels == 1) { // One-line format
              if (count == options.oneLineMaxItems) {
                strarr.push("...");
                break;
              }
            }
            else { // Multi-line format
              strarr.push(options.lineTerminator + indent(indentDepth+1, options));
            }
            if (i != count) {
              strarr.push(i);
              strarr.push(":");
            }
            strarr.push(recursive(itemvalue, showLevels-1, indentDepth+1, options));
            count++;
          }
          if (showLevels > 1) strarr.push(options.lineTerminator + indent(indentDepth, options));
          strarr.push("]");
          reply = strarr.join("");
        }
      }

      // Objects except Date
      else if (myDwr.util._isObject(data) && !myDwr.util._isDate(data)) {
        if (showLevels == 0) { // Short format (don't show properties)
          reply = myDwr.util._detailedTypeOf(data);
        }
        else { // Long format (show properties)
          var strarr = [];
          if (myDwr.util._detailedTypeOf(data) != "Object") {
            strarr.push(myDwr.util._detailedTypeOf(data));
            if (typeof data.valueOf() != "object") {
              strarr.push(":");
              strarr.push(recursive(data.valueOf(), 1, indentDepth, options));
            }
            strarr.push(" ");
          }
          strarr.push("{");
          var isDomObject = myDwr.util._isHTMLElement(data);
          var count = 0;
          for (var prop in data) {
            var propvalue = data[prop];
            if (isDomObject) {
              if (!propvalue) continue;
              if (typeof propvalue == "function") continue;
              if (skipDomProperties[prop]) continue;
              if (prop.toUpperCase() == prop) continue;
            }
            if (count > 0) strarr.push(", ");
            if (showLevels == 1) { // One-line format
              if (count == options.oneLineMaxItems) {
                strarr.push("...");
                break;
              }
            }
            else { // Multi-line format
              strarr.push(options.lineTerminator + indent(indentDepth+1, options));
            }
            strarr.push(prop.length > options.propertyNameMaxLength ? prop.substring(0, options.propertyNameMaxLength-3) + "..." : prop);
            strarr.push(":");
            strarr.push(recursive(propvalue, showLevels-1, indentDepth+1, options));
            count++;
          }
          if (showLevels > 1 && count > 0) strarr.push(options.lineTerminator + indent(indentDepth, options));
          strarr.push("}");
          reply = strarr.join("");
        }
      }

      // undefined, null, number, boolean, Date
      else {
        reply = "" + data;
      }

      return reply;
    }
    catch(err) {
      return (err.message ? err.message : ""+err);
    }
  }

  function indent(count, options) {
    var strarr = [];
    strarr.push(options.baseIndent);
    for (var i=0; i<count; i++) {
      strarr.push(options.childIndent);
    }
    return strarr.join("");
  };

  return recursive(data, showLevels, 0, opt);
}

myDwr.util.useLoadingMessage = function(message) {
  var loadingMessage;
  if (message) loadingMessage = message;
  else loadingMessage = "Loading";
  myDwr.engine.setPreHook(function() {
    var disabledZone = myDwr.util.byId('disabledZone');
    if (!disabledZone) {
      disabledZone = document.createElement('div');
      disabledZone.setAttribute('id', 'disabledZone');
      disabledZone.style.position = "absolute";
      disabledZone.style.zIndex = "1000";
      disabledZone.style.left = "0px";
      disabledZone.style.top = "0px";
      disabledZone.style.width = "100%";
      disabledZone.style.height = "100%";
      document.body.appendChild(disabledZone);
      var messageZone = document.createElement('div');
      messageZone.setAttribute('id', 'messageZone');
      messageZone.style.position = "absolute";
      messageZone.style.top = "0px";
      messageZone.style.right = "0px";
      messageZone.style.background = "red";
      messageZone.style.color = "white";
      messageZone.style.fontFamily = "Arial,Helvetica,sans-serif";
      messageZone.style.padding = "4px";
      disabledZone.appendChild(messageZone);
      var text = document.createTextNode(loadingMessage);
      messageZone.appendChild(text);
      myDwr.util._disabledZoneUseCount = 1;
    }
    else {
      myDwr.util.byId('messageZone').innerHTML = loadingMessage;
      disabledZone.style.visibility = 'visible';
      myDwr.util._disabledZoneUseCount++;
    }
  });
  myDwr.engine.setPostHook(function() {
    myDwr.util._disabledZoneUseCount--;
    if (myDwr.util._disabledZoneUseCount == 0) {
      myDwr.util.byId('disabledZone').style.visibility = 'hidden';
    }
  });
};

myDwr.util.setHighlightHandler = function(handler) {
  myDwr.util._highlightHandler = handler;
};

myDwr.util.yellowFadeHighlightHandler = function(ele) {
  myDwr.util._yellowFadeProcess(ele, 0);
};
myDwr.util._yellowFadeSteps = [ "d0", "b0", "a0", "90", "98", "a0", "a8", "b0", "b8", "c0", "c8", "d0", "d8", "e0", "e8", "f0", "f8" ];
myDwr.util._yellowFadeProcess = function(ele, colorIndex) {
  ele = myDwr.util.byId(ele);
  if (colorIndex < myDwr.util._yellowFadeSteps.length) {
    ele.style.backgroundColor = "#ffff" + myDwr.util._yellowFadeSteps[colorIndex];
    setTimeout("myDwr.util._yellowFadeProcess('" + ele.id + "'," + (colorIndex + 1) + ")", 200);
  }
  else {
    ele.style.backgroundColor = "transparent";
  }
};

myDwr.util.borderFadeHighlightHandler = function(ele) {
  ele.style.borderWidth = "2px";
  ele.style.borderStyle = "solid";
  myDwr.util._borderFadeProcess(ele, 0);
};
myDwr.util._borderFadeSteps = [ "d0", "b0", "a0", "90", "98", "a0", "a8", "b0", "b8", "c0", "c8", "d0", "d8", "e0", "e8", "f0", "f8" ];
myDwr.util._borderFadeProcess = function(ele, colorIndex) {
  ele = myDwr.util.byId(ele);
  if (colorIndex < myDwr.util._borderFadeSteps.length) {
    ele.style.borderColor = "#ff" + myDwr.util._borderFadeSteps[colorIndex] + myDwr.util._borderFadeSteps[colorIndex];
    setTimeout("myDwr.util._borderFadeProcess('" + ele.id + "'," + (colorIndex + 1) + ")", 200);
  }
  else {
    ele.style.backgroundColor = "transparent";
  }
};

myDwr.util.focusHighlightHandler = function(ele) {
  try {
    ele.focus();
  }
  catch (ex) { /* ignore */ }
};

myDwr.util._highlightHandler = null;

myDwr.util.highlight = function(ele, options) {
  if (options && options.highlightHandler) {
    options.highlightHandler(myDwr.util.byId(ele));
  }
  else if (myDwr.util._highlightHandler != null) {
    myDwr.util._highlightHandler(myDwr.util.byId(ele));
  }
};

myDwr.util.setValue = function(ele, val, options) {
  if (val == null) val = "";
  if (options == null) options = {};
  if (myDwr.util._shouldEscapeHtml(options) && typeof(val) == "string") {
    val = myDwr.util.escapeHtml(val);
  }

  var orig = ele;
  if (typeof ele == "string") {
    ele = myDwr.util.byId(ele);
    // We can work with names and need to sometimes for radio buttons, and IE has
    // an annoying bug where getElementById() returns an element based on name if
    // it doesn't find it by id. Here we don't want to do that, so:
    if (ele && ele.id != orig) ele = null;
  }
  var nodes = null;
  if (ele == null) {
    // Now it is time to look by name
    nodes = document.getElementsByName(orig);
    if (nodes.length >= 1) ele = nodes.item(0);
  }

  if (ele == null) {
    myDwr.util._debug("setValue() can't find an element with id/name: " + orig + ".");
    return;
  }

  // All paths now lead to some update so we highlight a change
  myDwr.util.highlight(ele, options);

  if (myDwr.util._isHTMLElement(ele, "select")) {
    if (ele.type == "select-multiple" && myDwr.util._isArray(val)) myDwr.util._selectListItems(ele, val);
    else myDwr.util._selectListItem(ele, val);
    return;
  }

  if (myDwr.util._isHTMLElement(ele, "input")) {
    if (ele.type == "radio" || ele.type == "checkbox") {
      if (nodes && nodes.length >= 1) {
        for (var i = 0; i < nodes.length; i++) {
          var node = nodes.item(i);
          if (node.type != ele.type) continue;
          if (myDwr.util._isArray(val)) {
            node.checked = false;
            for (var j = 0; j < val.length; j++)
              if (val[i] == node.value) node.checked = true;
          }
          else {
            node.checked = (node.value == val);
          }
        }
      }
      else ele.checked = (val == true);
    }
    else ele.value = val;

    return;
  }

  if (myDwr.util._isHTMLElement(ele, "textarea")) {
    ele.value = val;
    return;
  }

  // If the value to be set is a DOM object then we try importing the node
  // rather than serializing it out
  if (val.nodeType) {
    if (val.nodeType == 9 /*Node.DOCUMENT_NODE*/) val = val.documentElement;
    val = myDwr.util._importNode(ele.ownerDocument, val, true);
    ele.appendChild(val);
    return;
  }

  // Fall back to innerHTML
  ele.innerHTML = val;
};

myDwr.util._selectListItems = function(ele, val) {
  // We deal with select list elements by selecting the matching option
  // Begin by searching through the values
  var found  = false;
  var i;
  var j;
  for (i = 0; i < ele.options.length; i++) {
    ele.options[i].selected = false;
    for (j = 0; j < val.length; j++) {
      if (ele.options[i].value == val[j]) {
        ele.options[i].selected = true;
      }
    }
  }
  // If that fails then try searching through the visible text
  if (found) return;

  for (i = 0; i < ele.options.length; i++) {
    for (j = 0; j < val.length; j++) {
      if (ele.options[i].text == val[j]) {
        ele.options[i].selected = true;
      }
    }
  }
};

myDwr.util._selectListItem = function(ele, val) {
  // We deal with select list elements by selecting the matching option
  // Begin by searching through the values
  var found = false;
  var i;
  for (i = 0; i < ele.options.length; i++) {
    if (ele.options[i].value == val) {
      ele.options[i].selected = true;
      found = true;
    }
    else {
      ele.options[i].selected = false;
    }
  }

  // If that fails then try searching through the visible text
  if (found) return;

  for (i = 0; i < ele.options.length; i++) {
    if (ele.options[i].text == val) {
      ele.options[i].selected = true;
    }
    else {
      ele.options[i].selected = false;
    }
  }
};

myDwr.util.getValue = function(ele, options) {
  if (options == null) options = {};
  var orig = ele;
  if (typeof ele == "string") {
    ele = myDwr.util.byId(ele);
    // We can work with names and need to sometimes for radio buttons, and IE has
    // an annoying bug where getElementById() returns an element based on name if
    // it doesn't find it by id. Here we don't want to do that, so:
    if (ele && ele.id != orig) ele = null;
  }
  var nodes = null;
  if (ele == null) {
    // Now it is time to look by name
    nodes = document.getElementsByName(orig);
    if (nodes.length >= 1) ele = nodes.item(0);
  }
  if (ele == null) {
    myDwr.util._debug("getValue() can't find an element with id/name: " + orig + ".");
    return "";
  }

  if (myDwr.util._isHTMLElement(ele, "select")) {
    // Using "type" property instead of "multiple" as "type" is an official
    // client-side property since JS 1.1
    if (ele.type == "select-multiple") {
      var reply = new Array();
      for (var i = 0; i < ele.options.length; i++) {
        var item = ele.options[i];
        if (item.selected) {
          var valueAttr = item.getAttributeNode("value");
          if (valueAttr && valueAttr.specified) {
            reply.push(item.value);
          }
          else {
            reply.push(item.text);
          }
        }
      }
      return reply;
    }
    else {
      var sel = ele.selectedIndex;
      if (sel != -1) {
        var item = ele.options[sel];
        var valueAttr = item.getAttributeNode("value");
        if (valueAttr && valueAttr.specified) {
          return item.value;
        }
        return item.text;
      }
      else {
        return "";
      }
    }
  }

  if (myDwr.util._isHTMLElement(ele, "input")) {
    if (ele.type == "radio") {
      if (nodes && nodes.length >= 1) {
        for (var i = 0; i < nodes.length; i++) {
          var node = nodes.item(i);
          if (node.type == ele.type) {
            if (node.checked) return node.value;
          }
        }
      }
      return ele.checked;
    }
    if (ele.type == "checkbox") {
      if (nodes && nodes.length >= 1) {
        var reply = [];
        for (var i = 0; i < nodes.length; i++) {
          var node = nodes.item(i);
          if (node.type == ele.type) {
            if (node.checked) reply.push(node.value);
          }
        }
        return reply;
      }
      return ele.checked;
    }
    return ele.value;
  }

  if (myDwr.util._isHTMLElement(ele, "textarea")) {
    return ele.value;
  }

  if (myDwr.util._shouldEscapeHtml(options)) {
    if (ele.textContent) return ele.textContent;
    else if (ele.innerText) return ele.innerText;
  }
  return ele.innerHTML;
};

myDwr.util.getText = function(ele) {
  ele = myDwr.util._getElementById(ele, "getText()");
  if (ele == null) return null;
  if (!myDwr.util._isHTMLElement(ele, "select")) {
    myDwr.util._debug("getText() can only be used with select elements. Attempt to use: " + myDwr.util._detailedTypeOf(ele) + " from  id: " + orig + ".");
    return "";
  }

  // This is a bit of a scam because it assumes single select
  // but I'm not sure how we should treat multi-select.
  var sel = ele.selectedIndex;
  if (sel != -1) {
    return ele.options[sel].text;
  }
  else {
    return "";
  }
};

myDwr.util.setValues = function(data, options) {
  var prefix = "";
  if (options && options.prefix) prefix = options.prefix;
  if (options && options.idPrefix) prefix = options.idPrefix;
  myDwr.util._setValuesRecursive(data, prefix);
};

myDwr.util._setValuesRecursive = function(data, idpath) {
  // Array containing objects -> add "[n]" to prefix and make recursive call
  // for each item object
  if (myDwr.util._isArray(data) && data.length > 0 && myDwr.util._isObject(data[0])) {
    for (var i = 0; i < data.length; i++) {
      myDwr.util._setValuesRecursive(data[i], idpath+"["+i+"]");
    }
  }
  // Object (not array) -> handle nested object properties
  else if (myDwr.util._isObject(data) && !myDwr.util._isArray(data)) {
    for (var prop in data) {
      var subidpath = idpath ? idpath+"."+prop : prop;
      // Object (not array), or array containing objects -> call ourselves recursively
      if (myDwr.util._isObject(data[prop]) && !myDwr.util._isArray(data[prop])
        || myDwr.util._isArray(data[prop]) && data[prop].length > 0 && myDwr.util._isObject(data[prop][0])) {
        myDwr.util._setValuesRecursive(data[prop], subidpath);
      }
      // Functions -> skip
      else if (typeof data[prop] == "function") {
        // NOP
      }
      // Only simple values left (or array of simple values, or empty array)
      // -> call setValue()
      else {
        // Are there any elements with that id or name
        if (myDwr.util.byId(subidpath) != null || document.getElementsByName(subidpath).length >= 1) {
          myDwr.util.setValue(subidpath, data[prop]);
        }
      }
    }
  }
};

myDwr.util.getValues = function(data, options) {
  if (typeof data == "string" || myDwr.util._isHTMLElement(data)) {
    return myDwr.util.getFormValues(data);
  }
  else {
    var prefix = "";
    if (options != null && options.prefix) prefix = options.prefix;
    if (options != null && options.idPrefix) prefix = options.idPrefix;
    myDwr.util._getValuesRecursive(data, prefix);
    return data;
  }
};

myDwr.util.getFormValues = function(eleOrNameOrId) {
  var ele = null;
  if (typeof eleOrNameOrId == "string") {
    ele = document.forms[eleOrNameOrId];
    if (ele == null) ele = myDwr.util.byId(eleOrNameOrId);
  }
  else if (myDwr.util._isHTMLElement(eleOrNameOrId)) {
    ele = eleOrNameOrId;
  }
  if (ele != null) {
    if (ele.elements == null) {
      alert("getFormValues() requires an object or reference to a form element.");
      return null;
    }
    var reply = {};
    var name;
    var value;
    for (var i = 0; i < ele.elements.length; i++) {
      if (ele[i].type in {button:0,submit:0,reset:0,image:0,file:0}) continue;
      if (ele[i].name) {
        name = ele[i].name;
        value = myDwr.util.getValue(name);
      }
      else {
        if (ele[i].id) name = ele[i].id;
        else name = "element" + i;
        value = myDwr.util.getValue(ele[i]);
      }
      reply[name] = value;
    }
    return reply;
  }
};

myDwr.util._getValuesRecursive = function(data, idpath) {
  // Array containing objects -> add "[n]" to idpath and make recursive call
  // for each item object
  if (myDwr.util._isArray(data) && data.length > 0 && myDwr.util._isObject(data[0])) {
    for (var i = 0; i < data.length; i++) {
      myDwr.util._getValuesRecursive(data[i], idpath+"["+i+"]");
    }
  }
  // Object (not array) -> handle nested object properties
  else if (myDwr.util._isObject(data) && !myDwr.util._isArray(data)) {
    for (var prop in data) {
      var subidpath = idpath ? idpath+"."+prop : prop;
      // Object, or array containing objects -> call ourselves recursively
      if (myDwr.util._isObject(data[prop]) && !myDwr.util._isArray(data[prop])
        || myDwr.util._isArray(data[prop]) && data[prop].length > 0 && myDwr.util._isObject(data[prop][0])) {
        myDwr.util._getValuesRecursive(data[prop], subidpath);
      }
      // Functions -> skip
      else if (typeof data[prop] == "function") {
        // NOP
      }
      // Only simple values left (or array of simple values, or empty array)
      // -> call getValue()
      else {
        // Are there any elements with that id or name
        if (myDwr.util.byId(subidpath) != null || document.getElementsByName(subidpath).length >= 1) {
          data[prop] = myDwr.util.getValue(subidpath);
        }
      }
    }
  }
};

myDwr.util.addOptions = function(ele, data/*, options*/) {
  ele = myDwr.util._getElementById(ele, "addOptions()");
  if (ele == null) return;
  var useOptions = myDwr.util._isHTMLElement(ele, "select");
  var useLi = myDwr.util._isHTMLElement(ele, ["ul", "ol"]);
  if (!useOptions && !useLi) {
    myDwr.util._debug("addOptions() can only be used with select/ul/ol elements. Attempt to use: " + myDwr.util._detailedTypeOf(ele));
    return;
  }
  if (data == null) return;

  var argcount = arguments.length;
  var options = {};
  var lastarg = arguments[argcount - 1];
  if (argcount > 2 && myDwr.util._isObject(lastarg)) {
    options = lastarg;
    argcount--;
  }
  var arg3 = null; if (argcount >= 3) arg3 = arguments[2];
  var arg4 = null; if (argcount >= 4) arg4 = arguments[3];
  if (!options.optionCreator && useOptions) options.optionCreator = myDwr.util._defaultOptionCreator;
  if (!options.optionCreator && useLi) options.optionCreator = myDwr.util._defaultListItemCreator;

  var text, value, li;
  if (myDwr.util._isArray(data)) {
    // Loop through the data that we do have
    for (var i = 0; i < data.length; i++) {
      options.data = data[i];
      options.text = null;
      options.value = null;
      if (useOptions) {
        if (arg3 != null) {
          if (arg4 != null) {
            options.text = myDwr.util._getValueFrom(data[i], arg4);
            options.value = myDwr.util._getValueFrom(data[i], arg3);
          }
          else options.text = options.value = myDwr.util._getValueFrom(data[i], arg3);
        }
        else options.text = options.value = myDwr.util._getValueFrom(data[i]);

        if (options.text != null || options.value) {
          var opt = options.optionCreator(options);
          opt.text = options.text;
          opt.value = options.value;
          ele.options[ele.options.length] = opt;
        }
      }
      else {
        options.value = myDwr.util._getValueFrom(data[i], arg3);
        if (options.value != null) {
          li = options.optionCreator(options);
          if (myDwr.util._shouldEscapeHtml(options)) {
            options.value = myDwr.util.escapeHtml(options.value);
          }
          li.innerHTML = options.value;
          ele.appendChild(li);
        }
      }
    }
  }
  else if (arg4 != null) {
    if (!useOptions) {
      alert("myDwr.util.addOptions can only create select lists from objects.");
      return;
    }
    for (var prop in data) {
      options.data = data[prop];
      options.value = myDwr.util._getValueFrom(data[prop], arg3);
      options.text = myDwr.util._getValueFrom(data[prop], arg4);

      if (options.text != null || options.value) {
        var opt = options.optionCreator(options);
        opt.text = options.text;
        opt.value = options.value;
        ele.options[ele.options.length] = opt;
      }
    }
  }
  else {
    if (!useOptions) {
      myDwr.util._debug("myDwr.util.addOptions can only create select lists from objects.");
      return;
    }
    for (var prop in data) {
      options.data = data[prop];
      if (!arg3) {
        options.value = prop;
        options.text = data[prop];
      }
      else {
        options.value = data[prop];
        options.text = prop;
      }
      if (options.text != null || options.value) {
        var opt = options.optionCreator(options);
        opt.text = options.text;
        opt.value = options.value;
        ele.options[ele.options.length] = opt;
      }
    }
  }

  // All error routes through this function result in a return, so highlight now
  myDwr.util.highlight(ele, options);
};

myDwr.util._getValueFrom = function(data, method) {
  if (method == null) return data;
  else if (typeof method == 'function') return method(data);
  else return data[method];
};

myDwr.util._defaultOptionCreator = function(options) {
  return new Option();
};

myDwr.util._defaultListItemCreator = function(options) {
  return document.createElement("li");
};

myDwr.util.removeAllOptions = function(ele) {
  ele = myDwr.util._getElementById(ele, "removeAllOptions()");
  if (ele == null) return;
  var useOptions = myDwr.util._isHTMLElement(ele, "select");
  var useLi = myDwr.util._isHTMLElement(ele, ["ul", "ol"]);
  if (!useOptions && !useLi) {
    myDwr.util._debug("removeAllOptions() can only be used with select, ol and ul elements. Attempt to use: " + myDwr.util._detailedTypeOf(ele));
    return;
  }
  if (useOptions) {
    ele.options.length = 0;
  }
  else {
    while (ele.childNodes.length > 0) {
      ele.removeChild(ele.firstChild);
    }
  }
};

myDwr.util.addRows = function(ele, data, cellFuncs, options) {
  ele = myDwr.util._getElementById(ele, "addRows()");
  if (ele == null) return;
  if (!myDwr.util._isHTMLElement(ele, ["table", "tbody", "thead", "tfoot"])) {
    myDwr.util._debug("addRows() can only be used with table, tbody, thead and tfoot elements. Attempt to use: " + myDwr.util._detailedTypeOf(ele));
    return;
  }
  if (!options) options = {};
  if (!options.rowCreator) options.rowCreator = myDwr.util._defaultRowCreator;
  if (!options.cellCreator) options.cellCreator = myDwr.util._defaultCellCreator;
  var tr, rowNum;
  if (myDwr.util._isArray(data)) {
    for (rowNum = 0; rowNum < data.length; rowNum++) {
      options.rowData = data[rowNum];
      options.rowIndex = rowNum;
      options.rowNum = rowNum;
      options.data = null;
      options.cellNum = -1;
      tr = myDwr.util._addRowInner(cellFuncs, options);
      if (tr != null) ele.appendChild(tr);
    }
  }
  else if (typeof data == "object") {
    rowNum = 0;
    for (var rowIndex in data) {
      options.rowData = data[rowIndex];
      options.rowIndex = rowIndex;
      options.rowNum = rowNum;
      options.data = null;
      options.cellNum = -1;
      tr = myDwr.util._addRowInner(cellFuncs, options);
      if (tr != null) ele.appendChild(tr);
      rowNum++;
    }
  }

  myDwr.util.highlight(ele, options);
};

myDwr.util._addRowInner = function(cellFuncs, options) {
  var tr = options.rowCreator(options);
  if (tr == null) return null;
  for (var cellNum = 0; cellNum < cellFuncs.length; cellNum++) {
    var func = cellFuncs[cellNum];
    if (typeof func == 'function') options.data = func(options.rowData, options);
    else options.data = func || "";
    options.cellNum = cellNum;
    var td = options.cellCreator(options);
    if (td != null) {
      if (options.data != null) {
        if (myDwr.util._isHTMLElement(options.data)) td.appendChild(options.data);
        else {
          if (myDwr.util._shouldEscapeHtml(options) && typeof(options.data) == "string") {
            td.innerHTML = myDwr.util.escapeHtml(options.data);
          }
          else {
            td.innerHTML = options.data;
          }
        }
      }
      tr.appendChild(td);
    }
  }
  return tr;
};

myDwr.util._defaultRowCreator = function(options) {
  return document.createElement("tr");
};

myDwr.util._defaultCellCreator = function(options) {
  return document.createElement("td");
};

myDwr.util.removeAllRows = function(ele, options) {
  ele = myDwr.util._getElementById(ele, "removeAllRows()");
  if (ele == null) return;
  if (!options) options = {};
  if (!options.filter) options.filter = function() { return true; };
  if (!myDwr.util._isHTMLElement(ele, ["table", "tbody", "thead", "tfoot"])) {
    myDwr.util._debug("removeAllRows() can only be used with table, tbody, thead and tfoot elements. Attempt to use: " + myDwr.util._detailedTypeOf(ele));
    return;
  }
  var child = ele.firstChild;
  var next;
  while (child != null) {
    next = child.nextSibling;
    if (options.filter(child)) {
      ele.removeChild(child);
    }
    child = next;
  }
};

myDwr.util.setClassName = function(ele, className) {
  ele = myDwr.util._getElementById(ele, "setClassName()");
  if (ele == null) return;
  ele.className = className;
};

myDwr.util.addClassName = function(ele, className) {
  ele = myDwr.util._getElementById(ele, "addClassName()");
  if (ele == null) return;
  ele.className += " " + className;
};

myDwr.util.removeClassName = function(ele, className) {
  ele = myDwr.util._getElementById(ele, "removeClassName()");
  if (ele == null) return;
  var regex = new RegExp("(^|\\s)" + className + "(\\s|$)", 'g');
  ele.className = ele.className.replace(regex, '');
};

myDwr.util.toggleClassName = function(ele, className) {
  ele = myDwr.util._getElementById(ele, "toggleClassName()");
  if (ele == null) return;
  var regex = new RegExp("(^|\\s)" + className + "(\\s|$)");
  if (regex.test(ele.className)) {
    ele.className = ele.className.replace(regex, '');
  }
  else {
    ele.className += " " + className;
  }
};

myDwr.util.cloneNode = function(ele, options) {
  ele = myDwr.util._getElementById(ele, "cloneNode()");
  if (ele == null) return null;
  if (options == null) options = {};
  var clone = ele.cloneNode(true);
  if (options.idPrefix || options.idSuffix) {
    myDwr.util._updateIds(clone, options);
  }
  else {
    myDwr.util._removeIds(clone);
  }
  ele.parentNode.insertBefore(clone, ele);
  return clone;
};

myDwr.util._updateIds = function(ele, options) {
  if (options == null) options = {};
  if (ele.id) {
    ele.setAttribute("id", (options.idPrefix || "") + ele.id + (options.idSuffix || ""));
  }
  var children = ele.childNodes;
  for (var i = 0; i < children.length; i++) {
    var child = children.item(i);
    if (child.nodeType == 1 /*Node.ELEMENT_NODE*/) {
      myDwr.util._updateIds(child, options);
    }
  }
};

myDwr.util._removeIds = function(ele) {
  if (ele.id) ele.removeAttribute("id");
  var children = ele.childNodes;
  for (var i = 0; i < children.length; i++) {
    var child = children.item(i);
    if (child.nodeType == 1 /*Node.ELEMENT_NODE*/) {
      myDwr.util._removeIds(child);
    }
  }
};

myDwr.util.cloneNodeForValues = function(templateEle, data, options) {
  templateEle = myDwr.util._getElementById(templateEle, "cloneNodeForValues()");
  if (templateEle == null) return null;
  if (options == null) options = {};
  var idpath;
  if (options.idPrefix != null)
    idpath = options.idPrefix;
  else
    idpath = templateEle.id || "";
  return myDwr.util._cloneNodeForValuesRecursive(templateEle, data, idpath, options);
};

myDwr.util._cloneNodeForValuesRecursive = function(templateEle, data, idpath, options) {
  // Incoming array -> make an id for each item and call clone of the template
  // for each of them
  if (myDwr.util._isArray(data)) {
    var clones = [];
    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      var clone = myDwr.util._cloneNodeForValuesRecursive(templateEle, item, idpath + "[" + i + "]", options);
      clones.push(clone);
    }
    return clones;
  }
  else
  // Incoming object (not array) -> clone the template, add id prefixes, add
  // clone to DOM, and then recurse into any array properties if they contain
  // objects and there is a suitable template
  if (myDwr.util._isObject(data) && !myDwr.util._isArray(data)) {
    var clone = templateEle.cloneNode(true);
    if (options.updateCloneStyle && clone.style) {
      for (var propname in options.updateCloneStyle) {
        clone.style[propname] = options.updateCloneStyle[propname];
      }
    }
    myDwr.util._replaceIds(clone, templateEle.id, idpath);
    templateEle.parentNode.insertBefore(clone, templateEle);
    myDwr.util._cloneSubArrays(data, idpath, options);
    return clone;
  }

  // It is an error to end up here so we return nothing
  return null;
};

myDwr.util._replaceIds = function(ele, oldidpath, newidpath) {
  if (ele.id) {
    var newId = null;
    if (ele.id == oldidpath) {
      newId = newidpath;
    }
    else if (ele.id.length > oldidpath.length) {
      if (ele.id.substr(0, oldidpath.length) == oldidpath) {
        var trailingChar = ele.id.charAt(oldidpath.length);
        if (trailingChar == "." || trailingChar == "[") {
          newId = newidpath + ele.id.substr(oldidpath.length);
        }
      }
    }
    if (newId) {
      ele.setAttribute("id", newId);
    }
    else {
      ele.removeAttribute("id");
    }
  }
  var children = ele.childNodes;
  for (var i = 0; i < children.length; i++) {
    var child = children.item(i);
    if (child.nodeType == 1 /*Node.ELEMENT_NODE*/) {
      myDwr.util._replaceIds(child, oldidpath, newidpath);
    }
  }
};

myDwr.util._cloneSubArrays = function(data, idpath, options) {
  for (prop in data) {
    var value = data[prop];
    // Look for potential recursive cloning in all array properties
    if (myDwr.util._isArray(value)) {
      // Only arrays with objects are interesting for cloning
      if (value.length > 0 && myDwr.util._isObject(value[0])) {
        var subTemplateId = idpath + "." + prop;
        var subTemplateEle = myDwr.util.byId(subTemplateId);
        if (subTemplateEle != null) {
          myDwr.util._cloneNodeForValuesRecursive(subTemplateEle, value, subTemplateId, options);
        }
      }
    }
    // Continue looking for arrays in object properties
    else if (myDwr.util._isObject(value)) {
      myDwr.util._cloneSubArrays(value, idpath + "." + prop, options);
    }
  }
}

myDwr.util._getElementById = function(ele, source) {
  var orig = ele;
  ele = myDwr.util.byId(ele);
  if (ele == null) {
    myDwr.util._debug(source + " can't find an element with id: " + orig + ".");
  }
  return ele;
};

myDwr.util._isHTMLElement = function(ele, nodeName) {
  if (ele == null || typeof ele != "object" || ele.nodeName == null) {
    return false;
  }
  if (nodeName != null) {
    var test = ele.nodeName.toLowerCase();
    if (typeof nodeName == "string") {
      return test == nodeName.toLowerCase();
    }
    if (myDwr.util._isArray(nodeName)) {
      var match = false;
      for (var i = 0; i < nodeName.length && !match; i++) {
        if (test == nodeName[i].toLowerCase()) {
          match =  true;
        }
      }
      return match;
    }
    myDwr.util._debug("myDwr.util._isHTMLElement was passed test node name that is neither a string or array of strings");
    return false;
  }
  return true;
};

myDwr.util._detailedTypeOf = function(x) {
  var reply = typeof x;
  if (reply == "object") {
    reply = Object.prototype.toString.apply(x); // Returns "[object class]"
    reply = reply.substring(8, reply.length-1);  // Just get the class bit
  }
  return reply;
};

myDwr.util._isObject = function(data) {
  return (data && typeof data == "object");
};

myDwr.util._isArray = function(data) {
  return (data && data.join);
};

myDwr.util._isDate = function(data) {
  return (data && data.toUTCString) ? true : false;
};

myDwr.util._importNode = function(doc, importedNode, deep) {
  var newNode;

  if (importedNode.nodeType == 1 /*Node.ELEMENT_NODE*/) {
    newNode = doc.createElement(importedNode.nodeName);

    for (var i = 0; i < importedNode.attributes.length; i++) {
      var attr = importedNode.attributes[i];
      if (attr.nodeValue != null && attr.nodeValue != '') {
        newNode.setAttribute(attr.name, attr.nodeValue);
      }
    }

    if (typeof importedNode.style != "undefined") {
      newNode.style.cssText = importedNode.style.cssText;
    }
  }
  else if (importedNode.nodeType == 3 /*Node.TEXT_NODE*/) {
    newNode = doc.createTextNode(importedNode.nodeValue);
  }

  if (deep && importedNode.hasChildNodes()) {
    for (i = 0; i < importedNode.childNodes.length; i++) {
      newNode.appendChild(myDwr.util._importNode(doc, importedNode.childNodes[i], true));
    }
  }

  return newNode;
};

myDwr.util._debug = function(message, stacktrace) {
  var written = false;
  try {
    if (window.console) {
      if (stacktrace && window.console.trace) window.console.trace();
      window.console.log(message);
      written = true;
    }
    else if (window.opera && window.opera.postError) {
      window.opera.postError(message);
      written = true;
    }
  }
  catch (ex) { /* ignore */ }

  if (!written) {
    var debug = document.getElementById("myDwr-debug");
    if (debug) {
      var contents = message + "<br/>" + debug.innerHTML;
      if (contents.length > 2048) contents = contents.substring(0, 2048);
      debug.innerHTML = contents;
    }
  }
};