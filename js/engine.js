var Game = (function () {

    "use strict";

    var canvas, context;

    /**
     * Calculate the difference in elements between two arrays
     *
     * @param {Array} a - array to compare to
     *
     * @return {Array} an Array of the elements that weren't in Array a
     */
    Array.prototype.diff = function(a) {
        return this.filter(function(i) { return !(a.indexOf(i) > -1); });
    };

    /**
     * @constructor
     *
     * Obj is the fundamental object from which all
     * other game objects are polymorphed.
     */
    function Obj () {
        this.coords = [0, 0];
        this.size = [50, 50];
        this.color = [0, 0, 0];
        this.selected = false;
        this.sprite = null;
    }

    /**
     * render method
     *
     * @param {context} ctx - canvas rendering context
     * @param {object} timing - a set of timing data
     */
    Obj.prototype.render = function (ctx, scene, timing) {
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

        if (this.sprite) {
            ctx.drawImage(this.sprite, this.coords[0], this.coords[1]);
        }
        else {
            ctx.fillStyle = "rgb("+ this.color.join(",") +")";
            ctx.fillRect(this.coords[0], this.coords[1], this.size[0], this.size[1]);
        }
    };

    /**
    */
    Obj.prototype.setSprite = function (uri) {
        var img = new Image(uri);

        img.onload = (function () {
            this.sprite = img;
            this.size = [img.naturalWidth, img.naturalHeight];
        }).bind(this);

        img.src = uri;
    };

    /**
     * default click handler
     *
     * @param {Game} game
     * @param {Scene} scene
     */
    Obj.prototype.click = function (game, scene) {
    };

    /**
     * default hover (mouseOver) handler
     *
     * @param {Game} game
     * @param {Scene} scene
     */
    Obj.prototype.hoverOn = function (game, scene) {
    };

    /**
     * default hover (mouseOut) handler
     *
     * @param {Game} game
     * @param {Scene} scene
     */
    Obj.prototype.hoverOff = function (game, scene) {
    };

    /**
     * default select handler
     * custome event from the selection manager
     *
     * @param {Game} game
     * @param {Scene} scene
     */
    Obj.prototype.select = function () {
        this.selected = true;
    };

    /**
     * default deselect handler
     * custome event from the selection manager
     *
     * @param {Game} game
     * @param {Scene} scene
     */
    Obj.prototype.deselect = function () {
        this.selected = false;
    };

    /**
     * Simple animation method. So far only animates position
     *
     * @param {Array} to - [x, y] coordinates
     * @param {Number} time - in milliseconds
     */
    Obj.prototype.animate = function (to, time) {
        if (time === undefined)
            time = 1000;

        this.animating = {
            'to': to,
            'time': time
        };
    };

    /**
     * @constructor
     * @extends Obj
     *
     * Button makes for nice buttons for you to click.
     *
     * @param {object} options
     */
    function Button (options) {
        Obj.call(this);

        this.size = [100, 30];
        this.title = options.title;
        this.state = options.state;
        this.textColor = "rgb(255, 255, 255)";
    }

    Button.prototype = new Obj();

    /**
     * override default click handler from Obj.
     * For now load the state specified in the this.state URL
     *
     * @param {Game} game
     * @param {Scene} scene
     */
    Button.prototype.click = function (game, scene) {
        var currentScene = game.currentScene();
        currentScene.fade([255, 255, 255], 300, 'out', currentScene.delete.bind(currentScene));

        var newscene = game.loadScene(this.state);
        newscene.fade([255, 255, 255], 300, 'in');
        game.queueScene(newscene);
    };

    /**
     * override default render method
     *
     * @param {context} ctx
     * @param {object} timing
     */
    Button.prototype.render = function (ctx, scene, timing) {
        Obj.prototype.render.call(this, ctx, scene, timing);

        ctx.font = "400 16px sans-serif";
        ctx.textAlign = "center";

        ctx.fillStyle = this.textColor;
        ctx.fillText(this.title, this.coords[0] + this.size[0] / 2, this.coords[1] + 0.7 * this.size[1]);
    };

    /**
     * @constructor
     * @extends Obj
     *
     * Obj.Building is a standard in game object.
     * it cannot move
     * it can store other objects
     * it has a health meter from 0 to 100
     *
     * @param {object} options
     */
    function Building (options) {
        Obj.call(this);
        this.size = [100, 30];
        this.title = 'building';
        this.textColor = "rgb(255, 255, 255)";
    }

    Building.prototype = new Obj();

    /**
     * override default render method
     *
     * @param {context} ctx
     * @param {object} timing
     */
    Building.prototype.render = function (ctx, scene, timing) {
        Obj.prototype.render.call(this, ctx, scene, timing);

        ctx.font = "400 16px sans-serif";
        ctx.textAlign = "center";

        ctx.fillStyle = this.selected ? 'rgb(0, 255, 0)' : this.textColor;
        ctx.fillText(this.title, this.coords[0] + this.size[0] / 2, this.coords[1] + 0.7 * this.size[1]);

        if (this.sending) {
            if (this.sending.start === undefined) {
                this.sending.timing = timing.last;
            }

            if (timing.last >= this.sending.timing) {
                if (this.sending.units > 0) {
                    var unit = scene.add(new Obj());
                    unit.coords = this.coords.slice(0);
                    unit.animate(this.sending.target.coords, 2000);
                    this.sending.units -= 1;
                    this.sending.timing += 800;
                }
                else {
                    delete this.sending;
                }
            }
        }
    };

    /**
     * override default hover (mouseOver) handler
     *
     * @param {Game} game
     * @param {Scene} scene
     */
    Building.prototype.hoverOn = function (game, scene) { //TODO this could be an if stmt in the render function instead of overriding the default callback
        if (this.selected == false) {
            this.textColor = "rgb(255, 0, 0)";
        }
    };

    /**
     * override default hover (mouseOut) handler
     *
     * @param {Game} game
     * @param {Scene} scene
     */
    Building.prototype.hoverOff = function (game, scene) {
        if (this.selected == false) {
            this.textColor = "rgb(255, 255, 255)";
        }
    };

    /**
     * override default click  handler
     *
     * @param {Game} game
     * @param {Scene} scene
     */
    Building.prototype.click = function (game, scene) {
        console.log(scene.selection.selections, 'to', this);
        scene.selection.selections[0].sendUnits(this, 1); //TODO this is awkward as hell
    };

    /**
     * send units Units to target Building
     *
     * @param {Building} target
     * @param {Number} units
     */
    Building.prototype.sendUnits = function (target, units) {
        if (this.sending) {
            console.log('Already sending, skipping');
            return;
        }

        this.sending = {
            'units': units,
            'target': target
        };
    };

    /**
     * @constructor
     *
     * Scene holds all of the game objects in the current state or scene
     */
    function Scene () {
        this.objs = [];
        this.actions = {};
        this.selection = null;
    }

    /**
     * add a new object to the scene
     *
     * @param {Obj} obj
     */
    Scene.prototype.add = function (obj) {
        this.objs.push(obj);

        return obj;
    };

    /**
     * hit detection, based on point & bounding rectangle
     *
     * @param {Array} coords - [x, y]
     *
     * @return {Array(Obj)} a list of objects that were hit
     */
    Scene.prototype.queryHits = function (coords) {
        var hits = this.objs.filter(function (obj) {
            return coords[0] >= obj.coords[0] && coords[0] <= (obj.coords[0] + obj.size[0]) &&
                coords[1] >= obj.coords[1] && coords[1] <= (obj.coords[1] + obj.size[1]);
        });

        return hits;
    };

    /**
     * trigger a fade transition effect on the scene
     *
     * @param {Array} color - [r, g, b]
     * @param {Number} time - ms
     * @param {String} inout - enum (in, out)
     * @param {Function} callback - function to call after fade is finished
     */
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

    /**
     * Schedule scene for deletion, the Game object will take care of it on next step()
     */
    Scene.prototype.delete = function () {
        this.actions.delete = true;
    };

    /**
     * render the scene
     *
     * @param {context} ctx
     * @param {object} timing
     */
    Scene.prototype.render = function (ctx, timing) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        if (this.actions.loading) { //TODO change to a callback?
            ctx.fillStyle = 'rgb(255, 0, 0)';
            ctx.font = "italic 400 12px sans-serif";
            ctx.fillText('loading...', ctx.canvas.width - 100, ctx.canvas.height - 10);
            return;
        }

        this.objs.forEach(function (obj) { obj.render(ctx, this, timing); }, this);

        if (this.actions.fade) { //TODO change to callback?
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

    /**
     * remove all objects from the scene
     */
    Scene.prototype.flush = function () {
        this.objs = [];
    };

    /**
     * load scene data from an object
     *
     * @param {Game} game
     * @param {object} data
     */
    Scene.prototype.load = function (game, data) {

        this.selection = new Selection(game, this); //TODO have Scene.attachSelectionManager() instead?

        if (data.scene) {
            if (data.scene.selection) {
                this.selection.engage(data.scene.selection);
            }
        }

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
                var bld = this.add(new Building());
                bld.coords = building.coords;
                bld.setSprite(building.sprite);
            }, this);
        }
    };

    /**
     * @constructor
     *
     * Selection helps track which units are selected and what events they get based on that info.
     */
     function Selection (game, scene) {
        this.game = game;
        this.scene = scene;
        this.selections = [];
        this.engaged = false;
     }

    /**
     * handle the clicks through the selection manager logic if engaged
     * otherwise pass through to object click handling
     *
     * @param {MouseEvent} evt
     * @param {array} hits
     *
     */
     Selection.prototype.click = function (evt, hits) {
        if (this.engaged) { //TODO shouldnt need this flag
            if (evt.button == 2) {
                this.selections.forEach(function (hit) { hit.selected = false; hit.deselect(this.game, this.scene); }, this);
                this.selections = [];
            }
            else if (this.selections.length > 0) {
                if (hits.length == 1) {
                    hits[0].click(this.game, this.scene);
                }
                else {
                    console.log('don\'t know what to do; targetting two objects at once');
                }
            }
            else {
                this.add(hits);
            }
        }
        else {
            hits.forEach(function (hit) { hit.click(this.game, this.scene); }, this);
        }
     };

    /**
     * add the passed objects to the selection manager's invetory
     *
     * @param {array} hits
     *
     */
     Selection.prototype.add = function (hits) {
        hits.forEach(function (hit) { hit.selected = true; hit.select(this.game, this.scene); }, this);
        this.selections = hits;
     };

    /**
     * turns the selection manager functionality on/off
     *
     * @param {boolean} engaged
     */
     Selection.prototype.engage = function (engaged) {
        if (engaged != undefined) {
            if (typeof engaged !== "boolean")
                throw "invalid type";

            this.engaged = engaged;
        }
        else {
            return this.engaged;
        }
     };

    /**
     * Game is the object that runs the loop and 
     * makes the game universe go.
     *
     * @param {String} id - id of the canvas element
     */
    function Game (id) {
        canvas = document.getElementById(id);
        context = canvas.getContext('2d');
        //context.imageSmoothingEnabled = false;

        this.sceneStack = [];
        this.scene = null;
        this.timing = {
            'start': Date.now(),
            'last': Date.now(),
        };

        this.lastHoverHits = []; //TODO move this outside?

        this.mouseHandle = { //TODO move this outside?
            'coords': [0,0],
            'lastCoords': [0,0],
        };

        canvas.addEventListener('click',       this.clickController.bind(this));
        canvas.addEventListener('contextmenu', this.clickController.bind(this));
        canvas.addEventListener('mousemove',   this.mouseMoveController.bind(this));

        requestAnimationFrame(this.step.bind(this), canvas);
    }

    /**
     * Return the current Scene if there is one
     *
     * @return {Scene|null}
     */
    Game.prototype.currentScene = function () {
        if (this.scene !== null)
            return this.sceneStack[this.scene];
        else
            return null;
    };

    /**
     * Render loop step(), uses requestAnimationFrame(). Also perform some high
     * level logic, like deleting scenes, getting timings data, and converting
     * mouse coords.
     */
    Game.prototype.step = function () {
        this.timing.step = Date.now() - this.timing.last;
        this.timing.last = Date.now();

        var scene = this.currentScene();

        if (scene !== null)
        {
            //TODO: find home for this other than render loop.
            // loop should only do scene mgmt/render stuff proboably.
            // call this from new home instead to make loop cleaner
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
                this.popScene();

                scene = this.currentScene();
            }

            if (scene !== null)
                scene.render(context, this.timing);
        }

        requestAnimationFrame(this.step.bind(this), canvas);
    };

    /**
     * Catch all mouse clicks on the canavs, and delegate to scene
     *
     * @param {MouseEvent} evt
     */
    Game.prototype.clickController = function (evt) {
        if (this.scene === null)
            return;

        evt.preventDefault();

        var coords = [evt.pageX - evt.target.offsetLeft, evt.pageY - evt.target.offsetTop];

        var scene = this.currentScene();
        var hits = scene.queryHits(coords);

        scene.selection.click(evt, hits);

        //hits.forEach(function (hit) { hit.click(this, scene); }, this);
    };

    /**
     * Capture mouse move events and delay handling until step()
     *
     * @param {MouseEvent} evt
     */
    Game.prototype.mouseMoveController = function (evt) {
        this.mouseHandle.lastCoords = this.mouseHandle.coords;
        this.mouseHandle.coords = [evt.pageX - evt.target.offsetLeft, evt.pageY - evt.target.offsetTop];
    };

    /**
     * Load a new Scene to use as a game state
     *
     * @param {Scene} state - unfortunate variable name
     *
     * @return {Scene} the newly created / loaded scene
     */
    Game.prototype.loadScene = function (scene) {
        var newscene = new Scene();

        if (typeof scene == "string") {
            newscene.actions.loading = true;

            ejs.xhr('GET').callback((function (xhr, data) {
                newscene.load(this, data);
                delete newscene.actions.loading;
            }).bind(this)).send(scene);
        }
        else {
            newscene.load(this, scene);
        }

        return newscene;
    };

    /**
     * remove the top (current) Scene from the stack and return it
     *
     * @return {Scene} the top of the stack
     */
    Game.prototype.popScene = function () {
        var lastScene = this.sceneStack.pop();

        if (this.sceneStack.length)
            this.scene = this.sceneStack.length - 1;
        else
            this.scene = null;

        return lastScene;
    };

    /**
     * push a new state onto the stack, this superscedes the current Scene.
     *
     * @param {Scene} scene
     *
     * @return {Scene} the scene we just pushed
     */
    Game.prototype.pushScene = function (scene) {
        if (!scene instanceof Scene)
            throw "not a scene";

        this.sceneStack.push(scene);
        this.scene = this.sceneStack.length - 1;

        return scene;
    };

    /**
     * Queue a Scene to be shown After the current one finishes
     *
     * @param {Scene} scene
     *
     * @return {Scene}
     */
    Game.prototype.queueScene = function (scene) {
        if (!scene instanceof Scene)
            throw "not a scene";

        if (this.sceneStack.length) {
            this.sceneStack.splice(-1, 0, scene);
            this.scene++;
        }
        else {
            this.pushScene(scene);
        }

        return scene;
    };

    Game.Obj = Obj;
    Game.Scene = Scene;
    Game.Button = Button;
    Game.Building = Building;
    Game.Selection = Selection;

    return Game;
})();

(function () {
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
})();
