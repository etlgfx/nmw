var Game = (function () {

	"use strict";

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

	function Button () {
	}

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
		canvas = document.getElementById(id);
		context = canvas.getContext('2d');

		canvas.addEventListener('click', this.clickController.bind(this));

		requestAnimationFrame(this.step.bind(this), canvas);
	}

	Game.prototype.step = function () {
		this.scene.render(context);

		requestAnimationFrame(this.step.bind(this), canvas);
	};

	Game.prototype.clickController = function (evt) {
		var coords = [evt.clientX - evt.target.offsetLeft, evt.clientY - evt.target.offsetTop];
		this.scene.queryClick(coords)[0].modify(1);
	};

	Game.prototype.loadState = function (stateFile) {
		ejs.xhr('GET').callback((function (data) {
			data.units.forEach(function (unit) {
				this.scene.add(new Obj()).coords = unit.coords;
			}, this);
		}).bind(this)).send(stateFile);
	};

	return Game;
})();

(function () {
	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	window.requestAnimationFrame = requestAnimationFrame;
})();
