/* vim: set ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * This Source Code Form is “Incompatible With
 * Secondary Licenses”, as defined by the Mozilla
 * Public License, v. 2.0. */
if (typeof ceTabImproveLite == "undefined") {
  var ceTabImproveLite = {
    strings: {
      _bundle: Services.strings.createBundle('chrome://ntabimprovelite/locale/ntabimprovelite.properties'),
      get: function(name, args) {
        if (args) {
          args = Array.prototype.slice.call(arguments, 1);
          return this._bundle.formatStringFromName(name, args, args.length);
        } else {
          return this._bundle.GetStringFromName(name);
        }
      }
    },

    prefs: {
      get doubleClick() {
        return Application.prefs.getValue("extensions.ntabimprovelite.doubleClickPref", false);
      },
      set doubleClick(val) {
        Application.prefs.setValue("extensions.ntabimprovelite.doubleClickPref", val);
      },
      get middleClick() {
        return Application.prefs.getValue("extensions.ntabimprovelite.middleClickPref", false);
      },
      set middleClick(val) {
        Application.prefs.setValue("extensions.ntabimprovelite.middleClickPref", val);
      },
      get rightClick() {
        return Application.prefs.getValue("extensions.ntabimprovelite.rightClickPref", false);
      },
      set rightClick(val) {
        Application.prefs.setValue("extensions.ntabimprovelite.rightClickPref", val);
      },
      get background() {
        return Application.prefs.getValue("browser.tabs.loadDivertedInBackground", true);
      },
      set background(val) {
        Application.prefs.setValue("browser.tabs.loadDivertedInBackground", val);
      }
    },

    btns: [{
      id: 'ntabimprove_closetab_dblclick',
      pref: 'doubleClick'
    }, {
      id: 'ntabimprove_closetab_mclick',
      pref: 'middleClick'
    }, {
      id: 'ntabimprove_closetab_rclick',
      pref: 'rightClick'
    }, {
      id: 'ntabimprove_loadInBackground_disable',
      pref: 'background',
      inverted: true
    }, {
      id: 'ntabimprove_loadInBackground_enable',
      pref: 'background'
    }],

    onMenuItemCommand: function ntabimprovelite__onMenuItemCommand(e) {
      var features = "chrome,titlebar,toolbar,centerscreen,dialog=yes";
      window.openDialog("chrome://ntabimprovelite/content/preferences.xul", "Preferences", features);
    },

    updatePref: function ntabimprovelite__updatePref(aBtn) {
      this.btns.filter((btn) => btn.id == aBtn.id)
               .forEach((btn) => this.prefs[btn.pref] = btn.inverted ? !aBtn.checked : aBtn.checked);
    },

    init: function ntabimprovelite__init() {
      gBrowser = gBrowser || getBrowser();  //Compatibility with Firefox 3.0

      this._tabEventListeners.init();
      this._openUILinkInTab();
      this._openLinkInTab();
      this._tabOpeningOptions();
      this._tabClosingOptions();
      this._sendStats();
    },

    get _eTLDService() {
      delete this._eTLDService;
      return this._eTLDService = Cc["@mozilla.org/network/effective-tld-service;1"].getService(Ci.nsIEffectiveTLDService);
    },

    createButton: function ntabimprovelite__createButton(aId) {
      let widget = CustomizableUI.getWidget(aId);
      if (widget && widget.provider == CustomizableUI.PROVIDER_API) {
        return;
      }

      let migrationListener = {
        onWidgetAdded: function(aWidgetId, aArea) {
          if (aWidgetId == aId && aArea != CustomizableUI.AREA_ADDONBAR) {
            CustomizableUI.removeListener(migrationListener);
            let addonbar = document.getElementById(CustomizableUI.AREA_ADDONBAR);
            if (addonbar && addonbar._currentSetMigrated.has(aId)) {
              CustomizableUI.addWidgetToArea(aId, CustomizableUI.AREA_PANEL);
              addonbar._currentSetMigrated.delete(aId);
              addonbar._updateMigratedSet();
            };
          }
        }
      };
      CustomizableUI.addListener(migrationListener);

      CustomizableUI.createWidget({
        id: aId,
        type: 'view',
        viewId: 'PanelUI-ntabimprove-view',
        defaultArea: CustomizableUI.AREA_PANEL,
        label: this.strings.get('title'),
        tooltiptext: this.strings.get('tooltip'),
        onViewShowing: (aEvent) => this.initUI(aEvent)
      });
    },

    bindPopup: function ntabimprovelite__bindPopup(buttonId, menuId) {
      var button = document.getElementById(buttonId)
      if (!button)
        return;

      var menu = document.getElementById(menuId)
      button.addEventListener("mousedown", function(aEvent) {
        if (aEvent.button != 0 )
          return;
        menu.openPopup(button, "before_start", 0, 0, false, false, aEvent);
      }, false);
    },

    getDomainFromURI: function ntabimprovelite__getDomainFromURI(aURI) {
      try {
        return this._eTLDService.getBaseDomain(aURI);
      } catch (e) {}

      try {
        return aURI.host;
      } catch (e) {}

      return null;
    },

    handleEvent: function ntabimprovelite__handleEvent(aEvent) {
      window.removeEventListener(aEvent.type, this, false);
      switch (aEvent.type) {
        case "DOMContentLoaded":
          this.init();
          break;
        case "aftercustomization":
          this.initUI(aEvent);
          break;
      }
    },

    // Read localized string and set pref with converted int value.
    setDefaultPrefs: function() {
      let clickMarkAndHistoryPref = this.strings.get('clickMarkAndHistoryPref');
      gPrefService.getDefaultBranch('extensions.ntabimprovelite.')
                  .setIntPref('clickMarkAndHistoryPref', Number(clickMarkAndHistoryPref));
    },

    onLoad: function ntabimprovelite__onLoad(aEvent) {
      window.addEventListener("DOMContentLoaded", this, false);
      this.setDefaultPrefs();
      this.createButton("ntabimprove");
      this.initUI(aEvent);
      var toolbox = document.getElementById("navigator-toolbox");
      toolbox.addEventListener("aftercustomization", this, false);
    },

    initUI: function ntabimprovelite__initUI(aEvent) {
      // Use setTimeout() to avoid conflict
      setTimeout(() => {
        let doc = aEvent && aEvent.target && aEvent.target.ownerDocument || document;
        this.btns.forEach((btn) => {
          let pref = this.prefs[btn.pref];
          doc.getElementById(btn.id).checked = btn.inverted ? !pref : pref;
        });
      }, 0);
    },

    _tabEventListeners: {
      init: function() {
        TU_hookCode("gBrowser.addTab",
          ["{", "if (!aURI) aURI = 'about:blank';"],
          [/(?=.*dispatchEvent.*)/, function() {
            var caller = Components.stack.caller;
            while (caller) {
              if (caller.name) {
                break;
              }
              caller = caller.caller;
            }
            t.arguments = {
              aURI: aURI,
              aReferrerURI: aReferrerURI,
              aRelatedToCurrent: aRelatedToCurrent,
              caller: caller && caller.name
            };
          }]
        );

        gBrowser.onTabOpen = function onTabOpen(event) {var tab = event.target;};
        gBrowser.onTabMove = function onTabMove(event) {var tab = event.target;};
        gBrowser.onTabClose = function onTabClose(event) {var tab = event.target;};
        gBrowser.onTabSelect = function onTabSelect(event) {var tab = event.target;};
        gBrowser.onTabRestoring = function onTabRestoring(event) {var tab = event.target, ss = ceTabImproveLite._ss;};
        gBrowser.onTabRestored = function onTabRestored(event) {var tab = event.target, ss = ceTabImproveLite._ss;};
        gBrowser.onTabClosing = function onTabClosing(event) {var tab = event.target, ss = ceTabImproveLite._ss;};

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
          case "load":
            this.init();
            break;
          case "unload":
            this.uninit();
            break;
          case "TabOpen":
            gBrowser.onTabOpen(event);
            break;
          case "TabMove":
            gBrowser.onTabMove(event);
            break;
          case "TabClose":
            gBrowser.onTabClose(event);
            break;
          case "TabSelect":
            gBrowser.onTabSelect(event);
            break;
          case "SSTabRestoring":
            gBrowser.onTabRestoring(event);
            break;
          case "SSTabRestored":
            gBrowser.onTabRestored(event);
            break;
          case "SSTabClosing":
            gBrowser.onTabClosing(event);
            break;
        }
      }
    },

    _openUILinkInTab: function() {
      // 地址栏回车键
      TU_hookCode("gURLBar.handleCommand",
        [/((aTriggeringEvent)\s*&&\s*(aTriggeringEvent.altKey))(?![\s\S]*\1)/, "let (newTabPref = (TU_getPref('extensions.ntabimprovelite.locationInputPref', 2)!=1)) ($1 || newTabPref) && !(($2 ? $3 : false) && newTabPref)"],
        [/(?=\n.*openUILink\b[\s\S]*?([^{}]*)\n.*loadOneTab.*)/, "$1"], // Fx 3.6
        [/(.*openUILink.*)[\s\S]*\n(.*loadOneTab.*)[\s\S]*\n(.*(loadURI|loadCurrent).*)/, function(s, s1, s2, s3) {
          s1 = s1.replace(/openUILink\b/, "openUILinkIn")
                 .replace("aTriggeringEvent, false, false", "where")
                 .replace(/postData(?=\))/, "$&, null, {event: aTriggeringEvent || {}}"); // Fx 3.6
          return s.replace(s1, s1 = s1.replace("postData: postData", "$&, event: aTriggeringEvent || {}")) // Fx 4.0+
                  .replace(s2, s1.replace("where", "(TU_getPref('extensions.ntabimprovelite.locationInputPref', 2)==3)  ? 'background' : 'foreground'"))
                  .replace(s3, s1.replace("where", "'current'"));
        }],
        ["openUILinkIn(url, where, params);", function(s) s.replace("params", "{allowThirdPartyFixup: true, postData: postData, event: aTriggeringEvent || {}, inBackground: (TU_getPref('extensions.ntabimprovelite.locationInputPref', 2)==3)}")], // Fx 10.0+
        ["loadCurrent();", "openUILinkIn(url, 'current', {allowThirdPartyFixup: true, postData: postData});", "g"], // Fx 10.0+
        [/.*loadURIWithFlags.*(?=[\s\S]*(.*openUILinkIn.*))/, "$1"], // Fx 6.0+
        ["aTriggeringEvent.preventDefault();", ""],
        ["aTriggeringEvent.stopPropagation();", ""]
      );

      // 搜索栏回车键
      if (BrowserSearch.searchBar)
        TU_hookCode("BrowserSearch.searchBar.handleSearchCommand",
          [/"tab"/, "(TU_getPref('extensions.ntabimprovelite.searchInputPref', 2)==3) ? 'background' : 'foreground'"]
        );
    },

    _openLinkInTab: function() {
      // 强制在新标签页打开外部链接
      TU_hookCode("contentAreaClick", /if[^{}]*event.button == 0[^{}]*{([^{}]|{[^{}]*}|{([^{}]|{[^{}]*})*})*(?=})/, "$&"
        +'\n    if (TU_getPref("extensions.ntabimprovelite.openExternalInTab", false)) {                         '
        +'\n      let ourDomain = ceTabImproveLite.getDomainFromURI(linkNode.ownerDocument.documentURIObject);    '
        +'\n      let otherDomain = ceTabImproveLite.getDomainFromURI(makeURI(linkNode.href));                    '
        +'\n      if (ourDomain && otherDomain && ourDomain != otherDomain) {                                    '
        +'\n        openNewTabWith(linkNode.href, linkNode.ownerDocument, null, event, false);                   '
        +'\n        event.preventDefault();                                                                      '
        +'\n        return false;                                                                                '
        +'\n      }                                                                                              '
        +'\n    }                                                                                                '
      );

      // 外来链接
      TU_hookCode("nsBrowserAccess.prototype.openURI", /\S*getIntPref\S*/, 'isExternal ? TU_getPref("browser.link.open_external", 3) : $&');
    },

    _tabOpeningOptions: function() {
      // 在当前标签页的右侧打开新标签页
      // 连续打开后台标签时保持原有顺序
      TU_hookCode("gBrowser.addTab",
        [/\S*insertRelatedAfterCurrent\S*(?=\))/, "false"],
        [/(?=(return t;)(?![\s\S]*\1))/, function() {
          if (["sss_restoreWindow", "ssi_restoreWindow"].indexOf(t.arguments.caller) == -1 && !t.hasAttribute("pinned") && function() {
            switch (TU_getPref("extensions.ntabimprovelite.openTabNext", 1)) {
              case 1: return true; // All
              case 2: return aRelatedToCurrent != false; // All but New Tab
              case 3: return aRelatedToCurrent == null ? aReferrerURI : aRelatedToCurrent; // None but Links
              default: return false; // None
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
    },

    _tabClosingOptions: function() {
      // 关闭标签页时选择左侧/右侧/第一个/最后一个标签
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
            case 1: // Left
              for (let i = aTab._tPos - 1; i >= 0; i--) yield tabs[i];
              break;
            case 2: // Right
              for (let i = aTab._tPos + 1; i < tabs.length; i++) yield tabs[i];
              break;
            case 4: // First
              for (let i = 0; i < tabs.length; i++) yield tabs[i];
              break;
            case 8: // Last
              for (let i = tabs.length - 1; i >= 0; i--) yield tabs[i];
              break;
            case 0x10: // Last selected
              var tabHistory = gBrowser.mTabContainer._tabHistory;
              for (let i = tabHistory.length - 1; i >= 0; i--) yield tabHistory[i];
              break;
            case 0x20: // Unread
              for (let tab in __tabs__()) if (tab.getAttribute("unread") == "true") yield tab;
              break;
            case 0x40: // Related
              for (let tab in __tabs__()) if (gBrowser.isRelatedTab(tab, aTab)) yield tab;
              break;
            case 0x80: // Unread Related
              for (let tab in __tabs__(0x20)) if (gBrowser.isRelatedTab(tab, aTab)) yield tab;
              break;
            case undefined: // Right or Rightmost
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
        } catch (e) {
          return this.selectedTab = this.getLastSelectedTab(1, true);
        }
      };

      TU_hookCode("gBrowser.removeTab", // Firefox 3.0.x
        ["this.selectedTab =", ""],
        [/(?=var index)/, "aTab.collapsed = true;this._blurTab(aTab);"]
      );

      // 关闭标签页时选择亲属标签
      TU_hookCode("gBrowser.onTabOpen", "}", function() {
        if (["sss_restoreWindow", "ssi_restoreWindow"].indexOf(tab.arguments.caller) == -1)
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

        return bTab.getAttribute("opener").indexOf(aTab.linkedPanel) == 0;
      };

      // 关闭标签页时选择上次浏览的标签
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

      // Don't close the last primary window
      TU_hookCode("gBrowser._beginRemoveTab", /\S*closeWindowWithLastTab\S*(?=;)/, ''
        +'\n    $& && (TU_getPref("extensions.ntabimprovelite.closeLastTabPref", false) || function() { '
        +'\n      var winEnum = Cc["@mozilla.org/appshell/window-mediator;1"]                           '
        +'\n          .getService(Ci.nsIWindowMediator).getEnumerator("navigator:browser");             '
        +'\n      while (winEnum.hasMoreElements()) {                                                   '
        +'\n        var win = winEnum.getNext();                                                        '
        +'\n        if (win != window && win.toolbar.visible)                                           '
        +'\n          return win;                                                                       '
        +'\n      }                                                                                     '
        +'\n      return null;                                                                          '
        +'\n    }())                                                                                    '
      );

      if (!TU_getPref("extensions.ntabimprovelite.closeLastTabPref", false)) {
        gPrefService.setBoolPref("browser.tabs.closeWindowWithLastTab", true);
      }
    },

    _sendStats: function() {
      // getDataChoices
      if(! Application.prefs.getValue("extensions.tpmanager.tracking.enabled",false))
        return;

      var usageSampleKey = 'extensions.ntabimprovelite.usageSample';
      var prefBranch =
          Components.classes['@mozilla.org/preferences-service;1']
                    .getService(Components.interfaces.nsIPrefBranch);
      if (prefBranch.prefHasUserValue(usageSampleKey)) {
        return;
      }

      var random = Math.random();
      prefBranch.setCharPref(usageSampleKey, random);
      if (random >= 0.01) {
        return;
      }

      var sample = 0;
      ['extensions.ntabimprovelite.openHomepageInTab',
       'extensions.ntabimprovelite.openTabNext',
       'extensions.ntabimprovelite.openTabNext.keepOrder',
       'extensions.ntabimprovelite.openExternalInTab',
       'browser.tabs.insertRelatedAfterCurrent',
       'browser.tabs.selectOwnerOnClose',
       'browser.tabs.loadDivertedInBackground',
       'extensions.ntabimprovelite.locationInputPref',
       'extensions.ntabimprovelite.searchInputPref',
       'extensions.ntabimprovelite.clickMarkAndHistoryPref',
       'extensions.ntabimprovelite.closeTabreturnPref',
       'extensions.ntabimprovelite.doubleClickPref',
       'extensions.ntabimprovelite.middleClickPref',
       'extensions.ntabimprovelite.rightClickPref',
       'extensions.ntabimprovelite.closeLastTabPref'].forEach(function(prefKey) {
        var val = 0;
        if (prefBranch.prefHasUserValue(prefKey)) {
          switch (prefBranch.getPrefType(prefKey)) {
            case prefBranch.PREF_BOOL:
              val = prefBranch.getBoolPref(prefKey) ? 1 : 0;
              break;
            case prefBranch.PREF_INT:
              val = prefBranch.getIntPref(prefKey);
              break;
            default:
              break;
          }
          val += 1;
        }
        sample += val;
        sample *= 10;
      });

      var prefKey = 'extensions.ntabimprovelite.selectOnClose';
      if (prefBranch.prefHasUserValue(prefKey)) {
        sample += Math.log(prefBranch.getIntPref(prefKey)) / Math.log(2) + 1;
      }

      var img = new Image();
      img.src = 'http://adu.myfirefox.com.tw/addons/tabimprovelite.gif'
                + '?r=' + Math.random()
                + '&sample=' + sample;
    },
  };

  window.addEventListener("load", function(aEvent) { ceTabImproveLite.onLoad(aEvent); }, false);

};
