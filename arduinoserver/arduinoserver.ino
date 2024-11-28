#include "WiFiS3.h"
#include <ArduinoJson.h>
#include <Servo.h>
#include <Wire.h>
#include <ArduCAM.h>
#include <SPI.h>
#include "memorysaver.h"

// CAMERA----------------------------
//  Define constants and settings
const int CS_PIN = 7;
bool is_header = false;

ArduCAM myCAM(OV2640, CS_PIN);

void take_and_send_photo()
{
  // clear FIFO and start capture
  myCAM.flush_fifo();
  myCAM.clear_fifo_flag();
  myCAM.start_capture();

  // wait until capture is complete
  while (!myCAM.get_bit(ARDUCHIP_TRIG, CAP_DONE_MASK))
    ;
  // Serial.println(F("Capture Complete"));

  // start sending image data
  send_image_data();
}

void send_image_data()
{
  uint8_t temp, temp_last;
  uint32_t length = myCAM.read_fifo_length();

  if (length >= MAX_FIFO_SIZE || length == 0)
  {
    Serial.println(F("Image size error"));
    myCAM.clear_fifo_flag();
    return;
  }

  myCAM.CS_LOW();
  myCAM.set_fifo_burst(); // set FIFO burst mode

  // send image over serial
  is_header = false;
  while (length--)
  {
    temp_last = temp;
    temp = SPI.transfer(0x00);
    if (is_header)
    {
      Serial.write(temp);
    }
    else if ((temp == 0xD8) & (temp_last == 0xFF))
    { // jpeg header found
      is_header = true;
      Serial.write(temp_last);
      Serial.write(temp);
    }
    if ((temp == 0xD9) && (temp_last == 0xFF))
    { // jpeg footer found
      break;
    }
  }

  myCAM.CS_HIGH();
  myCAM.clear_fifo_flag();
  is_header = false;
}

//-------------------------

// MOTOR--------------------
#define STEP_PIN 2
#define DIR_PIN 3
#define trig 9
#define echo 10
#define enable 4

float duration;
float distance;
Servo gtservo;
int startup_toggle = 0;

int movestep(int steps, int dir)
{ // dir = 0 for clockwire and 1 for counter-clockwise
  if (dir == 1)
  {
    digitalWrite(DIR_PIN, HIGH);
  }
  else
  {
    digitalWrite(DIR_PIN, LOW);
  }
  for (int i = 0; i < steps; i++)
  {
    digitalWrite(STEP_PIN, HIGH);
    delayMicroseconds(4000);
    digitalWrite(STEP_PIN, LOW);
    delayMicroseconds(4000);
  }
  return 1;
}

float readultra()
{
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  duration = pulseIn(echo, HIGH);
  distance = duration * 0.034 / 2;
  return distance;
}

void feedamount(int num)
{
  digitalWrite(enable, LOW);
  int results = movestep(num * 10, 0);
  if (results == 1)
  {
    delay(500);
    gtservo.write(90); // opens servo
    delay(3000);
    gtservo.write(0); // closed servo
  }
  digitalWrite(enable, HIGH);
}
//---------------------------

// WIFI--------------
char ssid[] = "iAshtray";
char pass[] = "";
int keyIndex = 0;

int led = LED_BUILTIN;
int status = WL_IDLE_STATUS;
WiFiServer server(80);
//---------------------

