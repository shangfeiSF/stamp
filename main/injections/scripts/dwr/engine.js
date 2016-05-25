myDwr.engine.setErrorHandler = function (handler) {
  myDwr.engine._errorHandler = handler;
};

myDwr.engine.setWarningHandler = function (handler) {
  myDwr.engine._warningHandler = handler;
};

myDwr.engine.setTextHtmlHandler = function (handler) {
  myDwr.engine._textHtmlHandler = handler;
}

myDwr.engine.setTimeout = function (timeout) {
  myDwr.engine._timeout = timeout;
};

myDwr.engine.setPreHook = function (handler) {
  myDwr.engine._preHook = handler;
};

myDwr.engine.setPostHook = function (handler) {
  myDwr.engine._postHook = handler;
};

myDwr.engine.setHeaders = function (headers) {
  myDwr.engine._headers = headers;
};

myDwr.engine.setParameters = function (parameters) {
  myDwr.engine._parameters = parameters;
};

myDwr.engine.XMLHttpRequest = 1;
myDwr.engine.IFrame = 2;
myDwr.engine.ScriptTag = 3;

myDwr.engine.setRpcType = function (newType) {
  if (newType != myDwr.engine.XMLHttpRequest && newType != myDwr.engine.IFrame && newType != myDwr.engine.ScriptTag) {
    myDwr.engine._handleError(null, {
      name: "myDwr.engine.invalidRpcType",
      message: "RpcType must be one of myDwr.engine.XMLHttpRequest or myDwr.engine.IFrame or myDwr.engine.ScriptTag"
    });
    return;
  }
  myDwr.engine._rpcType = newType;
};

myDwr.engine.setHttpMethod = function (httpMethod) {
  if (httpMethod != "GET" && httpMethod != "POST") {
    myDwr.engine._handleError(null, {
      name: "myDwr.engine.invalidHttpMethod",
      message: "Remoting method must be one of GET or POST"
    });
    return;
  }
  myDwr.engine._httpMethod = httpMethod;
};

myDwr.engine.setOrdered = function (ordered) {
  myDwr.engine._ordered = ordered;
};

myDwr.engine.setAsync = function (async) {
  myDwr.engine._async = async;
};

myDwr.engine.setActiveReverseAjax = function (activeReverseAjax) {
  if (activeReverseAjax) {
    // Bail if we are already started
    if (myDwr.engine._activeReverseAjax) return;
    myDwr.engine._activeReverseAjax = true;
    myDwr.engine._poll();
  }
  else {
    // Can we cancel an existing request?
    if (myDwr.engine._activeReverseAjax && myDwr.engine._pollReq) myDwr.engine._pollReq.abort();
    myDwr.engine._activeReverseAjax = false;
  }
  // TODO: in iframe mode, if we start, stop, start then the second start may
  // well kick off a second iframe while the first is still about to return
  // we should cope with this but we don't
};

myDwr.engine.setPollType = function (newPollType) {
  if (newPollType != myDwr.engine.XMLHttpRequest && newPollType != myDwr.engine.IFrame) {
    myDwr.engine._handleError(null, {
      name: "myDwr.engine.invalidPollType",
      message: "PollType must be one of myDwr.engine.XMLHttpRequest or myDwr.engine.IFrame"
    });
    return;
  }
  myDwr.engine._pollType = newPollType;
};

myDwr.engine.defaultErrorHandler = function (message, ex) {
  myDwr.engine._debug("Error: " + ex.name + ", " + ex.message, true);

  if (message == null || message == "") alert("A server error has occured. More information may be available in the console.");
  // Ignore NS_ERROR_NOT_AVAILABLE if Mozilla is being narky
  else if (message.indexOf("0x80040111") != -1) myDwr.engine._debug(message);
  else alert(message);
};

myDwr.engine.defaultWarningHandler = function (message, ex) {
  myDwr.engine._debug(message);
};

myDwr.engine.beginBatch = function (mock) {
  if (myDwr.engine._batch) {
    myDwr.engine._handleError(null, {name: "myDwr.engine.batchBegun", message: "Batch already begun"});
    return;
  }
  myDwr.engine._batch = myDwr.engine._createBatch(mock);
};

myDwr.engine.endBatch = function (options) {
  var batch = myDwr.engine._batch;
  if (batch == null) {
    myDwr.engine._handleError(null, {name: "myDwr.engine.batchNotBegun", message: "No batch in progress"});
    return;
  }
  myDwr.engine._batch = null;
  if (batch.map.callCount == 0) return;

  // The hooks need to be merged carefully to preserve ordering
  if (options) myDwr.engine._mergeBatch(batch, options);

  // In ordered mode, we don't send unless the list of sent items is empty
  if (myDwr.engine._ordered && myDwr.engine._batchesLength != 0) {
    myDwr.engine._batchQueue[myDwr.engine._batchQueue.length] = batch;
  }
  else {
    myDwr.engine._sendData(batch);
  }
};

myDwr.engine.setPollMethod = function (type) {
  myDwr.engine.setPollType(type);
};
myDwr.engine.setMethod = function (type) {
  myDwr.engine.setRpcType(type);
};
myDwr.engine.setVerb = function (verb) {
  myDwr.engine.setHttpMethod(verb);
};


