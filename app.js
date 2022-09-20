require("dotenv").config();
const express = require("express");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;
const port = process.env.PORT;

const client = require("twilio")(accountSid, authToken);

const app = express();
app.use(express.json());

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

//validate the phone number from request
const checkRequestBody = (request, response, next) => {
  try {
    const { to } = request.body;
    if (to.length != "13") {
      throw new Error("A valid phone number is required");
    } else if (to.slice(0, 1) != "+") {
      throw new Error("country code is required");
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
    const { to } = request.body;
    const otpService = client.verify.v2.services(serviceSid);
    const result = await otpService.verifications.create({
      to,
      channel: "sms",
    });

    response.status(200);
    response.send({ msg: "OTP is sucessfully sent" });
    // .verifications.create({ to, channel: "sms" })
    // .then((verification) => console.log(verification.sid));
  } catch (error) {
    console.log(error.message);
    response.status(500);
    response.send({ err: "unexpected error has occured" });
  }
});
