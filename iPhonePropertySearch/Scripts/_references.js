/// <reference path="require.js" />

(function () {
  var DEBUG = 3, WARN = 2, ERROR = 1, NONE = 0;

  var logLevel = DEBUG;

  function log(level) {
    var msg = Array.prototype.slice.call(arguments, 1);
    if (logLevel >= level) {
      msg.splice(0, 0, level == DEBUG ? 'DEBUG' : level == WARN ? 'WARN' : level == ERROR ? 'ERROR' : 'UNKNOWN');
      intellisense.logMessage(msg.join(':'));
    }
  }

  log(DEBUG, "Re-read _references.js ");

  function hashCode() {
    var hash = 0;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
      char = this.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  //Redirect errors to intellisense log
  requirejs.onError = function (e) {
    log(ERROR, e.toString());
  };

  var originalDefine = define;
  var lastDefine;
  var currentDocumentId = "_@ROOT";
  define = function (name, deps, callback) {
    //Disallow anonymous modules - unfortunately we can't handle them
    //without turning everything to guesswork.
    if (typeof name !== 'string') {
      log(ERROR, "Intellisense not supported for anonymous modules");
    }
    //Make use of the fact that VS seemingly invokes the current document
    //code twice. On the second call, rename the module to ensure this 
    //specific code will be evaluated and then require it to evaluate it.
    if (lastDefine === name) {
      log(DEBUG, "Define current document");
      originalDefine(currentDocumentId, deps, callback);
      log(DEBUG, "Require current document");
      require([currentDocumentId], function () {
        //This log message never gets printed as VS stops execution of
        //the current document once it hits the node at which auto-
        //completion has being invoked.
        log(DEBUG, "Loaded current document and all dependencies");
      });
    } else {
      log(DEBUG, "Define module", name);
      originalDefine(name, deps, callback);
    }
    lastDefine = name;
  };
}());