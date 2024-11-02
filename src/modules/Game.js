import { loader, autoDetectRenderer } from 'pixi.js';
import { remove as _remove } from 'lodash/array';
import levels from '../data/levels.json';
import Stage from './Stage';
import sound from './Sound';
import levelCreator from '../libs/levelCreator.js';
import utils from '../libs/utils';
import firebase from 'firebase/app';
import 'firebase/database'; // Import the database module

// Your web app's Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyCDp6ZHqbfZyzt-Ro_ObSTmXsHvIdNjm8c",
  authDomain: "jeddhunt-js.firebaseapp.com",
  databaseURL: "https://jeddhunt-js-default-rtdb.firebaseio.com",
  projectId: "jeddhunt-js",
  storageBucket: "jeddhunt-js.appspot.com",
  messagingSenderId: "813925258701",
  appId: "1:813925258701:web:2b2a903e0a0d2928e1a084",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database
const database = firebase.database();
const BLUE_SKY_COLOR = 0x64b0ff;
const PINK_SKY_COLOR = 0xfbb4d4;
const SUCCESS_RATIO = 0.6;
const BOTTOM_LINK_STYLE = {
  fontFamily: 'Press Start 2P',
  fontSize: '15px',
  align: 'left',
  fill: 'white'
};

class Game {
  /**
   * Game Constructor
   * @param opts
   * @param {String} opts.spritesheet Path to the spritesheet file that PIXI's loader should load
   * @returns {Game}
   */
  constructor(opts) {
    this.spritesheet = opts.spritesheet;
    this.loader = loader;
    this.renderer = autoDetectRenderer(window.innerWidth, window.innerHeight, {
      backgroundColor: BLUE_SKY_COLOR
    });
    this.levelIndex = 0;
    this.maxScore = 0;
    this.timePaused = 0;
    this.muted = false;
    this.paused = false;
    this.activeSounds = [];

    this.waveEnding = false;
    this.quackingSoundId = null;
    this.levels = levels.normal;
    return this;
  }

  get ducksMissed() {
    return this.ducksMissedVal ? this.ducksMissedVal : 0;
  }

  set ducksMissed(val) {
    this.ducksMissedVal = val;

    if (this.stage && this.stage.hud) {

      if (!Object.prototype.hasOwnProperty.call(this.stage.hud, 'ducksMissed')) {
        this.stage.hud.createTextureBasedCounter('ducksMissed', {
          texture: 'hud/score-live/0.png',
          spritesheet: this.spritesheet,
          location: Stage.missedDuckStatusBoxLocation(),
          rowMax: 20,
          max: 20
        });
      }

      this.stage.hud.ducksMissed = val;
    }
  }

  get ducksShot() {
    return this.ducksShotVal ? this.ducksShotVal : 0;
  }

  set ducksShot(val) {
    this.ducksShotVal = val;

    if (this.stage && this.stage.hud) {

      if (!Object.prototype.hasOwnProperty.call(this.stage.hud, 'ducksShot')) {
        this.stage.hud.createTextureBasedCounter('ducksShot', {
          texture: 'hud/score-dead/0.png',
          spritesheet: this.spritesheet,
          location: Stage.deadDuckStatusBoxLocation(),
          rowMax: 20,
          max: 20
        });
      }

      this.stage.hud.ducksShot = val;
    }
  }
  /**
   * bullets - getter
   * @returns {Number}
   */
  get bullets() {
    return this.bulletVal ? this.bulletVal : 0;
  }

  /**
   * bullets - setter
   * Setter for the bullets property of the game. Also in charge of updating the HUD. In the event
   * the HUD doesn't know about displaying bullets, the property and a corresponding texture container
   * will be created in HUD.
   * @param {Number} val Number of bullets
   */
  set bullets(val) {
    this.bulletVal = val;

    if (this.stage && this.stage.hud) {

      if (!Object.prototype.hasOwnProperty.call(this.stage.hud, 'bullets')) {
        this.stage.hud.createTextureBasedCounter('bullets', {
          texture: 'hud/bullet/0.png',
          spritesheet: this.spritesheet,
          location: Stage.bulletStatusBoxLocation(),
          max: 80,
          rowMax: 20
        });
      }

      this.stage.hud.bullets = val;
    }

  }

