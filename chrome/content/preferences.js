var $ = document.getElementById.bind(document);

function updatesubstituteLastTabStatus(evt) {
  var closeLastTab = evt ? evt.target.value : $("closeLastTabPref").value;
  var closeWindowWithLastTabPref = $("closeWindowWithLastTabPref");
  closeWindowWithLastTabPref.disabled = !closeLastTab;
  if (!closeLastTab) {
    closeWindowWithLastTabPref.value = true;
  }
}

function onDefault() {
  var preferences = document.getElementsByTagName("preference");
  for (var i = 0; i < preferences.length; i++) {
    preferences[i].value = preferences[i].defaultValue;
  }
}

function onLoad() {
  updatesubstituteLastTabStatus();

  $("openNewTabPref").addEventListener("change", function(evt) {
    $("openNewTabPrefRelated").value = !!evt.target.value;
  }, false);
  $("searchInputPref").addEventListener("change", function(evt) {
    $("searchInputPrefRelated").value = evt.target.value != 1;
  }, false);
  $("clickMarkAndHistoryPref").addEventListener("change", function(evt) {
    $("clickMarkAndHistoryPrefRelated").value = evt.target.value == 3;
  }, false);
  $("closeLastTabPref").addEventListener("change", updatesubstituteLastTabStatus, false);
}