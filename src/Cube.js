
class Cube{
    constructor(segments){
        this.type='cube';
        //this.position = [0.0,0.0,0.0];
        this.color = [1.0,1.0,1.0,1.0];
        //this.size=5.0;
        //this.segments = segments;
        this.matrix = new Matrix4();
    }

    render() {
        //var xy = this.position;
        var rgba = this.color;
        //var size = this.size;
    
        
        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        //Pass the matrix to u)_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        

        //FRONT FACE
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    drawTriangle3d( [ 0.0, 0.0, 0.0,  1.0, 1.0, 0.0,  1.0, 0.0, 0.0 ] );
    drawTriangle3d( [ 0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  1.0, 1.0, 0.0 ] );
    
    //BOTTOM FACE
    gl.uniform4f(u_FragColor, rgba[0] * .9, rgba[1] * .9, rgba[2] * .9, rgba[3]);
    drawTriangle3d( [ 1.0, 0.0, 0.0,  0.0, 0.0, 1.0,  1.0, 0.0, 1.0 ] );
    drawTriangle3d( [ 0.0, 0.0, 0.0,  1.0, 0.0, 0.0,  0.0, 0.0, 1.0 ] );
    
    //LEFT FACE
    gl.uniform4f(u_FragColor, rgba[0] * .8, rgba[1] * .8, rgba[2] * .8, rgba[3]);
    drawTriangle3d( [ 0.0, 0.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 1.0 ] );
    drawTriangle3d( [ 0.0, 0.0, 0.0,  0.0, 0.0, 1.0,  0.0, 1.0, 1.0 ] );
        
    //TOP FACE
    gl.uniform4f(u_FragColor, rgba[0] * .9, rgba[1] * .9, rgba[2] * .9, rgba[3]);
    drawTriangle3d( [ 0.0, 1.0, 0.0,  1.0, 1.0, 0.0,  1.0, 1.0, 1.0 ] );
    drawTriangle3d( [ 0.0, 1.0, 0.0,  0.0, 1.0, 1.0,  1.0, 1.0, 1.0 ] );
    
    //RIGHT FACE
    gl.uniform4f(u_FragColor, rgba[0] * .7, rgba[1] * .7, rgba[2] * .8, rgba[3]);
    drawTriangle3d( [ 1.0, 0.0, 0.0,  1.0, 1.0, 0.0,  1.0, 1.0, 1.0 ] );
    drawTriangle3d( [ 1.0, 0.0, 0.0,  1.0, 0.0, 1.0,  1.0, 1.0, 1.0 ] );
        
    //BACK FACE
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    drawTriangle3d( [ 0.0, 0.0, 1.0,  0.0, 1.0, 1.0,  1.0, 1.0, 1.0 ] );
    drawTriangle3d( [ 0.0, 0.0, 1.0,  1.0, 0.0, 1.0,  1.0, 1.0, 1.0 ] );
    }

        
    
}



