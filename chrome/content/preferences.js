function updatesubstituteLastTabStatus() {
	document.getElementById("substituteLastTab").disabled = document.getElementById("closeLastTab.no").selected;
	if (document.getElementById("closeLastTab.no").selected) {
		document.getElementById("substituteLastTab").selectedItem = document.getElementById("substituteLastTab.closeWindow");
	}
} 

function onDefault() {
  var preferences = document.getElementsByTagName("preference");
  for (var i = 0; i < preferences.length; i++) {
	preferences[i].value = preferences[i].defaultValue;
  }
  updatesubstituteLastTabStatus();
}
	
function onLoad() {
	updatesubstituteLastTabStatus();
	var closeLastTab = document.getElementById("closeLastTab.no");
	closeLastTab.addEventListener("RadioStateChange", updatesubstituteLastTabStatus, false);
	return true;
}