myDwr.engine._origScriptSessionId = "62AD1388D0EAC45A0720A0193315ACCE";
myDwr.engine._sessionCookieName = "JSESSIONID"; // JSESSIONID
myDwr.engine._allowGetForSafariButMakeForgeryEasier = "false";
myDwr.engine._scriptTagProtection = "throw 'allowScriptTagRemoting is false.';";
myDwr.engine._defaultPath = "/myDwr";
myDwr.engine._scriptSessionId = null;

myDwr.engine._getScriptSessionId = function () {
  if (myDwr.engine._scriptSessionId == null) {
    myDwr.engine._scriptSessionId = myDwr.engine._origScriptSessionId + Math.floor(Math.random() * 1000);
  }
  return myDwr.engine._scriptSessionId;
};

myDwr.engine._errorHandler = myDwr.engine.defaultErrorHandler;

myDwr.engine._warningHandler = myDwr.engine.defaultWarningHandler;

myDwr.engine._preHook = null;
myDwr.engine._postHook = null;
myDwr.engine._batches = {};
myDwr.engine._batchesLength = 0;
myDwr.engine._batchQueue = [];
myDwr.engine._rpcType = myDwr.engine.XMLHttpRequest;
myDwr.engine._httpMethod = "POST";
myDwr.engine._ordered = false;
myDwr.engine._async = true;
myDwr.engine._batch = null;
myDwr.engine._timeout = 0;

myDwr.engine._DOMDocument = ["Msxml2.DOMDocument.6.0", "Msxml2.DOMDocument.5.0", "Msxml2.DOMDocument.4.0", "Msxml2.DOMDocument.3.0", "MSXML2.DOMDocument", "MSXML.DOMDocument", "Microsoft.XMLDOM"];

myDwr.engine._XMLHTTP = ["Msxml2.XMLHTTP.6.0", "Msxml2.XMLHTTP.5.0", "Msxml2.XMLHTTP.4.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"];

myDwr.engine._activeReverseAjax = false;
myDwr.engine._pollType = myDwr.engine.XMLHttpRequest;
myDwr.engine._outstandingIFrames = [];
myDwr.engine._pollReq = null;
myDwr.engine._pollCometInterval = 200;
myDwr.engine._pollRetries = 0;
myDwr.engine._maxPollRetries = 0;
myDwr.engine._textHtmlHandler = null;
myDwr.engine._headers = null;
myDwr.engine._parameters = null;
myDwr.engine._postSeperator = "\n";

myDwr.engine._defaultInterceptor = function (data) {
  return data;
}

myDwr.engine._urlRewriteHandler = myDwr.engine._defaultInterceptor;

myDwr.engine._contentRewriteHandler = myDwr.engine._defaultInterceptor;

myDwr.engine._replyRewriteHandler = myDwr.engine._defaultInterceptor;

myDwr.engine._nextBatchId = 0;

myDwr.engine._propnames = ["rpcType", "httpMethod", "async", "timeout", "errorHandler", "warningHandler", "textHtmlHandler"];

myDwr.engine._partialResponseNo = 0;
myDwr.engine._partialResponseYes = 1;
myDwr.engine._partialResponseFlush = 2;

myDwr.engine._execute = function (combine, scriptName, methodName, vararg_params) {
  var singleShot = false;
  var path = combine.path;
  if (myDwr.engine._batch == null) {
    myDwr.engine.beginBatch(combine.mock);
    singleShot = true;
  }
  var batch = myDwr.engine._batch;
  // To make them easy to manipulate we copy the arguments into an args array
  var args = [];
  for (var i = 0; i < arguments.length - 3; i++) {
    args[i] = arguments[i + 3];
  }
  // All the paths MUST be to the same servlet
  if (batch.path == null) {
    batch.path = path;
  }
  else {
    if (batch.path != path) {
      myDwr.engine._handleError(batch, {
        name: "myDwr.engine.multipleServlets",
        message: "Can't batch requests to multiple DWR Servlets."
      });
      return;
    }
  }
  // From the other params, work out which is the function (or object with
  // call meta-data) and which is the call parameters
  var callData;
  var lastArg = args[args.length - 1];
  if (typeof lastArg == "function" || lastArg == null) callData = {callback: args.pop()};
  else callData = args.pop();

  // Merge from the callData into the batch
  myDwr.engine._mergeBatch(batch, callData);
  batch.handlers[batch.map.callCount] = {
    exceptionHandler: callData.exceptionHandler,
    callback: callData.callback
  };

  // Copy to the map the things that need serializing
  var prefix = "c" + batch.map.callCount + "-";
  batch.map[prefix + "scriptName"] = scriptName;
  batch.map[prefix + "methodName"] = methodName;
  batch.map[prefix + "id"] = batch.map.callCount;
  for (i = 0; i < args.length; i++) {
    myDwr.engine._serializeAll(batch, [], args[i], prefix + "param" + i);
  }

  // Now we have finished remembering the call, we incr the call count
  batch.map.callCount++;
  if (singleShot) myDwr.engine.endBatch();
};

