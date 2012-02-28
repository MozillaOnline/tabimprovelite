var ntabimprovelite = {
  onMenuItemCommand: function(e) {
	var features = "chrome,titlebar,toolbar,centerscreen,dialog=yes";
	window.openDialog("chrome://ntabimprovelite/content/preferences.xul", "Preferences", features);
  },
  
  init: function() {
    gBrowser = gBrowser || getBrowser();  //Compatibility with Firefox 3.0

    this._tabEventListeners.init();
    this._openUILinkInTab();
    this._openLinkInTab();
    this._tabOpeningOptions();
    this._tabClosingOptions();
  },

  get _eTLDService() {
    delete this._eTLDService;
    return this._eTLDService = Cc["@mozilla.org/network/effective-tld-service;1"].getService(Ci.nsIEffectiveTLDService);
  },

  getDomainFromURI: function(aURI) {
    try {
      return this._eTLDService.getBaseDomain(aURI);
    }
    catch (e) {}

    try {
      return aURI.host;
    }
    catch (e) {}
  },

  handleEvent: function(event) {
    window.removeEventListener(event.type, this, false);
    switch (event.type) {
      case "DOMContentLoaded": this.init();break;
    }
  }
};
window.addEventListener("DOMContentLoaded", ntabimprovelite, false);

ntabimprovelite._tabEventListeners = {
  init: function() {
    TU_hookCode("gBrowser.addTab",
      ["{", "if (!aURI) aURI = 'about:blank';"],
      [/(?=.*dispatchEvent.*)/, function() {
        t.arguments = {
          aURI: aURI,
          aReferrerURI: aReferrerURI,
          aRelatedToCurrent: aRelatedToCurrent,
          caller: Components.stack.caller && Components.stack.caller.name //arguments.callee.caller && arguments.callee.caller.name
        };
      }]
    );

    gBrowser.onTabOpen = function onTabOpen(event) {
      var tab = event.target;
    };

    gBrowser.onTabMove = function onTabMove(event) {var tab = event.target;};
    gBrowser.onTabClose = function onTabClose(event) {var tab = event.target;};
    gBrowser.onTabSelect = function onTabSelect(event) {var tab = event.target;};
    gBrowser.onTabRestoring = function onTabRestoring(event) {var tab = event.target, ss = ntabimprovelite._ss;};
    gBrowser.onTabRestored = function onTabRestored(event) {var tab = event.target, ss = ntabimprovelite._ss;};
    gBrowser.onTabClosing = function onTabClosing(event) {var tab = event.target, ss = ntabimprovelite._ss;};

    [
      "TabOpen", "TabMove", "TabClose", "TabSelect",
      "SSTabRestoring", "SSTabRestored", "SSTabClosing"
    ].forEach(function(aEvent) {
      gBrowser.mTabContainer.addEventListener(aEvent, this, false);
    }, this);
    window.addEventListener("unload", this, false);
  },

  uninit: function() {
    [
      "TabOpen", "TabMove", "TabClose", "TabSelect",
      "SSTabRestoring", "SSTabRestored", "SSTabClosing"
    ].forEach(function(aEvent) {
      gBrowser.mTabContainer.removeEventListener(aEvent, this, false);
    }, this);
    window.removeEventListener("unload", this, false);
  },

  handleEvent: function(event) {
    switch (event.type) {
      case "load": this.init();break;
      case "unload": this.uninit();break;
      case "TabOpen": gBrowser.onTabOpen(event);break;
      case "TabMove": gBrowser.onTabMove(event);break;
      case "TabClose": gBrowser.onTabClose(event);break;
      case "TabSelect": gBrowser.onTabSelect(event);break;
      case "SSTabRestoring": gBrowser.onTabRestoring(event);break;
      case "SSTabRestored": gBrowser.onTabRestored(event);break;
      case "SSTabClosing": gBrowser.onTabClosing(event);break;
    }
  }
};

