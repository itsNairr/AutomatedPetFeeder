import threading
import serial
from ultralytics import YOLO
import cv2
from flask import Flask, jsonify, request
from flask_cors import CORS
import time

scheduleshash = {}
catshash = {}

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize the YOLO model and serial connection
# model = YOLO('catdetect.pt')
# ser = serial.Serial('/dev/ttyACM0', 115200, timeout=1)

# # Shared variable to hold the latest detection results
# latest_detection = {
#     'filename': None,
#     'detections': []
# }

# def detect_cats(img, filename):
#     results = model(img)

#     detections = []
#     if results[0].boxes:
#         for box in results[0].boxes:
#             class_id = int(box.cls)
#             class_name = results[0].names[class_id]
#             x1, y1, x2, y2 = map(int, box.xyxy[0])
#             detections.append({
#                 'class_id': class_id,
#                 'class_name': class_name,
#                 'box': [x1, y1, x2, y2]
#             })
#             # Draw rectangle on the image
#             cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
#         # Save the annotated image
#         annotated_filename = 'detected_' + filename
#         cv2.imwrite(annotated_filename, img)
#         return detections, annotated_filename
#     else:
#         return [], filename

# def receive_image():
#     global latest_detection
#     while True:
#         filename = 'frame.jpeg'
#         # Flush any old data in the serial buffer
#         ser.flushInput()

#         # Buffer to hold incoming data
#         image_data = bytearray()
#         receiving_image = False
#         start_marker = b'\xFF\xD8'
#         end_marker = b'\xFF\xD9'

#         print("Waiting for image data...")

#         while True:
#             if ser.in_waiting > 0:
#                 byte = ser.read(1)
#                 image_data += byte

#                 if not receiving_image and image_data.endswith(start_marker):
#                     receiving_image = True
#                     image_data = bytearray(start_marker)
#                     print("Start of JPEG detected.")
#                 elif receiving_image and image_data.endswith(end_marker):
#                     print("End of JPEG detected.")
#                     break
#             else:
#                 # If no data is received for a while, reset and wait again
#                 time.sleep(0.1)

#         # Save the image data to a file
#         with open(filename, 'wb') as f:
#             f.write(image_data)
#         print("Image saved.")

#         img = cv2.imread(filename)
#         if img is not None:
#             detections, annotated_filename = detect_cats(img, filename)
#             # Update the shared variable
#             latest_detection['filename'] = annotated_filename
#             latest_detection['detections'] = detections
#         else:
#             print("Error: Could not load image for detection.")

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
                    
        print(scheduleshash)

        time.sleep(30)  # Check every 30 seconds

# Start the background thread
threading.Thread(target=update_feeding_status, daemon=True).start()

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