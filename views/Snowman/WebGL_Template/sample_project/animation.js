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

		self.m_hand = new sunflower_head(5);	// Legacy code
		
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
			red = new Material( vec4( 1, 0, 0, 1), .5, 1, 1, 40 ),
			white = new Material( vec4( 1, 1, 1, 1 ), .5, 1, 1, 40 );
			
		/**********************************
		Start coding here!!!!
		**********************************/

		// Snowman
		var middle_snowball = mat4(), bottom_snowball = mat4(), top_snowball = mat4();	//Step 1: Define the 3 spheres for your snowman

		this.m_sphere.draw(this.graphicsState, middle_snowball, white);	//Step 2: Draw the middle snowball

		// Step 3: Draw the bottom snowball
		bottom_snowball = mult(bottom_snowball, translation(0, -2, 0));	// Move the snowball down from the center
		bottom_snowball = mult(bottom_snowball, scale(1.25, 1, 1.25));	// Make it a bit bigger in the x and z-coordinates
		this.m_sphere.draw(this.graphicsState, bottom_snowball, white);

		// Step 4: Draw the top snowball
		top_snowball = mult(top_snowball, translation(0, 2, 0));	// Move the snowball up from the center
		top_snowball = mult(top_snowball, scale(0.75, 1, 0.75));	// Make it a bit smaller in the x and z-coordinates
		this.m_sphere.draw(this.graphicsState, top_snowball, white);
		
		// Step 5: Define facial features
		var left_eye = mat4(), right_eye = mat4(), hat_base = mat4(), hat_top = mat4(), nose = mat4(), mouth_left = mat4(), mouth_middle = mat4(), mouth_right = mat4();

		// Eyes
		left_eye = mult(left_eye, translation(-0.25, 2.25, 0.75));	// Move the eye to the left, up from the center, and slightly forward
		left_eye = mult(left_eye, scale(0.1, 0.1, 0.1));	// Shrink down the scale of the sphere
		this.m_sphere.draw(this.graphicsState, left_eye, black);

		right_eye = mult(right_eye, translation(0.25, 2.25, 0.75));	// Move the eye to the right, up from the center, and slightly forward
		right_eye = mult(right_eye, scale(0.1, 0.1, 0.1));
		this.m_sphere.draw(this.graphicsState, right_eye, black);

		// Hat
		hat_base = mult(hat_base, translation(0, 3, 0));	// Move the hat base up above the top snowball
		hat_base = mult(hat_base, scale(1, 0.1, 1));	// Scale it so that it is flat on the y-axis but has shape on the x-axis and the z-axis
		this.m_sphere.draw(this.graphicsState, hat_base, black);

		hat_top = mult(hat_top, translation(0, 3.5, 0));	// Move the hat top above the hat base
		hat_top = mult(hat_top, rotation(90, 1, 0, 0));	// Rotate it so that the top is aligned correctly
		hat_top = mult(hat_top, scale(0.5, 1, 1));	// Shrink down the x portion
		this.m_cylinder.draw(this.graphicsState, hat_top, black);

		// Nose
		nose = mult(nose, translation(0, 2., 0.75));	//Move the nose up from the center and slightly forward
		nose = mult(nose, scale(0.25, 0.25, 1));	// Scale the nose
		this.m_fan.draw(this.graphicsState, nose, red);

		// Mouth
		mouth_left = mult(mouth_left, translation(-0.375, 1.75, 0.67));	// Move the mouth below the nose
		mouth_left = mult(mouth_left, scale(0.1, 0.1, 0.1));
		this.m_sphere.draw(this.graphicsState, mouth_left, brown);

		mouth_middle = mult(mouth_middle, translation(0, 1.5, 0.67));	// Move the mouth below the nose
		mouth_middle = mult(mouth_middle, scale(0.1, 0.1, 0.1));
		this.m_sphere.draw(this.graphicsState, mouth_middle, brown);

		mouth_right = mult(mouth_right, translation(0.375, 1.75, 0.67));	// Move the mouth below the nose
		mouth_right = mult(mouth_right, scale(0.1, 0.1, 0.1));
		this.m_sphere.draw(this.graphicsState, mouth_right, brown);

		// Step 6: Define the body fetures
		var middle_button = mat4(), bottom_button = mat4(), top_button = mat4(), left_arm = mat4(), left_hand = mat4(), right_arm = mat4(), right_hand = mat4();

		middle_button = mult(middle_button, translation(0, 0, 1));	// Have the button protrude out
		middle_button = mult(middle_button, scale(0.1, 0.1, 0.1));	// Shrink down the scale of the button
		this.m_sphere.draw(this.graphicsState, middle_button, black);

		bottom_button = mult(bottom_button, translation(0, -0.5, 0.9));	// Have the button protrude out
		bottom_button = mult(bottom_button, scale(0.1, 0.1, 0.1));	// Shrink down the scale of the button
		this.m_sphere.draw(this.graphicsState, bottom_button, black);

		top_button = mult(top_button, translation(0, 0.5, 0.9));	// Have the button protrude out
		top_button = mult(top_button, scale(0.1, 0.1, 0.1));	// Shrink down the scale of the button
		this.m_sphere.draw(this.graphicsState, top_button, black);

		// Draw left arm
		left_arm = mult(left_arm, translation(-1.5, 0, 0));
		left_arm = mult(left_arm, scale(1.5, 0.1, 0.1));
		this.m_cube.draw(this.graphicsState, left_arm, brown);

		// Draw left hand
		left_hand = mult(left_hand, translation(-2.75, 0, 0));
		left_hand = mult(left_hand, rotation(45, 1, 0, 0));
		left_hand = mult(left_hand, scale(0.5, 0.5, 0.5));
		this.m_hand.draw(this.graphicsState, left_hand, brown);

		// Draw right arm
		right_arm = mult(right_arm, translation(1.5, 0, 0));	
		right_arm = mult(right_arm, scale(1.5, 0.1, 0.1));
		this.m_cube.draw(this.graphicsState, right_arm, brown);		

		right_hand = mult(right_hand, translation(2.75, 0, 0));
		right_hand = mult(right_hand, rotation(-45, 1, 0, 0));
		right_hand = mult(right_hand, rotation(180, 0, 1, 0));
		right_hand = mult(right_hand, scale(0.5, 0.5, 0.5));
		this.m_hand.draw(this.graphicsState, right_hand, brown);
	}	

Animation.prototype.update_strings = function( debug_screen_strings )		// Strings this particular class contributes to the UI
{
	debug_screen_strings.string_map["time"] = "Animation Time: " + this.graphicsState.animation_time/1000 + "s";
	debug_screen_strings.string_map["basis"] = "Showing basis: " + this.m_axis.basis_selection;
	debug_screen_strings.string_map["animate"] = "Animation " + (animate ? "on" : "off") ;
	debug_screen_strings.string_map["thrust"] = "Thrust: " + thrust;
}