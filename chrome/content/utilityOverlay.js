/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * This Source Code Form is “Incompatible With
 * Secondary Licenses”, as defined by the Mozilla
 * Public License, v. 2.0. */

(function _utilityOverlayExt() {
  if (!("whereToOpenLink" in window))
    return;

  TU_hookCode("whereToOpenLink", "{", function() {
    var target;
    switch (arguments.callee.caller && arguments.callee.caller.name) {
      case "PU_openNodeWithEvent":  //Fx 3.6
      case "PU__openTabset":
      case "PUIU_openNodeWithEvent":  //Fx 4.0
      case "PUIU__openTabset":
        target = "bookmarks";break;
      case "BrowserGoHome":
        target = "homepage";break;
      case "handleLinkClick": //Fx 4.0
        target = "links";break;
      default:
        for (var node = e && e.originalTarget; node && !target; node = node.parentNode) {
          switch (node.id) {
            case "bookmarksMenuPopup":
            case "goPopup":
            case "appmenu_bookmarksPopup":  //Fx 4.0
            case "appmenu_historyMenupopup":
            case "pof-main-menupopup": //Plain Old Favorites
            case "ybookmarks_menu_popup": //Delicious Bookmarks
            case "personal-bookmarks":
            case "ybToolbar-toolbar":
            case "bookmarksPanel":
            case "history-panel":
            case "bookmarks-menu-button": //Fx 4.0
            case "historymenu_history": //History Button
            case "ybSidebarPanel":
              target = "bookmarks";break;
            case "home-button":
              target = "homepage";break;
            case "page-proxy-stack":
            case "go-button":
            case "urlbar-go-button":
            case "PopupAutoCompleteRichResult":
              target = "urlbar";break;
            case "searchbar":
            case "PopupAutoComplete":
              target = "searchbar";break;
          }
        }
    }

    var openInTab, loadInBackground;
    switch (target) {
      case "bookmarks":
        openInTab = (TU_getPref("extensions.ntabimprovelite.clickMarkAndHistoryPref", 2)!=1);
        loadInBackground = (TU_getPref("extensions.ntabimprovelite.clickMarkAndHistoryPref", 2)==3);
        break;
      case "homepage":
        openInTab = TU_getPref("extensions.ntabimprovelite.openHomepageInTab", false);
        break;
      case "urlbar":
        openInTab = (TU_getPref("extensions.ntabimprovelite.locationInputPref", 2)!=1);
        loadInBackground = (TU_getPref("extensions.ntabimprovelite.locationInputPref", 2)==3);
        break;
      case "searchbar":
        openInTab = TU_getPref("browser.search.openintab");
        loadInBackground = (TU_getPref("extensions.ntabimprovelite.searchInputPref", 2)==3);
        break;
    }
  });

  TU_hookCode("whereToOpenLink",
    [/"current"/g, 'openInTab ? "tab" : "current"'],
    [/"tab"/g, 'loadInBackground == null ? "tab" : loadInBackground ? "background" : "foreground"'],
    [/"tabshifted"/g, 'loadInBackground == null ? "tabshifted" : loadInBackground ? "foreground" : "background"'],
    [/(?=if \(ctrl)/, function() {
      if (openInTab && ctrl)
        return "current";
    }],
    [/if \(shift|shift \?/, function(s) s.replace('shift', '$& ^ (middle && target != "links")')]
  );

  TU_hookCode("openLinkIn" in window ? "openLinkIn" : "openUILinkIn",
    [/(?=if \(where == "save"\))/, function() { //Bookmarklet
      if (url.substr(0, 11) == "javascript:")
        where = "current";
    }],
    [/where == "tab".*\n?.*where == "tabshifted"/, '$& || where == "background" || where == "foreground"'],
    [/(?=case "tab")/, "case 'background':"],
    [/(?=case "tab")/, "case 'foreground':"],
    [/inBackground:\sloadInBackground/, function(s) s.replace("loadInBackground", "where == 'background' ? true : where == 'foreground' ? false : loadInBackground")]
  );
})();

(function _PlacesUtilsExt() {
  if (!("PlacesUIUtils" in window))
    return;

  ["openNodeWithEvent", "openNodeIn", "_openNodeIn", "_openTabset"].forEach(function(name) {
    if (!PlacesUIUtils["TI_" + name]) {
      PlacesUIUtils["TI_" + name] = PlacesUIUtils[name];
      PlacesUIUtils.__defineGetter__(name, function() {
        return ("_getTopBrowserWin" in this ? this._getTopBrowserWin() : window)["TI_" + name] || this["TI_" + name];
      });
      PlacesUIUtils.__defineSetter__(name, function(val) {
        return "_getTopBrowserWin" in this ? this._getTopBrowserWin()["TI_" + name] = val : window["TI_" + name] = val;
      });
    }

    if (!window["TI_" + name]) {
      window["TI_" + name] = PlacesUIUtils["TI_" + name];
    }
  });

  // 侧边栏书签
  TU_hookCode("TI_openNodeWithEvent", /openNodeIn\((.*)\)/, function(s, s1) s.replace(s1, (s1 = s1.split(","), s1.push("aEvent || {}"), s1.join())));
  TU_hookCode(TI__openNodeIn ? "TI__openNodeIn" : "TI_openNodeIn",
    ["{", "var aEvent = arguments[arguments.callee.length];"],
    ['aWhere == "current"', '(aEvent ? !aEvent.button && !aEvent.ctrlKey && !aEvent.altKey && !aEvent.shiftKey && !aEvent.metaKey : $&)']
  );

  // 书签组
  TU_hookCode("TI__openTabset",
    ['where == "tab" ? false : true', 'where == "current"'],
    ['where == "tabshifted" ? true : false', 'where == "tabshifted" ^ browserWindow.TU_getPref("browser.tabs.loadBookmarksInBackground")']
  );
})();

