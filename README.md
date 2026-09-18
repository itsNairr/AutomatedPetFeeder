# Automated Pet Feeder

An intelligent, connected pet feeder that combines an Arduino-powered dispensing system, camera-based cat detection, and a web dashboard for managing pets and feeding schedules.

## Features

- **Scheduled feeding** — Create, update, view, and delete feeding schedules for individual cats.
- **Cat identification** — Uses a YOLO model to recognize supported cat breeds from camera images.
- **Automatic dispensing** — Sends feeding commands to the Arduino over Wi-Fi and dispenses a configurable amount of kibble.
- **Camera streaming over serial** — The Arduino captures JPEG images and sends them to the Python backend through a serial connection.
- **Web API** — Flask endpoints for managing cats, schedules, and live schedule status.
- **Web dashboard** — Next.js frontend for interacting with the feeder system.
- **Hardware control** — Arduino controls the camera, stepper motor, servo gate, ultrasonic sensor, and Wi-Fi access point.

## System Architecture

```text
┌────────────────────┐       HTTP/API        ┌──────────────────────┐
│ Next.js Dashboard  │ ◄───────────────────► │ Flask Python Server  │
└────────────────────┘                       └──────────┬───────────┘
                                                        │
                                      Serial JPEG frames│HTTP /feed
                                                        │
                                             ┌──────────▼───────────┐
                                             │ Arduino Feeder        │
                                             │ Camera + Motor + Wi-Fi│
                                             └───────────────────────┘
```

1. The Arduino captures an image and sends it to the Python server over serial.
2. The Python server runs `catdetect.pt` with Ultralytics YOLO.
3. The detected breed is matched to a configured cat and its schedule.
4. When feeding is allowed, the server sends a `POST /feed` request to the Arduino.
5. The Arduino rotates the stepper motor and opens the servo gate to dispense kibble.

## Repository Structure

```text
.
├── arduinoserver/
│   └── arduinoserver.ino       # Arduino camera, motor, servo, and Wi-Fi server
├── frontend/
│   └── petfeedergui/            # Next.js web dashboard
├── catdetect.pt                # YOLO cat-breed detection model
├── server.py                   # Main Flask backend and detection pipeline
├── serial-yolo.py              # Standalone serial image capture and YOLO test script
├── serialcoms.py               # Serial JPEG receiver utility
├── arduinowifitest.py          # Arduino Wi-Fi/LED communication test server
├── kibbletest.py               # Arduino feeding request test script
└── test.py                     # Additional project tests/experiments
```

## Hardware

The Arduino sketch currently uses the following connections:

| Component | Pin(s) |
| --- | --- |
| Stepper motor step | `2` |
| Stepper motor direction | `3` |
| Motor enable | `4` |
| Servo gate | `6` |
| ArduCAM chip select | `7` |
| Ultrasonic trigger | `9` |
| Ultrasonic echo | `10` |

The Arduino sketch is configured to:

- Create an open Wi-Fi access point named `iAshtray`.
- Use the static IP address `192.48.56.2`.
- Listen for feeder requests on port `80`.
- Capture JPEG images at `320x240` resolution.
- Send camera frames to the host computer over serial at `115200` baud.

> **Security note:** The Wi-Fi credentials, IP address, and serial port are currently hard-coded in the source files. Change them before deploying the feeder in a shared or production environment.

## Requirements

### Backend

- Python 3.9 or newer
- Arduino connected over USB
- A serial port available at `/dev/ttyACM0` (update `server.py` for your platform)
- Python packages:
  - Flask
  - Flask-CORS
  - OpenCV
  - PySerial
  - Requests
  - Ultralytics

Install the Python dependencies with:

```bash
python -m pip install flask flask-cors opencv-python pyserial requests ultralytics
```

### Frontend

- Node.js 18 or newer
- npm or Bun

The frontend is a Next.js application located at `frontend/petfeedergui`.

### Arduino libraries and hardware

Install the libraries required by `arduinoserver/arduinoserver.ino` through the Arduino IDE or your preferred Arduino build workflow:

- WiFiS3
- ArduinoJson
- Servo
- ArduCAM
- Wire
- SPI

The sketch also expects an OV2640-compatible ArduCAM module and the connected motor, servo, and ultrasonic sensor hardware described above.

## Setup

