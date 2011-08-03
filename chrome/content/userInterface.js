(function() {
	if (!("gPrefService" in window)) {
	  __defineGetter__("gPrefService", function() {
	    delete this.gPrefService;
	    return gPrefService =  Components.classes["@mozilla.org/preferences-service;1"]
	             .getService(Components.interfaces.nsIPrefService)
	             .QueryInterface(Components.interfaces.nsIPrefBranch2);
	  });
	}
	
	var closeTabByClick={
		get to_be_closed() {
			return getBrowser().mTabContainer.childNodes.length > 1;
		},
		dblclicked: function(event){ //double click handler
			if(event.button!=0) return;
			if(!gPrefService.getBoolPref("extensions.ntabimprovelite.closeLastTabPref")&&!closeTabByClick.to_be_closed) return;
			if(gPrefService.getBoolPref("extensions.ntabimprovelite.doubleClickPref")){ 
				var tab = document.evaluate(
			            'ancestor-or-self::*[local-name()="tab"]',
			             event.originalTarget,
			             null,
			             XPathResult.FIRST_ORDERED_NODE_TYPE,
			             null
			           ).singleNodeValue;
				if(tab) gBrowser.removeTab(tab);
			}
		},
		midclicked: function(event){ //middle click handler
			if(event.button==1){	//Middle click
				if(event.target.tagName!="tab") return;
				event.preventDefault();
				event.stopPropagation();
				if(!gPrefService.getBoolPref("extensions.ntabimprovelite.closeLastTabPref")&&!closeTabByClick.to_be_closed) return;
				if(gPrefService.getBoolPref("extensions.ntabimprovelite.middleClickPref")){
					var tab = document.evaluate(
							'ancestor-or-self::*[local-name()="tab"]',
							event.originalTarget,
							null,
							XPathResult.FIRST_ORDERED_NODE_TYPE,
							null
		            	).singleNodeValue;
					if(tab) gBrowser.removeTab(tab);
				}
			}
		},
		rightclicked: function(event){ //right click handler
			if(event.button==2 && event.detail==1){	//Right click
				if(!gPrefService.getBoolPref("extensions.ntabimprovelite.closeLastTabPref")&&!closeTabByClick.to_be_closed) return;
				if(gPrefService.getBoolPref("extensions.ntabimprovelite.rightClickPref")){
					var tab = document.evaluate(
				             'ancestor-or-self::*[local-name()="tab"]',
				              event.originalTarget,
				              null,
				              XPathResult.FIRST_ORDERED_NODE_TYPE,
				              null
				            ).singleNodeValue;
					if(tab){
						document.getElementById("contentAreaContextMenu").hidePopup();
						event.preventDefault();
						event.stopPropagation();
						gBrowser.removeTab(tab);
					}
				}
			} 
		}
	};
	
//	openNewTab = function(event){
//		if(!gPrefService.getBoolPref("browser.tabs.insertRelatedAfterCurrent")){
			//防止有些add-on将browser.tabs.insertRelatedAfterCurrent屏蔽，再进行一次移动
//			gBrowser.moveTabTo(event.target, gBrowser.mTabContainer.itemCount);
//		}
//		else{
//			gBrowser.moveTabTo(event.target, gBrowser.mCurrentTab._tPos+1);
//		}
//	};
	//delete bacause this function can not be found in tabmixplus and tab utilities
	/*var undoHandler={
		restore: function(event){
			var tab = event.originalTarget;
			switch(gPrefService.getIntPref("extensions.ntabimprovelite.undoTabPref")){
			default:
			case 1:
				break;
			case 2:
				var tabHistory = gBrowser.mTabContainer._tabHistory;
				gBrowser.moveTabTo(tab, tabHistory[tabHistory.length-2]._tPos+1);
				break;
			case 3:
				gBrowser.moveTabTo(tab, gBrowser.mTabContainer.itemCount);
				break;
			}
		}
	};*/
	
	window.addEventListener("load", function() {
		window.setTimeout(function() {
			gBrowser.tabContainer.addEventListener('dblclick', closeTabByClick.dblclicked, false);
			gBrowser.tabContainer.addEventListener('click', closeTabByClick.midclicked, true);
			gBrowser.tabContainer.addEventListener('click', closeTabByClick.rightclicked, false);
//			gBrowser.tabContainer.addEventListener('TabOpen', openNewTab, false);
		}, 10);
	}, false);
	//gBrowser.tabContainer.addEventListener("SSTabRestoring", undoHandler.restore, false);
})();