ntabimprovelite._openUILinkInTab = function() {
/*
  //主页
  TU_hookCode("BrowserGoHome", "browser.tabs.loadBookmarksInBackground", "extensions.ntabimprovelite.loadHomepageInBackground");
  BrowserHome = BrowserGoHome;
*/
  //地址栏回车键
  TU_hookCode("gURLBar.handleCommand",
    [/((aTriggeringEvent)\s*&&\s*(aTriggeringEvent.altKey))(?![\s\S]*\1)/, "let (newTabPref = (TU_getPref('extensions.ntabimprovelite.locationInputPref', 2)!=1)) ($1 || newTabPref) && !(($2 ? $3 : false) && newTabPref)"],
    [/(?=\n.*openUILink\b[\s\S]*?([^{}]*)\n.*loadOneTab.*)/, "$1"], //Fx 3.6
    [/(.*openUILink.*)[\s\S]*\n(.*loadOneTab.*)[\s\S]*\n(.*(loadURI|loadCurrent).*)/, function(s, s1, s2, s3) {
      s1 = s1.replace(/openUILink\b/, "openUILinkIn")
             .replace("aTriggeringEvent, false, false", "where")
             .replace(/postData(?=\))/, "$&, null, {event: aTriggeringEvent || {}}"); //Fx 3.6
      return s.replace(s1, s1 = s1.replace("postData: postData", "$&, event: aTriggeringEvent || {}")) //Fx 4.0+
              .replace(s2, s1.replace("where", "(TU_getPref('extensions.ntabimprovelite.locationInputPref', 2)==3)  ? 'background' : 'foreground'"))
              .replace(s3, s1.replace("where", "'current'"));
    }],
    ["openUILinkIn(url, where, params);", function(s) s.replace("params", "{allowThirdPartyFixup: true, postData: postData, event: aTriggeringEvent || {}, inBackground: (TU_getPref('extensions.ntabimprovelite.locationInputPref', 2)==3)}")], //Fx 10.0+
    ["loadCurrent();", "openUILinkIn(url, 'current', {allowThirdPartyFixup: true, postData: postData});", "g"], //Fx 10.0+
    [/.*loadURIWithFlags.*(?=[\s\S]*(.*openUILinkIn.*))/, "$1"], //Fx 6.0+
    ["aTriggeringEvent.preventDefault();", ""],
    ["aTriggeringEvent.stopPropagation();", ""]
  );
  //搜索栏回车键
  if (BrowserSearch.searchBar)
  TU_hookCode("BrowserSearch.searchBar.handleSearchCommand",
    [/(\(aEvent && aEvent.altKey\)) \^ (newTabPref)/, "($1 || $2) && !($1 && $2)"],
    [/"tab"/, "(TU_getPref('extensions.ntabimprovelite.searchInputPref', 2)==3) ? 'background' : 'foreground'"]
  );
  


};

ntabimprovelite._openLinkInTab = function() {

  //强制在新标签页打开外部链接
  TU_hookCode("contentAreaClick", /if[^{}]*event.button == 0[^{}]*{([^{}]|{[^{}]*}|{([^{}]|{[^{}]*})*})*(?=})/, "$&" + <![CDATA[
    if (TU_getPref("extensions.ntabimprovelite.openExternalInTab", false)) {
      let ourDomain = ntabimprovelite.getDomainFromURI(linkNode.ownerDocument.documentURIObject);
      let otherDomain = ntabimprovelite.getDomainFromURI(makeURI(linkNode.href));
      if (ourDomain && otherDomain && ourDomain != otherDomain) {
        openNewTabWith(linkNode.href, linkNode.ownerDocument, null, event, false);
        event.preventDefault();
        return false;
      }
    }
  ]]>);

  //外来链接
  TU_hookCode("nsBrowserAccess.prototype.openURI", /\S*getIntPref\S*/, 'isExternal ? TU_getPref("browser.link.open_external", 3) : $&');
};

