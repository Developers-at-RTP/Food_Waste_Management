console.log("Hello Server");

// Dependencies
const express = require("express");
const morgan = require(`morgan`);
const mongoose = require(`mongoose`);

const entryRouter = require(`./entryRouter`);
const userRouter = require(`./userRouter`);
const { DATABASE_URL, PORT } = require(`./config.js`);

// Setup Dependencies
const app = express();

// Misc Middleware
app.use(morgan(`common`));
app.use(express.static("public"));

// Routing
app.use(`/users`, userRouter);
app.use(`/entries`, entryRouter);

// Open/Close Server
let server;

function runServer(database_url, port = PORT) {
  //database and port connection through config.js
  return new Promise((resolve, reject) => {
    mongoose.connect(database_url, { useNewUrlParser: true }, function (error) {
      if (error) {
        console.log(`Mongoose failed to connect.`);
        return reject(error);
      }
      server = app
        .listen(port, () => {
          console.log(`Your app is listening on port ${port}`);
          resolve();
        })
        .on("error", err => {
          mongoose.disconnect();
          console.log("Error in runServer, failed to listen at server.");
          reject(err);
        });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log(`closing server`);
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(function (err) {
    console.error(err);
  });
}

// Export App
module.exports = { app, runServer, closeServer };
