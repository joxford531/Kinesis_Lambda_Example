#include <OneWire.h>
#include <DallasTemperature.h>

#define ONE_WIRE_BUS 2
#define dht_dpin A5
#define photocellPin A0
byte bGlobalErr;
byte dht_dat[5];

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

void setup(void) {
  InitDHT();
  Serial.begin(9600);
  delay(300);
  sensors.begin();
}

void loop(void) {
  ReadDHT();
  if(bGlobalErr == 0) {
    sensors.requestTemperatures();
    char temp[6];
    dtostrf(sensors.getTempFByIndex(0), 4, 2, temp);
    String str(temp);
    String humidity = String(dht_dat[0]) + String(".") + String(dht_dat[1]);
    String dhtTempStr = String(dht_dat[2]) + String(".") + String(dht_dat[3]);
    float dhtTemp = (dhtTempStr.toFloat() * 1.8) + 32;
    Serial.println(temp + String(",") + String(dhtTemp) + String(",") + humidity + String(",") + String(analogRead(photocellPin)));
    delay(500);
  } else {
    switch(bGlobalErr) {
      case 1:
        Serial.println("Error 1: DHT start condition 1 not met.");
        break;
      case 2:
        Serial.println("Error 2: DHT start condition 2 not met.");
        break;
      case 3:
        Serial.println("Error 3: DHT checksum error.");
        break;
      default:
        Serial.println("Error: Unrecognized code encountered.");
        break;
    }
    delay(500); 
  }
}

void InitDHT(){
   pinMode(dht_dpin,OUTPUT);
        digitalWrite(dht_dpin,HIGH);
}


void ReadDHT(){
  bGlobalErr = 0;
  byte dht_in;
  byte i;
  digitalWrite(dht_dpin,LOW);
  delay(20);

  digitalWrite(dht_dpin,HIGH);
  delayMicroseconds(40);
  pinMode(dht_dpin,INPUT);
  //delayMicroseconds(40);
  dht_in = digitalRead(dht_dpin);
  
  if(dht_in){
    bGlobalErr=1;
    return;
  }
  delayMicroseconds(80);
  dht_in = digitalRead(dht_dpin);
  
  if(!dht_in){
    bGlobalErr=2;
    return;
  }
  delayMicroseconds(80);
  for (i=0; i<5; i++)
     dht_dat[i] = read_dht_dat();
  pinMode(dht_dpin,OUTPUT);
  digitalWrite(dht_dpin,HIGH);
  byte dht_check_sum = 
    dht_dat[0]+dht_dat[1]+dht_dat[2]+dht_dat[3];
  if(dht_dat[4] != dht_check_sum){ 
    bGlobalErr=3;
  }
};

byte read_dht_dat(){
  byte i = 0;
  byte result=0;
  for(i=0; i< 8; i++){
    while(digitalRead(dht_dpin)==LOW);
    delayMicroseconds(30);
    if (digitalRead(dht_dpin)==HIGH)
      result |=(1<<(7-i));
    while (digitalRead(dht_dpin)==HIGH);
  }
  return result;
}
