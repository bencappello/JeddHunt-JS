import Game from './src/modules/Game';

// document.addEventListener('DOMContentLoaded', function() {
//   console.log("DOMContentLoaded event fired, adding start screen");

//   let game = new Game({
//     spritesheet: 'sprites.json'
//   }).load();

// }, false);

document.addEventListener('DOMContentLoaded', function () {
  
  // Add a start screen with a background image from the dist folder
  var startScreen = document.createElement('div');
  startScreen.id = 'startScreen';
  startScreen.style.position = 'fixed';
  startScreen.style.top = '0';
  startScreen.style.left = '0';
  startScreen.style.width = '100vw';
  startScreen.style.height = '100vh';
  startScreen.style.backgroundImage = 'url("start-screen.jpeg")';  // Path to the image in the dist folder
  startScreen.style.backgroundSize = 'cover';  // Ensure the image covers the entire screen
  startScreen.style.backgroundPosition = 'center';  // Center the image
  startScreen.style.cursor = 'pointer';  // Make the screen clickable
  document.body.appendChild(startScreen);

  // Start the game when the user clicks the start screen
  startScreen.addEventListener('click', function () {
    document.body.removeChild(startScreen);  // Remove start screen when clicked

    // Start the game after the start screen is clicked
    let game = new Game({
      spritesheet: 'sprites.json'
    }).load();
  }, false);

}, false);