myDwr.engine._poll = function (overridePath) {
  if (!myDwr.engine._activeReverseAjax) return;

  var batch = myDwr.engine._createBatch();
  batch.map.id = 0; // TODO: Do we need this??
  batch.map.callCount = 1;
  batch.isPoll = true;
  if (navigator.userAgent.indexOf("Gecko/") != -1) {
    batch.rpcType = myDwr.engine._pollType;
    batch.map.partialResponse = myDwr.engine._partialResponseYes;
  }
  else if (document.all) {
    batch.rpcType = myDwr.engine.IFrame;
    batch.map.partialResponse = myDwr.engine._partialResponseFlush;
  }
  else {
    batch.rpcType = myDwr.engine._pollType;
    batch.map.partialResponse = myDwr.engine._partialResponseNo;
  }
  batch.httpMethod = "POST";
  batch.async = true;
  batch.timeout = 0;
  batch.path = (overridePath) ? overridePath : myDwr.engine._defaultPath;
  batch.preHooks = [];
  batch.postHooks = [];
  batch.errorHandler = myDwr.engine._pollErrorHandler;
  batch.warningHandler = myDwr.engine._pollErrorHandler;
  batch.handlers[0] = {
    callback: function (pause) {
      myDwr.engine._pollRetries = 0;
      setTimeout("myDwr.engine._poll()", pause);
    }
  };

  // Send the data
  myDwr.engine._sendData(batch);
  if (batch.rpcType == myDwr.engine.XMLHttpRequest) {
    // if (batch.map.partialResponse != myDwr.engine._partialResponseNo) {
    myDwr.engine._checkCometPoll();
  }
};

myDwr.engine._pollErrorHandler = function (msg, ex) {
  // if anything goes wrong then just silently try again (up to 3x) after 10s
  myDwr.engine._pollRetries++;
  myDwr.engine._debug("Reverse Ajax poll failed (pollRetries=" + myDwr.engine._pollRetries + "): " + ex.name + " : " + ex.message);
  if (myDwr.engine._pollRetries < myDwr.engine._maxPollRetries) {
    setTimeout("myDwr.engine._poll()", 10000);
  }
  else {
    myDwr.engine._debug("Giving up.");
  }
};

myDwr.engine._createBatch = function (mock) {
  var mock = mock || {}

  var page = mock.pathname ? mock.pathname : (window.location.pathname + window.location.search)
  var scriptSessionId = mock._origScriptSessionId ? mock._origScriptSessionId : myDwr.engine._getScriptSessionId()

  var batch = {
    map: {
      callCount: 0,
      page: page,
      httpSessionId: myDwr.engine._getJSessionId(),
      scriptSessionId: scriptSessionId
    },
    charsProcessed: 0, paramCount: 0,
    headers: [], parameters: [],
    isPoll: false, headers: {}, handlers: {}, preHooks: [], postHooks: [],
    rpcType: myDwr.engine._rpcType,
    httpMethod: myDwr.engine._httpMethod,
    async: myDwr.engine._async,
    timeout: myDwr.engine._timeout,
    errorHandler: myDwr.engine._errorHandler,
    warningHandler: myDwr.engine._warningHandler,
    textHtmlHandler: myDwr.engine._textHtmlHandler
  };
  if (myDwr.engine._preHook) batch.preHooks.push(myDwr.engine._preHook);
  if (myDwr.engine._postHook) batch.postHooks.push(myDwr.engine._postHook);
  var propname, data;
  if (myDwr.engine._headers) {
    for (propname in myDwr.engine._headers) {
      data = myDwr.engine._headers[propname];
      if (typeof data != "function") batch.headers[propname] = data;
    }
  }
  if (myDwr.engine._parameters) {
    for (propname in myDwr.engine._parameters) {
      data = myDwr.engine._parameters[propname];
      if (typeof data != "function") batch.parameters[propname] = data;
    }
  }
  return batch;
}

myDwr.engine._mergeBatch = function (batch, overrides) {
  var propname, data;
  for (var i = 0; i < myDwr.engine._propnames.length; i++) {
    propname = myDwr.engine._propnames[i];
    if (overrides[propname] != null) batch[propname] = overrides[propname];
  }
  if (overrides.preHook != null) batch.preHooks.unshift(overrides.preHook);
  if (overrides.postHook != null) batch.postHooks.push(overrides.postHook);
  if (overrides.headers) {
    for (propname in overrides.headers) {
      data = overrides.headers[propname];
      if (typeof data != "function") batch.headers[propname] = data;
    }
  }
  if (overrides.parameters) {
    for (propname in overrides.parameters) {
      data = overrides.parameters[propname];
      if (typeof data != "function") batch.map["p-" + propname] = "" + data;
    }
  }
};

myDwr.engine._getJSessionId = function () {
  var cookies = document.cookie.split(';');
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    while (cookie.charAt(0) == ' ') cookie = cookie.substring(1, cookie.length);
    if (cookie.indexOf(myDwr.engine._sessionCookieName + "=") == 0) {
      return cookie.substring(11, cookie.length);
    }
  }
  return "";
}

