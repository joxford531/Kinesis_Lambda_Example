import * as express from "express";
import {DatabaseModel} from "./repository/SequelizeModel";
const config = require("./config.json");
const app = express();

const db = new DatabaseModel(config);
db.Connection.sync().then(() => {
  app.listen(3000);
  console.log("Server is listening on port 3000");
});