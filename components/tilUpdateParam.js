const { classes: Cc, interfaces: Ci, utils: Cu } = Components;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
let fa = Cc["@mozilla.org/fuel/application;1"].getService(Ci.fuelIApplication);

function getCustomized() {
  let markAndHistoryPrefs = [2];
  let locale = Cc["@mozilla.org/chrome/chrome-registry;1"].
    getService(Ci.nsIXULChromeRegistry).
    getSelectedLocale("ntabimprovelite");
  if (locale !== 'zh-CN') {
    markAndHistoryPrefs.push(1);
  }

  let prefs = {
    "extensions.ntabimprovelite.openHomepageInTab": [false],
    "extensions.ntabimprovelite.openTabNext.keepOrder": [false],
    "extensions.ntabimprovelite.selectOnClose": [64],
    "extensions.ntabimprovelite.openExternalInTab": [false],
    "browser.tabs.selectOwnerOnClose": [false],
    "browser.tabs.loadDivertedInBackground": [false],
    "extensions.ntabimprovelite.locationInputPref": [1],
    "extensions.ntabimprovelite.searchInputPref": [2],
    "extensions.ntabimprovelite.clickMarkAndHistoryPref": markAndHistoryPrefs,
    "extensions.ntabimprovelite.closeTabreturnPref": [1],
    "extensions.ntabimprovelite.doubleClickPref": [true],
    "extensions.ntabimprovelite.middleClickPref": [true],
    "extensions.ntabimprovelite.rightClickPref": [false],
    "extensions.ntabimprovelite.closeLastTabPref": [true],
  };

  return Object.keys(prefs).some(function(aPrefKey) {
    let val = fa.prefs.getValue(aPrefKey, prefs[aPrefKey][0]);
    return prefs[aPrefKey].indexOf(val) < 0;
  }).toString();
}

function TilUpdateParams() {
}

TilUpdateParams.prototype = {
  classDescription: "TIL Update Params",
  classID: Components.ID("{a0d143bc-f4f4-41ce-8c5e-6214e173cfd0}"),
  contractID: "@mozillaonline.com/til-update-params;1",
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIPropertyBag2]),

  getPropertyAsAString: function(param) {
    switch(param) {
      case "TIL_PREF_TRACKING":
        return getCustomized();
      default:
        return "NotSupported";
    }
  }
};

let NSGetFactory = XPCOMUtils.generateNSGetFactory([TilUpdateParams]);
