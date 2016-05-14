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

// *******************************************************
// IMPORTANT -- In the line below, add the filenames of any new images you want to include for textures!

var texture_filenames_to_load = [ "stars.png", "text.png", "earth.gif"];

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
		
		self.m_cube = new cube();
		self.m_obj = new shape_from_file( "teapot.obj" )
		self.m_axis = new axis();
		self.m_sphere = new sphere( mat4(), 4 );	
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
	shortcut.add( "w",     function() { thrust[2] =  1; } );			shortcut.add( "w",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "a",     function() { thrust[0] =  1; } );			shortcut.add( "a",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "s",     function() { thrust[2] = -1; } );			shortcut.add( "s",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "d",     function() { thrust[0] = -1; } );			shortcut.add( "d",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "f",     function() { looking = !looking; } );
	shortcut.add( ",",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotation( 3, 0, 0,  1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;
	shortcut.add( ".",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotation( 3, 0, 0, -1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;

	shortcut.add( "r",     ( function(self) { return function() { self.graphicsState.camera_transform = mat4(); }; } ) (this) );
	shortcut.add( "ALT+s", function() { solid = !solid;					gl.uniform1i( g_addrs.SOLID_loc, solid);	
																		gl.uniform4fv( g_addrs.SOLID_COLOR_loc, vec4(Math.random(), Math.random(), Math.random(), 1) );	 } );
	shortcut.add( "ALT+g", function() { gouraud = !gouraud;				gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);	} );
	shortcut.add( "ALT+n", function() { color_normals = !color_normals;	gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);	} );
	shortcut.add( "ALT+a", function() { animate = !animate; } );
	
	shortcut.add( "p",     ( function(self) { return function() { self.m_axis.basis_selection++; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );
	shortcut.add( "m",     ( function(self) { return function() { self.m_axis.basis_selection--; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );	
}

//Do some translations to the ground's matrix
function update_camera( self, animation_delta_time )
	{
		var leeway = 70, border = 50;
		var degrees_per_frame = .0002 * animation_delta_time;
		var meters_per_frame  = .01 * animation_delta_time;
																					// Determine camera rotation movement first
		var movement_plus  = [ movement[0] + leeway, movement[1] + leeway ];		// movement[] is mouse position relative to canvas center; leeway is a tolerance from the center.
		var movement_minus = [ movement[0] - leeway, movement[1] - leeway ];
		var outside_border = false;
		
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
		
		var model_transform = mat4();
		
		//Variables
		var ball = mat4();
		var flag = mat4();
		var level = mat4();

		// Materials: Declare new ones as needed in every function.
		// 1st parameter:  Color (4 floats in RGBA format), 2nd: Ambient light, 3rd: Diffuse reflectivity, 4th: Specular reflectivity, 5th: Smoothness exponent, 6th: Texture image.
		var purplePlastic = new Material( vec4( .9,.5,.9,1 ), .2, .5, .8, 40 ), // Omit the final (string) parameter if you want no texture
			greyPlastic = new Material( vec4( .5,.5,.5,1 ), .2, .8, .5, 20 ),
			earth = new Material( vec4( .5,.5,.5,1 ), .5, 1, .5, 40, "earth.gif" ),
			stars = new Material( vec4( .5,.5,.5,1 ), .5, 1, 1, 40, "stars.png" ),
			black = new Material( vec4( 0, 0, 0, 1 ), .5, 1, 1, 40 ),
			yellow = new Material( vec4( 1, 1, 0, 1), .5, 1, 1, 40 ),
			brown = new Material( vec4( 165/216 , 42/216, 42/216, 1), .5, 1, 1, 40 ),
			green = new Material( vec4( 0, 1, 0, 1), .5, 1, 1, 40 ),
			red = new Material( vec4( 1, 0, 0, 1), .5, 1, 1, 40 );
			
		/**********************************
		Start coding here!!!!
		**********************************/
		//Give some code that does some bouncing and physics and a hackish way of doing it
		//Rigid body physics and they know where their contact point is and rotate away, you got to use a program that's already made

		

		this.drawGroundPlane(model_transform, black, green, false);

		this.drawTree(model_transform, brown, red, false);

		this.drawBee(model_transform, yellow, black, brown, false);
	}	

Animation.prototype.update_strings = function( debug_screen_strings )		// Strings this particular class contributes to the UI
{
	debug_screen_strings.string_map["time"] = "Animation Time: " + this.graphicsState.animation_time/1000 + "s";
	debug_screen_strings.string_map["basis"] = "Showing basis: " + this.m_axis.basis_selection;
	debug_screen_strings.string_map["animate"] = "Animation " + (animate ? "on" : "off") ;
	debug_screen_strings.string_map["thrust"] = "Thrust: " + thrust;
}

//Added code
/*Constants*/
const MILLISECONDS_PER_SECOND = 1000;
const FULL_REVOLUTION = 2 * Math.PI;
const BEE_ARC = -15;

/*Wings*/
const LEFT_WING = -0.275;	//-0.275
const RIGHT_WING = 0.275;	//0.275
/*End of Wings*/

/*Legs*/
const LEFT_LEGS = -0.7;
const RIGHT_LEGS = 0.5;

const FRONT_LEGS = 0.25;
const MIDDLE_LEGS = 0;
const BACK_LEGS = -0.25;
/*End of Legs*/

/*End of Constants*/

/*Drawing*/
Animation.prototype.drawLegJoint = function(model_transform, image, x_translation, y_translation, z_translation, debug_mode) {
	
	if(debug_mode) {
		CURRENT_BASIS_IS_WORTH_SHOWING(this, model_transform);	//Defines coordinate axes for debugging
	}

	//translate -> rotate -> scale
	model_transform = mult(model_transform, translation(x_translation, y_translation, z_translation));
	
	if(y_translation == -0.5) {	//Top joint
		if(z_translation == RIGHT_LEGS) {
			model_transform = mult(model_transform, rotation(Math.abs(20.0 * Math.sin(this.graphicsState.animation_time/MILLISECONDS_PER_SECOND)), 1, 0, 0));
		} else {
			model_transform = mult(model_transform, rotation(-1 * Math.abs(20.0 * Math.sin(this.graphicsState.animation_time/MILLISECONDS_PER_SECOND)), 1, 0, 0));
		}	
	} else {	//Bottom joint
		if(z_translation == RIGHT_LEGS) {
			model_transform = mult(model_transform, rotation(Math.abs(40.0 * Math.sin(this.graphicsState.animation_time/MILLISECONDS_PER_SECOND)), 1, 0, 0));
		} else {
			model_transform = mult(model_transform, rotation(-1 * Math.abs(40.0 * Math.sin(this.graphicsState.animation_time/MILLISECONDS_PER_SECOND)), 1, 0, 0));		
		}	
	}

	model_transform = mult(model_transform, translation(0.05, y_translation, 0.1));
	
	model_transform = mult(model_transform, scale(0.1, 1, 0.2));
	
	this.m_cube.draw(this.graphicsState, model_transform, image);
}

Animation.prototype.drawLeg = function(model_transform, image, x_translation, z_translation, debug_mode) {
	//Top leg joint
	this.drawLegJoint(model_transform, image, x_translation, -0.5, z_translation, debug_mode);

	//Bottom leg joint
	this.drawLegJoint(model_transform, image, x_translation, -1, z_translation, debug_mode);	
}

Animation.prototype.drawWing = function(model_transform, image, z_translation, debug_mode) {

	if(debug_mode) {
		CURRENT_BASIS_IS_WORTH_SHOWING(this, model_transform);	//Defines coordinate axes for debugging
	}

	//Translate -> rotate -> translate -> scale
	model_transform = mult(model_transform, translation(0, 0.5, z_translation));

	if(z_translation == RIGHT_WING) {
		model_transform = mult( model_transform, rotation(Math.abs(45.0 * Math.sin(this.graphicsState.animation_time/MILLISECONDS_PER_SECOND)), 1, 0, 0 ) );	
	} else {
		model_transform = mult( model_transform, rotation(-1 * Math.abs(45.0 * Math.sin(this.graphicsState.animation_time/MILLISECONDS_PER_SECOND)), 1, 0, 0 ) );
	}

	model_transform = mult(model_transform, translation(0, 0.5, 0));

	model_transform = mult(model_transform, translation(0, 0.5, z_translation));

	model_transform = mult(model_transform, scale(0.25, 2, 0.1));
	
	this.m_cube.draw(this.graphicsState, model_transform, image);
}

Animation.prototype.drawGroundPlane = function(model_transform, top_layer_image, bottom_layer_image, debug_mode) {
	//Draw the ground by scaling the x and z-axes
	model_transform = mult(model_transform, scale(100, 1, 20));

	this.m_cube.draw(this.graphicsState, model_transform, top_layer_image);

	model_transform = mult(model_transform, translation(0, -1, 0));

	model_transform = mult(model_transform, scale(1, 3, 1));

	this.m_cube.draw(this.graphicsState, model_transform, bottom_layer_image);
}

Animation.prototype.drawTree = function(model_transform, trunk_image, foliage_image, debug_mode) {

	if(debug_mode) {
		CURRENT_BASIS_IS_WORTH_SHOWING(this, model_transform);	//Defines coordinate axes for debugging
	}

	model_transform = mult(model_transform, scale(2, 2, 2));

	//Draw tree trunk
	for(var i = 1; i < 9; i++) {
		model_transform = mult(model_transform, translation(0, 0.5, 0));
		
		//Set z-axis of rotation and use f(t) = a + b * sin(w * t) to model oscillating behavior
		model_transform = mult(model_transform, rotation(FULL_REVOLUTION * Math.sin(this.graphicsState.animation_time/MILLISECONDS_PER_SECOND), 0, 0, 1) );

		model_transform = mult(model_transform, translation(0, 0.5, 0));

		this.m_cube.draw(this.graphicsState, model_transform, trunk_image);
	}

	//Draw tree foliage
	model_transform = mult(model_transform, translation(0, 2.5, 0));
	model_transform = mult(model_transform, scale(2, 2, 2));

	this.m_sphere.draw(this.graphicsState, model_transform, foliage_image);
}

Animation.prototype.drawBee = function(model_transform, butt_image, body_image, head_image, debug_mode) {

	if(debug_mode) {
		CURRENT_BASIS_IS_WORTH_SHOWING(this, model_transform);	//Defines coordinate axes for debugging
	}

	//Move the bee up and down
	model_transform = mult(model_transform, translation(0, Math.PI * Math.sin(this.graphicsState.animation_time / 1000), 0));

	//Rotate to move things as one piece
	model_transform = mult(model_transform, rotation(BEE_ARC * this.graphicsState.animation_time / MILLISECONDS_PER_SECOND, 0, 1, 0) );

	//Draw body
	model_transform = mult(model_transform, translation(-7, 12, -15));

	model_transform = mult(model_transform, scale(4, 2, 2));	

	this.m_sphere.draw(this.graphicsState, model_transform, butt_image);

	//Draw torso
	model_transform = mult(model_transform, translation(1.75, 0, 0));

	model_transform = mult(model_transform, scale(1.5, 1, 1));

	this.m_cube.draw(this.graphicsState, model_transform, body_image);
	
	//Draw wings
	//Right wing
	this.drawWing(model_transform, body_image, RIGHT_WING, false);

	//Draw left wing
	this.drawWing(model_transform, body_image, LEFT_WING, false);

	//Draw legs
	this.drawLeg(model_transform, body_image, BACK_LEGS, RIGHT_LEGS, false);

	this.drawLeg(model_transform, body_image, MIDDLE_LEGS, RIGHT_LEGS, false);

	this.drawLeg(model_transform, body_image, FRONT_LEGS, RIGHT_LEGS, false);

	this.drawLeg(model_transform, body_image, BACK_LEGS, LEFT_LEGS, false);	

	this.drawLeg(model_transform, body_image, MIDDLE_LEGS, LEFT_LEGS, false);	

	this.drawLeg(model_transform, body_image, FRONT_LEGS, LEFT_LEGS, false);	

	//Draw head
	model_transform = mult(model_transform, translation(0.75, 0, 0));

	model_transform = mult(model_transform, rotation(FULL_REVOLUTION * Math.sin(this.graphicsState.animation_time/MILLISECONDS_PER_SECOND), 0, 1, 0) );

	model_transform = mult(model_transform, scale(0.25, 0.5, 0.75));

	this.m_sphere.draw(this.graphicsState, model_transform, head_image);
}

/*End of Drawing*/