myDwr.engine._checkCometPoll = function () {
  for (var i = 0; i < myDwr.engine._outstandingIFrames.length; i++) {
    var text = "";
    var iframe = myDwr.engine._outstandingIFrames[i];
    try {
      text = myDwr.engine._getTextFromCometIFrame(iframe);
    }
    catch (ex) {
      myDwr.engine._handleWarning(iframe.batch, ex);
    }
    if (text != "") myDwr.engine._processCometResponse(text, iframe.batch);
  }
  if (myDwr.engine._pollReq) {
    var req = myDwr.engine._pollReq;
    var text = req.responseText;
    myDwr.engine._processCometResponse(text, req.batch);
  }

  // If the poll resources are still there, come back again
  if (myDwr.engine._outstandingIFrames.length > 0 || myDwr.engine._pollReq) {
    setTimeout("myDwr.engine._checkCometPoll()", myDwr.engine._pollCometInterval);
  }
};

myDwr.engine._getTextFromCometIFrame = function (frameEle) {
  var body = frameEle.contentWindow.document.body;
  if (body == null) return "";
  var text = body.innerHTML;
  // We need to prevent IE from stripping line feeds
  if (text.indexOf("<PRE>") == 0 || text.indexOf("<pre>") == 0) {
    text = text.substring(5, text.length - 7);
  }
  return text;
};

myDwr.engine._processCometResponse = function (response, batch) {
  if (batch.charsProcessed == response.length) return;
  if (response.length == 0) {
    batch.charsProcessed = 0;
    return;
  }

  var firstStartTag = response.indexOf("//#DWR-START#", batch.charsProcessed);
  if (firstStartTag == -1) {
    // myDwr.engine._debug("No start tag (search from " + batch.charsProcessed + "). skipping '" + response.substring(batch.charsProcessed) + "'");
    batch.charsProcessed = response.length;
    return;
  }
  // if (firstStartTag > 0) {
  //   myDwr.engine._debug("Start tag not at start (search from " + batch.charsProcessed + "). skipping '" + response.substring(batch.charsProcessed, firstStartTag) + "'");
  // }

  var lastEndTag = response.lastIndexOf("//#DWR-END#");
  if (lastEndTag == -1) {
    // myDwr.engine._debug("No end tag. unchanged charsProcessed=" + batch.charsProcessed);
    return;
  }

  // Skip the end tag too for next time, remembering CR and LF
  if (response.charCodeAt(lastEndTag + 11) == 13 && response.charCodeAt(lastEndTag + 12) == 10) {
    batch.charsProcessed = lastEndTag + 13;
  }
  else {
    batch.charsProcessed = lastEndTag + 11;
  }

  var exec = response.substring(firstStartTag + 13, lastEndTag);

  myDwr.engine._receivedBatch = batch;
  myDwr.engine._eval(exec);
  myDwr.engine._receivedBatch = null;
};

