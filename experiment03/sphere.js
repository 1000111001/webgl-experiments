
var Sphere = function(precision) {

	this.precision = precision;
	this.vertices = [];
	this.indices = [];
	this.colors = [];
	this.normals = [];

	var sin = Math.sin;
	var cos = Math.cos;
	function f(i, j) {
	    i = Math.PI*i/precision,
	    j = Math.PI*2*j/precision;
	    var l=sin(i),y=cos(i),x=sin(j)*l,z=cos(j)*l;
	    return [x, y, z];
	}

	var index = 0
	for(var i = 0; i <= precision; ++i){
		for(var j = 0; j <= precision; ++j){
			var k = [].concat(f(i, j), f(i+1, j), f(i, j+1), f(i+1, j+1));
			this.vertices.push.apply(this.vertices, k);
			this.normals.push.apply(this.normals, k);
			this.indices.push(index+0, index+1, index+2, index+1, index+2, index+3);
			index += 4;
		}
	}

	var mix;
	for(var i = 0; i < this.vertices.length; i += 4) {
		if( (i/4) % 2 )
			mix = 0.6;
		else
			mix = 0;
		this.colors.push(0.4+mix, 0.4, 0.4);
		this.colors.push(0.4+mix, 0.4, 0.4);
		this.colors.push(0.4+mix, 0.4, 0.4);
		this.colors.push(0.4+mix, 0.4, 0.4);
	}
}

Sphere.prototype.init = function() {

}