const canvas = document.querySelector("#myCanvas");
const colorRange = document.getElementById("colorRange");
const penSizeRange = document.getElementById("penSize");
const choiceBox = document.getElementById("choiceBox");
const mainColors = document.getElementsByClassName("colorChoices");
const reset = document.getElementById("reset");
const choseWord = document.getElementById("choseWord");
const choseWordBox = document.getElementById("choseWordBox");
const choseName = document.getElementById("choseName");
const choseNameBox = document.getElementById("choseNameBox");
const nameForm = document.getElementById("nameForm");
const chatWrite = document.getElementById("chatWrite");
const nameWriten = document.getElementById("nameWriten");
const playBtn = document.getElementById("play");
const winnerAlert = document.getElementById("winner");
const winnerAlertBox = document.getElementById("winner");
const whoWonDiv = document.getElementById("whoWon");
const tryAgainBtn = document.getElementById("try");
const timerBox = document.getElementById("timer");
const pointsBox = document.getElementById("points");
const chat = document.querySelector("#chat");
let requestedWord = " ";
let yourName = "";
let winnerName = "";
let random = 99;
let yourId = 99;
let color = "black";
let size = 5;
let backgroundColor = "white";
const ctx = canvas.getContext("2d");
let painting = false;
const sock = io();

let yourPoints = 0;
const getWords = (id) => {
  clearCanvas();
  getImage();
  removeDisabled();
  console.log(id);
  yourId = id;
  console.log(random);
  if (id == random) {
    choseWord.style.display = "flex";
    chatWrite.classList.add("disabled-state");

    fetch("words.json")
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        displayWords(response);
      });
  } else {
    choiceBox.style.display = "none";
    canvas.classList.add("disabled-state");
    reset.classList.add("disabled-state");
  }
};
playBtn.addEventListener("click", function () {
  let required = /^([A-z0-9]+\s*)+$/;
  yourName = nameWriten.value;
  if (required.test(yourName)) {
    choseName.style.display = "none";
    console.log(yourName);
    sock.emit("playerName", yourName);
  }
});
tryAgainBtn.addEventListener("click", function () {
  winnerAlert.style.display = "none";
  chat.innerHTML = "";

  sock.emit("tryAgainAfterWin");
  writeEvent(["Welcome to pictionary", "Game"]);
});
canvas.addEventListener("click", getImage);
function getImage() {
  sock.emit("image", canvas.toDataURL());
}
reset.addEventListener("click", function () {
  clearCanvas();
  getImage();
});
colorRange.addEventListener("change", function () {
  color = this.value;
});
penSizeRange.addEventListener("change", function () {
  size = this.value;
});
canvas.addEventListener("mousedown", startPosition);
canvas.addEventListener("mouseup", finishedPosition);
canvas.addEventListener("mousemove", draw);

window.addEventListener("resize", resizing);

function displayWords(words) {
  let br = 0;
  console.log(words);
  let niz = words;
  choseWordBox.innerHTML = "";
  let length = niz.length;
  while (niz.length > length - 3) {
    let rand = Math.floor(Math.random() * niz.length);
    console.log("rand " + rand);
    br = 0;

    niz.forEach((element) => {
      console.log(element);
      br++;
      if (element.id == rand) {
        choseWordBox.innerHTML += `<div class='chosenWord'>${element.word}</div>`;

        niz.splice(br - 1, 1);
        console.log("br-1 " + (br - 1));
        console.log(niz);
        br = 0;
      }
    });
  }
  let chosenWordClass = document.getElementsByClassName("chosenWord");
  for (let i = 0; i < chosenWordClass.length; i++) {
    chosenWordClass[i].addEventListener("click", function () {
      sock.emit("timer");

      sock.emit("chosen", this.innerText);
      choseWord.style.display = "none";
    });
  }
}
const changeChosen = (word) => {
  requestedWord = word;
};
function removeDisabled() {
  canvas.classList.remove("disabled-state");
  chatWrite.classList.remove("disabled-state");
  reset.classList.remove("disabled-state");
  choiceBox.style.display = "flex";
}

for (let i = 0; i < mainColors.length; i++) {
  mainColors[i].addEventListener("click", function () {
    color = this.style.backgroundColor;
  });
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = backgroundColor;
}

function resizing() {
  canvas.height = window.innerHeight - 155;
  canvas.width = window.innerWidth - 300;
}

ctx.fillStyle = backgroundColor;
resizing();

function startPosition(e) {
  painting = true;
  draw(e);
}
function finishedPosition() {
  painting = false;
  ctx.beginPath();
}
function draw(e) {
  if (!painting) return;
  ctx.lineWidth = size;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
}
const drawImageData = (data) => {
  clearCanvas();
  baseImage = new Image();
  baseImage.src = data;
  baseImage.onload = function () {
    ctx.drawImage(baseImage, 0, 0);
  };
};

const writeEvent = ([text, name]) => {
  let required = /^([A-z0-9]+\s*)+$/;

  if (text != 0 && required.test(text)) {
    const el = document.createElement("li");
    el.innerHTML = name + " : " + text;

    chat.appendChild(el);
    chat.scrollTo(0, chat.scrollHeight);
  }
};

const onFormSubmitted = (e) => {
  e.preventDefault();

  const input = document.querySelector("#chatWrite");
  const text = input.value;
  let required = /^([A-z0-9]+\s*)+$/;

  if (text != 0 && required.test(text)) {
    if (text.toUpperCase() == requestedWord.toUpperCase()) {
      chatWrite.classList.add("disabled-state");
      yourPoints += Math.round(parseInt(timerBox.textContent) * 1.5);
      sock.emit("points", [yourPoints, yourName]);
      sock.emit("tryAgain");
      requestedWord = "";
      if (yourPoints >= 1000) {
        setTimeout(() => {
          sock.emit("winner", yourName);
        }, 100);
      }
    }
    input.value = "";

    sock.emit("message", [text, yourName]);
  }
};

writeEvent(["Welcome to pictionary", "Game"]);

sock.on("message", writeEvent);
sock.on("image", drawImageData);
sock.on("wordChoosing", getWords);
sock.on("chosen", changeChosen);
sock.on("random", function (number) {
  random = number;
});
sock.on("winner", function (sentName) {
  winnerName = sentName;
  winnerAlert.style.display = "flex";
  whoWonDiv.innerHTML = `<p>Winner is ${winnerName}</p>`;
  yourPoints = 0;
  sock.emit("points", [yourPoints, yourName]);
});
sock.on("timer", function (Time) {
  timerBox.textContent = Time;
});
sock.on("playerName", (text) => {
  pointsBox.innerHTML += `<div id='player${text}'>${text} : 0</div>`;
});
sock.on("points", ([points, pName]) => {
  document.getElementById("player" + pName).innerText = pName + " : " + points;
});
sock.on("tryAgain", function () {
  getWords(yourId);
});
document.querySelector("#form").addEventListener("submit", onFormSubmitted);
