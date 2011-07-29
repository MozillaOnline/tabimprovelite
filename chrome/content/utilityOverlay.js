(function _utilityOverlayExt() {
  if (!("whereToOpenLink" in window))
    return;

  TU_hookCode("whereToOpenLink", "{", function() {
    var target;
    switch (arguments.callee.caller && arguments.callee.caller.name) {
      case "PU_openNodeWithEvent":
      case "PUIU_openNodeWithEvent":
      case "PU__openTabset":
      case "PUIU__openTabset":
        target = "bookmarks";break;
      case "BrowserGoHome":
        target = "homepage";break;
      case "handleLinkClick":
        target = "links";break;
      default:
        for (var node = e && e.originalTarget; node && !target; node = node.parentNode) {
          switch (node.id) {
            case "bookmarksMenuPopup":
            case "goPopup":
            case "ybookmarks_menu_popup":
            case "personal-bookmarks":
            case "ybToolbar-toolbar":
            case "bookmarksPanel":
            case "history-panel":
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
        break;
      case "homepage":
        openInTab = TU_getPref("extensions.ntabimprovelite.openHomepageInTab", false);
        break;
      case "urlbar":
        openInTab = (TU_getPref("extensions.ntabimprovelite.locationInputPref", 2)!=1);
        loadInBackground = (TU_getPref("extensions.ntabimprovelite.locationInputPref", 2)==3);
        break;
      case "searchbar":
        openInTab = (TU_getPref("extensions.ntabimprovelite.searchInputPref", 2)!=1);
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
    [/.*loadOneTab.*/, function(s) s.replace("loadInBackground", "where == 'background' ? true : where == 'foreground' ? false : loadInBackground")]
  );
})();

(function _PlacesUtilsExt() {
  if (!("PlacesUIUtils" in window))
    return;

  ["openNodeWithEvent", "openNodeIn", "_openTabset"].forEach(function(name) {
    if (!PlacesUIUtils["_" + name]) {
      PlacesUIUtils["_" + name] = PlacesUIUtils[name];
      PlacesUIUtils.__defineGetter__(name, function() {
        return ("_getTopBrowserWin" in this ? this._getTopBrowserWin() : window)[name] || this["_" + name];
      });
      PlacesUIUtils.__defineSetter__(name, function(val) {
        return "_getTopBrowserWin" in this ? this._getTopBrowserWin()[name] = val : window[name] = val;
      });
    }
    if (!window[name]) {
      window[name] = PlacesUIUtils["_" + name];
    }
  });

  //侧边栏书签
  TU_hookCode("openNodeWithEvent", /openNodeIn\((.*)\)/, function(s, s1) s.replace(s1, (s1 = s1.split(","), s1.push("aEvent"), s1.join())));
  TU_hookCode("openNodeIn", 'aWhere == "current"', '(arguments.length > 2 ? !arguments[2] || !arguments[2].button && !arguments[2].ctrlKey && !arguments[2].altKey && !arguments.shiftKey && !arguments[2].metaKey : $&)');

  //书签组
  TU_hookCode("_openTabset",
    ['where == "tab" ? false : true', 'where == "current"'],
    ['where == "tabshifted" ? true : false', 'where == "tabshifted" ^ browserWindow.TU_getPref("browser.tabs.loadBookmarksInBackground")']
  );
})();