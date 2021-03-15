var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Vector2D = /** @class */ (function () {
    function Vector2D(x, y) {
        var _a;
        if (typeof (x) === 'number') {
            this.x = x;
            this.y = y;
        }
        else {
            this.x = x.x;
            this.y = (_a = x === null || x === void 0 ? void 0 : x.y) !== null && _a !== void 0 ? _a : y;
        }
    }
    Vector2D.prototype.add = function (vector) {
        this.x += vector.x;
        this.y += vector.y;
    };
    Vector2D.prototype.added = function (vector) {
        return new Vector2D(this.x + vector.x, this.y + vector.y);
    };
    Object.defineProperty(Vector2D.prototype, "collisionDetector", {
        get: function () {
            var _this = this;
            return function (circle) { return circle.doesCollide(_this); };
        },
        enumerable: false,
        configurable: true
    });
    Vector2D.prototype.copyTo = function (other) {
        other.x = this.x;
        other.y = this.y;
    };
    Vector2D.prototype.crossProduct = function (vector) {
        return this.x * vector.y - this.y * vector.x;
    };
    Vector2D.prototype.divide = function (divisor) {
        this.x /= divisor;
        this.y /= divisor;
    };
    Vector2D.prototype.dividedBy = function (divisor) {
        return new Vector2D(this.x / divisor, this.y / divisor);
    };
    Vector2D.prototype.dotProduct = function (vector) {
        return this.x * vector.x + this.y * vector.y;
    };
    Vector2D.prototype.from = function (vector) {
        return new Vector2D(this.x - vector.x, this.y - vector.y);
    };
    Object.defineProperty(Vector2D.prototype, "length", {
        get: function () {
            return Math.hypot(this.x, this.y);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Vector2D.prototype, "squareOfLength", {
        get: function () {
            return this.dotProduct(this);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Vector2D.prototype, "retrorse", {
        get: function () {
            return new Vector2D(-this.x, -this.y);
        },
        enumerable: false,
        configurable: true
    });
    Vector2D.prototype.rotate = function (radian) {
        var _a = [Math.cos(radian), Math.sin(radian), this.x, this.y], c = _a[0], s = _a[1], x = _a[2], y = _a[3];
        this.x = x * c - y * s;
        this.y = x * s + y * c;
    };
    Vector2D.prototype.rotatedBy = function (radian) {
        var _a = [Math.cos(radian), Math.sin(radian)], c = _a[0], s = _a[1];
        return new Vector2D(this.x * c - this.y * s, this.x * s + this.y * c);
    };
    Vector2D.prototype.scale = function (scale) {
        this.x *= scale;
        this.y *= scale;
    };
    Vector2D.prototype.scaledBy = function (scale) {
        return new Vector2D(this.x * scale, this.y * scale);
    };
    Vector2D.prototype.sub = function (vector) {
        this.x -= vector.x;
        this.y -= vector.y;
    };
    return Vector2D;
}());
var Acceleration = /** @class */ (function (_super) {
    __extends(Acceleration, _super);
    function Acceleration() {
        var _this = _super.call(this, 0, 0) || this;
        _this.count = 0;
        return _this;
    }
    Acceleration.prototype.add = function (vector) {
        _super.prototype.add.call(this, vector);
        this.count++;
    };
    Acceleration.prototype.effectTo = function (vector) {
        if (this.count)
            vector.add(this.dividedBy(this.count));
    };
    return Acceleration;
}(Vector2D));
var Deceleration = /** @class */ (function (_super) {
    __extends(Deceleration, _super);
    function Deceleration() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Deceleration.prototype.add = function (vector) {
        _super.prototype.sub.call(this, vector);
        this.count++;
    };
    return Deceleration;
}(Acceleration));
var AvoidanceDeceleration = /** @class */ (function (_super) {
    __extends(AvoidanceDeceleration, _super);
    function AvoidanceDeceleration() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AvoidanceDeceleration.prototype.match = function (relationship) {
        var matched = relationship.distance < 12;
        if (matched)
            this.add(relationship.vector.dividedBy(relationship.distance * 4));
        return matched;
    };
    return AvoidanceDeceleration;
}(Deceleration));
var FarAcceleration = /** @class */ (function (_super) {
    __extends(FarAcceleration, _super);
    function FarAcceleration() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FarAcceleration.prototype.match = function (relationship) {
        var distance = relationship.distance;
        for (var i = 0; i < 4; i++)
            if (distance < 48 + i * 24) {
                this.add(relationship.vector.dividedBy(distance * (i + 1) * 8));
                return true;
            }
    };
    return FarAcceleration;
}(Acceleration));
var SpreadAcceleration = /** @class */ (function (_super) {
    __extends(SpreadAcceleration, _super);
    function SpreadAcceleration(spread) {
        var _this = _super.call(this) || this;
        _this.spread = spread;
        return _this;
    }
    SpreadAcceleration.prototype.match = function (relationship) {
        var matched = relationship.distance < this.spread;
        if (matched) {
            var boid = relationship.relationalBoid;
            this.add(boid.velocity.dividedBy(boid.speed * 32));
        }
        return matched;
    };
    return SpreadAcceleration;
}(Acceleration));
var Boid = /** @class */ (function () {
    function Boid(all, canvas, circles, context, index) {
        this.all = all;
        this.canvas = canvas;
        this.circles = circles;
        this.context = context;
        this.index = index;
        do {
            var x = 20 + Math.random() * (canvas.width - 40);
            var y = 20 + Math.random() * (canvas.height - 40);
            this.position = new Vector2D(x, y);
        } while (circles.some(this.position.collisionDetector));
        this.velocity = new Vector2D(1 - Math.random() * 2, 1 - Math.random() * 2);
    }
    Boid.prototype.avoidCircles = function () {
        var _a;
        for (var _i = 0, _b = this.circles.filter(this.position.collisionDetector); _i < _b.length; _i++) {
            var c = _b[_i];
            this.position.sub(this.velocity);
            var p = c.intersectingPoint(this);
            (_a = p === null || p === void 0 ? void 0 : p.rotate(this)) !== null && _a !== void 0 ? _a : (this.position.from(c.center).copyTo(this.velocity), this.normalize());
            this.position.add(this.velocity);
        }
    };
    Boid.prototype.draw = function () {
        this.context.beginPath();
        this.context.fillStyle = 'rgb(255, 128, 0)';
        this.context.arc(this.position.x, this.position.y, 1, 0, Math.PI * 2, true);
        this.context.fill();
    };
    Boid.prototype.drawCanvas = function () {
        this.context.fillStyle = "rgba(0, 0, 0, .1)";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    };
    Boid.prototype.drawCircles = function () {
        this.circles.forEach(function (circle) { return circle.draw(); });
    };
    Object.defineProperty(Boid.prototype, "globalCompositeOperation", {
        set: function (operation) {
            this.context.globalCompositeOperation = operation;
        },
        enumerable: false,
        configurable: true
    });
    Boid.prototype.move = function () {
        this.position.add(this.velocity);
        this.avoidCircles();
        this.turnOverByEdgeOfCanvas();
    };
    Object.defineProperty(Boid.prototype, "nextPoint", {
        get: function () {
            return this.position.added(this.velocity);
        },
        enumerable: false,
        configurable: true
    });
    Boid.prototype.normalize = function () {
        var limit = 0.8 + Math.random() * 1.2;
        var speed = this.speed;
        if (limit < speed)
            this.velocity.scale(limit / speed);
    };
    Object.defineProperty(Boid.prototype, "others", {
        get: function () {
            var _this = this;
            return this.all.filter(function (_, index) { return index != _this.index; });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Boid.prototype, "speed", {
        get: function () {
            return this.velocity.length;
        },
        enumerable: false,
        configurable: true
    });
    Boid.prototype.turnOverByEdgeOfCanvas = function () {
        if (this.position.x < 0) {
            this.position.x = 0;
            this.velocity.x = Math.abs(this.velocity.x);
        }
        if (this.canvas.width < this.position.x) {
            this.position.x = this.canvas.width;
            this.velocity.x = -Math.abs(this.velocity.x);
        }
        if (this.position.y < 0) {
            this.position.y = 0;
            this.velocity.y = Math.abs(this.velocity.y);
        }
        if (this.canvas.height < this.position.y) {
            this.position.y = this.canvas.height;
            this.velocity.y = -Math.abs(this.velocity.y);
        }
    };
    Boid.prototype.update = function () {
        var effects = [
            new AvoidanceDeceleration(),
            new SpreadAcceleration(16 + Math.random() * 8),
            new FarAcceleration(),
        ];
        var _loop_1 = function (boid) {
            var relationship = new BoidRelationship(this_1, boid);
            effects.find(function (e) { return e.match(relationship); });
        };
        var this_1 = this;
        for (var _i = 0, _a = this.others; _i < _a.length; _i++) {
            var boid = _a[_i];
            _loop_1(boid);
        }
        for (var _b = 0, effects_1 = effects; _b < effects_1.length; _b++) {
            var e = effects_1[_b];
            e.effectTo(this.velocity);
        }
    };
    return Boid;
}());
var BoidRelationship = /** @class */ (function () {
    function BoidRelationship(baseBoid, relationalBoid) {
        this.baseBoid = baseBoid;
        this.relationalBoid = relationalBoid;
        this.vector = relationalBoid.position.from(baseBoid.position);
        this.distance = this.vector.length;
    }
    return BoidRelationship;
}());
function within(lower, higher) {
    return function (value) { return lower <= value && value <= higher; };
}
var Circle = /** @class */ (function () {
    function Circle(context, x, y, radius, color) {
        if (radius === void 0) { radius = 100; }
        if (color === void 0) { color = 'rgba(32, 32, 48, .5)'; }
        this.context = context;
        this.radius = radius;
        this.color = color;
        this.center = new Vector2D(x, y);
    }
    Circle.prototype.amplitude = function (time, boid) {
        var next = boid.position.added(boid.velocity.scaledBy(time));
        var _a = [boid.nextPoint, this.center].map(function (v) { return v.from(next); }), v1 = _a[0], v2 = _a[1];
        return Math.acos(v1.dotProduct(v2) / (v1.length * v2.length));
    };
    Circle.prototype.draw = function () {
        this.context.beginPath();
        this.context.fillStyle = this.color;
        this.context.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2, true);
        this.context.fill();
    };
    Circle.prototype.doesCollide = function (pos) {
        var v = this.center.from(pos);
        return v.length <= this.radius;
    };
    Circle.prototype.intersectingPoint = function (boid) {
        var vector = boid.position.from(this.center);
        var length = boid.velocity.squareOfLength;
        var a = -boid.velocity.dotProduct(vector);
        var b = vector.squareOfLength - this.squareOfRadius;
        var c = a * a - length * b;
        if (0 <= c) {
            var d = Math.sqrt(c);
            var t = [(a + d) / length, (a - d) / length];
            if (t.some(within(0, 1)))
                return new IntersectingPoint(this.amplitude(t[0], boid));
        }
    };
    Object.defineProperty(Circle.prototype, "squareOfRadius", {
        get: function () {
            return this.radius * this.radius;
        },
        enumerable: false,
        configurable: true
    });
    return Circle;
}());
var IntersectingPoint = /** @class */ (function () {
    function IntersectingPoint(amplitude) {
        this.rotation = Math.PI - (amplitude * 2 <= Math.PI ? 2 : 1) * amplitude;
    }
    IntersectingPoint.prototype.rotate = function (boid) {
        boid.velocity.rotate(this.rotation);
        return true;
    };
    return IntersectingPoint;
}());
function addOrRemoveCircle(circles, context, event) {
    var r = event.target.getBoundingClientRect();
    var p = new Vector2D(event.clientX, event.clientY).from(new Vector2D(r.left, r.top));
    var found = circles.filter(p.collisionDetector);
    for (var _i = 0, found_1 = found; _i < found_1.length; _i++) {
        var circle = found_1[_i];
        var index = circles.indexOf(circle);
        circles.splice(index, 1);
    }
    if (found.length == 0)
        circles.push(new Circle(context, p.x, p.y));
}
function updateBoids(boids) {
    var boid = boids[0];
    boid.globalCompositeOperation = "source-over";
    boid.drawCanvas();
    boid.drawCircles();
    boid.globalCompositeOperation = "lighter";
    for (var _i = 0, boids_1 = boids; _i < boids_1.length; _i++) {
        var boid_1 = boids_1[_i];
        boid_1.draw();
        boid_1.update();
    }
    for (var _a = 0, boids_2 = boids; _a < boids_2.length; _a++) {
        var boid_2 = boids_2[_a];
        boid_2.normalize();
        boid_2.move();
    }
}
function generateBoids(param) {
    var canvas = document.getElementById(param.id);
    var context = canvas.getContext('2d');
    var circles = [];
    for (var i = 0; i < 1; i++) {
        var x = 100 + Math.random() * (canvas.width - 200);
        var y = 100 + Math.random() * (canvas.height - 200);
        circles.push(new Circle(context, x, y));
    }
    var boids = [];
    for (var i = 0; i < param.num; i++)
        boids.push(new Boid(boids, canvas, circles, context, i));
    canvas.onmouseup = function (event) { return addOrRemoveCircle(circles, context, event); };
    return { boids: boids, update: updateBoids };
}