### 1. Flash the Arduino

1. Open `arduinoserver/arduinoserver.ino` in the Arduino IDE.
2. Install the required libraries.
3. Confirm the pin assignments match your wiring.
4. Update the Wi-Fi SSID, password, and static IP if needed.
5. Select the correct board and serial port.
6. Upload the sketch to the Arduino.
7. Open the serial monitor at `115200` baud and confirm the camera and access point initialize successfully.

### 2. Configure the Python backend

Update the following values in `server.py` to match your environment:

```python
ARDUINO_IP = "192.48.56.2"
ARDUINO_PORT = 80
ser = serial.Serial('/dev/ttyACM0', 115200, timeout=1)
```

Then start the backend:

```bash
python server.py
```

The Flask server starts on its default development address. The backend begins receiving camera frames and updating feeding statuses in background threads.

### 3. Start the frontend

```bash
cd frontend/petfeedergui
npm install
npm run dev
```

Open the local URL printed by Next.js, usually `http://localhost:3000`.

For a production build:

```bash
npm run build
npm start
```

## API Reference

The Flask backend exposes the following routes:

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Check whether the backend is connected |
| `POST` | `/upload/schedule` | Add a feeding schedule |
| `PUT` | `/upload/schedule/<name>` | Update a feeding schedule |
| `GET` | `/subscribe/schedules` | Get all schedules |
| `GET` | `/subscribe/schedules/<name>` | Get one schedule |
| `DELETE` | `/delete/schedule/<name>` | Delete a schedule |
| `POST` | `/upload/cat` | Add a cat and associate its breed |
| `PUT` | `/upload/cat/<breed>` | Update a cat |
| `GET` | `/subscribe/cats` | Get all configured cats |
| `GET` | `/subscribe/cats/<breed>` | Get one cat |
| `DELETE` | `/delete/cat/<breed>` | Delete a cat |
| `GET` | `/stream/schedule` | Stream schedule updates using Server-Sent Events |

### Example: Add a cat

```bash
curl -X POST http://localhost:5000/upload/cat \
  -H "Content-Type: application/json" \
  -d '{"cat":"Timmy","breed":"Bengal"}'
```

### Example: Add a schedule

```bash
curl -X POST http://localhost:5000/upload/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Timmy",
    "schedule":{
      "Monday":[
        {"time":"08:00","kibble":10,"status":"On Time"},
        {"time":"18:00","kibble":10,"status":"On Time"}
      ]
    }
  }'
```

### Example: Feed the cat directly

The Arduino accepts feeding commands at `/feed`:

```bash
curl -X POST http://192.48.56.2/feed \
  -H "Content-Type: application/json" \
  -d '{"kibble":10}'
```

## Supported Cat Breeds

The bundled detection mapping includes:

- Abyssinian
- Bengal
- Birman
- Bombay
- British Shorthair
- Egyptian Mau
- Maine Coon
- Persian
- Ragdoll
- Russian Blue
- Siamese
- Sphynx

## Development Notes

- Schedule and cat data are currently stored in in-memory Python dictionaries, so they are lost when the backend restarts.
- The backend uses permissive CORS settings for local development.
- Feeding status is updated by a background thread every 10 seconds.
- Camera images are written to `frame.jpeg` during processing.
- The YOLO model is loaded from `catdetect.pt` in the repository root.
- Test scripts contain hard-coded network and serial settings that may need to be adjusted for your setup.

## Troubleshooting

### The backend cannot open the serial port

- Confirm the Arduino is connected.
- Check the available device name with your operating system tools.
- Update `/dev/ttyACM0` in `server.py` or the relevant test script.
- Make sure no other serial monitor or process is using the port.

### No images are detected

- Confirm the camera is initialized successfully in the Arduino serial output.
- Verify that the Arduino and Python server use `115200` baud.
- Check that the OV2640 camera and ArduCAM wiring are correct.
- Ensure `catdetect.pt` is present in the working directory used to start the server.

### Feeding requests fail

- Connect your computer to the Arduino's Wi-Fi access point.
- Confirm the configured Arduino IP address matches the address in `server.py`.
- Test the Arduino directly with the `/feed` curl command.
- Check the stepper motor, servo, enable pin, and power supply.

## License

No license has been specified for this repository yet. Add a license file before redistributing the project.
