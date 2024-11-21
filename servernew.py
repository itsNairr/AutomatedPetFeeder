import threading
import serial
from ultralytics import YOLO
import cv2
from flask import Flask, jsonify, request, Response, json
from flask_cors import CORS
import time

feedhash = {}

subscribers = []  # List to keep track of subscribers

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

# def start_receiver_thread():
#     thread = threading.Thread(target=receive_image, daemon=True)
#     thread.start()

@app.route('/')
def home():
    return jsonify({'status': 'Connected'})

@app.route('/upload', methods=['POST'])
def upload():
    global breed, kibble, ftime
    data = request.get_json()
    breed = data.get('breed')
    kibble = data.get('kibble')
    ftime = data.get('time')
    feedhash[ftime] = [breed, kibble]
    print(feedhash)
    notify_subscribers() 
    return jsonify({'message': 'Data received! Feed another Cat!'}), 200

@app.route('/stream')
def stream():
    def event_stream():
        while True:
            # Serialize `feedhash` as a JSON string with `json.dumps`
            yield f"data: {json.dumps(feedhash)}\n\n"
            time.sleep(1)  # Adjust as needed
    return Response(event_stream(), content_type="text/event-stream")

def notify_subscribers():
    # Add a placeholder for every new update to notify
    subscribers.append(True)
 
if __name__ == '__main__':
    #start_receiver_thread()
    app.run(debug=True)