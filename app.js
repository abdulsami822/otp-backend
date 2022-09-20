require("dotenv").config();

const port = process.env.PORT;
const apiKey = process.env.VONAGE_API_KEY;
const apiSecret = process.env.VONAGE_API_SECRET;

const express = require("express");
const app = express();
app.use(express.json());

const Vonage = require("@vonage/server-sdk");
const vonage = new Vonage({
  apiKey,
  apiSecret,
});

//start server
const initializeServer = () => {
  try {
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
    const { to, text } = request.body;

    vonage.message.sendSms(from, to, text, (err, response) => {
      if (err) {
        console.log(err);
      } else {
        console.log(response);
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
