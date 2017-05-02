import * as sequelize from "sequelize";
import {Unit} from "./Unit";

export interface Variable {
  Id?: number;
  Name: string;
  Description: string;
  Type?: VariableType;
  TypeId: number;  
}

export interface VariableInstance extends sequelize.Instance<Variable>, Variable {}
export interface VariableModel extends sequelize.Model<VariableInstance, Variable> {}

export interface VariableType {
  Id?: number;
  Measurement: string;
}

export interface VariableTypeInstance extends sequelize.Instance<VariableType>, VariableType {}
export interface VariableTypeModel extends sequelize.Model<VariableTypeInstance, VariableType> {}

export interface VariableData {
  UnitId: number;
  Unit?: Unit;
  SentTime: Date;
  VariableId: number;
  Variable?: Variable;
  ProcessedTime: Date;  
  Value: string;
}

export interface VariableDataInstance extends sequelize.Instance<VariableData>, VariableData {}
export interface VariableDataModel extends sequelize.Model<VariableDataInstance, VariableData> {}

export interface LiveUnitData {
  UnitId: number;
  Unit?: Unit;
  SentTime: Date;
  VariableId: number;
  Variable?: Variable;
  ProcessedTime: Date;  
  Value: string;
}

export interface LiveUnitDataInstance extends sequelize.Instance<LiveUnitData>, LiveUnitData {}
export interface LiveUnitDataModel extends sequelize.Model<LiveUnitDataInstance, LiveUnitData> {}