var Vector2D = function Vector2D(u, v) {
	this.u = u;
	this.v = v;
}
Vector2D.crossProduct = function(v1, v2) {
	return v1.u * v2.v - v1.v * v2.u;
}
Vector2D.dotProduct = function(v1, v2) {
	return v1.u * v2.u + v1.v * v2.v;
}
Vector2D.fromPoint = function(pos) {
	return new Vector2D(pos.x, pos.y);
}
Vector2D.prototype = {
	length: function() {
		return Math.sqrt(this.u * this.u + this.v * this.v);
	},
	point: function() {
		return new Point2D(this.u, this.v);
	},
	vectorByAdding: function(vec) {
		return new Vector2D(this.u + vec.u, this.v + vec.v);
	},
	vectorByDividing: function(d) {
		return new Vector2D(this.u / d, this.v / d);
	},
	vectorByRotating: function(deg) {
		var c = Math.cos(deg);
		var s = Math.sin(deg);
		return new Vector2D(this.u * c - this.v * s, this.u * s + this.v * c);
	},
	vectorByScaling: function(scale) {
		return new Vector2D(this.u * scale, this.v * scale);
	},
};

var Point2D = function Point2D(x, y) {
	this.x = x;
	this.y = y;
}
Point2D.prototype = {
	doesCollide: function(circles) {
		for (var i = 0; i < circles.length; i++)
			if (circles[i].doesCollide(this))
				return true;
		return false;
	},
	pointByAdding: function(vec) {
		return new Point2D(this.x + vec.u, this.y + vec.v);
	},
	vectorFrom: function(pos) {
		return new Vector2D(this.x - pos.x, this.y - pos.y);
	},
	vectorTo: function(pos) {
		return new Vector2D(pos.x - this.x, pos.y - this.y);
	},
};

var IntersectingPoint = function(time, boid) {
	var v = boid.vector().vectorByScaling(time);
	this.point = boid.point().pointByAdding(v);
	this.vector = this.point.vectorTo(boid.nextPoint());
}
IntersectingPoint.prototype = {
	amplitude: function(circle) {
		var v1 = this.vector;
		var v2 = this.point.vectorTo(circle.center());
		var dp = Vector2D.dotProduct(v1, v2) / (v1.length() * v2.length());
		return Math.acos(dp);
	},
};

var Boid = function(canvas, circles) {
	do {
		this.x = 20 + Math.random() * (canvas.width - 40);
		this.y = 20 + Math.random() * (canvas.height - 40);
	} while (this.point().doesCollide(circles));
	this.vx = 1 - Math.random() * 2;
	this.vy = 1 - Math.random() * 2;
}
Boid.prototype = {
	draw: function(context) {
		context.beginPath();
		context.fillStyle = 'rgb(255, 128, 0)';
		context.arc(this.x, this.y, 1, 0, Math.PI * 2, true);
		context.fill();
	},
	intersectingPoint: function(circle) {
		var dx = this.x - circle.x;
		var dy = this.y - circle.y;
		var v = this.vector()
		var dv = new Vector2D(dx, dy)
		var a = Vector2D.dotProduct(v, v)
		var b = Vector2D.dotProduct(v, dv)
		var c = Vector2D.dotProduct(dv, dv) - circle.radius * circle.radius;
		var d = b * b - a * c;
		if (d < 0)
			return null;
		b *= -1;
		d = Math.sqrt(d);
		var t1 = (b + d) / a;
		var t2 = (b - d) / a;
		return (t1 < 0 || 1 < t1) && (t2 < 0 || 1 < t2) ? null : new IntersectingPoint(t1, this);
	},
	move: function(canvas, circles) {
		this.x += this.vx;
		this.y += this.vy;
		for (var i = 0; i < circles.length; i++) {
			var c = circles[i];
			if (c.doesCollide(this.point())) {
				this.x -= this.vx;
				this.y -= this.vy;
				var p = this.intersectingPoint(c);
				if (p) {
					var a = p.amplitude(c);
					if (a * 2 <= Math.PI)
						a = Math.PI - a * 2;
					else
						a = Math.PI - a;
					var v = this.vector().vectorByRotating(a);
					this.vx = v.u;
					this.vy = v.v;
				} else {
					this.vx = this.x - c.x;
					this.vy = this.y - c.y;
					this.normalize();
				}
				this.x += this.vx;
				this.y += this.vy;
			}
		}
		if (this.x < 0 || canvas.width < this.x) {
			this.x -= this.vx;
			this.vx *= -1;
		}
		if (this.y < 0 || canvas.height < this.y) {
			this.y -= this.vy;
			this.vy *= -1;
		}
	},
	nextPoint: function() {
		return this.point().pointByAdding(this.vector());
	},
	normalize: function() {
		var limit = 0.8 + Math.random() * 1.2
		var speed = this.speed();
		if (limit < speed) {
			var v = this.vector().vectorByScaling(limit / speed);
			this.vx = v.u;
			this.vy = v.v;
		}
	},
	point: function() {
		return new Point2D(this.x, this.y);
	},
	speed: function() {
		return this.vector().length();
	},
	update: function(i, boids) {
		var av = new Vector2D(0, 0), ac = 0;
		var bv = new Vector2D(0, 0), bc = 0;
		var cv = new Vector2D(0, 0), cc = 0;
		var spread = 16 + Math.random() * 8;
		for (var j = 0; j < boids.length; j++) {
			if (j == i)
				continue;
			var dv = this.point().vectorFrom(boids[j].point());
			var distance = dv.length();
			if (distance < 12) {
				av = av.vectorByAdding(dv.vectorByDividing(distance * 4));
				ac++;
			} else if (distance < spread) {
				var speed = boids[j].speed();
				bv = bv.vectorByAdding(boids[j].vector().vectorByDividing(speed * 32));
				bc++;
			} else
				for (var k = 0; k < 4; k++)
					if (distance < 48 + k * 24) {
						cv = cv.vectorByAdding(dv.vectorByDividing(distance * (k + 1) * 8));
						cc++;
						break;
					}
		}
		var v = this.vector();
		if (ac)
			v = v.vectorByAdding(av.vectorByDividing(ac));
		if (bc)
			v = v.vectorByAdding(bv.vectorByDividing(bc));
		if (cc)
			v = v.vectorByAdding(cv.vectorByDividing(-cc));
		this.vx = v.u;
		this.vy = v.v;
	},
	vector: function() {
		return new Vector2D(this.vx, this.vy);
	},
};

