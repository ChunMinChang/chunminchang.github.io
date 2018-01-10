'use strict';

(function(aExports) {
  aExports.ready = function(aHandler) {
    var handled = false;
    function wrapper() {
      if (!handled) {
        handled = true;
        document.removeEventListener('DOMContentLoaded', wrapper);
        document.removeEventListener('load', wrapper);
        aHandler();
      }
    }
    document.addEventListener('DOMContentLoaded', wrapper);
    document.addEventListener('load', wrapper);
  };

  // aExports.debug = function(prefix, aMessage) {
  //   console.log('[' + prefix + '] ' + aMessage);
  // }
}(window));
