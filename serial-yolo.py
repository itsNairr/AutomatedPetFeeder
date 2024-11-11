import serial
from ultralytics import YOLO
import cv2

def detect_cats(filename):
    img = cv2.imread(filename)
    if img is None:
        print("Error: Could not load image for YOLO detection.")
        return

    # Perform cat detection using YOLO
    results = model(img)

    # Display results
    for result in results:
        # You can filter out specific classes if needed (e.g., cat class)
        print(result.boxes)

def receive_image(filename='frame.jpeg'):
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
                    print("JPEG Header Detected, Image transmission started...")
                else:
                    image_data.append(ord(byte))

            elif receiving_image:
                image_data.append(ord(byte))
                
                # Check for the end of JPEG (0xFF, 0xD9)
                if len(image_data) > 1 and image_data[-2] == 0xFF and image_data[-1] == 0xD9:
                    print("JPEG End Header Detected, Image transmission ended.")
                    break

    # Save the image data to a file
    with open(filename, 'wb') as f:
        f.write(image_data)
    print(f"Image saved as {filename}")
    detect_cats(filename)
    receive_image()
    
    
    
model = YOLO('catdetect.pt')
ser = serial.Serial('COM3', 115200, timeout=1)
receive_image()
