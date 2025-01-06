const express = require("express");
const axios = require("axios");
const cors = require("cors");
const request = require("request");
require("dotenv").config();
const app = express();

const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const port = process.env.PORT || 5000;

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const frontendUrl = process.env.FRONTEND_URL;

let accessToken = "";
let access_token = "";

app.use(
  cors({
    origin: frontendUrl,
  })
);

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
  } catch (error) {
    console.error("Error fetching access token from Spotify API:", error);
  }
};

app.get("/token", async (req, res) => {
  if (!accessToken) await getAccessToken();
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
    "streaming user-library-modify user-read-email user-read-recently-played user-read-private playlist-modify-public playlist-modify-private user-follow-modify user-read-recently-played user-top-read user-follow-read user-library-read";

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

app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const response = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      data: new URLSearchParams({
        code: code,
        redirect_uri: `${frontendUrl}/auth/callback`,
        grant_type: "authorization_code",
      }),
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(clientId + ":" + clientSecret).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    access_token = response.data.access_token;
    res.redirect("/");
  } catch (error) {
    console.error("Error in callback:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to exchange authorization code for access token",
    });
  }
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