ntabimprovelite._tabOpeningOptions = function() {

  //在当前标签页的右侧打开新标签页
  //连续打开后台标签时保持原有顺序
//  gBrowser.mTabContainer._tabOffset = 1;


  TU_hookCode("gBrowser.addTab",
    [/\S*insertRelatedAfterCurrent\S*(?=\))/, "false"],
    [/(?=(return t;)(?![\s\S]*\1))/, function() {
      if (t.arguments.caller != "sss_restoreWindow" && !t.hasAttribute("pinned") && function() {
        switch (TU_getPref("extensions.ntabimprovelite.openTabNext", 1)) {
          case 1: return true; //All
          case 2: return aRelatedToCurrent != false; //All but New Tab
          case 3: return aRelatedToCurrent == null ? aReferrerURI : aRelatedToCurrent; //None but Links
          default: return false; //None
        }
      }()) {
        let lastRelatedTab = this.mCurrentTab;
        if (TU_getPref("extensions.ntabimprovelite.openTabNext.keepOrder", true)) {
          let panelId = this.mCurrentTab.linkedPanel;
          for (let i = this.mTabs.length - 1; i >= 0; i--) {
            if (this.mTabs[i].getAttribute("opener") == panelId) {
              lastRelatedTab = this.mTabs[i];
              break;
            }
          }
        }
        this.moveTabTo(t, t._tPos > lastRelatedTab._tPos ? lastRelatedTab._tPos + 1 : lastRelatedTab._tPos);
        t.setAttribute("opener", this.mCurrentTab.linkedPanel);
      }
    }]
  );
  
  
  TU_hookCode("gBrowser.moveTabTo", "{", function() {
    if (aIndex < 0)
      aIndex = 0;
    else if (aIndex >= this.mTabs.length)
      aIndex = this.mTabs.length - 1;

    if (aIndex == aTab._tPos)
      return;
  });

  TU_hookCode("gBrowser.onTabClose", "}", function() {
    if (tab._tPos > this.mCurrentTab._tPos
        && tab._tPos < this.mCurrentTab._tPos + this.mTabContainer._tabOffset)
      this.mTabContainer._tabOffset--;
  });

  TU_hookCode("gBrowser.onTabSelect", "}", "this.mTabContainer._tabOffset = 1;");
  TU_hookCode("gBrowser.onTabMove", "}", "this.mTabContainer._tabOffset = 1;");
};

