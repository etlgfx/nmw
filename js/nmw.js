var game = new Game('game');

//game.pushScene(game.loadScene('data/menu.json'));

var menuScene = game.loadScene({});
var button = menuScene.add(new Game.Button({ 'title': 'new game' }));

button.coords = [ 200, 400 ];
button.animate([ 200, 200 ], 600);
button.click = function () {
    menuScene.fade([255, 255, 255], 300, 'out', menuScene.delete.bind(menuScene));
};

game.pushScene(menuScene);
game.queueScene(game.loadScene('data/map1.json'));

