import threading
import serial
from ultralytics import YOLO
import cv2
from flask import Flask, jsonify, request
from flask_cors import CORS
import time
import requests

scheduleshash = {}
catshash = {}
current_time = time.strftime("%H:%M")
current_day = time.strftime("%A")
detections = []

catIndex = {
    'cat-Abyssinian': "Abyssinian",
    'cat-Bengal': "Bengal",
    'cat-Birman': "Birman",
    'cat-Bombay': "Bombay",
    'cat-British_Shorthair': "British-Shorthair",
    'cat-Egyptian_Mau': "Egyptian-Mau",
    'cat-Maine_Coon': "Maine-Coon",
    'cat-Persian': "Persian",
    'cat-Ragdoll': "Ragdoll",
    'cat-Russian_Blue': "Russian-Blue",
    'cat-Siamese': "Siamese",
    'cat-Sphynx': "Sphynx"
}

ARDUINO_IP = "192.48.56.2"
ARDUINO_PORT = 80

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
model = YOLO('catdetect.pt')
ser = serial.Serial('/dev/ttyACM0', 115200, timeout=1)

def detect_cats(img):
    results = model(img)

    detections = []
    # Display results
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls)  # Get the class ID for the detected box
            class_name = result.names[class_id]  # Map ID to class name using the 'names' dictionary
            detections.append(class_name)
    return detections

def receive_image():
    global scheduleshash
    global catIndex
    global detections
    while True:
        filename = 'frame.jpeg'
        # Flush any old data in the serial buffer
        ser.flushInput()

        # Buffer to hold incoming data
        image_data = bytearray()
        receiving_image = False

        print("Waiting for image data...")

        while True:
            if ser.in_waiting > 0:
                byte = ser.read(1)
                if not receiving_image:
                    # Check for the start of JPEG (0xFF, 0xD8)
                    if len(image_data) > 0 and image_data[-1] == 0xFF and byte == b'\xD8':
                        receiving_image = True
                        image_data = bytearray([0xFF, 0xD8])
                        #print("JPEG Header Detected, Image transmission started...")
                    else:
                        image_data.append(ord(byte))

                elif receiving_image:
                    image_data.append(ord(byte))
                    
                    # Check for the end of JPEG (0xFF, 0xD9)
                    if len(image_data) > 1 and image_data[-2] == 0xFF and image_data[-1] == 0xD9:
                        #print("JPEG End Header Detected, Image transmission ended.")
                        break

        # Save the image data to a file
        with open(filename, 'wb') as f:
            f.write(image_data)
        print(f"Image saved")
        img = cv2.imread(filename)
        if img is not None:
            detections = detect_cats(img)
            sendArduino(detections)
        else:
            print("Error: Could not load image for detection.")


def sendArduino(detections):
    # scheduleshash = {
    # "Timmy": {
    #     "Wednesday": [
    #         {"time": "08:00", "kibble": 20, "status": "Waiting for Cat"},
    #         {"time": "12:00", "kibble": 10, "status": "On Time"},
    #         {"time": "18:00", "kibble": 10, "status": "On Time"}
    #     ],
    #     "Thursday": [
    #         {"time": "08:00", "kibble": 10, "status": "On Time"},
    #         {"time": "12:00", "kibble": 10, "status": "On Time"},
    #         {"time": "18:00", "kibble": 10, "status": "On Time"}
    #     ]
    # }
    # }
    
    # catshash = {"Bengal": "Timmy"}
    
    global catshash
    global scheduleshash
    print("sendAdrdu", detections, scheduleshash)
    if detections:
        # print("I SEE STUFF")
        
        # url = f"http://{ARDUINO_IP}:{ARDUINO_PORT}/feed"
        # payload = {"kibble": 10}
        # try:
        #     # Send the POST request with the payload as JSON
        #     response = requests.post(url, json=payload, timeout=5)
                
        # except requests.exceptions.RequestException as e:
        #         print(f"successful.")
        
        
        
        
        for cat, schedule in scheduleshash.items():
            key = next((key for key, value in catshash.items() if value == cat), None)
            print(key)
            if current_day in schedule:  # Check if the current day exists in the schedule
                for feeding in schedule[current_day]:
                    #if feeding["time"] <= current_time and feeding["status"] == "Waiting for Cat":
                    if feeding["status"] == "Waiting for Cat":
                        for detection in detections:
                            print(detections)
                            print(key)
                            print(catIndex.get(detection))
                            print(feeding.get("kibble"))
                            print(feeding.get("status"))
                            print(feeding.get("time"))
                            if catIndex.get(detection) == key:
                                print(f"Feeding {cat}...")
                                feeding["status"] = "Feeding Cat..."
                                url = f"http://{ARDUINO_IP}:{ARDUINO_PORT}/feed"
                                payload = {"kibble": feeding["kibble"]}
                                try:
                                    # Send the POST request with the payload as JSON
                                    response = requests.post(url, json=payload, timeout=5)
                                except requests.exceptions.RequestException as e:
                                        feeding["status"] = "Cat Fed"
                                        print(f"Feeding {cat} successful.")
    else:
        print("No cats to feed.")


# Background thread to update feeding statuses
def update_feeding_status():
    global scheduleshash
    while True:
        current_time = time.strftime("%H:%M")  
        current_day = time.strftime("%A")  
        print(f"Current time: {current_time}, Current day: {current_day}")
        for cat, schedule in scheduleshash.items():
            if current_day in schedule:  # Check if the current day exists in the schedule
                for feeding in schedule[current_day]:
                    if feeding["time"] <= current_time and feeding["status"] == "On Time":
                        feeding["status"] = "Waiting for Cat"
                    
        # print(scheduleshash)

        time.sleep(10)