  /**
   * score - getter
   * @returns {Number}
   */
  get score() {
    return this.scoreVal ? this.scoreVal : 0;
  }

  /**
   * score - setter
   * Setter for the score property of the game. Also in charge of updating the HUD. In the event
   * the HUD doesn't know about displaying the score, the property and a corresponding text box
   * will be created in HUD.
   * @param {Number} val Score value to set
   */
  set score(val) {
    this.scoreVal = val;

    if (this.stage && this.stage.hud) {

      if (!Object.prototype.hasOwnProperty.call(this.stage.hud, 'score')) {
        this.stage.hud.createTextBox('score', {
          style: {
            fontFamily: 'Press Start 2P',
            fontSize: '18px',
            align: 'left',
            fill: 'white'
          },
          location: Stage.scoreBoxLocation(),
          anchor: {
            x: 1,
            y: 0
          }
        });
      }

      this.stage.hud.score = val;
    }

  }

  /**
   * wave - get
   * @returns {Number}
   */
  get wave() {
    return this.waveVal ? this.waveVal : 0;
  }

  /**
   * wave - set
   * Setter for the wave property of the game. Also in charge of updating the HUD. In the event
   * the HUD doesn't know about displaying the wave, the property and a corresponding text box
   * will be created in the HUD.
   * @param {Number} val
   */
  set wave(val) {
    this.waveVal = val;

    if (this.stage && this.stage.hud) {

      if (!Object.prototype.hasOwnProperty.call(this.stage.hud, 'waveStatus')) {
        this.stage.hud.createTextBox('waveStatus', {
          style: {
            fontFamily: 'Press Start 2P',
            fontSize: '14px',
            align: 'center',
            fill: 'white'
          },
          location: Stage.waveStatusBoxLocation(),
          anchor: {
            x: 1,
            y: 1
          }
        });
      }

      if (!isNaN(val) && val > 0) {
        this.stage.hud.waveStatus = 'WAVE ' + val + ' OF ' + this.level.waves;
      } else {
        this.stage.hud.waveStatus = '';
      }
    }
  }

  /**
   * gameStatus - get
   * @returns {String}
   */
  get gameStatus() {
    return this.gameStatusVal ? this.gameStatusVal : '';
  }

  /**
   * gameStatus - set
   * @param {String} val
   */
  set gameStatus(val) {
    this.gameStatusVal = val;

    if (this.stage && this.stage.hud) {

      if (!Object.prototype.hasOwnProperty.call(this.stage.hud, 'gameStatus')) {
        this.stage.hud.createTextBox('gameStatus', {
          style: {
            fontFamily: 'Press Start 2P',
            fontSize: '40px',
            align: 'left',
            fill: 'white',
            dropShadow: true,
            dropShadowColor: 'black',
            dropShadowBlur: 4,           // No blur for a pixelated effect
            dropShadowDistance: 4,       // Small offset for a blocky shadow
            stroke: 'black',             // Adds a black stroke for extra outline
            strokeThickness: 2           // Thickness of the stroke 
          },
          location: Stage.gameStatusBoxLocation()
        });
      }

      this.stage.hud.gameStatus = val;
    }
  }

  load() {
    this.loader
      .add(this.spritesheet)
      .load(this.onLoad.bind(this));
  }

  onLoad() {
    document.body.appendChild(this.renderer.view);

    this.stage = new Stage({
      spritesheet: this.spritesheet
    });

    this.scaleToWindow();
    // this.addLinkToLevelCreator();
    this.addPauseLink();
    this.addMuteLink();
    // this.addFullscreenLink();
    this.bindEvents();

    this.showStartScreen();
  }

