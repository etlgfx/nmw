var Game = (function () {

    "use strict";

    var canvas, context;

    Array.prototype.diff = function(a) {
        return this.filter(function(i) { return !(a.indexOf(i) > -1); });
    };

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

    Obj.prototype.hoverOn = function (game, scene) {
    };

    Obj.prototype.hoverOff = function (game, scene) {
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
        var currentScene = game.currentScene();
        currentScene.fade([255, 255, 255], 300, 'out', currentScene.delete.bind(currentScene));

        var newscene = game.loadState(this.state);
        newscene.fade([255, 255, 255], 300, 'in');
        game.queueState(newscene);
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

    Building.prototype.hoverOn = function (game, scene) {
        this.textColor = "rgb(255, 0, 0)";
    };

    Building.prototype.hoverOff = function (game, scene) {
        this.textColor = "rgb(255, 255, 255)";
    };

    /**
     * Obj.Scene holds all of the game objects
     */
    function Scene () {
        this.objs = [];
        this.actions = {};
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

    Scene.prototype.fade = function (color, time, inout, callback) {
        this.actions.fade = {
            "color": color,
            "callback": callback,
            "time": time,
            "totalTime": time,
            "inout": inout,
            "opacity": 0,
        };
    };

    Scene.prototype.delete = function () {
        console.log('delete', this);
        this.actions.delete = true;
    };

    Scene.prototype.render = function (ctx, timing) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        if (this.actions.loading) {
            ctx.fillStyle = 'rgb(255, 0, 0)';
            ctx.font = "italic 400 12px sans-serif";
            ctx.fillText('loading...', ctx.canvas.width - 100, ctx.canvas.height - 10);
            return;
        }

        this.objs.forEach(function (obj) { obj.render(ctx, timing); });

        if (this.actions.fade) {
            this.actions.fade.opacity += (timing.step / this.actions.fade.totalTime)
            this.actions.fade.time -= timing.step;

            ctx.fillStyle = 'rgba('+ this.actions.fade.color.join(',') +','+ (this.actions.fade.inout == 'in' ? 1 - this.actions.fade.opacity : this.actions.fade.opacity) +')';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            if (this.actions.fade.time <= 0)
            {
                if (this.actions.fade.callback)
                {
                    this.actions.fade.callback();
                }

                delete this.actions.fade;
            }
        }
    };

    Scene.prototype.flush = function () {
        this.objs = [];
    };

    Scene.prototype.load = function (data, game) {
        if (data.menu) {
            data.menu.options.forEach(function (option) {
                this.add(new Button(option)).animate([200,200], 500);
            }, this);
        }

        if (data.units) {
            data.units.forEach(function (unit) {
                this.add(new Obj()).coords = unit.coords;
            }, this);
        }

        if (data.buildings) {
            data.buildings.forEach(function (building) {
                this.add(new Building()).coords = building.coords;
            }, this);
        }
    };

    /**
     * Game is the object that runs the loop and 
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

        this.lastHoverHits = [];

        this.mouseHandle = {
            'coords': [0,0],
            'lastCoords': [0,0],
        };

        canvas.addEventListener('click', this.clickController.bind(this));
        canvas.addEventListener('mousemove', this.mouseMoveController.bind(this));

        requestAnimationFrame(this.step.bind(this), canvas);
    }

    Game.prototype.currentScene = function () {
        if (this.scene !== null)
            return this.sceneStack[this.scene];
        else
            return null;
    };

    Game.prototype.step = function () {
        this.timing.step = Date.now() - this.timing.last;
        this.timing.last = Date.now();

        var scene = this.currentScene();

        if (scene !== null)
        {
            if ((this.mouseHandle.lastCoords[0] != this.mouseHandle.coords[0]) || (this.mouseHandle.lastCoords[1] != this.mouseHandle.coords[1]))
            {
                var hits = scene.queryHits(this.mouseHandle.coords);

                var diffHitsExiting = this.lastHoverHits.diff(hits);
                var diffHitsEntering = hits.diff(this.lastHoverHits);

                this.lastHoverHits = hits;

                diffHitsEntering.forEach(function (hit) { hit.hoverOn(this, scene); }, this);
                diffHitsExiting.forEach(function (hit) { hit.hoverOff(this, scene); }, this);
            }

            if (scene.actions.delete)
            {
                this.popState();

                scene = this.currentScene();
            }

            if (scene !== null)
                scene.render(context, this.timing);
        }

        requestAnimationFrame(this.step.bind(this), canvas);
    };

    Game.prototype.clickController = function (evt) {
        if (this.scene === null)
            return;

        var coords = [evt.pageX - evt.target.offsetLeft, evt.pageY - evt.target.offsetTop];

        var scene = this.currentScene();
        var hits = scene.queryHits(coords);

        //console.log(hits);
        hits.forEach(function (hit) { hit.click(this, scene); }, this);
    };

    Game.prototype.mouseMoveController = function (evt) {
        this.mouseHandle.lastCoords = this.mouseHandle.coords;
        this.mouseHandle.coords = [evt.pageX - evt.target.offsetLeft, evt.pageY - evt.target.offsetTop];
    };

    Game.prototype.loadState = function (state) {
        var scene = new Scene();

        if (typeof state == "string") {
            scene.actions.loading = true;

            ejs.xhr('GET').callback((function (xhr, data) {
                scene.load(data, this);

                setTimeout(function () { delete scene.actions.loading; }, 1000);
            }).bind(this)).send(state);
        }
        else {
            scene.load(data, this);
        }

        return scene;
    };

    Game.prototype.popState = function () {
        var lastScene = this.sceneStack.pop();

        if (this.sceneStack.length)
            this.scene = this.sceneStack.length - 1;
        else
            this.scene = null;

        return lastScene;
    };

    Game.prototype.pushState = function (scene) {
        if (!scene instanceof Scene)
            throw "not a scene";

        this.sceneStack.push(scene);
        this.scene = this.sceneStack.length - 1;

        return scene;
    };

    Game.prototype.queueState = function (scene) {
        if (!scene instanceof Scene)
            throw "not a scene";

        if (this.sceneStack.length) {
            this.sceneStack.splice(-1, 0, scene);
            this.scene++;
        }
        else {
            this.pushState(scene);
        }
    };

    return Game;
})();

(function () {
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
})();
