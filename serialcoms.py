import serial

# Set up serial connection (adjust COM port and baud rate as needed)
ser = serial.Serial('/dev/ttyACM0', 115200, timeout=1)

def receive_image(filename='captured_image.jpeg'):
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
    receive_image()

# Call the function to receive image
receive_image()
