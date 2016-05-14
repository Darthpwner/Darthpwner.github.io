// *******************************************************
// CS 174a Graphics Example Code
// animation.js - The main file and program start point.  The class definition here describes how to display an Animation and how it will react to key and mouse input.  Right now it has 
// very little in it - you will fill it in with all your shape drawing calls and any extra key / mouse controls.  

// Now go down to display() to see where the sample shapes are drawn, and to see where to fill in your own code.

"use strict"
var canvas, canvas_size, gl = null, g_addrs,
	movement = vec2(),	thrust = vec3(), 	looking = false, prev_time = 0, animate = false, animation_time = 0;
		var gouraud = false, color_normals = false, solid = false;
function CURRENT_BASIS_IS_WORTH_SHOWING(self, model_transform) { self.m_axis.draw( self.basis_id++, self.graphicsState, model_transform, new Material( vec4( .8,.3,.8,1 ), .5, 1, 1, 40, "" ) ); }

//Boolean variables
var gravityOn = false;
var panToHamster = false;

//Ball properties
var ballThrust = vec3();
var ball = {value: mat4() };

//Platform properties
var platforms = new Array();

var platform1 = {value: mat4() };
var platform2 = {value: mat4() };
var platform3 = {value: mat4() };
var platform4 = {value: mat4() };
var platform5 = {value: mat4() };
var platform6 = {value: mat4() };
var platform7 = {value: mat4() };
var platform8 = {value: mat4() };
var platform9 = {value: mat4() };
var platform10 = {value: mat4() };
var platform11 = {value: mat4() };
var platform12 = {value: mat4() };
var platform13 = {value: mat4() };
var platform14 = {value: mat4() };
var platform15 = {value: mat4() };
var platform16 = {value: mat4() };

		platforms.push(platform1);
		platforms.push(platform2);
		platforms.push(platform3);
		platforms.push(platform4);
		platforms.push(platform5);
		platforms.push(platform6);
		platforms.push(platform7);
		platforms.push(platform8);
		platforms.push(platform9);
		platforms.push(platform10);
		platforms.push(platform11);
		platforms.push(platform12);
		platforms.push(platform13);
		platforms.push(platform14);
		platforms.push(platform15);
		platforms.push(platform16);

//Inverse properties
var platformsInverse = [{value: mat4() }];;	//To find collisions with platforms
var flagsInverse = [{value: mat4() }];;	//To find collisions with flags
var ballInverse = {value: mat4()};	//To find collisions with the ball
var hamsterInverse = {value: mat4() };	//To find collision with the hamster
var sunflowerInverse = {value: mat4() };	//To find collision with the sunflower
var finishInverse = {value: mat4() };	//To find collision with finish

//Flag properties
var flag = {value: mat4() };

//Ground properties
var ground = {value: mat4() };

//Hamster properties
var hamster = {value: mat4() };

//Sunflower properties
var sunflower = {value: mat4() };

//Side that hamster is on (sunflower on opposite side)
var side = Math.round(Math.random());	//0: left, 1: right

// Materials: Declare new ones as needed in every function.
		// 1st parameter:  Color (4 floats in RGBA format), 2nd: Ambient light, 3rd: Diffuse reflectivity, 4th: Specular reflectivity, 5th: Smoothness exponent, 6th: Texture image.
		var purplePlastic = new Material( vec4( .9,.5,.9,1 ), .2, .5, .8, 40 ), // Omit the final (string) parameter if you want no texture
			greyPlastic = new Material( vec4( .5,.5,.5,1 ), .2, .8, .5, 20 ),
			earth = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "earth.gif" ),
			stars = new Material( vec4( .5,.5,.5,1 ), .5, 1, 1, 40, "stars.png" ),
			black = new Material( vec4( 0, 0, 0, 1 ), .5, 1, 1, 40 ),
			yellow = new Material( vec4( 1, 1, 0, 1), .5, 1, 1, 40 ),
			ball_yellow = new Material( vec4( 1, 1, 0, 1), .5, 1, 1, 40, "ball_lines.jpg" ),
			brown = new Material( vec4( 165/216 , 42/216, 42/216, 1), .5, 1, 1, 40 ),
			green = new Material( vec4( 0, 1, 0, 1), .5, 1, 1, 40 ),
			white = new Material( vec4( 255, 255, 255, 1 ), .5, 1, 1, 40 ),
			pink = new Material( vec4(255/255, 192/255, 203/255, 1), .5, 1, 1, 40 ),
			bisque = new Material( vec4(255/255, 228/255, 192/255, 1), .5, 1, 1, 40),
			red = new Material( vec4( 1, 0, 0, 1), .5, 1, 1, 40 );