var Circle = function(x, y, radius, color) {
	this.x = x;
	this.y = y;
	this.radius = radius;
	this.color = color;
}
Circle.prototype = {
	center: function() {
		return new Point2D(this.x, this.y);
	},
	draw: function(context) {
		context.beginPath();
		context.fillStyle = this.color;
		context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
		context.fill();
	},
	doesCollide: function(pos) {
		return this.center().vectorFrom(pos).length() <= this.radius;
	},
};

function onmouseup(circles, event) {
	var r = event.target.getBoundingClientRect();
	var p = new Point2D(event.clientX, event.clientY).vectorFrom(new Point2D(r.left, r.top)).point();
	var found = false;
	for (var i = 0; i < circles.length; i++)
		if (circles[i].doesCollide(p)) {
			if (!found)
				found = new Array();
			found.push(i);
		}
	if (found)
		for (var i = 0; i < found.length; i++)
			circles.splice(found[i] - i, 1);
	else
		circles.push(new Circle(p.x, p.y, 100, 'rgba(32, 32, 48, .5)'));
}

function update(canvas, context, circles, boids) {
	context.globalCompositeOperation = "source-over";
	context.fillStyle = "rgba(0, 0, 0, .1)";
	context.fillRect(0, 0, canvas.width, canvas.height);
	for (var i = 0; i < circles.length; i++)
		circles[i].draw(context);
	context.globalCompositeOperation = "lighter";
	for (var i = 0; i < boids.length; i++)
		boids[i].draw(context);
	for (var i = 0; i < boids.length; i++)
		boids[i].update(i, boids);
	for (var i = 0; i < boids.length; i++)
		boids[i].normalize();
	for (var i = 0; i < boids.length; i++)
		boids[i].move(canvas, circles);
}

function initialize(num, period) {
	var canvas = document.getElementById('boids');
	var context = canvas.getContext('2d');
	var circles = new Array();
	for (var i = 0; i < 1; i++) {
		var x = 100 + Math.random() * (canvas.width - 200);
		var y = 100 + Math.random() * (canvas.height - 200);
		circles[i] = new Circle(x, y, 100, 'rgba(32, 32, 48, .5)');
	}
	var boids = new Array();
	for (var i = 0; i < num; i++)
		boids[i] = new Boid(canvas, circles);
	setInterval(function() { update(canvas, context, circles, boids); }, period);
	canvas.onmouseup = function(event) { onmouseup(circles, event); };
}