require("dotenv").config();

const port = process.env.PORT;
const apiKey = process.env.VONAGE_API_KEY;
const apiSecret = process.env.VONAGE_API_SECRET;

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const cors = require("cors");
const path = require("path");
const express = require("express");

const app = express();
app.use(express.json());
app.use(cors());

let db = null;
const dbFilePath = path.join(__dirname, "message.db");

const Vonage = require("@vonage/server-sdk");
const vonage = new Vonage({
  apiKey,
  apiSecret,
});

//start server
const initializeServer = async () => {
  try {
    db = await open({
      filename: dbFilePath,
      driver: sqlite3.Database,
    });
    app.listen(port, () => {
      console.log(`server is running at ${port}`);
    });
  } catch (error) {
    console.log(`something went wrong error is ${error.message}`);
    process.exit(1);
  }
};

initializeServer();

//validate the request body
const checkRequestBody = (request, response, next) => {
  try {
    const { to, text, firstName, lastName, otp } = request.body;
    if (!to || !text || !firstName || !lastName || !otp) {
      throw new Error("enter all the required details");
    } else if (to.length != "12") {
      throw new Error("A valid phone number is required");
    } else if (to.slice(0, 1) == "+") {
      throw new Error("country code is not required");
    }
    next();
  } catch (err) {
    response.status(400);
    response.send({ error: err.message });
  }
};

//send otp API
app.post("/send-otp", checkRequestBody, async (request, response) => {
  try {
    const from = "sami";
    const { firstName, lastName, to, text, otp } = request.body;

    vonage.message.sendSms(from, to, text, async (err, response) => {
      if (err) {
        console.log(err);
      } else {
        //store otp in db
        const query = `INSERT INTO otp(first_name,last_name,time,otp) VALUES ("${firstName}","${lastName}",CURRENT_TIMESTAMP,${otp})`;
        await db.run(query);
      }
    });

    response.status(200);
    response.send({ msg: "OTP is sucessfully sent" });
  } catch (error) {
    console.log(error.message);
    response.status(500);
    response.send({ err: "unexpected error has occured" });
  }
});

//fetch all contacts API
app.get("/contacts", async (request, response) => {
  try {
    const query = `select * from contact`;
    const contacts = await db.all(query);
    response.status(200);
    response.send(contacts);
  } catch (error) {
    response.status(500);
    response.send("Something Went Wrong");
  }
});

//fetch all OTPs API
app.get("/otps", async (request, response) => {
  try {
    const query = `select * from otp`;
    const otps = await db.all(query);
    response.status(200);
    response.send(otps);
  } catch (error) {
    response.status(500);
    response.send("Something Went Wrong");
  }
});

app.get("/contact/:id/", async (request, response) => {
  try {
    const { id } = request.params;
    const query = `select * from contact where id = ${id}`;
    const result = await db.get(query);
    response.status(200);
    response.send(result);
  } catch (error) {
    response.status(404);
    response.send("requested resource not found");
  }
});
