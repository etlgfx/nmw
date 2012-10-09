var Game = (function () {
	var canvas,
		context;

	function Obj () {
		this.coords = [0, 0];
		this.size = [50, 50];
		this.color = [0, 0, 0];
		this.mod = 0;
	}

	Obj.prototype.render = function (ctx) {
		var color = this.color.slice();

		if (this.mod >= 0) {
			var mod = this.mod--;
			color = this.color.map(function (c) { return c + mod; });
		}
		else
			this.mod = 0;

		ctx.fillStyle = "rgb("+ color.join(",") +")";
		ctx.fillRect(this.coords[0], this.coords[1], this.size[0], this.size[1]);
	};

	Obj.prototype.modify = function (time) {
		this.mod = 100;
	};

	function Scene () {
		this.objs = [];
	}

	Scene.prototype.add = function (obj) {
		this.objs.push(obj);

		return obj;
	};

	Scene.prototype.queryClick = function (coords) {
		var hits = this.objs.filter(function (obj) {
			return coords[0] >= obj.coords[0] && coords[0] <= (obj.coords[0] + obj.size[0]) &&
				coords[1] >= obj.coords[1] && coords[1] <= (obj.coords[1] + obj.size[1])
		});

		return hits;
	};

	Scene.prototype.render = function (ctx) {
		this.objs.forEach(function (obj) { obj.render(ctx); });
	};

	function Game (id) {
		var self = this;

		canvas = document.getElementById(id);
		context = canvas.getContext('2d');
		canvas.addEventListener('click', function (evt) { self.clickController(evt); });

		this.scene = new Scene();
		this.scene.add(new Obj()).coords = [50, 50];

		var o = new Obj();
		o.coords = [150, 150];
		o.color = [50, 200, 0];
		this.scene.add(o);

		requestAnimationFrame(function () { self.step() }, canvas);
	}

	Game.prototype.step = function () {
		this.scene.render(context);

		var self = this;
		requestAnimationFrame(function () { self.step() }, canvas);
	};

	Game.prototype.clickController = function (evt) {
		var coords = [evt.clientX - evt.target.offsetLeft, evt.clientY - evt.target.offsetTop];
		this.scene.queryClick(coords)[0].modify(1);
	};

	return Game;
})();

(function () {
	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	window.requestAnimationFrame = requestAnimationFrame;
})();
