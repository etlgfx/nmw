var canvas,
	context;

function obj() {
	this.coords = [0, 0];
	this.size = [50, 50];
	this.color = [0, 0, 0];
}

obj.prototype.render = function(ctx) {
	ctx.fillStyle = "rgb("+ this.color.join(",") +")";
	ctx.fillRect(this.coords[0], this.coords[1], this.size[0], this.size[1]);
};

function game(id) {
	canvas = document.getElementById(id);
	context = canvas.getContext('2d');
	canvas.addEventListener('click', function(evt) {
		//console.log(evt);
	});

	this.objs = [];

	var o;

	o = new obj();
	o.coords = [50, 50];
	this.objs.push(o);

	o = new obj();
	o.coords = [150, 150];
	o.color = [50, 200, 0];
	this.objs.push(o);

	var self = this;
	requestAnimationFrame(function () { self.step() }, canvas);
}

game.prototype.step = function () {
	this.objs.forEach(function (obj) { obj.render(context); });
};

(function() {
	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	window.requestAnimationFrame = requestAnimationFrame;
})();
