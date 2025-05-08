let isRecording = false;
let events = [];
let startURL = '';
let lastInputElement = null;
let lastInputTime = 0;
const INPUT_BATCH_DELAY = 500; // milliseconds to batch input events

// Inform the extension that the content script is loaded
chrome.runtime.sendMessage({ action: "contentScriptReady" });

// Check if we should be recording on page load
chrome.storage.local.get(['isRecording', 'currentURL'], function(result) {
  if (result.isRecording) {
    isRecording = true;
    startURL = result.currentURL || window.location.href;
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "startRecording") {
    startRecording();
    sendResponse({status: "recording_started"});
  } else if (request.action === "stopRecording") {
    stopRecording();
    sendResponse({status: "recording_stopped"});
  } else if (request.action === "ping") {
    // Simple ping to check if content script is loaded
    sendResponse({status: "content_script_ready"});
  }
  return true; // Keep the message channel open for asynchronous responses
});

function startRecording() {
  isRecording = true;
  events = [];
  startURL = window.location.href;
  
  // Record the initial URL
  events.push({
    type: 'navigation',
    url: startURL
  });
  
  console.log("Recording started...");
}

function stopRecording() {
  if (!isRecording) return;
  
  isRecording = false;
  console.log("Recording stopped...");
  
  // Generate Selenium script
  const seleniumScript = generateSeleniumScript(events);
  
  // Store the generated script
  chrome.storage.local.set({seleniumScript: seleniumScript});
}

// Event listeners for user interactions
document.addEventListener('click', function(e) {
  if (!isRecording) return;
  
  const element = e.target;
  const xpath = getXPath(element);
  
  events.push({
    type: 'click',
    element: {
      tag: element.tagName.toLowerCase(),
      id: element.id,
      className: element.className,
      text: element.textContent,
      xpath: xpath
    },
    timestamp: Date.now()
  });
  
  console.log(`Recorded click on ${element.tagName}`, xpath);
});

document.addEventListener('input', function(e) {
  if (!isRecording) return;
  
  const element = e.target;
  const xpath = getXPath(element);
  const currentTime = Date.now();
  
  // Check if this is the same element as the last input and within batch delay
  if (lastInputElement === element && (currentTime - lastInputTime) < INPUT_BATCH_DELAY) {
    // Find the last input event for this element and update its value
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].type === 'input' && 
          ((events[i].element.id && events[i].element.id === element.id) || 
           (events[i].element.xpath && events[i].element.xpath === xpath))) {
        
        // Update the existing event with new value
        events[i].value = element.value;
        console.log(`Updated input on ${element.tagName} to "${element.value}"`, xpath);
        break;
      }
    }
  } else {
    // Record as a new input event
    events.push({
      type: 'input',
      element: {
        tag: element.tagName.toLowerCase(),
        id: element.id,
        className: element.className,
        xpath: xpath
      },
      value: element.value,
      timestamp: currentTime
    });
    
    console.log(`Recorded input on ${element.tagName}: "${element.value}"`, xpath);
  }
  
  // Update tracking variables
  lastInputElement = element;
  lastInputTime = currentTime;
});

document.addEventListener('change', function(e) {
  if (!isRecording) return;
  
  const element = e.target;
  const xpath = getXPath(element);
  
  // Only record select, checkbox, radio button changes
  if (element.tagName.toLowerCase() === 'select' || 
      (element.tagName.toLowerCase() === 'input' && 
       (element.type === 'checkbox' || element.type === 'radio'))) {
    
    let value = element.value;
    if (element.type === 'checkbox' || element.type === 'radio') {
      value = element.checked;
    }
    
    events.push({
      type: 'change',
      element: {
        tag: element.tagName.toLowerCase(),
        id: element.id,
        className: element.className,
        xpath: xpath
      },
      value: value,
      timestamp: Date.now()
    });
    
    console.log(`Recorded change on ${element.tagName}`, xpath);
  }
});

// Generate XPath for an element
function getXPath(element) {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  
  if (element === document.body) {
    return '/html/body';
  }
  
  let ix = 0;
  const siblings = element.parentNode.childNodes;
  
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    
    if (sibling === element) {
      const path = getXPath(element.parentNode);
      const tag = element.tagName.toLowerCase();
      return `${path}/${tag}[${ix + 1}]`;
    }
    
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
      ix++;
    }
  }
}

