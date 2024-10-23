import Game from './src/modules/Game';

document.addEventListener('DOMContentLoaded', function() {
  console.log("DOMContentLoaded event fired, adding start screen");

  let game = new Game({
    spritesheet: 'sprites.json'
  }).load();

}, false);

