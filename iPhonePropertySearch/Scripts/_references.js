intellisense.logMessage("Re-read _references.js ");

(function () {
  
  intellisense.logMessage(print(intellisense, 2, 0));
  // the list of module functions in the order visual studio has called them
  // this should match the order we require them but if the code has been 
  // modified then it can be wrong
  var modules = [];

  // a lookup of module reference to the index in the modules array. However,
  // this is derrived from the order the require's indicate they
  // should have been included in which isn't necessarily accurate
  var references = {};
  var referenceCount = 0;

  var root = true;

  function loadScript(url, onload) {
    var tag = document.createElement("script");
    tag.src = url;
    document.getElementsByTagName("head")[0].appendChild(tag);
  }

  function noop() {
  }

  function defineNode() {
    root = false;
    define.apply(null, arguments);
    root = true;
  }

  function define(arg) {
    if (typeof arg === 'function') {
      intellisense.logMessage("define:function:" + arg);

      // async function definition, save for later ...
      modules.push(arg);
      // ... and evaluate it to discover requires
      arg(define);

      return null;
    }
    if (typeof arg === 'string') {
      intellisense.logMessage("define:string:" + arg);

      var idx = references[arg];
      if (idx === undefined) {
        // haven't yet encountered this reference
        idx = references[arg] = referenceCount++;
        intellisense.logMessage("define:string:unknown:" + arg);
      }

      // always load the reference, we have no way of knowing if this is 
      // the first past i.e. no deps loaded or not. which obv. screws the 
      // loading order
      intellisense.logMessage("define:string:loadScript:[" + idx + "]" + arg);
      loadScript(arg + ".js");

      if (modules.length > 1 && modules[idx]) {
        // if we've loaded more than just the root module AND
        // the module is loaded, return it
        intellisense.logMessage("define:string:module:[" + idx + "]" + arg);
        return modules[idx](noop);
      }
    }
  }

  window.define = define;

}());