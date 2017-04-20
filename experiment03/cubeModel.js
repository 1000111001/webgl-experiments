
function CubeModel (center, size) {

	this.center = center;
	this.size = size;

	this.vertices = [];
	this.indices = [];

	this.colors = [];

	this.normals = [];

};

CubeModel.prototype.init = function() {

	this.vertices = [
		//Front face
		-1, -1,  1,  
		 1, -1,  1,   
		 1,  1,  1,  
		-1,  1,  1,

		//Back face
		-1, -1, -1, 
		 1, -1, -1,  
		 1,  1, -1, 
		-1,  1, -1,

		//Left face
		-1, -1, -1, 
		-1,  1, -1,  
		-1,  1,  1, 
		-1, -1,  1,

		//Right face
		 1, -1, -1,  
		 1,  1, -1,   
		 1,  1,  1,  
		 1, -1,  1,

		//Top face
		-1,  1, -1,  
		 1,  1, -1,   
		 1,  1,  1,  
		-1,  1,  1,

		//Bottom face
		-1, -1, -1, 
		 1, -1, -1,  
		 1, -1,  1, 
		-1, -1,  1,
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

	this.normals = [
        // Front face
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,
         0.0,  0.0,  1.0,

        // Back face
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,
         0.0,  0.0, -1.0,

        // Left face
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,

        // Right face
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0,  0.0,  0.0,

        // Top face
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,

        // Bottom face
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0, -1.0,  0.0,
	];

};