// *******************************************************
// IMPORTANT -- In the line below, add the filenames of any new images you want to include for textures!

var texture_filenames_to_load = [ "ball_lines.jpg", "stars.png", "text.png", "earth.gif" ];

// *******************************************************	
// When the web page's window loads it creates an "Animation" object.  It registers itself as a displayable object to our other class "GL_Context" -- which OpenGL is told to call upon every time a
// draw / keyboard / mouse event happens.

window.onload = function init() {	var anim = new Animation();	}
function Animation()
{
	( function init (self) 
	{
		self.context = new GL_Context( "gl-canvas" );
		self.context.register_display_object( self );
		
		gl.clearColor( 0, 0, 1, 1 );			// Background color: Blue
		
		for( var i = 0; i < texture_filenames_to_load.length; i++ )
			initTexture( texture_filenames_to_load[i], true );
		
		//Create the flag
		self.m_triangle = new triangle();

		//Create sunflower head
		self.m_sunflower_head = new sunflower_head(10);

		//Create cheese
		self.m_cheese = new cheese();

		self.m_cube = new cube();
		self.m_obj = new shape_from_file( "teapot.obj" )
		self.m_axis = new axis();
		self.m_sphere = new sphere( mat4(), 0 );
		
		self.m_circle = new circle( mat4(), 4 );	//Used to reduce lag for the ball and hamster
		
		self.m_fan = new triangle_fan_full( 10, mat4() );
		self.m_strip = new rectangular_strip( 1, mat4() );
		self.m_cylinder = new cylindrical_strip( 10, mat4() );
		
		// 1st parameter is camera matrix.  2nd parameter is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
		self.graphicsState = new GraphicsState( translation(0, 0,-40), perspective(45, canvas.width/canvas.height, .1, 1000), 0 );

		gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);		gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);		gl.uniform1i( g_addrs.SOLID_loc, solid);
		
		self.context.render();	
	} ) ( this );	
	
	canvas.addEventListener('mousemove', function(e)	{		e = e || window.event;		movement = vec2( e.clientX - canvas.width/2, e.clientY - canvas.height/2, 0);	});
}