ntabimprovelite._tabClosingOptions = function() {

  //关闭标签页时选择左侧/右侧/第一个/最后一个标签
  TU_hookCode("_beginRemoveTab" in gBrowser ? "gBrowser._beginRemoveTab" : "gBrowser.removeTab", "{", "aTab.setAttribute('removing', true);");
  gBrowser._tabsToSelect = function _tabsToSelect(aTab) {
    if (!aTab)
      aTab = this.mCurrentTab;

    if (aTab.owner && !aTab.owner.hasAttribute("removing") && TU_getPref("browser.tabs.selectOwnerOnClose")) {
      yield aTab.owner;
      return;
    }

    var seenTabs = [];
    seenTabs[aTab._tPos] = true;

    var selectOnClose = TU_getPref("extensions.ntabimprovelite.selectOnClose", 0);
    if (selectOnClose & 0x80) for (let tab in _tabs_(0x80)) yield tab;
    if (selectOnClose & 0x40) for (let tab in _tabs_(0x40)) yield tab;
    if (selectOnClose & 0x20) for (let tab in _tabs_(0x20)) yield tab;
    if (selectOnClose & 0x03) for (let tab in _tabs_(selectOnClose & 0x03)) yield tab;
    if (selectOnClose & 0x1c) for (let tab in _tabs_(selectOnClose & 0x1c)) yield tab;

    function _tabs_(selectOnClose) {
      for (let tab in __tabs__(selectOnClose)) {
        if (!tab.hidden && !tab.hasAttribute("removing") && !(tab._tPos in seenTabs)) {
          seenTabs[tab._tPos] = true;
          yield tab;
        }
      }
    }

    function __tabs__(selectOnClose) {
      var tabs = gBrowser.mTabs;
      switch (selectOnClose) {
        case 1: //Left
          for (let i = aTab._tPos - 1; i >= 0; i--) yield tabs[i];
          break;
        case 2: //Right
          for (let i = aTab._tPos + 1; i < tabs.length; i++) yield tabs[i];
          break;
        case 4: //First
          for (let i = 0; i < tabs.length; i++) yield tabs[i];
          break;
        case 8: //Last
          for (let i = tabs.length - 1; i >= 0; i--) yield tabs[i];
          break;
        case 0x10: //Last selected
          var tabHistory = gBrowser.mTabContainer._tabHistory;
          for (let i = tabHistory.length - 1; i >= 0; i--) yield tabHistory[i];
          break;
        case 0x20: //Unread
          for (let tab in __tabs__()) if (tab.getAttribute("unread") == "true") yield tab;
          break;
        case 0x40: //Related
          for (let tab in __tabs__()) if (gBrowser.isRelatedTab(tab, aTab)) yield tab;
          break;
        case 0x80: //Unread Related
          for (let tab in __tabs__(0x20)) if (gBrowser.isRelatedTab(tab, aTab)) yield tab;
          break;
        case undefined: //Right or Rightmost
          for (let i = aTab._tPos + 1; i < tabs.length; i++) yield tabs[i];
          for (let i = aTab._tPos - 1; i >= 0; i--) yield tabs[i];
          break;
      }
    }
  };

  gBrowser._blurTab = function _blurTab(aTab) {
    if (aTab != this.mCurrentTab)
      return this.mCurrentTab;

    try {
      return this.selectedTab = this._tabsToSelect().next();
    }
    catch (e) {
      return this.selectedTab = this.getLastSelectedTab(1, true);
    }
  };

  TU_hookCode("gBrowser.removeTab", //Firefox 3.0.x
    ["this.selectedTab =", ""],
    [/(?=var index)/, "aTab.collapsed = true;this._blurTab(aTab);"]
  );

  //关闭标签页时选择亲属标签
  TU_hookCode("gBrowser.onTabOpen", "}", function() {
    if (tab.arguments.caller != "sss_restoreWindow")
      tab.setAttribute("opener", this.mCurrentTab.linkedPanel);
  });

  TU_hookCode("gBrowser.onTabSelect", "}", function() {
    var panelId = tab.linkedPanel;
    Array.forEach(this.mTabs, function(aTab) {
      if (aTab.getAttribute("opener").indexOf(panelId) == 0)
        aTab.setAttribute("opener", panelId + (+aTab.getAttribute("opener").slice(panelId.length) + 1));
    });
  });

  TU_hookCode("gBrowser.loadTabs", "}", function() {
    this.updateCurrentBrowser(true);
  });

  gBrowser.isRelatedTab = function isRelatedTab(aTab, bTab) {
    if (!bTab)
      bTab = this.mCurrentTab;

    return aTab.getAttribute("opener") == bTab.getAttribute("opener")
        || aTab.getAttribute("opener").indexOf(bTab.linkedPanel) == 0
        || bTab.getAttribute("opener").indexOf(aTab.linkedPanel) == 0;
  };

  //关闭标签页时选择未读标签
  //TU_hookCode("gBrowser.mTabProgressListener", /(?=var location)/, 'this.mTab.setAttribute("unread", !this.mTab.selected);');
  //TU_hookCode("gBrowser.onTabSelect", "}", 'tab.removeAttribute("unread");');

  //关闭标签页时选择上次浏览的标签
  gBrowser.mTabContainer._tabHistory = Array.slice(gBrowser.mTabs);
  TU_hookCode("gBrowser.onTabOpen", "}", function() {
    this.mTabContainer._tabHistory.unshift(tab);
  });

  TU_hookCode("gBrowser.onTabSelect", "}", function() {
    if (!this._previewMode) {
      var tabHistory = this.mTabContainer._tabHistory;
      tabHistory.splice(tabHistory.indexOf(tab), 1);
      tabHistory.push(tab);
    }
  });

  TU_hookCode("gBrowser.onTabClose", "}", function() {
    var tabHistory = this.mTabContainer._tabHistory;
    tabHistory.splice(tabHistory.indexOf(tab), 1);
  });

  gBrowser.getLastSelectedTab = function getLastSelectedTab(aDir, aAll) {
    var tabHistory = this.mTabContainer._tabHistory;
    var index = tabHistory.indexOf(this.mCurrentTab);
    for (var i = index > -1; i < tabHistory.length; i++) {
      var tab = tabHistory[index = aDir < 0 ? index + 1 : index - 1]
             || tabHistory[index = aDir < 0 ? 0 : tabHistory.length - 1];
      if ((aAll || !tab.hidden) && !tab.hasAttribute("removing"))
        return tab;
    }
    return null;
  };

 /*
  //Close tab by double click
  gBrowser.mTabContainer.addEventListener("dblclick", function(event) {
    if (event.button == 0 && event.target.localName == "tab"
        && !this._blockDblClick && !gBrowser._blockDblClick && TU_getPref("extensions.ntabimprovelite.dblClickTab") == 4) {
      gBrowser.removeTab(event.target, {animate: true});
      event.stopPropagation();
    }
  }, false);
*/

  //Don't close the last primary window
  TU_hookCode("gBrowser._beginRemoveTab", /\S*closeWindowWithLastTab\S*(?=;)/, <![CDATA[
    $& && (TU_getPref("extensions.ntabimprovelite.closeLastTabPref", false) || function() {
      var winEnum = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator).getEnumerator("navigator:browser");
      while (winEnum.hasMoreElements()) {
        var win = winEnum.getNext();
        if (win != window && win.toolbar.visible)
          return win;
      }
      return null;
    }())
  ]]>);

  if (!TU_getPref("extensions.ntabimprovelite.closeLastTabPref", false)) {
    gPrefService.setBoolPref("browser.tabs.closeWindowWithLastTab", true);
  }
};
