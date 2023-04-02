const express = require("./node_modules/express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbpath = path.join(__dirname, "/covid19India.db");
let db = null;

async function initialSetUP() {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server started at port 3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
}

initialSetUP();

const snakeToCamelForState = (object) => {
  return {
    stateId: object.state_id,
    stateName: object.state_name,
    population: object.population,
  };
};

const snakeToCamelForDistrict = (object) => {
  return {
    districtId: object.district_id,
    districtName: object.district_name,
    stateId: object.state_id,
    cases: object.cases,
    cured: object.cured,
    active: object.active,
    deaths: object.deaths,
  };
};

//first api
app.get("/states/", async (req, res) => {
  const bringAllStates = `SELECT * FROM state`;
  const listOfStates = await db.all(bringAllStates);
  const anotherList = [];
  for (let each of listOfStates) {
    let temp = snakeToCamelForState(each);
    anotherList.push(temp);
  }
  res.send(anotherList);
});

//second api
app.get("/states/:stateId/", async (req, res) => {
  const { stateId } = req.params;
  const bringSpecificState = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const state = await db.get(bringSpecificState);
  const temp = snakeToCamelForState(state);
  res.send(temp);
});

//third api giving problem
app.post("/districts/", async (req, res) => {
  const newDistrict = req.body;
  const { districtName, stateId, cases, cured, active, deaths } = newDistrict;
  const addNewDistrictQuery = `INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
VALUES ('${districtName}', '${stateId}','${cases}', '${cured}', '${active}', '${deaths}');`;
  await db.run(addNewDistrictQuery);
  res.send("District Successfully Added");
});

//fourth api
app.get("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const bringDistrictQuery = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const specificDistrict = await db.get(bringDistrictQuery);
  const temp = snakeToCamelForDistrict(specificDistrict);
  res.send(temp);
});

//fifth api
app.delete("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const query = `DELETE FROM district
WHERE district_id = ${districtId};`;
  await db.run(query);
  res.send("District Removed");
});

//sixth api
app.put("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const districtDetails = req.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const UpdateQuery = `UPDATE district
SET district_name = '${districtName}',
    state_id = '${stateId}',
    cases = '${cases}',
    cured = '${cured}',
    active = '${active}',
    deaths = '${deaths}'
WHERE
    district_id = ${districtId};`;
  await db.run(UpdateQuery);
  res.send("District Details Updated");
});

//seventh api
app.get("/states/:stateId/stats/", async (req, res) => {
  const { stateId } = req.params;
  const query = `SELECT cases, cured, active, deaths FROM district
    WHERE state_id = ${stateId};`;
  const dataList = await db.all(query);
  function change() {
    return {
      totalCases: 0,
      totalCured: 0,
      totalActive: 0,
      totalDeaths: 0,
    };
  }
  const newData = change();
  for (let each of dataList) {
    newData.totalCases = newData.totalCases + each.cases;
    newData.totalCured = newData.totalCured + each.cured;
    newData.totalActive = newData.totalActive + each.active;
    newData.totalDeaths = newData.totalDeaths + each.deaths;
  }
  res.send(newData);
});

//eighth api
app.get("/districts/:districtId/details/", async (req, res) => {
  const { districtId } = req.params;
  const query = `SELECT state_name
    FROM (district INNER JOIN state on district.state_id = state.state_id)
    WHERE district_id = ${districtId};`;
  const object = await db.get(query);
  function change(object) {
    return {
      stateName: object.state_name,
    };
  }
  let temp = change(object);
  res.send(temp);
});

module.exports = app;