myDwr.engine._sendData = function (batch) {
  batch.map.batchId = myDwr.engine._nextBatchId++;
  myDwr.engine._batches[batch.map.batchId] = batch;
  myDwr.engine._batchesLength++;
  batch.completed = false;

  for (var i = 0; i < batch.preHooks.length; i++) {
    batch.preHooks[i]();
  }
  batch.preHooks = null;
  // Set a timeout
  if (batch.timeout && batch.timeout != 0) {
    batch.interval = setInterval(function () {
      myDwr.engine._abortRequest(batch);
    }, batch.timeout);
  }
  // Get setup for XMLHttpRequest if possible
  if (batch.rpcType == myDwr.engine.XMLHttpRequest) {
    if (window.XMLHttpRequest) {
      batch.req = new XMLHttpRequest();
    }
    // IE5 for the mac claims to support window.ActiveXObject, but throws an error when it's used
    else if (window.ActiveXObject && !(navigator.userAgent.indexOf("Mac") >= 0 && navigator.userAgent.indexOf("MSIE") >= 0)) {
      batch.req = myDwr.engine._newActiveXObject(myDwr.engine._XMLHTTP);
    }
  }

  var prop, request;
  if (batch.req) {
    // Proceed using XMLHttpRequest
    if (batch.async) {
      batch.req.onreadystatechange = function () {
        myDwr.engine._stateChange(batch);
      };
    }
    // If we're polling, record this for monitoring
    if (batch.isPoll) {
      myDwr.engine._pollReq = batch.req;
      // In IE XHR is an ActiveX control so you can't augment it like this
      // however batch.isPoll uses IFrame on IE so were safe here
      batch.req.batch = batch;
    }
    // Workaround for Safari 1.x POST bug
    var indexSafari = navigator.userAgent.indexOf("Safari/");
    if (indexSafari >= 0) {
      var version = navigator.userAgent.substring(indexSafari + 7);
      if (parseInt(version, 10) < 400) {
        if (myDwr.engine._allowGetForSafariButMakeForgeryEasier == "true") batch.httpMethod = "GET";
        else myDwr.engine._handleWarning(batch, {
          name: "myDwr.engine.oldSafari",
          message: "Safari GET support disabled. See getahead.org/myDwr/server/servlet and allowGetForSafariButMakeForgeryEasier."
        });
      }
    }
    batch.mode = batch.isPoll ? myDwr.engine._ModePlainPoll : myDwr.engine._ModePlainCall;
    request = myDwr.engine._constructRequest(batch);
    try {
      batch.req.open(batch.httpMethod, request.url, batch.async);
      try {
        for (prop in batch.headers) {
          var value = batch.headers[prop];
          if (typeof value == "string") batch.req.setRequestHeader(prop, value);
        }
        if (!batch.headers["Content-Type"]) batch.req.setRequestHeader("Content-Type", "text/plain");
      }
      catch (ex) {
        myDwr.engine._handleWarning(batch, ex);
      }
      batch.req.send(request.body);
      if (!batch.async) myDwr.engine._stateChange(batch);
    }
    catch (ex) {
      myDwr.engine._handleError(batch, ex);
    }
  }
  else if (batch.rpcType != myDwr.engine.ScriptTag) {
    // Proceed using iframe
    var idname = batch.isPoll ? "myDwr-if-poll-" + batch.map.batchId : "myDwr-if-" + batch.map["c0-id"];
    batch.div = document.createElement("div");
    batch.div.innerHTML = "<iframe src='javascript:void(0)' frameborder='0' style='width:0px;height:0px;border:0;' id='" + idname + "' name='" + idname + "'></iframe>";
    document.body.appendChild(batch.div);
    batch.iframe = document.getElementById(idname);
    batch.iframe.batch = batch;
    batch.mode = batch.isPoll ? myDwr.engine._ModeHtmlPoll : myDwr.engine._ModeHtmlCall;
    if (batch.isPoll) myDwr.engine._outstandingIFrames.push(batch.iframe);
    request = myDwr.engine._constructRequest(batch);
    if (batch.httpMethod == "GET") {
      batch.iframe.setAttribute("src", request.url);
      // document.body.appendChild(batch.iframe);
    }
    else {
      batch.form = document.createElement("form");
      batch.form.setAttribute("id", "myDwr-form");
      batch.form.setAttribute("action", request.url);
      batch.form.setAttribute("target", idname);
      batch.form.target = idname;
      batch.form.setAttribute("method", batch.httpMethod);
      for (prop in batch.map) {
        var value = batch.map[prop];
        if (typeof value != "function") {
          var formInput = document.createElement("input");
          formInput.setAttribute("type", "hidden");
          formInput.setAttribute("name", prop);
          formInput.setAttribute("value", value);
          batch.form.appendChild(formInput);
        }
      }
      document.body.appendChild(batch.form);
      batch.form.submit();
    }
  }
  else {
    batch.httpMethod = "GET"; // There's no such thing as ScriptTag using POST
    batch.mode = batch.isPoll ? myDwr.engine._ModePlainPoll : myDwr.engine._ModePlainCall;
    request = myDwr.engine._constructRequest(batch);
    batch.script = document.createElement("script");
    batch.script.id = "myDwr-st-" + batch.map["c0-id"];
    batch.script.src = request.url;
    document.body.appendChild(batch.script);
  }
};

myDwr.engine._ModePlainCall = "/call/plaincall/";
myDwr.engine._ModeHtmlCall = "/call/htmlcall/";
myDwr.engine._ModePlainPoll = "/call/plainpoll/";
myDwr.engine._ModeHtmlPoll = "/call/htmlpoll/";

myDwr.engine._constructRequest = function (batch) {
  // A quick string to help people that use web log analysers
  var request = {url: batch.path + batch.mode, body: null};
  if (batch.isPoll == true) {
    request.url += "ReverseAjax.myDwr";
  }
  else if (batch.map.callCount == 1) {
    request.url += batch.map["c0-scriptName"] + "." + batch.map["c0-methodName"] + ".myDwr";
  }
  else {
    request.url += "Multiple." + batch.map.callCount + ".myDwr";
  }
  // Play nice with url re-writing
  var sessionMatch = location.href.match(/jsessionid=([^?]+)/);
  if (sessionMatch != null) {
    request.url += ";jsessionid=" + sessionMatch[1];
  }

  var prop;
  if (batch.httpMethod == "GET") {
    // Some browsers (Opera/Safari2) seem to fail to convert the callCount value
    // to a string in the loop below so we do it manually here.
    batch.map.callCount = "" + batch.map.callCount;
    request.url += "?";
    for (prop in batch.map) {
      if (typeof batch.map[prop] != "function") {
        request.url += encodeURIComponent(prop) + "=" + encodeURIComponent(batch.map[prop]) + "&";
      }
    }
    request.url = request.url.substring(0, request.url.length - 1);
  }
  else {
    // PERFORMANCE: for iframe mode this is thrown away.
    request.body = "";
    for (prop in batch.map) {
      if (typeof batch.map[prop] != "function") {
        request.body += prop + "=" + batch.map[prop] + myDwr.engine._postSeperator;
      }
    }
    request.body = myDwr.engine._contentRewriteHandler(request.body);
  }
  request.url = myDwr.engine._urlRewriteHandler(request.url);
  return request;
};

