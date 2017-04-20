
function CubeModel (center, size) {

	this.center = center;
	this.size = size;

	this.vertices = [];
	this.indices = [];

	this.colors = [];

};

CubeModel.prototype.init = function() {

	this.vertices = [
		-1,-1,1,  1,-1,1,   1,1,1,  -1,1,1,   //front
		-1,-1,-1, 1,-1,-1,  1,1,-1, -1,1,-1,  //back
		-1,-1,-1, -1,1,-1,  -1,1,1, -1,-1,1,  //left
		1,-1,-1,  1,1,-1,   1,1,1,  1,-1,1,   //right
		-1,1,-1,  1,1,-1,   1,1,1,  -1,1,1,   //top
		-1,-1,-1, 1,-1,-1,  1,-1,1, -1,-1,1,  //bottom
	];

	for(var i = 0; i < 24; i += 4){
		this.indices.push(i+0,i+1,i+3,i+3,i+2,i+1);
	}

	var tmp = [[1,0,0],[0,1,0],[0,0,1],[1,1,0],[1,0,1],[0,1,1]];
	for (var i = 0; i < tmp.length; ++i) {//4 vertices are the same color
		for (var j = 0; j < 4; ++j) {
			this.colors.push.apply(this.colors,tmp[i]);
		}
	}

};
