// background.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "contentScriptReady") {
    // Content script is ready in a tab
    console.log("Content script ready in tab:", sender.tab.id);
    sendResponse({status: "acknowledged"});
  }
  return true;
});