myDwr.engine._stateChange = function (batch) {
  var toEval;

  if (batch.completed) {
    myDwr.engine._debug("Error: _stateChange() with batch.completed");
    return;
  }

  var req = batch.req;
  try {
    if (req.readyState != 4) return;
  }
  catch (ex) {
    myDwr.engine._handleWarning(batch, ex);
    // It's broken - clear up and forget this call
    myDwr.engine._clearUp(batch);
    return;
  }

  try {
    var reply = req.responseText;
    reply = myDwr.engine._replyRewriteHandler(reply);
    var status = req.status; // causes Mozilla to except on page moves

    if (reply == null || reply == "") {
      myDwr.engine._handleWarning(batch, {name: "myDwr.engine.missingData", message: "No data received from server"});
    }
    else if (status != 200) {
      myDwr.engine._handleError(batch, {name: "myDwr.engine.http." + status, message: req.statusText});
    }
    else {
      var contentType = req.getResponseHeader("Content-Type");
      if (!contentType.match(/^text\/plain/) && !contentType.match(/^text\/javascript/)) {
        if (contentType.match(/^text\/html/) && typeof batch.textHtmlHandler == "function") {
          batch.textHtmlHandler();
        }
        else {
          myDwr.engine._handleWarning(batch, {
            name: "myDwr.engine.invalidMimeType",
            message: "Invalid content type: '" + contentType + "'"
          });
        }
      }
      else {
        // Comet replies might have already partially executed
        if (batch.isPoll && batch.map.partialResponse == myDwr.engine._partialResponseYes) {
          myDwr.engine._processCometResponse(reply, batch);
        }
        else {
          if (reply.search("//#DWR") == -1) {
            myDwr.engine._handleWarning(batch, {
              name: "myDwr.engine.invalidReply",
              message: "Invalid reply from server"
            });
          }
          else {
            toEval = reply;
          }
        }
      }
    }
  }
  catch (ex) {
    myDwr.engine._handleWarning(batch, ex);
  }

  myDwr.engine._callPostHooks(batch);

  // Outside of the try/catch so errors propogate normally:
  myDwr.engine._receivedBatch = batch;
  if (toEval != null) toEval = toEval.replace(myDwr.engine._scriptTagProtection, "");
  myDwr.engine._eval(toEval);
  myDwr.engine._receivedBatch = null;

  myDwr.engine._clearUp(batch);
};

myDwr.engine._remoteHandleCallback = function (batchId, callId, reply) {
  var batch = myDwr.engine._batches[batchId];
  if (batch == null) {
    myDwr.engine._debug("Warning: batch == null in remoteHandleCallback for batchId=" + batchId, true);
    return;
  }
  // Error handlers inside here indicate an error that is nothing to do
  // with DWR so we handle them differently.
  try {
    var handlers = batch.handlers[callId];
    if (!handlers) {
      myDwr.engine._debug("Warning: Missing handlers. callId=" + callId, true);
    }
    else if (typeof handlers.callback == "function") handlers.callback(reply);
  }
  catch (ex) {
    myDwr.engine._handleError(batch, ex);
  }
};

myDwr.engine._remoteHandleException = function (batchId, callId, ex) {
  var batch = myDwr.engine._batches[batchId];
  if (batch == null) {
    myDwr.engine._debug("Warning: null batch in remoteHandleException", true);
    return;
  }
  var handlers = batch.handlers[callId];
  if (handlers == null) {
    myDwr.engine._debug("Warning: null handlers in remoteHandleException", true);
    return;
  }
  if (ex.message == undefined) ex.message = "";
  if (typeof handlers.exceptionHandler == "function") handlers.exceptionHandler(ex.message, ex);
  else if (typeof batch.errorHandler == "function") batch.errorHandler(ex.message, ex);
};

myDwr.engine._remoteHandleBatchException = function (ex, batchId) {
  var searchBatch = (myDwr.engine._receivedBatch == null && batchId != null);
  if (searchBatch) {
    myDwr.engine._receivedBatch = myDwr.engine._batches[batchId];
  }
  if (ex.message == undefined) ex.message = "";
  myDwr.engine._handleError(myDwr.engine._receivedBatch, ex);
  if (searchBatch) {
    myDwr.engine._receivedBatch = null;
    myDwr.engine._clearUp(myDwr.engine._batches[batchId]);
  }
};

myDwr.engine._remotePollCometDisabled = function (ex, batchId) {
  myDwr.engine.setActiveReverseAjax(false);
  var searchBatch = (myDwr.engine._receivedBatch == null && batchId != null);
  if (searchBatch) {
    myDwr.engine._receivedBatch = myDwr.engine._batches[batchId];
  }
  if (ex.message == undefined) ex.message = "";
  myDwr.engine._handleError(myDwr.engine._receivedBatch, ex);
  if (searchBatch) {
    myDwr.engine._receivedBatch = null;
    myDwr.engine._clearUp(myDwr.engine._batches[batchId]);
  }
};

myDwr.engine._remoteBeginIFrameResponse = function (iframe, batchId) {
  if (iframe != null) myDwr.engine._receivedBatch = iframe.batch;
  myDwr.engine._callPostHooks(myDwr.engine._receivedBatch);
};

