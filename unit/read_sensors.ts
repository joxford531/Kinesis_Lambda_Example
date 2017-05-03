import * as AWS from "aws-sdk";
import * as five from "johnny-five";
import * as moment from "moment";
import * as Raspi from "raspi-io";
import * as SerialPort from "serialport";
const config = require("./config.json");
const Readline = SerialPort.parsers.Readline;

let boardReady = false;
let portReady = false;
let flatDataState = false;

const board = new five.Board({
  io: new Raspi({enableSoftPwm: true})
});

const port = new SerialPort('/dev/ttyACM0', {
  baudRate: 9600
});

const parser = port.pipe(Readline({delimiter: '\r\n'}));

const kinesis = new AWS.Kinesis({
  credentials: new AWS.Credentials({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey
  }),
  endpoint: config.kinesisEndPoint,
  region: config.kinesisRegion
});

port.on('open', () => {
  console.log("Arduino port open");
  portReady = true;
});

board.on("ready", () => {
  console.log("Board ready");
  boardReady = true;

  let button = new five.Button({pin: "GPIO4", holdTime: 300});
  let led = new five.Led.RGB({
    pins: {
      red: "GPIO5",
      green: "GPIO6",
      blue: "GPIO13"
    },
    isAnode: true
  });

  let ledColor = "crimson";

  led.on();
  led.color(ledColor);
  led.intensity(50);
  
  button.on("up", () => {
    flatDataState = !flatDataState;
    
    if(ledColor === "crimson")
      ledColor = "darkturquoise";
    else
      ledColor = "crimson";

    led.color(ledColor);
  });

  parser.on('data', (data: Buffer) => {
    if(portReady && boardReady) {
      let values = data.toString('utf-8').split(',');
      if(values[0].toLowerCase().indexOf("error") > -1) {
        console.error("Arduino Error");
      } else {
        if(flatDataState){
          let recordsToSend = [
            {
              UnitCode: "Unit01",
              Timestamp: moment().toISOString(),
              Data: [
                {VariableCode: "Temp1", Value: values[0]},
                {VariableCode: "Temp2", Value: values[1]},
                {VariableCode: "Humd", Value: values[2]},
                {VariableCode: "Light", Value: values[3]}
              ]
            },
            {
              UnitCode: "Unit02",
              Timestamp: moment().toISOString(),
              Data: [
                {VariableCode: "Temp1", Value: values[0]},
                {VariableCode: "Temp2", Value: values[1]},
                {VariableCode: "Humd", Value: values[2]},
                {VariableCode: "Light", Value: values[3]}
              ]
            }
          ]
          kinesis.putRecords({
            Records: recordsToSend.map(record => {
              return {
                Data: JSON.stringify(record),
                PartitionKey: record.UnitCode                
              }
            }),
            StreamName: config.kinesisStreamName
          }, (err, data) => {
            if(!err) {
              console.log("sent records: " + JSON.stringify(recordsToSend));
            } else {
              console.error("error: ", err);
            }
          });
        } else {
          let recordsToSend: {UnitCode: string, VariableCode: string, Value: string, Timestamp: string}[] = [];
          for(let i = 0; i < 4; i++) {
            switch(i) {
              case 0:
                recordsToSend.push(
                  { UnitCode: "Unit01", VariableCode: "Temp1", Value: values[i], Timestamp: moment().toISOString() }
                );
                recordsToSend.push(
                  { UnitCode: "Unit02", VariableCode: "Temp1", Value: values[i], Timestamp: moment().toISOString() }
                );
              case 1:
                recordsToSend.push(
                  { UnitCode: "Unit01", VariableCode: "Temp2", Value: values[i], Timestamp: moment().toISOString() }
                );
                recordsToSend.push(
                  { UnitCode: "Unit02", VariableCode: "Temp2", Value: values[i], Timestamp: moment().toISOString() }
                );
              case 2:
                recordsToSend.push(
                  { UnitCode: "Unit01", VariableCode: "Humd", Value: values[i], Timestamp: moment().toISOString() }
                );
                recordsToSend.push(
                  { UnitCode: "Unit02", VariableCode: "Humd", Value: values[i], Timestamp: moment().toISOString() }
                );
              case 3:
                recordsToSend.push(
                  { UnitCode: "Unit01", VariableCode: "Light", Value: values[i], Timestamp: moment().toISOString() }
                );
                recordsToSend.push(
                  { UnitCode: "Unit02", VariableCode: "Light", Value: values[i], Timestamp: moment().toISOString() }
                );
            }
          }
          kinesis.putRecords({
            Records: recordsToSend.map(record => {
              return {
                Data: JSON.stringify(record),
                PartitionKey: record.UnitCode                
              }
            }),
            StreamName: config.kinesisStreamName
          }, (err, data) => {
            if(!err) {
              console.log("sent record: " + JSON.stringify(recordsToSend));
            } else {
              console.error("error: ", err);
            }
          });
        } 
      }           
    }
  });
});