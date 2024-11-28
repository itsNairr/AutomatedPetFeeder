import requests

# Arduino server details
ARDUINO_IP = "192.48.56.2"  # Replace with your Arduino's IP address
ARDUINO_PORT = 80

url = f"http://{ARDUINO_IP}:{ARDUINO_PORT}/test"
payload = {"message": "Hello Arduino"}

try:
    print(f"Sending POST request to {url}...")
    response = requests.post(url, json=payload, timeout=5)  # Set a reasonable timeout
    if response.status_code == 200:
        print("Response from Arduino:", response.json())
    else:
        print(f"Error: Arduino returned status code {response.status_code}")
except requests.exceptions.RequestException as e:
    print(f"Error contacting Arduino: {e}")
