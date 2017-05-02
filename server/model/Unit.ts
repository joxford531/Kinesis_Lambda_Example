import * as sequelize from "sequelize";

export interface Unit {
    Id?: number;
    Code: string;
    Name: string;
}

export interface UnitInstance extends sequelize.Instance<Unit>, Unit { }
export interface UnitModel extends sequelize.Model<UnitInstance, Unit> { }