  showStartScreen() {
    // Create a div element for the start screen
    const startScreen = document.createElement('div');
    startScreen.id = 'startScreen';
    startScreen.style.position = 'fixed';
    startScreen.style.top = '0';
    startScreen.style.left = '0';
    startScreen.style.width = '100vw';
    startScreen.style.height = '100vh';
    startScreen.style.backgroundImage = 'url("start-screen.jpeg")';
    startScreen.style.backgroundSize = 'cover';
    startScreen.style.backgroundPosition = 'center';
    startScreen.style.cursor = 'pointer';
    document.body.appendChild(startScreen);




    // Create a new AudioContext to check if sounds are allowed
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Function to check if sounds are enabled
    function areSoundsEnabled() {
      return audioContext.state === 'running';  // 'running' means sounds are enabled
    }

    // Function to resume sounds after user interaction
    function enableSounds() {
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log("Sounds are now enabled.");
        });
      }
    }

    // Play the start screen music
    this.startScreenMusicId = sound.play('startScreen');

    // Start the game when the start screen is clicked
    startScreen.addEventListener('click', () => {
      this.startGameFromStartScreen(startScreen);
    }, false);
  }

  startGameFromStartScreen(startScreen) {
    // Stop the start screen music
    sound.stop(this.startScreenMusicId);

    // Remove the start screen
    document.body.removeChild(startScreen);

    // Continue the game as usual
    this.startLevel();
    this.animate();
  }

  async getHighScores() {
    try {
      const highScoresRef = database.ref("highScores");
      const snapshot = await highScoresRef.orderByChild("score").limitToLast(10).once("value");

      const highScores = [];
      snapshot.forEach((data) => {
        highScores.push({
          name: data.val().name,
          score: data.val().score,
        });
      });

      // Sort high scores in descending order
      return highScores.reverse();
    } catch (error) {
      console.error("Error fetching high scores:", error);
      return [];
    }
  }

  saveHighScore(score, playerName) {
    const highScoresRef = firebase.database().ref("highScores");
    const newScoreRef = highScoresRef.push();

    newScoreRef.set(
      {
        name: playerName,
        score: score,
      },
      (error) => {
        if (error) {
          console.error("Error saving high score:", error);
        } else {
          console.log("High score saved successfully!");
        }
      }
    );
  }

  // win() {
  //   sound.play('champ');
  //   this.gameStatus = 'YOU WON!';
  //   this.showReplay(this.getScoreMessage());
  // }

  // loss() {
  //   sound.play('loserSound');
  //   this.gameStatus = 'YOU LOSE.';
  //   this.showReplay(this.getScoreMessage());
  // }

  async win() {
    sound.play("champ");
    // this.gameStatus = "You Win!";

    // Show the win screen and proceed based on high score status
    this.showEndGameScreen(
      "YOU WON!\nAS MUCH AS YOU CAN WIN AT\nA GAME CALLED JEDD HUNT.",
      async () => {
        const highScores = await this.getHighScores();
        if (this.isTopScore(this.score, highScores)) {
          this.promptPlayerNameForHighScore(); // Prompt for initials if a top score was achieved
        } else {
          this.showHighScores(highScores); // Otherwise, just show high scores
        }
      }
    );
  }

  async loss() {
    sound.play("loserSound");
    // this.gameStatus = "You Lose";

    // Show the lose screen and then display the high scores page
    this.showEndGameScreen(
      "YOU LOSE\nAS MUCH AS YOU CAN LOSE AT\nA GAME CALLED JEDD HUNT.",
      async () => {
        const highScores = await this.getHighScores();
        if (this.isTopScore(this.score, highScores)) {
          this.promptPlayerNameForHighScore(); // Prompt for initials if a top score was achieved
        } else {
          this.showHighScores(highScores); // Otherwise, just show high scores
        }
      }
    );
  }

  isTopScore(score, highScores) {
    return highScores.length < 10 || score > highScores[highScores.length - 1].score;
  }

  promptPlayerNameForHighScore() {
    // Create a div element for the name prompt
    const namePrompt = document.createElement("div");
    namePrompt.id = "namePrompt";
    namePrompt.style.position = "fixed";
    namePrompt.style.top = "0";
    namePrompt.style.left = "0";
    namePrompt.style.width = "100vw";
    namePrompt.style.height = "100vh";
    namePrompt.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
    namePrompt.style.color = "yellow";  // Bright, classic arcade color
    namePrompt.style.display = "flex";
    namePrompt.style.flexDirection = "column";
    namePrompt.style.alignItems = "center";
    namePrompt.style.justifyContent = "center";
    namePrompt.style.fontFamily = "'Press Start 2P', sans-serif";  // Retro arcade font

    // High score title
    const highScoreTitle = document.createElement("h2");
    highScoreTitle.innerText = "HIGH SCORE!";
    highScoreTitle.style.marginBottom = "10px";
    highScoreTitle.style.textShadow = "2px 2px 4px #ff0000";  // Red shadow for retro effect

    // Display the player's score
    const scoreDisplay = document.createElement("div");
    scoreDisplay.innerText = `SCORE: ${this.score}`;
    scoreDisplay.style.marginBottom = "20px";
    scoreDisplay.style.fontSize = "28px";
    scoreDisplay.style.textShadow = "2px 2px 4px #000";  // Black shadow for readability

    // Title for entering initials
    const initialsTitle = document.createElement("h2");
    initialsTitle.innerText = "ENTER YOUR INITIALS";
    initialsTitle.style.marginBottom = "20px";
    initialsTitle.style.textShadow = "2px 2px 4px #ff0000";  // Red shadow for retro effect

    const inputWrapper = document.createElement("div");
    inputWrapper.style.marginTop = "20px";
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "AAA";
    nameInput.maxLength = 3;  // Limit to 3 characters
    nameInput.style.textTransform = "uppercase"; // Convert input to uppercase
    nameInput.style.fontFamily = "'Press Start 2P', sans-serif";  // Retro font
    nameInput.style.fontSize = "24px";
    nameInput.style.textAlign = "center";
    nameInput.style.backgroundColor = "black";
    nameInput.style.color = "lime";  // Classic arcade bright green color
    nameInput.style.border = "4px solid yellow";  // Bold yellow border
    nameInput.style.padding = "10px";
    nameInput.style.marginRight = "10px";
    nameInput.style.width = "80px";  // Make it visually fit 3 characters nicely

    const submitButton = document.createElement("button");
    submitButton.textContent = "OK";
    submitButton.style.fontFamily = "'Press Start 2P', sans-serif"; // Retro arcade font
    submitButton.style.fontSize = "18px";
    submitButton.style.color = "white";
    submitButton.style.backgroundColor = "black";
    submitButton.style.border = "4px solid yellow";  // Bold yellow border
    submitButton.style.padding = "10px 20px";
    submitButton.style.cursor = "pointer";

    submitButton.addEventListener("click", async () => {
      const playerName = (nameInput.value || "AAA").toUpperCase(); // Default to "AAA" if empty
      await this.saveHighScore(this.score, playerName);

      document.body.removeChild(namePrompt);

      // Fetch the updated high scores and show them
      const highScores = await this.getHighScores();
      this.showHighScores(highScores);
    });

    inputWrapper.appendChild(nameInput);
    inputWrapper.appendChild(submitButton);
    namePrompt.appendChild(highScoreTitle); // Add high score title
    namePrompt.appendChild(scoreDisplay);   // Display the player's score
    namePrompt.appendChild(initialsTitle);  // Add title for initials
    namePrompt.appendChild(inputWrapper);
    document.body.appendChild(namePrompt);
  }

  showEndGameScreen(message, nextStepCallback) {
    // Create a div element for the end game screen
    const endGameScreen = document.createElement("div");
    endGameScreen.id = "endGameScreen";
    endGameScreen.style.position = "fixed";
    endGameScreen.style.top = "0";
    endGameScreen.style.left = "0";
    endGameScreen.style.width = "100vw";
    endGameScreen.style.height = "100vh";
    endGameScreen.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
    endGameScreen.style.color = "yellow";
    endGameScreen.style.display = "flex";
    endGameScreen.style.flexDirection = "column";
    endGameScreen.style.alignItems = "center";
    endGameScreen.style.justifyContent = "center";
    endGameScreen.style.fontFamily = "'Press Start 2P', sans-serif";
    endGameScreen.style.textAlign = "center";
    endGameScreen.style.cursor = "pointer"; // Indicate that clicking is allowed

    // Display the end game message
    const messageParts = message.split('\n'); // Split the message to handle line breaks
    messageParts.forEach((part, index) => {
      const messageElement = document.createElement("div");
      messageElement.innerText = part;
      messageElement.style.fontSize = index === 0 ? "36px" : "28px"; // Larger font for first line
      messageElement.style.marginBottom = index === 0 ? "20px" : "10px"; // Add spacing between lines
      messageElement.style.textShadow = "2px 2px 4px #ff0000"; // Red shadow for retro effect
      endGameScreen.appendChild(messageElement);
    });

    // Add the end game screen to the document
    document.body.appendChild(endGameScreen);

    // Define the function to proceed to the next step
    const proceedToNextStep = () => {
      if (endGameScreen) {
        document.body.removeChild(endGameScreen);
      }
      nextStepCallback();
    };

    // Set up a timeout to proceed after 2 seconds
    const timeoutId = setTimeout(proceedToNextStep, 6000);

    // Allow clicking anywhere on the screen to proceed immediately
    endGameScreen.addEventListener("click", () => {
      clearTimeout(timeoutId); // Clear the timeout if the user clicks
      proceedToNextStep();
    });
  }

  showHighScores(highScores) {
    // Create a div element for the high scores screen
    const highScoresScreen = document.createElement("div");
    highScoresScreen.id = "highScoresScreen";
    highScoresScreen.style.position = "fixed";
    highScoresScreen.style.top = "0";
    highScoresScreen.style.left = "0";
    highScoresScreen.style.width = "100vw";
    highScoresScreen.style.height = "100vh";
    highScoresScreen.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
    highScoresScreen.style.color = "yellow";
    highScoresScreen.style.display = "flex";
    highScoresScreen.style.flexDirection = "column";
    highScoresScreen.style.alignItems = "center";
    highScoresScreen.style.justifyContent = "center";
    highScoresScreen.style.fontFamily = "'Press Start 2P', sans-serif";
    highScoresScreen.style.textAlign = "center";

    // High scores title
    const title = document.createElement("h2");
    title.innerText = "HIGH SCORES";
    title.style.marginBottom = "20px";
    title.style.textShadow = "2px 2px 4px #ff0000";
    highScoresScreen.appendChild(title);

    // Display each high score
    highScores.forEach((scoreEntry, index) => {
      const scoreElement = document.createElement("div");
      scoreElement.innerHTML = `${index + 1}. ${scoreEntry.name} - ${scoreEntry.score}`;
      scoreElement.style.marginBottom = "15px";
      scoreElement.style.fontSize = "24px";
      scoreElement.style.textShadow = "2px 2px 4px #000";
      highScoresScreen.appendChild(scoreElement);
    });

    // Buttons container
    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.display = "flex";
    buttonsContainer.style.gap = "20px";
    buttonsContainer.style.marginTop = "30px";

    // Add a replay button
    const replayButton = document.createElement("button");
    replayButton.textContent = "PLAY AGAIN";
    replayButton.style.width = "150px";
    replayButton.style.height = "50px";
    replayButton.style.backgroundColor = "black";
    replayButton.style.color = "yellow";
    replayButton.style.border = "4px solid yellow";
    replayButton.style.fontFamily = "'Press Start 2P', sans-serif";
    replayButton.style.fontSize = "16px";
    replayButton.style.cursor = "pointer";
    replayButton.style.textTransform = "uppercase";

    replayButton.addEventListener("click", () => {
      document.body.removeChild(highScoresScreen);
      window.location = window.location.pathname;
    });

    // Add a "Hire Jedd" button
    const hireButton = document.createElement("button");
    hireButton.textContent = "HIRE\nJEDD";
    hireButton.style.width = "150px";
    hireButton.style.height = "50px";
    hireButton.style.backgroundColor = "black";
    hireButton.style.color = "yellow";
    hireButton.style.border = "4px solid yellow";
    hireButton.style.fontFamily = "'Press Start 2P', sans-serif";
    hireButton.style.fontSize = "16px";
    hireButton.style.cursor = "pointer";
    hireButton.style.textTransform = "uppercase";
    hireButton.style.whiteSpace = "pre-wrap";

    // Add click event for opening the link in a new tab
    hireButton.addEventListener("click", () => {
      window.open("https://www.jeddlevine.com/contact", "_blank");
    });

    // Add buttons to the container
    buttonsContainer.appendChild(replayButton);
    buttonsContainer.appendChild(hireButton);
    highScoresScreen.appendChild(buttonsContainer);

    // Add the high scores screen to the document
    document.body.appendChild(highScoresScreen);
  }


  addFullscreenLink() {
    this.stage.hud.createTextBox('fullscreenLink', {
      style: BOTTOM_LINK_STYLE,
      location: Stage.fullscreenLinkBoxLocation(),
      anchor: {
        x: 1,
        y: 1
      }
    });
    this.stage.hud.fullscreenLink = 'fullscreen (f)';
  }
  addMuteLink() {
    this.stage.hud.createTextBox('muteLink', {
      style: BOTTOM_LINK_STYLE,
      location: Stage.muteLinkBoxLocation(),
      anchor: {
        x: 1,
        y: 1
      }
    });
    this.stage.hud.muteLink = '(M)UTE';
  }

  addPauseLink() {
    this.stage.hud.createTextBox('pauseLink', {
      style: BOTTOM_LINK_STYLE,
      location: Stage.pauseLinkBoxLocation(),
      anchor: {
        x: 1,
        y: 1
      }
    });
    this.stage.hud.pauseLink = '(P)AUSE';
  }

  addLinkToLevelCreator() {
    this.stage.hud.createTextBox('levelCreatorLink', {
      style: BOTTOM_LINK_STYLE,
      location: Stage.levelCreatorLinkBoxLocation(),
      anchor: {
        x: 1,
        y: 1
      }
    });
    this.stage.hud.levelCreatorLink = 'level creator (c)';
  }

  bindEvents() {
    window.addEventListener('resize', this.scaleToWindow.bind(this));

    this.stage.mousedown = this.stage.touchstart = this.handleClick.bind(this);

    document.addEventListener('keypress', (event) => {
      event.stopImmediatePropagation();

      if (event.key === 'p') {
        this.pause();
      }

      if (event.key === 'm') {
        this.mute();
      }

      // if (event.key === 'c') {
      //   this.openLevelCreator();
      // }

      // if (event.key === 'f') {
      //   this.fullscreen();
      // }
    });

    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        this.stage.hud.fullscreenLink = 'unfullscreen (f)';
      } else {
        this.stage.hud.fullscreenLink = 'fullscreen (f)';
      }
    });

    sound.on('play', (soundId) => {
      if (this.activeSounds.indexOf(soundId) === -1) {
        this.activeSounds.push(soundId);
      }
    });
    sound.on('stop', this.removeActiveSound.bind(this));
    sound.on('end', this.removeActiveSound.bind(this));
  }

  fullscreen() {
    this.isFullscreen = !this.isFullscreen;
    utils.toggleFullscreen();
  }

  pause() {
    this.stage.hud.pauseLink = this.paused ? '(P)AUSE' : '(P)AUSE';
    // SetTimeout, woof. Thing is here we need to leave enough animation frames for the HUD status to be updated
    // before pausing all rendering, otherwise the text update we need above won't be shown to the user.
    setTimeout(() => {
      this.paused = !this.paused;
      if (this.paused) {
        this.pauseStartTime = Date.now();
        this.stage.pause();
        this.activeSounds.forEach((soundId) => {
          sound.pause(soundId);
        });
      } else {
        this.timePaused += (Date.now() - this.pauseStartTime) / 1000;
        this.stage.resume();
        this.activeSounds.forEach((soundId) => {
          sound.play(soundId);
        });
      }
    }, 40);
  }

  removeActiveSound(soundId) {
    _remove(this.activeSounds, function (item) {
      return item === soundId;
    });
  }

  mute() {
    this.stage.hud.muteLink = this.muted ? '(M)UTE' : 'UNMUTE (M)';
    this.muted = !this.muted;
    sound.mute(this.muted);
  }

  scaleToWindow() {
    this.renderer.resize(window.innerWidth, window.innerHeight);
    this.stage.scaleToWindow();
  }

  startLevel() {
    if (levelCreator.urlContainsLevelData()) {
      this.level = levelCreator.parseLevelQueryString();
      this.levelIndex = this.levels.length - 1;
    } else {
      this.level = this.levels[this.levelIndex];
    }

    this.maxScore += this.level.waves * this.level.ducks * this.level.pointsPerDuck;
    this.ducksShot = 0;
    this.ducksMissed = 0;
    this.wave = 0;

    this.gameStatus = this.level.title;
    this.stage.preLevelAnimation().then(() => {
      this.gameStatus = '';
      this.startWave();
    });
  }

  startWave() {
    this.quackingSoundId = sound.play('quacking');
    this.wave += 1;
    this.waveStartTime = Date.now();
    this.bullets = this.level.bullets;
    this.ducksShotThisWave = 0;
    this.waveEnding = false;

    this.stage.addDucks(this.level.ducks, this.level.speed);
  }

  endWave() {
    this.waveEnding = true;
    this.bullets = 0;
    sound.stop(this.quackingSoundId);
    if (this.stage.ducksAlive()) {
      this.ducksMissed += this.level.ducks - this.ducksShotThisWave;
      this.renderer.backgroundColor = PINK_SKY_COLOR;
      this.stage.flyAway().then(this.goToNextWave.bind(this));
    } else {
      this.stage.cleanUpDucks();
      this.goToNextWave();
    }
  }

  goToNextWave() {
    this.renderer.backgroundColor = BLUE_SKY_COLOR;
    if (this.level.waves === this.wave) {
      this.endLevel();
    } else {
      this.startWave();
    }
  }

  shouldWaveEnd() {
    // evaluate pre-requisites for a wave to end
    if (this.wave === 0 || this.waveEnding || this.stage.dogActive()) {
      return false;
    }

    return this.isWaveTimeUp() || (this.outOfAmmo() && this.stage.ducksAlive()) || !this.stage.ducksActive();
  }

  isWaveTimeUp() {
    return this.level ? this.waveElapsedTime() >= this.level.time : false;
  }

  waveElapsedTime() {
    return ((Date.now() - this.waveStartTime) / 1000) - this.timePaused;
  }

  outOfAmmo() {
    return this.level && this.bullets === 0;
  }

  endLevel() {
    this.wave = 0;
    this.goToNextLevel();
  }

  goToNextLevel() {
    this.levelIndex++;
    if (!this.levelWon()) {
      this.loss();
    } else if (this.levelIndex < this.levels.length) {
      this.startLevel();
    } else {
      this.win();
    }
  }

  levelWon() {
    return this.ducksShot > SUCCESS_RATIO * this.level.ducks * this.level.waves;
  }

  getScoreMessage() {
    let scoreMessage;

    const percentage = (this.score / this.maxScore) * 100;

    if (percentage <= 100) {
      scoreMessage = 'AS MUCH AS YOU CAN WIN AT\nA GAME CALLED JEDD HUNT. ';
    }

    if (percentage <= 63) {
      scoreMessage = 'AS MUCH AS YOU CAN LOSE AT\nA GAME CALLED JEDD HUNT.';
    }

    return scoreMessage;
  }

  showReplay(replayText) {
    this.stage.hud.createTextBox('replayButton', {
      location: Stage.replayButtonLocation()
    });
    this.stage.hud.replayButton = replayText + '\n\nPlay Again?';
  }

  openLevelCreator() {
    // // If they didn't pause the game, pause it for them
    // if (!this.paused) {
    //   this.pause();
    // }
    // window.open('/creator.html', '_blank');
  }

  handleClick(event) {
    const clickPoint = {
      x: event.data.global.x,
      y: event.data.global.y
    };

    if (this.stage.clickedPauseLink(clickPoint)) {
      this.pause();
      return;
    }

    if (this.stage.clickedMuteLink(clickPoint)) {
      this.mute();
      return;
    }

    if (this.stage.clickedFullscreenLink(clickPoint)) {
      this.fullscreen();
      return;
    }

    // if (this.stage.clickedLevelCreatorLink(clickPoint)) {
    //   this.openLevelCreator();
    //   return;
    // }

    if (!this.stage.hud.replayButton && !this.outOfAmmo() && !this.shouldWaveEnd() && !this.paused) {
      sound.play('gunSound');
      this.bullets -= 1;
      this.updateScore(this.stage.shotsFired(clickPoint, this.level.radius));
      return;
    }

    if (this.stage.hud.replayButton && this.stage.clickedReplay(clickPoint)) {
      window.location = window.location.pathname;
    }
  }

  updateScore(ducksShot) {
    this.ducksShot += ducksShot;
    this.ducksShotThisWave += ducksShot;
    this.score += ducksShot * this.level.pointsPerDuck;
  }

  animate() {
    if (!this.paused) {
      this.renderer.render(this.stage);

      if (this.shouldWaveEnd()) {
        this.endWave();
      }
    }

    requestAnimationFrame(this.animate.bind(this));
  }
}

export default Game;