// *******************************************************	
// init_keys():  Define any extra keyboard shortcuts here
Animation.prototype.init_keys = function()
{
	shortcut.add( "Space", function() { thrust[1] = -1; } );			shortcut.add( "Space", function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "z",     function() { thrust[1] =  1; } );			shortcut.add( "z",     function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "w",     function() { thrust[2] =  10; } );			shortcut.add( "w",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "a",     function() { thrust[0] =  10; } );			shortcut.add( "a",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "s",     function() { thrust[2] = -10; } );			shortcut.add( "s",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "d",     function() { thrust[0] = -10; } );			shortcut.add( "d",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "f",     function() { looking = !looking; } );
	shortcut.add( ",",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotation( 3, 0, 0,  1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;
	shortcut.add( ".",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotation( 3, 0, 0, -1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;

	shortcut.add( "r",     ( function(self) { return function() { self.graphicsState.camera_transform = mat4(); }; } ) (this) );
	shortcut.add( "ALT+s", function() { solid = !solid;					gl.uniform1i( g_addrs.SOLID_loc, solid);	
																		gl.uniform4fv( g_addrs.SOLID_COLOR_loc, vec4(Math.random(), Math.random(), Math.random(), 1) );	 } );
	shortcut.add( "ALT+g", function() { gouraud = !gouraud;				gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);	} );
	shortcut.add( "ALT+n", function() { color_normals = !color_normals;	gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);	} );
	shortcut.add( "ALT+a", function() { animate = !animate; } );
	shortcut.add( "ALT+x", function() { panToHamster = !panToHamster; } );
	shortcut.add("ALT+c", function() { gravityOn = !gravityOn} );
	
	shortcut.add( "p",     ( function(self) { return function() { self.m_axis.basis_selection++; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );
	shortcut.add( "m",     ( function(self) { return function() { self.m_axis.basis_selection--; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );	

	//Arrow keys
	shortcut.add( "up",     function() { ballThrust[2] =  -5; } );			shortcut.add( "up",     function() { ballThrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "left",     function() { ballThrust[0] =  -5; } );			shortcut.add( "left",     function() { ballThrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "down",     function() { ballThrust[2] = 5; } );			shortcut.add( "down",     function() { ballThrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "right",     function() { ballThrust[0] = 5; } );			shortcut.add( "right",     function() { ballThrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "c", function() { ballThrust[1] = 5; } );			shortcut.add( "c", function() { ballThrust[1] =  0; }, {'type':'keyup'} );
}

function update_camera( self, animation_delta_time )
	{
		var leeway = 70, border = 50;
		var degrees_per_frame = .0002 * animation_delta_time;
		var meters_per_frame  = .01 * animation_delta_time;
																					// Determine camera rotation movement first
		var movement_plus  = [ movement[0] + leeway, movement[1] + leeway ];		// movement[] is mouse position relative to canvas center; leeway is a tolerance from the center.
		var movement_minus = [ movement[0] - leeway, movement[1] - leeway ];
		var outside_border = false;
		
		// console.log(self.graphicsState.camera_transform[0]);

		// console.log(self.graphicsState.camera_transform);

		for( var i = 0; i < 2; i++ )
			if ( Math.abs( movement[i] ) > canvas_size[i]/2 - border )	outside_border = true;		// Stop steering if we're on the outer edge of the canvas.

		for( var i = 0; looking && outside_border == false && i < 2; i++ )			// Steer according to "movement" vector, but don't start increasing until outside a leeway window from the center.
		{
			var velocity = ( ( movement_minus[i] > 0 && movement_minus[i] ) || ( movement_plus[i] < 0 && movement_plus[i] ) ) * degrees_per_frame;	// Use movement's quantity unless the &&'s zero it out
			self.graphicsState.camera_transform = mult( rotation( velocity, i, 1-i, 0 ), self.graphicsState.camera_transform );			// On X step, rotate around Y axis, and vice versa.
		}
		self.graphicsState.camera_transform = mult( translation( scale_vec( meters_per_frame, thrust ) ), self.graphicsState.camera_transform );		// Now translation movement of camera, applied in local camera coordinate frame
	}

// *******************************************************	
// display(): called once per frame, whenever OpenGL decides it's time to redraw.

Animation.prototype.display = function(time)
	{
		if(!time) time = 0;
		this.animation_delta_time = time - prev_time;
		if(animate) this.graphicsState.animation_time += this.animation_delta_time;
		prev_time = time;
		
		update_camera( this, this.animation_delta_time );
	
		this.basis_id = 0;

		/**********************************
		Start coding here!!!!
		**********************************/

		this.createGround(ground.value);

		//Have something that says (if(time > x))
		this.createLevels(flag.value, white, black, red);

		//Assign platform matrix after creating levels

//		console.log("level.value " + level.value);

		this.createHamster(hamster.value);	//TODO

		this.createSunflower(sunflower.value);	//TODO

		this.createBall(ball.value, ball_yellow);

		//TEMP: DELETE AFTER
//		this.move_ball(ball, this.animation_delta_time);	//This is controlled by arrow keys

		console.log("ball value: " + ball.value);

		console.log("p1: " + platform1.value);

		if(animate && !panToHamster) {
			this.graphicsState.camera_transform = lookAt(vec3(0 + ball.value[0][3], 10 + ball.value[1][3], 25 + ball.value[2][3]), vec3(0 + ball.value[0][3], 5 + ball.value[1][3], 7.5 + ball.value[2][3]), vec3(0, 1, 0));

			this.move_ball(ball, this.animation_delta_time);	//This is controlled by arrow keys
		} else if(panToHamster) {
			if(side == 0) {	//Hamster is on the left
				this.graphicsState.camera_transform = lookAt(vec3(-180, 30, -550), vec3(-180, 6, -640), vec3(0, 1, 0));
			} else {	//Hamster is on the right
				this.graphicsState.camera_transform = lookAt(vec3(100, 30, -550), vec3(100, 6, -640), vec3(0, 1, 0));
			}
		}
	}	

/*************************************************************************************************************************/
//Physics

//Call this each time you create a level
Animation.prototype.createGravity = function() {
	ballThrust[1] -= 9.8 * .0001 * .001;	// Gravity updates translation velocity.
	var delta = translation( scale_vec( this.animation_delta_time, ballThrust) ); // Make proportional to real time.
	ball.value = mult(delta, ball.value);	
}

Animation.prototype.createInverseMatrix = function(mat4, scale_amount, i) {
	var temp = inverse(mult(mat4, scale(scale_amount)));

	platformsInverse[i] = temp;	
}

Animation.prototype.createInverseMatrixBall = function(mat4, scale_amount) {
	var temp = inverse(mult(mat4, scale(scale_amount)));

	ballInverse.value = temp;
}

//TODO: BUGGY AF
Animation.prototype.detectCollisions = function() {
	for(var i = 0; i < platforms.length; i++) {
		if(gravityOn) {
			this.createGravity();	
		}
		
		this.createInverseMatrix(ball.value, vec3(5, 5, 5));

		console.log("platforms[" + i + "].value: " + platforms[i].value); 

		//Collision process starts here
		var T = mult(ballInverse.value, platforms[i].value);	// Convert the current sphere to a coordinate frame where the collision one is a unit sphere

		console.log("T: " + T);

//		var T = mult(ballInverse.value, platformsInverse[i]);	// Convert the current sphere to a coordinate frame where the collision one is a unit sphere
		for(var j = 0; j < this.m_sphere.vertices.length; j++) {
			var modified_sphere_point = mult_vec(T, this.m_sphere.vertices[j]);
			if(length(vec3(modified_sphere_point)) < 1) {
				console.log("COLLIDED " + modified_sphere_point);
//				ballThrust[1] = 0;	//HOW DO I STOP THE Y-CONDITION?
				//ballThrust = vec3(ballThrust[0], 0, ballThrust[2]);
//				ball.value = mult()
			} 
		}
	}
}

//Hamster properties
Animation.prototype.createHamster = function(h) {
//	console.log("Side: " + side);

	if(side == 0) {	//Place hamster on left
		h = mult(h, translation(-180, 19.5, -640));	
	} else {	//Place hamster on right
		h = mult(h, translation(100, 19.5, -640));
	}
	
	h = mult(h, translation(0, Math.sin(this.graphicsState.animation_time/100), 0));

	this.createHamsterFeet(h);
	this.createHamsterBody(h);
	this.createHamsterBelly(h);
	this.createHamsterHands(h);
	this.createHamsterHead(h);
	this.createHamsterOuterEyes(h);
	this.createHamsterInnerEyes(h);
	this.createHamsterNose(h);
	this.createHamsterMouth(h);
	this.createHamsterOuterEars(h);
	this.createHamsterInnerEars(h);
	this.createHamsterTopWhiskers(h);
	this.createHamsterBottomWhiskers(h);
}

Animation.prototype.createHamsterFeet = function(h) {
	h = mult(h, translation(-4.5, -10, 2.5));

	h = mult(h, scale(2, 2, 2));

	this.m_circle.draw(this.graphicsState, h, pink);

	h = mult(h, scale(.5, .5, .5));

	h = mult(h, translation(9, 0, 0));

	h = mult(h, scale(2, 2, 2));

	this.m_circle.draw(this.graphicsState, h, pink);
}

Animation.prototype.createHamsterBody = function(h) {
	h = mult(h, scale(10, 10, 5));

	this.m_circle.draw(this.graphicsState, h, bisque);
}

Animation.prototype.createHamsterBelly = function(h) {
	h = mult(h, translation(0, 0, 4.5));
	h = mult(h, scale(3, 5, 1));

	this.m_circle.draw(this.graphicsState, h, white);
}

Animation.prototype.createHamsterHands = function(h) {
	h = mult(h, translation(-6.5, 2, 4.5));

	h = mult(h, scale(2, 2, 2));

	this.m_circle.draw(this.graphicsState, h, pink);

	h = mult(h, scale(.5, .5, .5));

	h = mult(h, translation(13, 0, 0));

	h = mult(h, scale(2, 2, 2));

	this.m_circle.draw(this.graphicsState, h, pink);
}

Animation.prototype.createHamsterHead = function(h) {
	h = mult(h, translation(0, 10, 0));

	h = mult(h, scale(10, 10, 5));

	this.m_circle.draw(this.graphicsState, h, bisque);
}

Animation.prototype.createHamsterOuterEyes = function(h) {
	h = mult(h, translation(-5, 12.5, 4.5));

	h = mult(h, scale(2, 2, 1));

	this.m_circle.draw(this.graphicsState, h, black);

	h = mult(h, scale(.5, .5, 1));

	h = mult(h, translation(10, 0, 0));

	h = mult(h, scale(2, 2, 1));

	this.m_circle.draw(this.graphicsState, h, black);
}

Animation.prototype.createHamsterInnerEyes = function(h) {
	h = mult(h, translation(-5, 12.5, 5));

	this.m_circle.draw(this.graphicsState, h, white);

	h = mult(h, translation(10, 0, 0));

	this.m_circle.draw(this.graphicsState, h, white);
}

Animation.prototype.createHamsterNose = function(h) {
	h = mult(h, translation(0, 11, 4.5));

	this.m_circle.draw(this.graphicsState, h, pink);
}

Animation.prototype.createHamsterMouth = function(h) {
	h = mult(h, translation(0, 8, 4));

	this.m_circle.draw(this.graphicsState, h, pink);
}

Animation.prototype.createHamsterMouthContours = function(h) {

}

Animation.prototype.createHamsterOuterEars = function(h) {
	h = mult(h, translation(-5, 18.5, 2));

	h = mult(h, scale(4, 3, 2));

	this.m_circle.draw(this.graphicsState, h, bisque);

	h = mult(h, scale(.25, .33, .5));

	h = mult(h, translation(10, 0, 0));

	h = mult(h, scale(4, 3, 2));

	this.m_circle.draw(this.graphicsState, h, bisque);
}

Animation.prototype.createHamsterInnerEars = function(h) {
	h = mult(h, translation(-5, 18, 2.5));

	h = mult(h, scale(3, 2, 2));

	this.m_circle.draw(this.graphicsState, h, pink);

	h = mult(h, scale(.33, .5, .5));

	h = mult(h, translation(10, 0, 0));

	h = mult(h, scale(3, 2, 2));

	this.m_circle.draw(this.graphicsState, h, pink);
}

Animation.prototype.createHamsterTopWhiskers = function(h) {
	//top left whisker
	h = mult(h, translation(-8.5, 10, 4.5));

	h = mult(h, scale(7.5, 0.5, 0.5));

	this.m_cube.draw(this.graphicsState, h, black);

	h = mult(h, scale(0.133, 1, 1));

	//top right whisker
	h = mult(h, translation(17, 0, 0));

	h = mult(h, scale(-7.5, 1, 1));

	this.m_cube.draw(this.graphicsState, h, black);
}

Animation.prototype.createHamsterBottomWhiskers = function(h) {
	//top left whisker
	h = mult(h, translation(-8.5, 8, 4.5));

	h = mult(h, scale(7.5, 0.5, 0.5));

	this.m_cube.draw(this.graphicsState, h, black);

	h = mult(h, scale(0.133, 1, 1));

	//top right whisker
	h = mult(h, translation(17, 0, 0));

	h = mult(h, scale(-7.5, 1, 1));

	this.m_cube.draw(this.graphicsState, h, black);
}

//Sunflower properties
Animation.prototype.createSunflower = function(s) {
	if(side == 0) {	//Place sunflower on right
		s = mult(s, translation(100, 4.25, -640));
	} else { //Place sunflower on left
		s = mult(s, translation(-180, 4.25, -640));
	}

	s = mult(s, scale(5, 5, 5));

	for(var i = 1; i < 9; i++) {
		s = mult(s, translation(0, 0.5, 0));
		
		//Set z-axis of rotation and use f(t) = a + b * sin(w * t) to model oscillating behavior
		s = mult(s, rotation(2 * Math.PI * Math.sin(this.graphicsState.animation_time/1000), 0, 0, 1) );

		s = mult(s, translation(0, 0.5, 0));

		this.m_cube.draw(this.graphicsState, s, green);
	}

	//Draw flower head
	s = mult(s, translation(0, 0.5, 2.5));
	
	s = mult(s, rotation(90, 0, 1, 0));	//Rotate the flower head to face the ball

	s = mult(s, scale(2, 2, 2));

//	console.log("Sunflower " + sunflower);

	this.m_sunflower_head.draw(this.graphicsState, s, yellow);
}

//Flag properties
Animation.prototype.createFlag = function(model_transform, pole_color, flag_color, pole_x, pole_y, pole_z) {
	model_transform = mult(model_transform, translation(pole_x, pole_y, pole_z));

	model_transform = mult(model_transform, scale(1, 9.95, 1));

	this.m_cube.draw(this.graphicsState, model_transform, pole_color);

	model_transform = mult(model_transform, scale(3, 0.5, 1));

	model_transform = mult(model_transform, translation(-0.2, 1, -0.2));

	this.m_triangle.draw(this.graphicsState, model_transform, flag_color);
}

//Ball properties
Animation.prototype.createBall = function(model_transform, color) {
	model_transform = mult(model_transform, scale(5, 5, 5));

	this.m_circle.draw(this.graphicsState, model_transform, color);
}

Animation.prototype.move_ball = function(b, animation_delta_time )
	{
		var meters_per_frame  = .01 * animation_delta_time;

		this.detectCollisions();

		b.value = mult( translation( scale_vec( meters_per_frame, ballThrust ) ), b.value);		// Now translation movement of camera, applied in local camera coordinate frame		
	}

//Level properties
Animation.prototype.createLevels = function(f, color, pole_color, flag_color) {
	this.createLevel1(platform1.value, platform2.value, f, color, pole_color, flag_color);
	this.createLevel2(platform3.value, platform4.value, f, color, pole_color, flag_color);
	this.createLevel2Bridge(platform5.value, green);
	this.createLevel3(platform6.value, platform7.value, f, color, pole_color, flag_color);
	this.createLevel3Bridge1(platform8.value, platform9.value, f, green, pole_color, flag_color);
	this.createLevel3Bridge2(platform10.value, platform11.value, green);
	this.createLevel4(platform12.value, f, color, pole_color, flag_color);
	this.createLevel4Bridge(platform13.value, green);
	this.createLevel5(platform14.value, platform15.value, f, color, pole_color, flag_color);
	this.createFinishGame(platform16.value, green);
}

//Single platform level - easy
Animation.prototype.createLevel1 = function(p1, p2, f, color, pole_color, flag_color) {

	p1 = mult(p1, translation(0, -5.5, -40));

	p1 = mult(p1, scale(20, 1, 100));

	this.createInverseMatrix(p1, vec3(20, 1, 100), 0);
//	console.log("platformsInverse[0]: " + platformsInverse[0]);

	this.m_cube.draw(this.graphicsState, p1, color);

	console.log("p1 value: " + p1);

	// console.log("platform1[0]: " + platform1[0]);
	// console.log("platform1[1]: " + platform1[1]);
	// console.log("platform1[2]: " + platform1[2]);
	// console.log("platform1[3]: " + platform1[3]);


	this.createFlag(f, pole_color, flag_color, 0, 0, -80);

	//Bridge to Level 2
	p2 = mult(p2, translation(17.55, -5.5, -80));

	p2 = mult(p2, scale(14.95, 1, 10));

	this.createInverseMatrix(p2, vec3(14.95, 1, 10), 1);
	// console.log("platformsInverse[1]: " + platformsInverse[1]);

	this.m_cube.draw(this.graphicsState, p2, green);

	// console.log("platform2[0]: " + platform2[0]);
	// console.log("platform2[1]: " + platform2[1]);
	// console.log("platform2[2]: " + platform2[2]);
	// console.log("platform2[3]: " + platform2[3]);
}

//Double platform level - easy
Animation.prototype.createLevel2 = function(p3, p4, f, color, pole_color, flag_color) {

	//Platform 3
	p3 = mult(p3, translation(30, -5.5, -120));

	p3 = mult(p3, translation(0, 5 * Math.sin(this.graphicsState.animation_time / 1000), 0));

	p3 = mult(p3, scale(10, 1, 100));

	this.createInverseMatrix(p3, vec3(10, 1, 100), 2);
	// console.log("platformsInverse[2]: " + platformsInverse[2]);

	this.m_cube.draw(this.graphicsState, p3, color);

	// console.log("platform3[0]: " + platform3[0]);
	// console.log("platform3[1]: " + platform3[1]);
	// console.log("platform3[2]: " + platform3[2]);
	// console.log("platform3[3]: " + platform3[3]);

	p4 = mult(p4, translation(30, -25.5, -240));

	p4 = mult(p4, translation(0, 5 * Math.sin(this.graphicsState.animation_time / 1000), 0));

	p4 = mult(p4, scale(10, 1, 100));

	this.createInverseMatrix(p4, vec3(10, 1, 100), 3);
	// console.log("platformsInverse[3]: " + platformsInverse[3]);

	this.m_cube.draw(this.graphicsState, p4, color);	

	// console.log("platform4[0]: " + platform4[0]);
	// console.log("platform4[1]: " + platform4[1]);
	// console.log("platform4[2]: " + platform4[2]);
	// console.log("platform4[3]: " + platform4[3]);

	//Moves flag up and down
	f = mult(f, translation(0, 5 * Math.sin(this.graphicsState.animation_time / 1000), 0));

	this.createFlag(f, pole_color, flag_color, 30, -20, -280);
}

Animation.prototype.createLevel2Bridge = function(p5, color) {

	p5 = mult(p5, translation(0, -25, -285));

	p5 = mult(p5, translation(30 * Math.sin(this.graphicsState.animation_time / 1000), 0, 0));

	p5 = mult(p5, scale(10, 1, 10));

	this.createInverseMatrix(p5, vec3(10, 1, 10), 4);
	// console.log("platformsInverse[4]: " + platformsInverse[4]);

	this.m_cube.draw(this.graphicsState, p5, color);

	// console.log("platform5[0]: " + platform5[0]);
	// console.log("platform5[1]: " + platform5[1]);
	// console.log("platform5[2]: " + platform5[2]);
	// console.log("platform5[3]: " + platform5[3]);
}

//Triple platform level with a middle platform moving up and down - easy
Animation.prototype.createLevel3 = function(p6, p7, f, color, pole_color, flag_color) {

	//Left platform
	p6 = mult(p6, translation(-40, -25, -320));

	p6 = mult(p6, scale(10, 1, 100));

	this.createInverseMatrix(p6, vec3(10, 1, 100), 5);
	// console.log("platformsInverse[5]: " + platformsInverse[5]);

	this.m_cube.draw(this.graphicsState, p6, color);

	// console.log("platform6[0]: " + platform6[0]);
	// console.log("platform6[1]: " + platform6[1]);
	// console.log("platform6[2]: " + platform6[2]);
	// console.log("platform6[3]: " + platform6[3]);

	//Right platform

	p7 = mult(p7, translation(-40, -25, -420.01));

	p7 = mult(p7, rotation(90 * Math.sin(this.graphicsState.animation_time/1000), 0, 1, 0) );

	p7 = mult(p7, scale(10, 1, 100));

	this.createInverseMatrix(p7, vec3(10, 1, 100), 6);
	// console.log("platformsInverse[6]: " + platformsInverse[6]);

	this.m_cube.draw(this.graphicsState, p7, brown);

	// console.log("platform7[0]: " + platform7[0]);
	// console.log("platform7[1]: " + platform7[1]);
	// console.log("platform7[2]: " + platform7[2]);
	// console.log("platform7[3]: " + platform7[3]);
}

Animation.prototype.createLevel3Bridge1 = function(p8, p9, f, color, pole_color, flag_color) {
	//Stationary bridge
	p8 = mult(p8, translation(-40, -25, -475));

	p8 = mult(p8, scale(10, 1, 10));

	this.createInverseMatrix(p8, vec3(10, 1, 10), 7);
	// console.log("platformsInverse[7]: " + platformsInverse[7]);

	this.m_cube.draw(this.graphicsState, p8, green);


	// console.log("platform8[0]: " + platform8[0]);
	// console.log("platform8[1]: " + platform8[1]);
	// console.log("platform8[2]: " + platform8[2]);
	// console.log("platform8[3]: " + platform8[3]);
	
	//Place new flag over here
	this.createFlag(f, black, red, -40, -20, -475);

	//Bridge that moves up and down
	p9 = mult(p9, translation(-40, -25, -485));

	p9 = mult(p9, translation(0, 31.0 * Math.sin(this.graphicsState.animation_time / 1000), 0));

	p9 = mult(p9, scale(10, 1, 10));

	this.createInverseMatrix(p9, vec3(10, 1, 10), 8);
	// console.log("platformsInverse[8]: " + platformsInverse[8]);

	this.m_cube.draw(this.graphicsState, p9, purplePlastic);

	// console.log("platform9[0]: " + platform9[0]);
	// console.log("platform9[1]: " + platform9[1]);
	// console.log("platform9[2]: " + platform9[2]);
	// console.log("platform9[3]: " + platform9[3]);
}

Animation.prototype.createLevel3Bridge2 = function(p10, p11, color) {
	p10 = mult(p10, translation(-40, 6, -495));

	p10 = mult(p10, scale(10, 1, 10));

	this.createInverseMatrix(p10, vec3(10, 1, 10), 9);
	// console.log("platformsInverse[9]: " + platformsInverse[9]);

	this.m_cube.draw(this.graphicsState, p10, stars);

	// console.log("platform10[0]: " + platform10[0]);
	// console.log("platform10[1]: " + platform10[1]);
	// console.log("platform10[2]: " + platform10[2]);
	// console.log("platform10[3]: " + platform10[3]);

	p11 = mult(p11, translation(-40, 6, -505));

	p11 = mult(p11, translation(0, 0, -1 * Math.abs(30 * Math.sin(this.graphicsState.animation_time / 1000))));

	p11 = mult(p11, scale(10, 1, 10));

	this.createInverseMatrix(p11, vec3(10, 1, 10), 10);
	// console.log("platformsInverse[10]: " + platformsInverse[10]);

	this.m_cube.draw(this.graphicsState, p11, earth);

	// console.log("platform11[0]: " + platform11[0]);
	// console.log("platform11[1]: " + platform11[1]);
	// console.log("platform11[2]: " + platform11[2]);
	// console.log("platform11[3]: " + platform11[3]);
}

//Triple platform level with a middle platform oscillating - medium
Animation.prototype.createLevel4 = function(p12, f, color, pole_color, flag_color) {
	p12 = mult(p12, translation(-40, 6, -565));

	p12 = mult(p12, scale(10, 1, 50));

	this.createInverseMatrix(p12, vec3(10, 1, 50), 11);
	// console.log("platformsInverse[11]: " + platformsInverse[11]);

	this.m_cube.draw(this.graphicsState, p12, white);

	// console.log("platform12[0]: " + platform12[0]);
	// console.log("platform12[1]: " + platform12[1]);
	// console.log("platform12[2]: " + platform12[2]);
	// console.log("platform12[3]: " + platform12[3]);

	this.createFlag(f, pole_color, flag_color, -40, 11.5, -575);
}

Animation.prototype.createLevel4Bridge = function(p13, color) {

	p13 = mult(p13, translation(-40, 6, -595));

	p13 = mult(p13, translation(90 * Math.sin(this.graphicsState.animation_time / 1000), 0, 0));

	p13 = mult(p13, scale(50, 1, 10));

	this.createInverseMatrix(p13, vec3(50, 1, 10), 12);
	// console.log("platformsInverse[12]: " + platformsInverse[12]);

	this.m_cube.draw(this.graphicsState, p13, yellow);

	// console.log("platform13[0]: " + platform13[0]);
	// console.log("platform13[1]: " + platform13[1]);
	// console.log("platform13[2]: " + platform13[2]);
	// console.log("platform13[3]: " + platform13[3]);
}

//Quadruple platform level with two middle platforms: one of them moves up and down, the other moves left and right - medium
Animation.prototype.createLevel5 = function(p14, p15, flag, color, pole_color, flag_color) {
	p14 = mult(p14, translation(-180, 6, -640));

	p14 = mult(p14, scale(50, 1, 100));

	this.createInverseMatrix(p14, vec3(50, 1, 100), 13);

	this.m_cube.draw(this.graphicsState, p14, white);

	// console.log("platform14[0]: " + platform14[0]);
	// console.log("platform14[1]: " + platform14[1]);
	// console.log("platform14[2]: " + platform14[2]);
	// console.log("platform14[3]: " + platform14[3]);

	p15 = mult(p15, translation(100, 6, -640));

	p15 = mult(p15, scale(50, 1, 100));

	this.createInverseMatrix(p15, vec3(50, 1, 100), 14);
	// console.log("platformsInverse[14]: " + platformsInverse[14]);

	this.m_cube.draw(this.graphicsState, p15, white);

	// console.log("platform15[0]: " + platform15[0]);
	// console.log("platform15[1]: " + platform15[1]);
	// console.log("platform15[2]: " + platform15[2]);
	// console.log("platform15[3]: " + platform15[3]);
}

Animation.prototype.createFinishGame = function(p16, color) {
	//Initially start the finish game at the right
	p16 = mult(p16, translation(-40, 6, -702.5));

	//Start rotation to create an orbit in the xy-plane
	p16 = mult(p16, rotation(45 * this.graphicsState.animation_time / 1000, 0, 0, 1) );

	//Moves the level to the left side
	p16 = mult(p16, translation(140, 0, 0));

	//Rotate again to prevent rotation on its axis
	p16 = mult(p16, rotation(-45 * this.graphicsState.animation_time / 1000, 0, 0, 1) );

	p16 = mult(p16, scale(25, 1, 25));

	this.createInverseMatrix(p16, vec3(25, 1, 25), 15);
	// console.log("platformsInverse[15]: " + platformsInverse[15]);

	this.m_cube.draw(this.graphicsState, p16, black);

	p16 = mult(p16, scale(.04, 1, .04));

	p16 = mult(p16, scale(20, 20, 20));

	this.m_cheese.draw(this.graphicsState, p16, yellow);


	// console.log("platform16[0]: " + platform16[0]);
	// console.log("platform16[1]: " + platform16[1]);
	// console.log("platform16[2]: " + platform16[2]);
	// console.log("platform16[3]: " + platform16[3]);
}

//Ground properties
Animation.prototype.createGround = function(model_transform) {
	//Draw the ground by scaling the x and z-axes
	model_transform = mult(model_transform, translation(0, -150, 0));

	model_transform = mult(model_transform, scale(10000, 1, 10000));

	this.m_cube.draw(this.graphicsState, model_transform, earth);
}
/****************************************************************************************************************/

Animation.prototype.update_strings = function( debug_screen_strings )		// Strings this particular class contributes to the UI
{
	debug_screen_strings.string_map["score"] = "Score: " + 0;

	//Fix bugs here, FPS not showing!
	var prev_frame = debug_screen_strings.tick;
	var deltaFrame = debug_screen_strings.tick - prev_frame;
    debug_screen_strings.string_map["fps"] = "FPS: " + 1 / this.animation_delta_time * 1000; // convert from milliseconds
	debug_screen_strings.string_map["time"] = "Animation Time: " + this.graphicsState.animation_time/1000 + "s";
}