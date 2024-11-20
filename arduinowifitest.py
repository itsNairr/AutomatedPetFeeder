from flask import Flask, jsonify, request
import requests

app = Flask(__name__)

# Replace with your Arduino server's IP address
ARDUINO_IP = "192.48.56.2"
ARDUINO_PORT = 80

@app.route('/control-led', methods=['POST'])
def control_led():
    try:
        # Extract the LED state from the query parameters
        state = request.args.get("state")
        
        if state not in ["on", "off"]:
            return jsonify({"error": "Invalid state. Use 'on' or 'off'."}), 400
        
        # Determine the appropriate Arduino endpoint
        endpoint = "/H" if state == "on" else "/L"
        url = f"http://{ARDUINO_IP}:{ARDUINO_PORT}{endpoint}"
        
        # Send the request to the Arduino server
        response = requests.get(url)
        
        if response.status_code == 200:
            return jsonify({"message": f"LED turned {state} successfully."}), 200
        else:
            return jsonify({"error": f"Failed to communicate with Arduino. Status code: {response.status_code}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
