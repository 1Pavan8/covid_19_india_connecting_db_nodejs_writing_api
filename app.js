const exp = require("express");
const app = exp();
const { open } = require("sqlite");
const path = require("path");
const dbpath = path.join(__dirname, "covid19India.db");
const sqlite3 = require("sqlite3");
app.use(exp.json());
let db = null;

const initialize = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
    console.log("staart");
  } catch (e) {
    console.log(`Error DB : ${e.message}`);
    process.exit(1);
  }
};

initialize();

const statedetfn = (dbobj) => {
  return {
    stateId: dbobj.state_id,
    stateName: dbobj.state_name,
    population: dbobj.population,
  };
};

const distrfn = (dbobj) => {
  return {
    districtId: dbobj.district_id,
    districtName: dbobj.district_name,
    stateId: dbobj.state_id,
    cases: dbobj.cases,
    cured: dbobj.cured,
    active: dbobj.active,
    deaths: dbobj.deaths,
  };
};

app.get("/states/", async (req, resp) => {
  const getstate = `SELECT * FROM state`;
  const stated = await db.all(getstate);
  resp.send(stated.map((state) => statedetfn(state)));
});

app.get("/states/:stateId/", async (req, resp) => {
  const { stateId } = req.params;
  const getstateq = `SELECT * FROM state 
    WHERE state_id='${stateId}';`;
  const state = await db.get(getstateq);
  resp.send(statedetfn(state));
});

app.post("/districts/", async (req, resp) => {
  const districtd = req.body;
  const { districtName, stateId, cases, cured, active, deaths } = districtd;
  const distradd = `INSERT INTO district (district_name,state_id,cured,active,deaths)
    VALUES ('${districtName}','${stateId}','${cured}','${active}','${deaths}');`;
  const district = await db.run(distradd);
  const districtId = district.lastID;
  //console.log(districtId);
  resp.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (req, resp) => {
  const { districtId } = req.params;
  const getdistrict = `SELECT * FROM district 
    WHERE district_id='${districtId}';`;
  const dist = await db.get(getdistrict);
  resp.send(distrfn(dist));
});

app.delete("/districts/:districtId/", async (req, resp) => {
  const { districtId } = req.params;
  const delq = `DELETE FROM district 
  WHERE district_id=${districtId};`;
  await db.run(delq);
  resp.send("District Removed");
});
app.put("/districts/:districtId/", async (req, resp) => {
  const { districtId } = req.params;
  const districtd = req.body;
  const { districtName, stateId, cases, cured, active, deaths } = districtd;
  const getdistrict = `UPDATE district SET district_name='${districtName}',
  state_id='${stateId}',cases='${cases}',cured='${cured}',
  active='${active}',deaths='${deaths}'
  WHERE district_id='${districtId}';`;
  await db.get(getdistrict);
  resp.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (req, resp) => {
  const { stateId } = req.params;
  const statsq = `SELECT SUM(cases) AS totalCases,SUM(cured) AS totalCured,
  SUM(active) AS totalActive,SUM(deaths) AS totalDeaths
    FROM district WHERE state_id='${stateId}';`;
  const stats = await db.get(statsq);
  resp.send(stats);
});

app.get("/districts/:districtId/details/", async (req, resp) => {
  const { districtId } = req.params;
  const getstatenameq = `SELECT state_name AS stateName FROM state NATURAL JOIN district
    WHERE district_id='${districtId}';`;
  const statename = await db.get(getstatenameq);
  resp.send(statename);
});

module.exports = app;
