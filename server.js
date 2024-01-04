const express = require("express");
const axios = require("axios");
const cors = require("cors");
const request = require("request");
require("dotenv").config();
const app = express();

const port = process.env.PORT || 5000;

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const frontendUrl = process.env.FRONTEND_URL;

let accessToken = "";
let access_token = "";
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
  res.json({
    access_token: accessToken,
  });
});

const generateRandomString = function (length) {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

app.get("/auth/login", (req, res) => {
  const scope =
    "streaming user-read-email user-read-private user-read-recently-played user-top-read";

  const state = generateRandomString(16);

  const auth_query_parameters = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: scope,
    redirect_uri: `${frontendUrl}/auth/callback`,
    state: state,
  });

  res.redirect(
    "https://accounts.spotify.com/authorize/?" +
      auth_query_parameters.toString()
  );
});

app.get("/auth/callback", (req, res) => {
  const code = req.query.code;
  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
      redirect_uri: `${frontendUrl}/auth/callback`,
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

  request.post(authOptions, (error, response, body) => {
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

app.get("/auth/logout", (req, res) => {
  access_token = "";
  res.json({ status: "success", message: "Logout successful" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  getAccessToken();
});