myDwr.engine._remoteEndIFrameResponse = function (batchId) {
  myDwr.engine._clearUp(myDwr.engine._receivedBatch);
  myDwr.engine._receivedBatch = null;
};

myDwr.engine._eval = function (script) {
  if (script == null) return null;
  if (script == "") {
    myDwr.engine._debug("Warning: blank script", true);
    return null;
  }
  // myDwr.engine._debug("Exec: [" + script + "]", true);
  return eval(script.replace('dwr', 'myDwr'));
};

myDwr.engine._abortRequest = function (batch) {
  if (batch && !batch.completed) {
    clearInterval(batch.interval);
    myDwr.engine._clearUp(batch);
    if (batch.req) batch.req.abort();
    myDwr.engine._handleError(batch, {name: "myDwr.engine.timeout", message: "Timeout"});
  }
};

myDwr.engine._callPostHooks = function (batch) {
  if (batch.postHooks) {
    for (var i = 0; i < batch.postHooks.length; i++) {
      batch.postHooks[i]();
    }
    batch.postHooks = null;
  }
}

myDwr.engine._clearUp = function (batch) {
  if (!batch) {
    myDwr.engine._debug("Warning: null batch in myDwr.engine._clearUp()", true);
    return;
  }
  if (batch.completed == "true") {
    myDwr.engine._debug("Warning: Double complete", true);
    return;
  }

  // IFrame tidyup
  if (batch.div) batch.div.parentNode.removeChild(batch.div);
  if (batch.iframe) {
    // If this is a poll frame then stop comet polling
    for (var i = 0; i < myDwr.engine._outstandingIFrames.length; i++) {
      if (myDwr.engine._outstandingIFrames[i] == batch.iframe) {
        myDwr.engine._outstandingIFrames.splice(i, 1);
      }
    }
    batch.iframe.parentNode.removeChild(batch.iframe);
  }
  if (batch.form) batch.form.parentNode.removeChild(batch.form);

  // XHR tidyup: avoid IE handles increase
  if (batch.req) {
    // If this is a poll frame then stop comet polling
    if (batch.req == myDwr.engine._pollReq) myDwr.engine._pollReq = null;
    delete batch.req;
  }

  if (batch.map && batch.map.batchId) {
    delete myDwr.engine._batches[batch.map.batchId];
    myDwr.engine._batchesLength--;
  }

  batch.completed = true;

  // If there is anything on the queue waiting to go out, then send it.
  // We don't need to check for ordered mode, here because when ordered mode
  // gets turned off, we still process *waiting* batches in an ordered way.
  if (myDwr.engine._batchQueue.length != 0) {
    var sendbatch = myDwr.engine._batchQueue.shift();
    myDwr.engine._sendData(sendbatch);
  }
};

myDwr.engine._handleError = function (batch, ex) {
  if (typeof ex == "string") ex = {name: "unknown", message: ex};
  if (ex.message == null) ex.message = "";
  if (ex.name == null) ex.name = "unknown";
  if (batch && typeof batch.errorHandler == "function") batch.errorHandler(ex.message, ex);
  else if (myDwr.engine._errorHandler) myDwr.engine._errorHandler(ex.message, ex);
  myDwr.engine._clearUp(batch);
};

myDwr.engine._handleWarning = function (batch, ex) {
  if (typeof ex == "string") ex = {name: "unknown", message: ex};
  if (ex.message == null) ex.message = "";
  if (ex.name == null) ex.name = "unknown";
  if (batch && typeof batch.warningHandler == "function") batch.warningHandler(ex.message, ex);
  else if (myDwr.engine._warningHandler) myDwr.engine._warningHandler(ex.message, ex);
  myDwr.engine._clearUp(batch);
};

myDwr.engine._serializeAll = function (batch, referto, data, name) {
  if (data == null) {
    batch.map[name] = "null:null";
    return;
  }

  switch (typeof data) {
    case "boolean":
      batch.map[name] = "boolean:" + data;
      break;
    case "number":
      batch.map[name] = "number:" + data;
      break;
    case "string":
      batch.map[name] = "string:" + encodeURIComponent(data);
      break;
    case "object":
      if (data instanceof String) batch.map[name] = "String:" + encodeURIComponent(data);
      else if (data instanceof Boolean) batch.map[name] = "Boolean:" + data;
      else if (data instanceof Number) batch.map[name] = "Number:" + data;
      else if (data instanceof Date) batch.map[name] = "Date:" + data.getTime();
      else if (data && data.join) batch.map[name] = myDwr.engine._serializeArray(batch, referto, data, name);
      else batch.map[name] = myDwr.engine._serializeObject(batch, referto, data, name);
      break;
    case "function":
      // We just ignore functions.
      break;
    default:
      myDwr.engine._handleWarning(null, {
        name: "myDwr.engine.unexpectedType",
        message: "Unexpected type: " + typeof data + ", attempting default converter."
      });
      batch.map[name] = "default:" + data;
      break;
  }
};

myDwr.engine._lookup = function (referto, data, name) {
  var lookup;
  // Can't use a map: getahead.org/ajax/javascript-gotchas
  for (var i = 0; i < referto.length; i++) {
    if (referto[i].data == data) {
      lookup = referto[i];
      break;
    }
  }
  if (lookup) return "reference:" + lookup.name;
  referto.push({data: data, name: name});
  return null;
};