// Generate Selenium Python script from recorded events
function generateSeleniumScript(events) {
  let script = `# Generated Selenium Python Script
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# Setup the driver
driver = webdriver.Chrome()  # You can change to other drivers as needed
driver.maximize_window()

try:
`;
  
  // Add events
  for (const event of events) {
    if (event.type === 'navigation') {
      script += `    # Navigate to the starting URL\n`;
      script += `    driver.get("${event.url}")\n`;
    }
    else if (event.type === 'click') {
      if (event.element.id) {
        script += `    # Click on element with ID: ${event.element.id}\n`;
        script += `    element = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.ID, '${event.element.id}')))\n`;
      } else {
        script += `    # Click on element with XPath: ${event.element.xpath}\n`;
        script += `    element = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.XPATH, '${event.element.xpath}')))\n`;
      }
      script += `    element.click()\n`;
    }
    else if (event.type === 'input') {
      if (event.element.id) {
        script += `    # Input text into element with ID: ${event.element.id}\n`;
        script += `    element = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, '${event.element.id}')))\n`;
      } else {
        script += `    # Input text into element with XPath: ${event.element.xpath}\n`;
        script += `    element = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.XPATH, '${event.element.xpath}')))\n`;
      }
      script += `    element.clear()\n`;
      script += `    element.send_keys("${event.value}")\n`;
      
      // Alternative approach for character-by-character typing if needed
      // Uncomment this and comment the line above if you want to simulate typing
      /*
      const text = event.value;
      script += `    # Simulating natural typing\n`;
      script += `    for char in "${text}":\n`;
      script += `        element.send_keys(char)\n`;
      script += `        time.sleep(0.1)  # Short delay between keystrokes\n`;
      */
    }
    else if (event.type === 'change') {
      if (event.element.tag === 'select') {
        if (event.element.id) {
          script += `    # Select option in dropdown with ID: ${event.element.id}\n`;
          script += `    from selenium.webdriver.support.ui import Select\n`;
          script += `    select = Select(driver.find_element(By.ID, '${event.element.id}'))\n`;
          script += `    select.select_by_value("${event.value}")\n`;
        } else {
          script += `    # Select option in dropdown with XPath: ${event.element.xpath}\n`;
          script += `    from selenium.webdriver.support.ui import Select\n`;
          script += `    select = Select(driver.find_element(By.XPATH, '${event.element.xpath}'))\n`;
          script += `    select.select_by_value("${event.value}")\n`;
        }
      } else if (event.element.tag === 'input') {
        // Handle checkbox or radio
        if (event.value) { // if checked
          if (event.element.id) {
            script += `    # Check checkbox/radio with ID: ${event.element.id}\n`;
            script += `    element = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.ID, '${event.element.id}')))\n`;
          } else {
            script += `    # Check checkbox/radio with XPath: ${event.element.xpath}\n`;
            script += `    element = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.XPATH, '${event.element.xpath}')))\n`;
          }
          script += `    if not element.is_selected():\n`;
          script += `        element.click()\n`;
        } else { // if unchecked
          if (event.element.id) {
            script += `    # Uncheck checkbox with ID: ${event.element.id}\n`;
            script += `    element = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.ID, '${event.element.id}')))\n`;
          } else {
            script += `    # Uncheck checkbox with XPath: ${event.element.xpath}\n`;
            script += `    element = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.XPATH, '${event.element.xpath}')))\n`;
          }
          script += `    if element.is_selected():\n`;
          script += `        element.click()\n`;
        }
      }
    }
    
    script += `    time.sleep(1)  # Wait for any page changes to complete\n\n`;
  }
  
  script += `    # Script execution completed successfully\n`;
  script += `    print("Selenium script executed successfully!")\n\n`;
  
  script += `except Exception as e:\n`;
  script += `    print(f"An error occurred: {e}")\n\n`;
  
  script += `finally:\n`;
  script += `    # Close the browser\n`;
  script += `    driver.quit()\n`;
  
  return script;
}