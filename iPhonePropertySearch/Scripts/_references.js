(function () {
  var DEBUG = 3, WARN = 2, ERROR = 1, NONE = 0;

  intellisense.requirejsLogLevel = DEBUG;

  if (intellisense.requirejsLogLevel >= DEBUG) {
    intellisense.logMessage("Re-read _references.js ");
  }

  function log(level) {
    var msg = Array.prototype.slice.call(arguments, 1);
    if (intellisense.requirejsLogLevel >= level) {
      msg.splice(0, 0, level == DEBUG ? 'DEBUG' : level == WARN ? 'WARN' : level == ERROR ? 'ERROR' : 'UNKNOWN');
      intellisense.logMessage(msg.join(':'));
    }
  }
  
  function hashCode() {
    var hash = 0;
    if (this.length == 0) return hash;
    for (i = 0; i < this.length; i++) {
      char = this.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  // the list of module functions in the order visual studio has called them
  // this should match the order we require them but if the code has been 
  // modified then it can be wrong
  var modules = [];

  var references = [];
  var referencesByLevel = [];

  var commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
    cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g;

  function noop() {
  }

  function loadScript(url) {
    var tag = document.createElement("script");
    tag.src = url + ".js";
    if (intellisense.requirejsLogLevel >= DEBUG) {
      intellisense.logMessage("loadScript:" + tag.src);
    }
    document.getElementsByTagName("head")[0].appendChild(tag);
  }


  function processModule(levelReferences, callback) {
    callback.toString()
            .replace(commentRegExp, '')
            .replace(cjsRequireRegExp, function (match, dep) {
              if (references.indexOf(dep) === -1) {
                references.push(dep);
                levelReferences.push(dep);
              }
            });
  }

  window.define = function (module) {
    log(DEBUG, "define", modules.length, hashCode(module.toString()));

    // a decent test for the end of the scripts seems to be a duplicate script
    // sadly equality doesn't cut it, so string compare
    if (modules[modules.length - 1] + "" != module + "") {
      modules.push(module);
      return;
    }

    // remove the root, it should not be considered a module (we still have a reference to it)
    modules.pop();

    log(DEBUG, "define", "process", modules.length);
    var level = 0;
    var levelReferences = referencesByLevel[level] = [];
    processModule(levelReferences, module);
    var index = 0;
    while (levelReferences.length) {
      levelReferences = referencesByLevel[++level] = [];
      log(DEBUG, "define", "process", "level", level);
      if (index >= modules.length) {
        log(WARN, "define", "process", "break", level, index, modules.length);
        break;
      }
      for (var i = 0; i < referencesByLevel[level - 1].length; i++) {
        log(DEBUG, "define", "process", "module", index);
        if (index >= modules.length) {
          // this should never happen when the correct modules are loaded, it should be caught by the break guard above
          log(ERROR, "define", "process", "mismatch", level, index, modules.length);
          return;
        }
        processModule(levelReferences, modules[index++]);
      }
    }

    if (references.length !== modules.length) {
      log(WARN, "define", "mismatch", references.length, modules.length);
      references.forEach(loadScript);
      // there's no point continuing, the modules will very likely be mismatched
      //return;
    } else {
      if (intellisense.requirejsLogLevel >= DEBUG) {
        references.forEach(function (ref, i) {
          log(DEBUG, i, ref, modules[i]);
        });
      }
    }

    log(DEBUG, "define", "evaluate");
    module(function require(ref) {
      var idx = references.indexOf(ref);
      log(DEBUG, "define", "evaluate", ref ,idx);
      var module = modules[idx];
      return module ? modules[idx](require) : undefinedWithCompletionsOf(null);
    });
  };

}());