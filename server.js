const express = require("express");
const axios = require("axios");
const cors = require("cors");
const request = require("request");
const app = express();
const port = process.env.PORT || 5000;

const clientId = "15780379e12e4f7087459a01ef5d9468";
const clientSecret = "9ac76df2c3a24d58bbdee29326a70c9b";

let accessToken = "";
var access_token = "";
let tokenExpirationTime = 0;
app.use(cors());
const getAccessToken = async () => {
  try {
    const response = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      params: {
        grant_type: "client_credentials",
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      },
    });

    accessToken = response.data.access_token;
    tokenExpirationTime =
      new Date().getTime() + response.data.expires_in * 1000;
    setTimeout(getAccessToken, response.data.expires_in * 1000);
  } catch (error) {
    console.error("Error fetching access token from Spotify API:", error);
  }
};

app.get("/token", (req, res) => {
  res.send(accessToken);
});

var generateRandomString = function (length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

app.get("/auth/login", (req, res) => {
  var scope =
    "streaming \
               user-read-email \
               user-read-private";

  var state = generateRandomString(16);

  var auth_query_parameters = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: scope,
    redirect_uri: "http://localhost:3000/auth/callback",
    state: state,
  });

  res.redirect(
    "https://accounts.spotify.com/authorize/?" +
      auth_query_parameters.toString()
  );
});

app.get("/auth/callback", (req, res) => {
  console.log("hit cb");
  var code = req.query.code;

  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
      redirect_uri: "http://localhost:3000/auth/callback",
      grant_type: "authorization_code",
    },
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(clientId + ":" + clientSecret).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    json: true,
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      access_token = body.access_token;
      res.redirect("/");
    }
  });
});

app.get("/auth/token", (req, res) => {


  res.json({
    access_token: access_token,
  });
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  getAccessToken();
});
