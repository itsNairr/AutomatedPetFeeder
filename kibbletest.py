import requests
import time

ARDUINO_IP = "192.48.56.2"
ARDUINO_PORT = 80

cat = "Fluffy"
feeding = {"kibble": 10}  # Example kibble amount

print(f"Feeding {cat}...")
feeding["status"] = "Feeding Cat..."
url = f"http://{ARDUINO_IP}:{ARDUINO_PORT}/feed"
payload = {"kibble": feeding["kibble"]}
while True:
    try:
        # Send the POST request with the payload as JSON
        timeout = 3.5+(feeding["kibble"]*0.008)
        response = requests.post(url, json=payload, timeout=(3))
        if response.status_code == 200:
            feeding["status"] = "Cat Fed"
            print(f"Feeding {cat} successful.")
        else:
            print(f"Error: Arduino returned status code {response.status_code}")
            feeding["status"] = "Error Feeding Cat"
    except requests.exceptions.RequestException as e:
        print(f"Kill Yourself")
        feeding["status"] = "Error Feeding Cat"
        time.sleep(10);
