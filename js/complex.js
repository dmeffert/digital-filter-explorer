// This module defines a constructor for complex number objects. It is by no means a complete class, 
// as it lacks many operations you would expect to be able to perform  with complex numbers. It 
// simply covers the needs of this particular application.
//  
// Binary operations (e.g. addition, multiplication, etc) are added directly to the `Complex` 
// constructor object as static methods that accept two complex number parameters, instead of being 
// methods of the complex number object prototype. For example,  adding two complex numbers is done 
// with `Complex.add(z, w)` instead of `z.add(w)`.

//
define(
    ['underscore'], 
    function(_) {

    // Constructor.
    function Complex(real, imaginary) {
        if (imaginary === undefined) imaginary = 0.0;
        if (!_.isNumber(real) || !_.isNumber(imaginary)) throw new TypeError();

        this.real = real;
        this.imaginary = imaginary;
    }

    // This method returns `true` only if the complex number is real. Since we are dealing 
    // with limited precision floating point operations we do not test if the imaginary
    // part is exactly equal to zero, but we test if it's within some small distance 
    // $\varepsilon$ to zero.
    Complex.prototype.isReal = function() {
        return Math.abs(this.imaginary) < Complex.EPSILON;
    };

    // Returns the *modulus*, or *absolute value*, which for a complex number $z = a + bi$ is
    // defined as $$|z| = \sqrt{a^2 + b^2}$$
    Complex.prototype.modulus = function() {
        return Math.sqrt(this.modulusSquared());
    };

    // Returns the modulus squared, which for a complex number $z = a + bi$ is
    // equal to $$|z|^2 = a^2 + b^2$$
    Complex.prototype.modulusSquared = function() {
        return this.real * this.real + this.imaginary * this.imaginary;
    };

    // Returns the *argument* or *phase*, which for a complex number $z = a + bi$ is defined as
    // $$\angle z = \operatorname{atan2}(b, a)$$
    Complex.prototype.argument = function() {
        return Math.atan2(this.imaginary, this.real);
    };

    // Returns the complex conjugate, which for a complex number $z = a + bi$ is defined as
    // $$\bar{z} = a - bi$$
    Complex.prototype.conjugate = function() {
        return new Complex(this.real, -this.imaginary);
    };

    // Returns the multiplicative inverse, which for a complex number $z = a + bi$ is equal
    // to $$\frac{1}{z} = \frac{\bar{z}}{z\bar{z}} = \frac{a - bi}{a^2 + b^2}$$
    Complex.prototype.reciprocal = function() {
        var modulusSquared = this.real * this.real + this.imaginary * this.imaginary;
        return new Complex(this.real / modulusSquared, -this.imaginary / modulusSquared);
    };

    // Returns the additive inverse, which for a complex number $z = a + bi$ is equal to
    // $$-z = -a -bi$$
    Complex.prototype.negation = function() {
        return new Complex(-this.real, -this.imaginary);
    };

    // Scales the complex number by a real factor such that its modulus equals `x`.
    Complex.prototype.scaleModulusTo = function(x) {
        var scaleFactor = x / this.modulus();
        this.real *= scaleFactor;
        this.imaginary *= scaleFactor;
    };

    // Takes the `n`th-root.
    Complex.prototype.root = function(n) {
        var r = Math.pow(this.modulus(), 1/n);
        var phi = this.argument() / n;
        return Complex.fromPolar(r, phi);
    };

    // Returns a string describing the complex number in $a + bi$ form.
    Complex.prototype.toString = function() {
        if (this.isReal()) return this.real;
        return this.real + " + " + this.imaginary + "i";
    };

    // Returns a new complex number from a combination of modulus `r` and argument `phi`.
    Complex.fromPolar = function(r, phi) {
        return new Complex(r * Math.cos(phi), r * Math.sin(phi));
    };

    // Adds two complex numbers `lhs` and `rhs` and returns the result.
    Complex.add = function(lhs, rhs) {
        return new Complex(lhs.real + rhs.real, lhs.imaginary + rhs.imaginary);
    };

    // Subtracts the complex numbers `rhs` from the complex number `lhs` and returns the result.
    Complex.subtract = function(lhs, rhs) {
        return new Complex(lhs.real - rhs.real, lhs.imaginary - rhs.imaginary);
    };

    // Multiplies two complex numbers `lhs` and `rhs` and returns the result.
    Complex.multiply = function(lhs, rhs) {
        var real = lhs.real * rhs.real - lhs.imaginary * rhs.imaginary;
        var imaginary = lhs.real * rhs.imaginary + lhs.imaginary * rhs.real;
        return new Complex(real, imaginary);
    };

    // Divides two complex number `lhs` by the complex number `rhs` and returns the result.
    Complex.divide = function (lhs, rhs) {
        var modulusSquared = rhs.real * rhs.real + rhs.imaginary * rhs.imaginary;
        var real = lhs.real * rhs.real + lhs.imaginary * rhs.imaginary;
        var imaginary = lhs.imaginary * rhs.real - lhs.real * rhs.imaginary;
        return new Complex(real / modulusSquared, imaginary / modulusSquared);
    };

    // Returns the complex exponential $exp($`z`$)$.
    Complex.exp = function(z) {
        var realPart = new Complex(Math.exp(z.real));
        var imaginaryPart = new Complex(Math.cos(z.imaginary), Math.sin(z.imaginary));
        return Complex.multiply(realPart, imaginaryPart);
    };

    // Returns `true` if the complex numbers `lhs` and `rhs` are equal up to a small number
    // $\varepsilon$.
    Complex.areEqual = function(lhs, rhs) {
        if (lhs === rhs) return true;
        if (lhs === null || rhs === null || lhs === undefined || rhs === undefined) return false;
        return (Math.abs(lhs.real      - rhs.real)      < Complex.EPSILON) &&
               (Math.abs(lhs.imaginary - rhs.imaginary) < Complex.EPSILON);
    };

    // The small $\varepsilon$-value used for equality testing.
    Complex.EPSILON = 1e-10;

    return Complex;
});