# Background thread to receive images
def start_receiver_thread1():
    threading.Thread(target=receive_image, daemon=True).start()
    
# # Background thread to send POST
# def start_receiver_thread2():
#     threading.Thread(target=sendArduino, daemon=True).start()

# Function to start all background threads
def start_background_threads():
    start_receiver_thread1()
    #start_receiver_thread2()
    threading.Thread(target=update_feeding_status, daemon=True).start()

# Start all background threads
start_background_threads()

@app.route('/')
def home():
    return jsonify({'status': 'Connected'})

@app.route('/upload/schedule', methods=['POST']) #Upload a schedule
def upload_schedule():
    global scheduleshash
    data = request.get_json()
    name = data.get('name')
    schedule = data.get('schedule')
    if name in scheduleshash:
        return jsonify({'message': 'Schedule for this cat already exists! Try again.'}), 409
    else:
        scheduleshash[name] = schedule
        print(scheduleshash)
        return jsonify({'message': 'Schedule added! Redirecting to schedules page...'}), 200
    
@app.route('/upload/schedule/<name>', methods=['PUT']) #Edit a schedule
def edit_schedule(name):
    global scheduleshash
    data = request.get_json()

    # Check if the name exists
    if name not in scheduleshash:
        return jsonify({'message': 'Name not found.'}), 404

    # Extract new data
    new_name = data.get('name')
    new_schedule = data.get('schedule')

    if new_name != name and new_name in scheduleshash:
        return jsonify({'message': 'Schedule for this cat already exists! Try again.'}), 409
    else:
        scheduleshash.pop(name)
        scheduleshash[new_name] = new_schedule
        return jsonify({'message': 'Schedule updated! Redirecting to schedules page...'}), 200
    
@app.route('/subscribe/schedules', methods=['GET']) #Get all cats
def subscribe_all_schedules():
    global scheduleshash
    return jsonify(scheduleshash), 200

@app.route('/subscribe/schedules/<name>', methods=['GET']) #Get single schedule
def subscribe_single_schedule(name):
    global scheduleshash
    # Check if the name exists in scheduleshash
    if name not in scheduleshash:
        return jsonify({'message': f'Name {name} not found.'}), 404

    return jsonify({name: scheduleshash[name]}), 200

@app.route('/subscribe/cats', methods=['GET']) #Get all cats
def subscribe_all_cats():
    global catshash
    return jsonify(catshash), 200


@app.route('/subscribe/cats/<breed>', methods=['GET']) #Get single cat
def subscribe_single_cat(breed):
    global catshash
    # Check if the breed exists in catshash
    if breed not in catshash:
        return jsonify({'message': f'Breed {breed} not found.'}), 404

    return jsonify({breed: catshash[breed]}), 200

@app.route('/delete/schedule/<name>', methods=['DELETE']) #Delete a schedule
def delete_schedule(name):
    global scheduleshash
    if name in scheduleshash:
        scheduleshash.pop(name)
        return jsonify({'message': 'Schedule deleted! Redirecting to schedules page...'}), 200
    else:
        return jsonify({'message': 'Name not found.'}), 404

@app.route('/upload/cat', methods=['POST']) #Upload a cat
def upload_cat():
    global catshash
    data = request.get_json()
    cat = data.get('cat')
    breed = data.get('breed')
    if breed in catshash:
        return jsonify({'message': 'Cat of this breed already exists! Try again.'}), 409
    else:
        catshash[breed] = cat
        print(catshash)
        return jsonify({'message': 'Cat added! Redirecting to cats page...'}), 200
    
@app.route('/upload/cat/<breed>', methods=['PUT']) #Edit a cat
def edit_cat(breed):
    global catshash
    data = request.get_json()

    # Check if the breed exists
    if breed not in catshash:
        return jsonify({'message': 'Breed not found.'}), 404

    # Extract new data
    new_breed = data.get('breed')
    new_name = data.get('cat')
    # print(new_breed)
    # print(breed)

    if new_breed != breed and new_breed in catshash:
        return jsonify({'message': 'Cat of this breed already exists! Try again.'}), 409
    else:
        catshash.pop(breed)
        catshash[new_breed] = new_name
        return jsonify({'message': 'Cat updated! Redirecting to cats page...'}), 200
    
@app.route('/delete/cat/<breed>', methods=['DELETE']) #Delete a cat
def delete_cat(breed):
    global catshash
    if breed in catshash:
        if catshash[breed] in scheduleshash:
            scheduleshash.pop(catshash[breed])
        catshash.pop(breed)
        return jsonify({'message': 'Cat deleted! Redirecting to cats page...'}), 200
    else:
        return jsonify({'message': 'Breed not found.'}), 404
    
    
@app.route('/stream/schedule', methods=['GET'])  # Stream schedule status
def stream_schedule():
    def event_stream():
        import json
        while True:
            # Serialize scheduleshash manually
            yield f"data: {json.dumps(scheduleshash)}\n\n"
            time.sleep(2)  # Send updates every 2 seconds

    return app.response_class(event_stream(), mimetype='text/event-stream')

 
if __name__ == '__main__':
    #start_receiver_thread()
    app.run(debug=True, threaded=True)