/**From TabUtilities**/
TU_hookCode = TU_hookMethod;
function TU_hookMethod(aStr) {
  try {
    var namespaces = aStr.split(".");

    try {
      var object = this;
      while (namespaces.length > 1) {
        object = object[namespaces.shift()];
      }
    }
    catch (e) {
      throw TypeError(aStr + " is not a function");
    }

    var method = namespaces.pop();
    if (typeof object[method] != "function")
      throw TypeError(aStr + " is not a function");

    return object[method] = TU_hookFunc.apply(this, Array.concat(object[method], Array.slice(arguments, 1)));
  }
  catch (e) {
    Components.utils.reportError("Failed to hook " + aStr + ": " + e.message);
  }
}

function TU_hookFunc(aFunc) {
  var myCode = aFunc.toString();
  for (var i = 1; i < arguments.length;) {
    if (arguments[i].constructor.name == "Array") {
      var [orgCode, newCode, flags] = arguments[i++];
    }
    else {
      var [orgCode, newCode, flags] = [arguments[i++], arguments[i++], arguments[i++]];
    }

    if (typeof newCode == "function" && newCode.length == 0)
      newCode = newCode.toString().replace(/^.*{|}$/g, "");

    switch (orgCode) {
      case "{": [orgCode, newCode] = [/^.*{/m, "$&" + newCode];break;
      case "}": [orgCode, newCode] = [/}$/, newCode + "$&"];break;
    }

    if (typeof orgCode == "string")
      orgCode = RegExp(orgCode.replace(/[{[(\\^|$.?*+/)\]}]/g, "\\$&"), flags || "");

    myCode = myCode.replace(orgCode, newCode);
  }

  return eval("(" + myCode + ")");
}

if (!window.gPrefService)
  gPrefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

function TU_getPref(aPrefName, aDefault) {
  switch (gPrefService.getPrefType(aPrefName)) {
    case gPrefService.PREF_BOOL: return gPrefService.getBoolPref(aPrefName);
    case gPrefService.PREF_INT: return gPrefService.getIntPref(aPrefName);
    case gPrefService.PREF_STRING: return gPrefService.getComplexValue(aPrefName, Components.interfaces.nsISupportsString).data;
    default:
      switch (typeof aDefault) {
        case "boolean": gPrefService.setBoolPref(aPrefName, aDefault);break;
        case "number": gPrefService.setIntPref(aPrefName, aDefault);break;
        case "string": gPrefService.setCharPref(aPrefName, aDefault);break;
      }
      return aDefault;
  }
}
