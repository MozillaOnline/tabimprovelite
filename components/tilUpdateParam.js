const { classes: Cc, interfaces: Ci, utils: Cu } = Components;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

let prefs = Services.prefs;

function shouldSend(aPrev, aCurrent, aPercent) {
  let usageSampleKey = "extensions.ntabimprovelite.usageSample";
  let usageSamplePrevKey = usageSampleKey + aPrev;
  let usageSampleCurrentKey = usageSampleKey + aCurrent;

  if (prefs.prefHasUserValue(usageSampleCurrentKey)) {
    return false;
  }

  let val = 0;
  if (prefs.prefHasUserValue(usageSamplePrevKey)) {
    try {
      val = parseFloat(prefs.getCharPref(usageSamplePrevKey));
    } catch(e) {}
    prefs.clearUserPref(usageSamplePrevKey);
  }
  prefs.setCharPref(usageSampleCurrentKey, val || Math.random());

  return val > (1 - aPercent / 100);
}

function collectPref() {
  let ret = [];

  if (!shouldSend("", "2", 10)) {
    return "";
  }

  try {
    ["extensions.ntabimprovelite.openHomepageInTab",
     "extensions.ntabimprovelite.openTabNext",
     "extensions.ntabimprovelite.openTabNext.keepOrder",
     "extensions.ntabimprovelite.selectOnClose",
     "extensions.ntabimprovelite.openExternalInTab",
     "browser.tabs.loadDivertedInBackground",
     "browser.tabs.closeWindowWithLastTab",
     "extensions.ntabimprovelite.locationInputPref",
     "extensions.ntabimprovelite.searchInputPref",
     "extensions.ntabimprovelite.clickMarkAndHistoryPref",
     "extensions.ntabimprovelite.closeTabreturnPref",
     "extensions.ntabimprovelite.doubleClickPref",
     "extensions.ntabimprovelite.middleClickPref",
     "extensions.ntabimprovelite.rightClickPref",
     "extensions.ntabimprovelite.closeLastTabPref"].forEach(function(prefKey) {
      let val = 0;
      if (prefs.prefHasUserValue(prefKey)) {
        switch (prefs.getPrefType(prefKey)) {
          case prefs.PREF_BOOL:
            val = prefs.getBoolPref(prefKey) ? 1 : 0;
            break;
          case prefs.PREF_INT:
            val = prefs.getIntPref(prefKey);
            break;
          default:
            break;
        }
      }
      ret.push(val);
    })
  } catch(e) {}

  return ret.join("|");
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
        return collectPref();
      default:
        return "NotSupported";
    }
  }
};

let NSGetFactory = XPCOMUtils.generateNSGetFactory([TilUpdateParams]);
