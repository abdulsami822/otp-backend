require("dotenv").config();

const port = process.env.PORT;
const apiKey = process.env.VONAGE_API_KEY;
const apiSecret = process.env.VONAGE_API_SECRET;

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const express = require("express");
const app = express();
app.use(express.json());

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
    const { to, text } = request.body;
    if (!to) {
      throw new Error("enter reciepient number");
    } else if (!text) {
      throw new Error("message is required");
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
    const { name, to, text, otp } = request.body;

    vonage.message.sendSms(from, to, text, async (err, response) => {
      if (err) {
        console.log(err);
      } else {
        //store otp in db
        const query = `INSERT INTO otp(name,time,otp) VALUES ("${name}",CURRENT_TIMESTAMP,${otp})`;
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
