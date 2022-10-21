const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const app = express();

const clientPath = `${__dirname}/public`;
console.log(`Serving static from ${clientPath}`);

app.use(express.static(clientPath));

const server = http.createServer(app);

const io = socketio(server);

let players = [];
let TryAgainBr = 0;

let iBr = 0;
let time = 0;
let interval = setInterval;

io.on("connection", (sock) => {
  sock.on("playerName", (text) => {
    io.emit("playerName", text);
    players.push(text);

    if (players.length === 1) {
      io.emit("random", iBr);
      iBr++;
      console.log("iBr" + iBr);
    }

    sock.emit("wordChoosing", players.length - 1);
  });
  sock.on("points", ([points, pName]) => {
    io.emit("points", [points, pName]);
  });

  sock.on("chosen", (text) => {
    io.emit("chosen", text);
  });
  sock.on("tryAgain", () => {
    console.log("TryAgainBr" + TryAgainBr);
    TryAgainBr++;
    if (TryAgainBr == players.length - 1) {
      console.log("iBr" + iBr);
      io.emit("random", iBr);
      io.emit("tryAgain");
      iBr++;
      clearInterval(interval);

      if (iBr == players.length) {
        iBr = 0;
      }
    }

    if (TryAgainBr == players.length - 1) {
      TryAgainBr = 0;
    }
  });
  sock.on("tryAgainAfterWin", () => {
    console.log("TryAgainBrAW" + TryAgainBr);

    if (TryAgainBr == players.length) {
      console.log("iBr" + iBr);
      io.emit("random", iBr);
      io.emit("tryAgain");
      iBr++;

      clearInterval(interval);
      TryAgainBr = 0;
      if (iBr == players.length) {
        iBr = 0;
      }
    } else if (TryAgainBr != 0) {
      TryAgainBr++;
    }
  });
  sock.on("winner", (name) => {
    io.emit("winner", name);
  });
  sock.on("timer", () => {
    time = 200;
    interval = setInterval(() => {
      io.emit("timer", time);
      time--;
      io.emit("timer", time);
      if (time == 0) {
        clearInterval(interval);
        TryAgainBr = 0;

        io.emit("random", iBr);
        io.emit("tryAgain");
        iBr++;

        if (iBr == players.length) {
          iBr = 0;
        }
      }
    }, 1000);
  });

  sock.on("message", ([text, name]) => {
    io.emit("message", [text, name]);
  });
  sock.on("image", (data) => {
    io.emit("image", data);
  });
});

server.on("error", (err) => {
  console.error("Server error:", err);
});

server.listen(8080, () => {
  console.log("Pictionary started on 8080");
});
