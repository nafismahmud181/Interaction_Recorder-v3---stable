document.addEventListener('DOMContentLoaded', function() {
  const recordButton = document.getElementById('recordButton');
  const stopButton = document.getElementById('stopButton');
  const againButton = document.getElementById('againButton');
  const viewScriptButton = document.getElementById('viewScriptButton');
  const scriptPanel = document.getElementById('scriptPanel');
  const statusText = document.getElementById('statusText');

  let isRecording = false;
  let generatedScript = '';

  // Initialize button states from storage
  chrome.storage.local.get(['isRecording', 'hasRecording'], function(result) {
    if (result.isRecording) {
      startRecordingUI();
    }
    if (result.hasRecording) {
      againButton.disabled = false;
      viewScriptButton.disabled = false;
    }
  });

  // Get the generated script if available
  chrome.storage.local.get(['seleniumScript'], function(result) {
    if (result.seleniumScript) {
      generatedScript = result.seleniumScript;
    }
  });

  recordButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      // First check if content script is available by sending a ping
      chrome.tabs.sendMessage(tabs[0].id, {action: "ping"}, function(response) {
        if (chrome.runtime.lastError) {
          // Content script is not ready, show error message
          statusText.textContent = 'Error: Please reload the page';
          statusText.style.color = '#ea4335';
          console.error("Content script not loaded:", chrome.runtime.lastError);
          return;
        }
        
        // Content script is ready, start recording
        chrome.tabs.sendMessage(tabs[0].id, {action: "startRecording"}, function(response) {
          if (chrome.runtime.lastError) {
            statusText.textContent = 'Error starting recording';
            statusText.style.color = '#ea4335';
            console.error("Error:", chrome.runtime.lastError);
            return;
          }
          
          startRecordingUI();
          chrome.storage.local.set({isRecording: true, currentURL: tabs[0].url});
        });
      });
    });
  });

  stopButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "stopRecording"}, function(response) {
        if (chrome.runtime.lastError) {
          statusText.textContent = 'Error stopping recording';
          statusText.style.color = '#ea4335';
          console.error("Error:", chrome.runtime.lastError);
          return;
        }
        
        stopRecordingUI();
        chrome.storage.local.set({isRecording: false, hasRecording: true});
      });
    });
  });

  againButton.addEventListener('click', function() {
    chrome.storage.local.set({hasRecording: false, seleniumScript: ''});
    scriptPanel.style.display = 'none';
    againButton.disabled = true;
    viewScriptButton.disabled = true;
    statusText.textContent = 'Ready to record';
    statusText.style.color = 'black';
  });

  viewScriptButton.addEventListener('click', function() {
    chrome.storage.local.get(['seleniumScript'], function(result) {
      if (result.seleniumScript) {
        scriptPanel.value = result.seleniumScript;
        scriptPanel.style.display = 'block';
      } else {
        scriptPanel.value = 'No script generated yet.';
        scriptPanel.style.display = 'block';
      }
    });
  });

  function startRecordingUI() {
    isRecording = true;
    recordButton.disabled = true;
    stopButton.disabled = false;
    againButton.disabled = true;
    viewScriptButton.disabled = true;
    statusText.textContent = 'Recording...';
    statusText.style.color = '#ea4335';
  }

  function stopRecordingUI() {
    isRecording = false;
    recordButton.disabled = false;
    stopButton.disabled = true;
    againButton.disabled = false;
    viewScriptButton.disabled = false;
    statusText.textContent = 'Recording complete';
    statusText.style.color = '#34a853';
  }
});