var game = (function () {
	var canvas,
		context;

	function game(id) {
		canvas = document.getElementById(id);
		context = canvas.getContext('2d');

		requestAnimationFrame(step);
	};

	function step() {
		context.fillStyle = "rgb(200,0,0)";
		context.fillRect (10, 10, 55, 50);

		context.fillStyle = "rgba(0, 0, 200, 0.5)";
		context.fillRect (30, 30, 55, 50);
	};

	return game;
})();

(function() {
	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	window.requestAnimationFrame = requestAnimationFrame;
})();
