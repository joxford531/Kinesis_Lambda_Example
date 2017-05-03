import * as sequelize from "sequelize";

import {Variable, VariableInstance, VariableModel} from "../model/Variable";
import {VariableType, VariableTypeInstance, VariableTypeModel} from "../model/Variable";
import {VariableData, VariableDataInstance, VariableDataModel} from "../model/Variable";
import {LiveUnitData, LiveUnitDataInstance, LiveUnitDataModel} from "../model/Variable";
import {Unit, UnitInstance, UnitModel} from "../model/Unit";

export class DatabaseModel {
  private static _connection: sequelize.Sequelize;
  private static _variables: VariableModel;
  private static _variabletypes: VariableTypeModel;
  private static _variabledata: VariableDataModel;
  private static _liveunitdata: LiveUnitDataModel;
  private static _units: UnitModel;

  constructor(config: any) {
    if (!DatabaseModel._connection) {
      DatabaseModel._connection = new sequelize(config.schema, config.user,
        config.password, config.connection);

      this.initializeSchema();
      this.createRelationships();
    }
  }

  public get Connection(): sequelize.Sequelize {
    return DatabaseModel._connection;
  }

  public get Variables(): VariableModel {
    return DatabaseModel._variables;
  }

  public get VariableTypes(): VariableTypeModel {
    return DatabaseModel._variabletypes;
  }

  public get VariableData(): VariableDataModel {
    return DatabaseModel._variabledata;
  }

  public get LiveUnitData(): LiveUnitDataModel {
    return DatabaseModel._liveunitdata;
  }

  public get Units(): UnitModel {
    return DatabaseModel._units;
  }

  private initializeSchema() {
    DatabaseModel._variabletypes = 
      DatabaseModel._connection.define<VariableTypeInstance, VariableType>('VariableTypes', {
        Id: {
          type: sequelize.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true
        },
        Measurement: {
          type: sequelize.STRING,
          allowNull: false
        }
      }, {
        timestamps: false
      });

    DatabaseModel._variables = 
      DatabaseModel._connection.define<VariableInstance, Variable>('Variables', {
        Id: {
          type: sequelize.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true
        },
        Code: {
          type: sequelize.STRING,
          allowNull: false
        },
        Description: {
          type: sequelize.STRING,
          allowNull: false
        },
        TypeId: {
          type: sequelize.INTEGER,
          allowNull: false
        }
      }, {
        timestamps: false
      });

    DatabaseModel._units = 
      DatabaseModel._connection.define<UnitInstance, Unit>('Units', {
        Id: {
          type: sequelize.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true
        },
        Code: {
          type: sequelize.STRING,
          allowNull: false
        },
        Name: {
          type: sequelize.STRING,
          allowNull: false
        }
      }, {
        timestamps: false
      });

    DatabaseModel._variabledata = 
      DatabaseModel._connection.define<VariableDataInstance, VariableData>('VariableData', {
        UnitId: {
          type: sequelize.INTEGER,
          allowNull: false,
          primaryKey: true
        },
        SentTime: {
          type: sequelize.DATE,
          allowNull: false,
          primaryKey: true
        },
        VariableId: {
          type: sequelize.INTEGER,
          allowNull: false,
          primaryKey: true
        },
        ProcessedTime: {
          type: sequelize.DATE,
          allowNull: false
        },
        Value: {
          type: sequelize.STRING,
          allowNull: true
        }
      }, {
        timestamps: false
      });

    DatabaseModel._liveunitdata = 
      DatabaseModel._connection.define<LiveUnitDataInstance, LiveUnitData>('LiveUnitData', {
        UnitId: {
          type: sequelize.INTEGER,
          allowNull: false,
          primaryKey: true
        },
        SentTime: {
          type: sequelize.DATE,
          allowNull: false
        },
        VariableId: {
          type: sequelize.INTEGER,
          allowNull: false,
          primaryKey: true
        },
        ProcessedTime: {
          type: sequelize.DATE,
          allowNull: false
        },
        Value: {
          type: sequelize.STRING,
          allowNull: true
        }
      }, {
        timestamps: false
      });
  }

  private createRelationships() {
    DatabaseModel._variables.belongsTo(DatabaseModel._variabletypes, { foreignKey: "TypeId" });

    DatabaseModel._variabledata.belongsTo(DatabaseModel._variables, { foreignKey: "VariableId" });
    DatabaseModel._variabledata.belongsTo(DatabaseModel._units, { foreignKey: "UnitId" });

    DatabaseModel._liveunitdata.belongsTo(DatabaseModel._variables, { foreignKey: "VariableId" });
    DatabaseModel._liveunitdata.belongsTo(DatabaseModel._units, { foreignKey: "UnitId" });
    DatabaseModel._units.hasMany(DatabaseModel._liveunitdata, { as: "LiveData", foreignKey: "UnitId" });
  }
}
