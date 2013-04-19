/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * This Source Code Form is “Incompatible With
 * Secondary Licenses”, as defined by the Mozilla
 * Public License, v. 2.0. */

(function() {
  if (!("gPrefService" in window)) {
    __defineGetter__("gPrefService", function() {
      delete this.gPrefService;
      return gPrefService =  Components.classes["@mozilla.org/preferences-service;1"]
                                       .getService(Components.interfaces.nsIPrefService)
                                       .QueryInterface(Components.interfaces.nsIPrefBranch2);
    });
  }

  var closeTabByClick = {
    get to_be_closed() {
      return getBrowser().mTabContainer.childNodes.length > 1;
    },

    dblclicked: function(event) { // double click handler
      if (event.button != 0)
        return;

      if (!gPrefService.getBoolPref("extensions.ntabimprovelite.closeLastTabPref")&&!closeTabByClick.to_be_closed)
        return;

      if (gPrefService.getBoolPref("extensions.ntabimprovelite.doubleClickPref")) {
        var tab = document.evaluate(
                  'ancestor-or-self::*[local-name()="tab"]',
                   event.originalTarget,
                   null,
                   XPathResult.FIRST_ORDERED_NODE_TYPE,
                   null
                 ).singleNodeValue;
        if (tab)
          gBrowser.removeTab(tab);
      }
    },

    midclicked: function(event) { // middle click handler
      if (event.button == 1) {  // Middle click
        if (event.target.tagName != "tab")
          return;

        event.preventDefault();
        event.stopPropagation();

        if (!gPrefService.getBoolPref("extensions.ntabimprovelite.closeLastTabPref") && !closeTabByClick.to_be_closed)
          return;

        if (gPrefService.getBoolPref("extensions.ntabimprovelite.middleClickPref")) {
          var tab = document.evaluate(
              'ancestor-or-self::*[local-name()="tab"]',
              event.originalTarget,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null
                  ).singleNodeValue;
          if (tab)
            gBrowser.removeTab(tab);
        }
      }
    },

    rightclicked: function(event) { // right click handler
      if (event.button == 2 && event.detail == 1) {  // Right click
        if (!gPrefService.getBoolPref("extensions.ntabimprovelite.closeLastTabPref") && !closeTabByClick.to_be_closed) return;
        if (gPrefService.getBoolPref("extensions.ntabimprovelite.rightClickPref")) {
          var tab = document.evaluate(
                     'ancestor-or-self::*[local-name()="tab"]',
                      event.originalTarget,
                      null,
                      XPathResult.FIRST_ORDERED_NODE_TYPE,
                      null
                    ).singleNodeValue;
          if (tab) {
            document.getElementById("contentAreaContextMenu").hidePopup();
            event.preventDefault();
            event.stopPropagation();
            gBrowser.removeTab(tab);
          }
        }
      }
    }
  };

  window.addEventListener("load", function() {
    window.setTimeout(function() {
      gBrowser.tabContainer.addEventListener('dblclick', closeTabByClick.dblclicked, false);
      gBrowser.tabContainer.addEventListener('click', closeTabByClick.midclicked, true);
      gBrowser.tabContainer.addEventListener('click', closeTabByClick.rightclicked, false);
    }, 10);
  }, false);
})();