void setup()
{

  uint8_t vid, pid;
  uint8_t temp;

  // serial communication and SPI
  Wire.begin();
  Serial.begin(115200);
  SPI.begin();

  // initialize camera
  pinMode(CS_PIN, OUTPUT);
  pinMode(enable, OUTPUT);
  digitalWrite(CS_PIN, HIGH);
  digitalWrite(enable, HIGH);
  myCAM.write_reg(0x07, 0x80); // Reset the CPLD
  delay(100);
  myCAM.write_reg(0x07, 0x00);
  delay(100);

  // check SPI interface and camera are functional
  myCAM.write_reg(ARDUCHIP_TEST1, 0x55);
  temp = myCAM.read_reg(ARDUCHIP_TEST1);
  if (temp != 0x55)
  {
    Serial.println(F("SPI interface error"));
    while (1)
      ; // stop if error
  }

  myCAM.wrSensorReg8_8(0xff, 0x01);
  myCAM.rdSensorReg8_8(OV2640_CHIPID_HIGH, &vid);
  myCAM.rdSensorReg8_8(OV2640_CHIPID_LOW, &pid);
  if ((vid != 0x26) || ((pid != 0x41) && (pid != 0x42)))
  {
    Serial.println(F("no OV2640 module"));
    while (1)
      ;
  }
  Serial.println(F("OV2640 camera detected"));

  // Set jpeg capture mode, resolution
  myCAM.set_format(JPEG);
  myCAM.InitCAM();
  myCAM.OV2640_set_JPEG_size(OV2640_320x240); // resolution to 320x240

  pinMode(trig, OUTPUT);
  pinMode(echo, INPUT);
  pinMode(STEP_PIN, OUTPUT);
  pinMode(DIR_PIN, OUTPUT);
  gtservo.attach(6);
  gtservo.write(0);

  while (!Serial)
  {
    ; // wait for serial port to connect. Needed for native USB port only
  }
   Serial.println("Access Point Web Server");

  // check for the WiFi module:
  if (WiFi.status() == WL_NO_MODULE)
  {
    // Serial.println("Communication with WiFi module failed!");
    //  don't continue
    while (true)
      ;
  }

    String fv = WiFi.firmwareVersion();
    if (fv < WIFI_FIRMWARE_LATEST_VERSION) {
      Serial.println("Please upgrade the firmware");
    }

  // by default the local IP address will be 192.168.4.1
  // you can override it with the following:
  WiFi.config(IPAddress(192, 48, 56, 2));

  // print the network name (SSID);
    Serial.print("Creating access point named: ");
    Serial.println(ssid);

  // Create open network. Change this line if you want to create an WEP network:
  status = WiFi.beginAP(ssid, pass);
  if (status != WL_AP_LISTENING)
  {
     Serial.println("Creating access point failed");
    //  don't continue
    while (true)
      ;
  }

  // wait 10 seconds for connection:
  delay(10000);

  // start the web server on port 80
  server.begin();

  // you're connected now, so print out the status
  printWiFiStatus();
}

void loop()
{
//     // compare the previous status to the current status
//    if (status != WiFi.status()) {
//      // it has changed update the variable
//      status = WiFi.status();
//  
//      if (status == WL_AP_CONNECTED) {
//        // a device has connected to the AP
//        Serial.println("Device connected to AP");
//      } else {
//        // a device has disconnected from the AP, and we are back in listening mode
//        Serial.println("Device disconnected from AP");
//      }
//    }

  WiFiClient client = server.available(); // Listen for incoming clients

  if (client)
  {
    // Serial.println("New client connected");
    String currentLine = "";
    String requestPath = "";
    String requestBody = "";
    
    bool isPost = false;
    bool bodyStart = false;

    // Read the request
    while (client.connected())
    {
      if (client.available())
      {
        char c = client.read();

        if (bodyStart)
        {
          requestBody += c; // Capture request body
        }

        if (c == '\n' && currentLine.length() == 0)
        {
          bodyStart = true; // Body starts after a blank line
        }
        else if (c == '\n')
        {
          // Process the first line to get the method and path
          if (currentLine.startsWith("POST"))
          {
            isPost = true;
            int firstSpace = currentLine.indexOf(' ');
            int secondSpace = currentLine.indexOf(' ', firstSpace + 1);
            requestPath = currentLine.substring(firstSpace + 1, secondSpace);
          }
          currentLine = "";
        }
        else if (c != '\r')
        {
          currentLine += c;
        }
      }
    }

    // Handle POST request
    if (isPost && requestPath == "/feed")
    {
      // Process the POST request
      // Parse JSON from the request body
      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, requestBody);

      if (!error)
      {
        int kibble = doc["kibble"]; // Extract "kibble" value

        //Serial.println(kibble);
        
        // Respond to the client
        client.println("HTTP/1.1 200 OK");
        client.println("Content-Type: application/json");
        client.println("Connection: close");
        client.println();
        client.println("{\"status\":\"Cat Fed\"}");
        
        feedamount(kibble);
      }
      else
      {
        // Respond with an error
        client.println("HTTP/1.1 400 Bad Request");
        client.println("Content-Type: application/json");
        client.println("Connection: close");
        client.println();
        client.println("{\"error\":\"Invalid JSON\"}");
      }
    }
    else
    {
      // Respond to invalid requests
      client.println("HTTP/1.1 404 Not Found");
      client.println("Content-Type: text/plain");
      client.println("Connection: close");
      client.println();
      client.println("Not Found");
    }

    // Close the connection
    client.stop();
    Serial.println("Client disconnected");
  }
  take_and_send_photo();

  // avoid bouncing issues
  delay(3000);
}

void printWiFiStatus()
{
  // print the SSID of the network you're attached to:
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());

  // print your WiFi shield's IP address:
  IPAddress ip = WiFi.localIP();
  Serial.print("IP Address: ");
  Serial.println(ip);

  // print where to go in a browser:
  Serial.print("To see this page in action, open a browser to http://");
  Serial.println(ip);
}
