// Shape - superclass
function Shape(x, y) {
	this.x = x;
	this.y = y;
}

// superclass method
Shape.prototype.move = function(x, y) {
	this.x += x;
	this.y += y;
	console.info("Shape moved.");
};

// Rectangle - subclass
function Rectangle() {
	Shape.call(this); // call super constructor.
}

// subclass extends superclass
Rectangle.prototype = Object.create(Shape.prototype);

//If you don't set Object.prototype.constructor to Rectangle,
//it will take prototype.constructor of Shape (parent).
//To avoid that, we set the prototype.constructor to Rectangle (child).
Rectangle.prototype.constructor = Rectangle;

var rect = new Rectangle();

console.log("Is rect an instance of Rectangle?", rect instanceof Rectangle); // true
console.log("Is rect an instance of Shape?", rect instanceof Shape); // true
rect.move(1, 1); // Outputs, 'Shape moved.'
console.log(typeof rect);
console.log(rect instanceof Rectangle);
console.log(rect instanceof Shape);
