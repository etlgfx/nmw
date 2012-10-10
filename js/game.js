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

	Obj.prototype.render = function (ctx, timing) {
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

	function Button (options) {
		Obj.call(this);

		this.size = [100, 30];
		this.title = options.title;
		this.state = options.state;
	}

	Button.prototype = new Obj();

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

	Scene.prototype.flush = function () {
		this.objs = [];
	};

	function Game (id) {
		canvas = document.getElementById(id);
		context = canvas.getContext('2d');

		this.sceneStack = [];
		this.scene = null;
		this.timing = {
			'start': Date.now(),
			'last': Date.now(),
		};

		canvas.addEventListener('click', this.clickController.bind(this));

		requestAnimationFrame(this.step.bind(this), canvas);
	}

	Game.prototype.step = function () {
		this.timing.step = this.timing.last - Date.now();
		this.timing.last = Date.now();

		if (this.scene)
			this.scene.render(context, this.timing);

		requestAnimationFrame(this.step.bind(this), canvas);
	};

	Game.prototype.clickController = function (evt) {
		if (!this.scene)
			return;

		var coords = [evt.pageX - evt.target.offsetLeft, evt.pageY - evt.target.offsetTop];
		var hits = this.scene.queryClick(coords);

		//console.log(hits);
		hits.forEach(function (hit) { hit.modify(1); });
	};

	Game.prototype.loadState = function (stateFile) {
		var scene = new Scene();

		ejs.xhr('GET').callback((function (xhr, data) {
			if (data.menu) {
				data.menu.options.forEach(function (option) {
					scene.add(new Button(option));
				}, this);
			}

			if (data.units) {
				data.units.forEach(function (unit) {
					scene.add(new Obj()).coords = unit.coords;
				}, this);
			}
		}).bind(this)).send(stateFile);

		return scene;
	};

	Game.prototype.popState = function () {
		var lastScene = this.sceneStack.pop();

		this.scene = this.sceneStack[this.sceneStack.length - 1];

		return lastScene;
	};

	Game.prototype.pushState = function (scene) {
		if (!scene instanceof Scene) {
			throw "not a scene";
		}

		this.sceneStack.push(scene);
		this.scene = scene;

		return scene;
	};

	return Game;
})();

(function () {
	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	window.requestAnimationFrame = requestAnimationFrame;
})();