myDwr.engine._serializeObject = function (batch, referto, data, name) {
  var ref = myDwr.engine._lookup(referto, data, name);
  if (ref) return ref;

  // This check for an HTML is not complete, but is there a better way?
  // Maybe we should add: data.hasChildNodes typeof "function" == true
  if (data.nodeName && data.nodeType) {
    return myDwr.engine._serializeXml(batch, referto, data, name);
  }

  // treat objects as an associative arrays
  var reply = "Object_" + myDwr.engine._getObjectClassName(data) + ":{";
  var element;
  for (element in data) {
    if (typeof data[element] != "function") {
      batch.paramCount++;
      var childName = "c" + myDwr.engine._batch.map.callCount + "-e" + batch.paramCount;
      myDwr.engine._serializeAll(batch, referto, data[element], childName);

      reply += encodeURIComponent(element) + ":reference:" + childName + ", ";
    }
  }

  if (reply.substring(reply.length - 2) == ", ") {
    reply = reply.substring(0, reply.length - 2);
  }
  reply += "}";

  return reply;
};

myDwr.engine._errorClasses = {
  "Error": Error,
  "EvalError": EvalError,
  "RangeError": RangeError,
  "ReferenceError": ReferenceError,
  "SyntaxError": SyntaxError,
  "TypeError": TypeError,
  "URIError": URIError
};

myDwr.engine._getObjectClassName = function (obj) {
  // Try to find the classname by stringifying the object's constructor
  // and extract <class> from "function <class>".
  if (obj && obj.constructor && obj.constructor.toString) {
    var str = obj.constructor.toString();
    var regexpmatch = str.match(/function\s+(\w+)/);
    if (regexpmatch && regexpmatch.length == 2) {
      return regexpmatch[1];
    }
  }

  // Now manually test against the core Error classes, as these in some
  // browsers successfully match to the wrong class in the
  // Object.toString() test we will do later
  if (obj && obj.constructor) {
    for (var errorname in myDwr.engine._errorClasses) {
      if (obj.constructor == myDwr.engine._errorClasses[errorname]) return errorname;
    }
  }

  // Try to find the classname by calling Object.toString() on the object
  // and extracting <class> from "[object <class>]"
  if (obj) {
    var str = Object.prototype.toString.call(obj);
    var regexpmatch = str.match(/\[object\s+(\w+)/);
    if (regexpmatch && regexpmatch.length == 2) {
      return regexpmatch[1];
    }
  }

  // Supplied argument was probably not an object, but what is better?
  return "Object";
};

myDwr.engine._serializeXml = function (batch, referto, data, name) {
  var ref = myDwr.engine._lookup(referto, data, name);
  if (ref) return ref;

  var output;
  if (window.XMLSerializer) output = new XMLSerializer().serializeToString(data);
  else if (data.toXml) output = data.toXml;
  else output = data.innerHTML;

  return "XML:" + encodeURIComponent(output);
};

myDwr.engine._serializeArray = function (batch, referto, data, name) {
  var ref = myDwr.engine._lookup(referto, data, name);
  if (ref) return ref;

  var reply = "Array:[";
  for (var i = 0; i < data.length; i++) {
    if (i != 0) reply += ",";
    batch.paramCount++;
    var childName = "c" + myDwr.engine._batch.map.callCount + "-e" + batch.paramCount;
    myDwr.engine._serializeAll(batch, referto, data[i], childName);
    reply += "reference:";
    reply += childName;
  }
  reply += "]";

  return reply;
};

myDwr.engine._unserializeDocument = function (xml) {
  var dom;
  if (window.DOMParser) {
    var parser = new DOMParser();
    dom = parser.parseFromString(xml, "text/xml");
    if (!dom.documentElement || dom.documentElement.tagName == "parsererror") {
      var message = dom.documentElement.firstChild.data;
      message += "\n" + dom.documentElement.firstChild.nextSibling.firstChild.data;
      throw message;
    }
    return dom;
  }
  else if (window.ActiveXObject) {
    dom = myDwr.engine._newActiveXObject(myDwr.engine._DOMDocument);
    dom.loadXML(xml); // What happens on parse fail with IE?
    return dom;
  }
  else {
    var div = document.createElement("div");
    div.innerHTML = xml;
    return div;
  }
};

myDwr.engine._newActiveXObject = function (axarray) {
  var returnValue;
  for (var i = 0; i < axarray.length; i++) {
    try {
      returnValue = new ActiveXObject(axarray[i]);
      break;
    }
    catch (ex) { /* ignore */
    }
  }
  return returnValue;
};

myDwr.engine._debug = function (message, stacktrace) {
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
  catch (ex) { /* ignore */
  }

  if (!written) {
    var debug = document.getElementById("myDwr-debug");
    if (debug) {
      var contents = message + "<br/>" + debug.innerHTML;
      if (contents.length > 2048) contents = contents.substring(0, 2048);
      debug.innerHTML = contents;
    }
  }
};