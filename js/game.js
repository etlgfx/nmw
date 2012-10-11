var Game = (function () {

	"use strict";

	var canvas, context;
	
	/**
	* Obj is the fundamental object from which all
	* other game objects are polymorphed.
	*/
	function Obj () {
		this.coords = [0, 0];
		this.size = [50, 50];
		this.color = [0, 0, 0];
	}

	Obj.prototype.render = function (ctx, timing) {
		if (this.animating && this.animating.time > 0) {
			if (this.animating.velocity) {
				this.coords[0] += this.animating.velocity[0] * timing.step;
				this.coords[1] += this.animating.velocity[1] * timing.step;
			}
			else {
				this.animating.velocity = [
					(this.animating.to[0] - this.coords[0]) / this.animating.time,
					(this.animating.to[1] - this.coords[1]) / this.animating.time,
				];
			}

			this.animating.time -= timing.step;
		}
		else if (this.animating) {
			this.coords = this.animating.to;
			this.animating = undefined;
		}

		ctx.fillStyle = "rgb("+ this.color.join(",") +")";
		ctx.fillRect(this.coords[0], this.coords[1], this.size[0], this.size[1]);
	};

	Obj.prototype.click = function (game, scene) {
	};

	Obj.prototype.hover = function (game, scene) {
	};
	
	Obj.prototype.animate = function (to, time) {
		if (time === undefined)
			time = 1000;

		this.animating = {
			'to': to,
			'time': time
		};
	};

	/**
	* Obj.Button makes for nice buttons to you for click.
	*/
	function Button (options) {
		Obj.call(this);

		this.size = [100, 30];
		this.title = options.title;
		this.state = options.state;
	}

	Button.prototype = new Obj();

	Button.prototype.click = function (game, scene) {
		game.pushState(game.loadState(this.state));
	};

	Button.prototype.render = function (ctx, timing) {
		Obj.prototype.render.call(this, ctx, timing);

		ctx.font = "400 16px sans-serif";
		ctx.textAlign = "center";

		ctx.fillStyle = "rgb(255, 255, 255)";
		ctx.fillText(this.title, this.coords[0] + this.size[0] / 2, this.coords[1] + 0.7 * this.size[1]);
	};

	/**
	* Obj.Building is a standard in game object.
	* it cannot move
	* it can store other objects
	* it has a health meter from 0 to 100 
	* 
	*/
	function Building (options) {
		Obj.call(this);
		this.size = [100, 30];
		this.title = 'building';
		this.textColor = "rgb(255, 255, 255)";
	}

	Building.prototype = new Obj();

	Building.prototype.render = function (ctx, timing) {
		Obj.prototype.render.call(this, ctx, timing);

		ctx.font = "400 16px sans-serif";
		ctx.textAlign = "center";

		ctx.fillStyle = this.textColor;
		ctx.fillText(this.title, this.coords[0] + this.size[0] / 2, this.coords[1] + 0.7 * this.size[1]);
	};

	Building.prototype.hover = function (game, scene) {
		this.textColor = "rgb(255, 0, 0)";
	};

	/**
	* Obj.Scene holds all of the game objects
	*/
	function Scene () {
		this.objs = [];
	}

	Scene.prototype.add = function (obj) {
		this.objs.push(obj);

		return obj;
	};

	Scene.prototype.queryHits = function (coords) {
		var hits = this.objs.filter(function (obj) {
			return coords[0] >= obj.coords[0] && coords[0] <= (obj.coords[0] + obj.size[0]) &&
				coords[1] >= obj.coords[1] && coords[1] <= (obj.coords[1] + obj.size[1])
		});

		return hits;
	};

	Scene.prototype.render = function (ctx, timing) {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		this.objs.forEach(function (obj) { obj.render(ctx, timing); });
	};

	Scene.prototype.flush = function () {
		this.objs = [];
	};
	
	/**
	* Game is the objecct that runs the loop and 
	* makes the game universe go.
	*/
	function Game (id) {
		canvas = document.getElementById(id);
		context = canvas.getContext('2d');

		this.sceneStack = [];
		this.scene = null;
		this.timing = {
			'start': Date.now(),
			'last': Date.now(),
		};
		this.mouseHandle = {
			'coords': [0,0],
			'lastCoords': [0,0],
		};		


		canvas.addEventListener('click', this.clickController.bind(this));
		canvas.addEventListener('mousemove', this.mouseMoveController.bind(this));

		requestAnimationFrame(this.step.bind(this), canvas);
	}

	Game.prototype.step = function () {
		this.timing.step = Date.now() - this.timing.last;
		this.timing.last = Date.now();

		if((this.mouseHandle.lastCoords[0] != this.mouseHandle.coords[0]) || (this.mouseHandle.lastCoords[1] != this.mouseHandle.coords[1])) 
		{
			var hits = this.scene.queryHits(this.mouseHandle.coords);
			
			hits.forEach(function (hit) { hit.hover(this, this.scene); }, this);
		}	

		if (this.scene)
			this.scene.render(context, this.timing);

		requestAnimationFrame(this.step.bind(this), canvas);
	};

	Game.prototype.clickController = function (evt) {
		if (!this.scene)
			return;

		var coords = [evt.pageX - evt.target.offsetLeft, evt.pageY - evt.target.offsetTop];
		var hits = this.scene.queryHits(coords);

		//console.log(hits);
		hits.forEach(function (hit) { hit.click(this, this.scene); }, this);
	};
	
	Game.prototype.mouseMoveController = function (evt) {
		if(!this.scene)
			return;		
		
		this.mouseHandle.lastCoords = this.mouseHandle.coords;
		this.mouseHandle.coords = [evt.pageX - evt.target.offsetLeft, evt.pageY - evt.target.offsetTop];
	}

	Game.prototype.loadState = function (stateFile) {
		var scene = new Scene();

		ejs.xhr('GET').callback((function (xhr, data) {
			if (data.menu) {
				data.menu.options.forEach(function (option) {
					scene.add(new Button(option)).animate([200,200], 500);
				}, this);
			}

			if (data.units) {
				data.units.forEach(function (unit) {
					scene.add(new Obj()).coords = unit.coords;
				}, this);
			}

			
			if (data.buildings) {
				data.buildings.forEach(function (building) {
					scene.add(new Building()).coords = building.coords;
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
