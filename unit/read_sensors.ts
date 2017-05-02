import * as five from "johnny-five";
import * as Raspi from "raspi-io";
import * as moment from "moment";
import * as SerialPort from "serialport";
const Readline = SerialPort.parsers.Readline;

let boardReady = false;
let portReady = false;
let flatDataState = true;

const board = new five.Board({
  io: new Raspi()
});

const port = new SerialPort('/dev/ttyACM0', {
  baudRate: 9600
});

const parser = port.pipe(Readline({delimiter: '\r\n'}));

port.on('open', () => {
  console.log("Arduino port open");
  portReady = true;
});

board.on("ready", () => {
  console.log("Board ready");
  boardReady = true;
  let button = new five.Button({pin: "GPIO4", holdTime: 300});
  
  button.on("up", () => {
    flatDataState = !flatDataState;
  });

  parser.on('data', (data) => {
    if(portReady && boardReady) {
      let values = data.toString('utf-8').split(',');

      if(flatDataState){
        let record = {
          Temp1: values[0],
          Temp2: values[1],
          Humidity: values[2],
          Light: values[3],
          Time: moment().toISOString()
        }
        console.log(JSON.stringify(record));
      } else {
        for(let i = 0; i < 4; i++) {
          let record;
          switch(i) {
            case 0:
              record = { Temp1: values[i], Time: moment().toISOString() };
              break;
            case 1:
              record = { Temp2: values[i], Time: moment().toISOString() };
              break;
            case 2:
              record = { Humidity: values[i], Time: moment().toISOString() };
              break;
            case 3:
              record = { Light: values[i], Time: moment().toISOString() };
              break;
          }
          console.log(JSON.stringify(record));
        }
      }      
    }
  });
});