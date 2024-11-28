#include <Wire.h>
#include <ArduCAM.h>
#include <SPI.h>
#include "memorysaver.h"

// Define constants and settings
const int CS_PIN = 7; 
bool is_header = false;

ArduCAM myCAM(OV2640, CS_PIN);

void setup() {
  uint8_t vid, pid;
  uint8_t temp;
  
  //  serial communication and SPI
  Wire.begin();
  Serial.begin(115200);
  SPI.begin();

  // initialize camera
  pinMode(CS_PIN, OUTPUT);
  digitalWrite(CS_PIN, HIGH);
  myCAM.write_reg(0x07, 0x80); // Reset the CPLD
  delay(100);
  myCAM.write_reg(0x07, 0x00);
  delay(100);

  // check SPI interface and camera are functional
  myCAM.write_reg(ARDUCHIP_TEST1, 0x55);
  temp = myCAM.read_reg(ARDUCHIP_TEST1);
  if (temp != 0x55) {
    Serial.println(F("SPI interface error"));
    while(1); //stop if error
  }
  
  myCAM.wrSensorReg8_8(0xff, 0x01);
  myCAM.rdSensorReg8_8(OV2640_CHIPID_HIGH, &vid);
  myCAM.rdSensorReg8_8(OV2640_CHIPID_LOW, &pid);
  if ((vid != 0x26) || ((pid != 0x41) && (pid != 0x42))) {
    Serial.println(F("no OV2640 module"));
    while(1); 
  }
  Serial.println(F("OV2640 camera detected"));

  // Set jpeg capture mode, resolution
  myCAM.set_format(JPEG);
  myCAM.InitCAM();
  myCAM.OV2640_set_JPEG_size(OV2640_320x240); //resolution to 320x240
  delay(3000);


  //take_and_send_photo();
  
}

void loop() {

 take_and_send_photo();

 // avoid bouncing issues
 delay(1000);
}

void take_and_send_photo() {
  // clear FIFO and start capture
  myCAM.flush_fifo();
  myCAM.clear_fifo_flag();
  myCAM.start_capture();

  // wait until capture is complete
  while (!myCAM.get_bit(ARDUCHIP_TRIG, CAP_DONE_MASK));
  //Serial.println(F("Capture Complete"));

  //start sending image data
  send_image_data();
}

void send_image_data() {
  uint8_t temp, temp_last;
  uint32_t length = myCAM.read_fifo_length();
  
  if (length >= MAX_FIFO_SIZE || length == 0) {
    Serial.println(F("Image size error"));
    myCAM.clear_fifo_flag();
    return;
  }

  myCAM.CS_LOW();
  myCAM.set_fifo_burst(); //set FIFO burst mode

  //send image over serial
  is_header = false;
  while (length--) {
    temp_last = temp;
    temp = SPI.transfer(0x00);
    if (is_header) {
      Serial.write(temp);
    } else if ((temp == 0xD8) & (temp_last == 0xFF)) { //jpeg header found
      is_header = true;
      Serial.write(temp_last);
      Serial.write(temp);
    }
    if ((temp == 0xD9) && (temp_last == 0xFF)) { //jpeg footer found
      break;
    }
  }

  myCAM.CS_HIGH();
  myCAM.clear_fifo_flag();
  is_header = false;
}
