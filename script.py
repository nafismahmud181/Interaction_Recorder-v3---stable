# Generated Selenium Python Script
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
    # Navigate to the starting URL
    driver.get("http://10.10.1.10/login")
    time.sleep(1)  # Wait for any page changes to complete

    # Click on element with ID: login-username
    

# 1. CSS Selector
    # element = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "#login-username")))

# 2. Relative XPath
    # element = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.XPATH, "//input[@id='login-username']")))


# 3. Indexed XPath
    # element = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.XPATH, "(//input[@id='login-username'])[1]")))



# 4. JavaScript Path
    # element = driver.execute_script("return document.querySelector('#login-username');")

# 5. ID Selector
    element = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.ID, "login-username")))


# 6. Name Selector
    # element = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.NAME, "username")))


# 7. Class Name Selector
    # element = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.CLASS_NAME, "form-control")))


# 8. Absolute XPath
    # element = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.XPATH, "/html[1]/body[1]/div[2]/div[1]/div[1]/div[1]/div[2]/div[1]/span[1]/form[1]/div[1]/div[1]/span[1]/input[1]")))


# 9. Tag Name Selector
    # element = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.TAG_NAME, "input")))




    element.click()
    time.sleep(1)  # Wait for any page changes to complete

    # Input text into element with ID: login-username
    element = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, 'login-username')))
    element.clear()
    element.send_keys("admin")
    time.sleep(1)  # Wait for any page changes to complete

    

    # Script execution completed successfully
    print("Selenium script executed successfully!")

except Exception as e:
    print(f"An error occurred: {e}")

finally:
    # Close the browser
    driver.quit()
