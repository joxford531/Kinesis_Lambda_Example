import * as aws from "aws-sdk";
import * as AWSLambda from "aws-lambda";
import * as moment from "moment";
import {DatabaseModel} from "./repository/SequelizeModel";
import {VariableData} from "./model/Variable";
const config = require("./config.json");

const db = new DatabaseModel(config);

interface KinesisEvent {
  Records: { kinesis: { data: string } }[];
}

interface IncomingVariable {
  UnitCode: string;
  VariableCode: string;
  Value: string;
  Timestamp: string;
}

interface GroupedVariable {
  UnitCode: string;
  Data: {VariableCode: string; Value: string;} [];
  Timestamp: string;
}

interface Lookup {
  Id: number;
  Code: string;
}

export class VariableProcessor {
  public static unitLookup: { [UnitCode: string]: Lookup } = {};
  public static variableLookup: { [VariableCode: string]: Lookup } = {};

  public static async handler(event: KinesisEvent, context: AWSLambda.Context, callback: AWSLambda.Callback) {
    if(!!event && !!event.Records && event.Records.length > 0) {
      const records: IncomingVariable[] = [];
      const groupedRecords: GroupedVariable[] = [];

      // Kinesis records are in base64 format, we need to convert them to parseable strings
      event.Records.forEach(record => {
        const decodedStr = new Buffer(record.kinesis.data, "base64").toString("utf8");
        const recordToProcess: {} = JSON.parse(decodedStr);

        if(recordToProcess.hasOwnProperty("Data")){
          groupedRecords.push(recordToProcess as GroupedVariable);
        } else {
          records.push(recordToProcess as IncomingVariable);
        }        
      });

      if(groupedRecords.length > 0) {
        let groupedRecordsToConcat: IncomingVariable[] = [];

        groupedRecords.forEach(group => {
          group.Data.forEach(item => {
            groupedRecordsToConcat.push({
              UnitCode: group.UnitCode,
              Timestamp: group.Timestamp,
              VariableCode: item.VariableCode,
              Value: item.Value
            });
          });
        });
        records.concat(groupedRecordsToConcat);
      }

      await VariableProcessor.performLookups(records);
      await VariableProcessor.processRecords(records);

      callback(null, `Successfully processed ${event.Records.length} records.`);
    } else {
      // fail the Lambda invocation if there are no records
      callback(new Error("Kinesis data did not contain any records"), null);
    }
  }

  public static performLookups(records: IncomingVariable[]): Promise<void[]> {
    const lookups = [];
    records.forEach(record => {
      if(VariableProcessor.unitLookup[record.UnitCode] === undefined) {
        VariableProcessor.unitLookup[record.UnitCode] = null; // insert placeholder to prevent duplicate lookups

        lookups.push(
          db.Units.findOne({
            where: {
              Code: record.UnitCode
            }
          })
          .then(unit => {
            if(unit) {
              VariableProcessor.unitLookup[record.UnitCode] = {
                Id: unit.get("Id"),
                Code: record.UnitCode
              }
            } else {
              delete VariableProcessor.unitLookup[record.UnitCode];
              console.error("Unable to find Unit in database with code: " + record.UnitCode);
            }
          })
          .catch(err => {
            console.error("Unit lookup failed: ", err);
            delete VariableProcessor.unitLookup[record.UnitCode];
          })
        );
      }

      if(VariableProcessor.variableLookup[record.VariableCode] === undefined) {
        VariableProcessor.variableLookup[record.VariableCode] = null; // insert placeholder to prevent duplicate lookups

        lookups.push(
          db.Variables.findOne({
            where: {
              Code: record.VariableCode
            }
          })
          .then(variable => {
            if(variable) {
              VariableProcessor.variableLookup[record.VariableCode] = {
                Id: variable.get("Id"),
                Code: record.VariableCode
              }
            } else {
              delete VariableProcessor.variableLookup[record.VariableCode];
              console.error("Unable to find Variable in database with code: " + record.VariableCode);
            }
          })
          .catch(err => {
            console.error("Variable lookup failed: ", err);
            delete VariableProcessor.variableLookup[record.VariableCode];
          })
        );
      }
    });

    return Promise.all(lookups);
  }

  public static processRecords(records: IncomingVariable[]): Promise<void[]> {
    const requests = [];
    let validItems: IncomingVariable[] = [];
    const recordsToCreate: VariableData[] = [];

    // filter out any variables or units that weren't found
    validItems = records.filter(record => {
      return VariableProcessor.unitLookup[record.UnitCode] &&
        VariableProcessor.variableLookup[record.VariableCode];
    });

    // shape data
    validItems.forEach(item => {
      recordsToCreate.push({
        UnitId: VariableProcessor.unitLookup[item.UnitCode].Id,
        SentTime: moment(item.Timestamp).toDate(),
        VariableId: VariableProcessor.variableLookup[item.VariableCode].Id,
        ProcessedTime: moment().toDate(),
        Value: item.Value
      });
    });

    // insert/update records in DB    
    requests.push(
      db.VariableData.bulkCreate(recordsToCreate)
    );

    requests.push(
      db.LiveUnitData.bulkCreate(recordsToCreate, { updateOnDuplicate: ["SentTime", "ProcessedTime", "Value"] })
    );

    return Promise.all(requests);
  }
}