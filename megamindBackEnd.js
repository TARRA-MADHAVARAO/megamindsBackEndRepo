const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const jwt = require("jsonwebtoken");
const cors = require("cors");
app.use(cors());

const dbPath = path.join(__dirname, "megamindDB.db");
let db;
initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server successfully running");
    });
  } catch (error) {
    console.log(`DB Error:${error}`);
  }
};
initializeDbAndServer();

//login API
app.post("/login", async (request, response) => {
  const userData = request.body;
  const query = `select * from login where user_name="${userData.userName}";`;
  const user = await db.get(query);
  if (user === undefined) {
    response.status(400);
    response.send("Invalid username.");
  } else {
    if (userData.password === user.password) {
      const jwtToken = jwt.sign({ userName: user.user_name }, "MADHAV_SIRI");
      response.status(200);
      response.send({ jwt_token: jwtToken });
      console.log(jwtToken);
    } else {
      response.send("Invalid Password");
    }
  }
});

app.post("/register", async (request, response) => {
  const newUser = request.body;
  const { userName, password } = newUser;
  const userQuery = `select * from login where user_name="${userName}";`;
  const user = await db.get(userQuery);
  if (user === undefined) {
    const query = `INSERT INTO login (user_name,password) VALUES ("${userName}","${password}");`;
    await db.run(query);
    response.send(`Mr.${userName}! Your Successfully Registered.`);
  } else {
    response.send("User Already Existed.Please Login.");
  }
});

//get services

app.get("/services", async (request, response) => {
  const query = `select * from services`;
  const services = await db.all(query);
  response.send(services);
});

//get projects

app.get("/projects", async (request, response) => {
  const query = `select * from projects`;
  const projects = await db.all(query);
  response.send(projects);
});

const authValid = async (request, response, next) => {
  const auth = request.headers["Authorization"];
  if (auth === undefined) {
    response.status(401);
    response.send("Unauthorized User");
  } else {
    const jwtToken = auth.split(" ")[1];
    if (jwtToken === undefined) {
      response.send("unauthenticated user");
    } else {
      jwt.verify(jwtToken, "MADHAV_SIRI", (error, user) => {
        if (error) {
          response.send("invalid jwt token");
        } else {
          next();
        }
      });
    }
  }
};

app.post("/projects", authValid, async (request, response) => {
  const projectDetails = request.body;
  const { projectId, imageUrl, name, description } = projectDetails;
  const query = `INSERT INTO projects (project_id,img_url,name,description) VALUES(${projectId},"${imageUrl}","${name}","${description}");`;
  await db.run(query);
  response.send("Project Added Successfully");
});

app.delete("/projects/:projectId", authValid, async (request, response) => {
  const { projectId } = request.params;
  const query = `DELETE FROM projects WHERE project_id=${projectId};`;
  await db.run(query);
  response.send("Project Deleted Successfully");
});
