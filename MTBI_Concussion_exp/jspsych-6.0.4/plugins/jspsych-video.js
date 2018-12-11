/* jspsych-video.js
 * Josh de Leeuw
 *
 * This plugin displays a video. The trial ends when the video finishes.
 *
 * documentation: docs.jspsych.org
 *
 */

jsPsych.plugins.video = (function() {

  var plugin = {};

  plugin.info = {
    name: 'video',
    description: '',
    parameters: {
      sources: {
        type: jsPsych.plugins.parameterType.VIDEO,
        pretty_name: 'Sources',
        array: true,
        default: undefined,
        description: 'The video file to play.'
      },
      width: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Width',
        default: undefined,
        description: 'The width of the video in pixels.'
      },
      height: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Height',
        default: undefined,
        description: 'The height of the video display in pixels.'
      },
      autoplay: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Autoplay',
        default: true,
        description: 'If true, the video will begin playing as soon as it has loaded.'
      },
      controls: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Controls',
        default: false,
        description: 'If true, the subject will be able to pause the video or move the playback to any point in the video.'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'Any content here will be displayed below the video content.'
      },
      start: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: 'Start',
        default: null,
        description: 'Time to start the clip.'
      },
      stop: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: 'Stop',
        default: null,
        description: 'Time to stop the clip.'
      }
    }
  }


  plugin.trial = function(display_element, trial) {

    //------------------Video Tag------------------
    
    // display stimulus
    var video_html = '<video id="jspsych-video-player" width="'+trial.width+'" height="'+trial.height+'" muted ';
    //If autoplay then add autoplay
    if(trial.autoplay){
      video_html += "autoplay "
    }
    //Add the controls
    if(trial.controls){
      video_html +="controls "
    }
    //Close the opening video tag
    video_html+=">"
    
    //Loop through the sources and add them inside the video tag
    for(var i=0; i<trial.sources.length; i++){
      var s = trial.sources[i];
      if(s.indexOf('?') > -1){
        s = s.substring(0, s.indexOf('?'));
      }
      var type = s.substr(s.lastIndexOf('.') + 1);
      type = type.toLowerCase();

      // adding start stop parameters if specified
      video_html+='<source src="'+trial.sources[i]

      /*
      // this isn't implemented yet in all browsers, but when it is
      // revert to this way of doing it.

      if (trial.start !== null) {
        video_html+= '#t=' + trial.start;
      } else {
        video_html+= '#t=0';
      }

      if (trial.stop !== null) {
        video_html+= ',' + trial.stop
      }*/
      
      video_html+='" type="video/'+type+'">';
    }
    //Close the video tag
    video_html +="</video>"

    //show prompt if there is one
    if (trial.prompt !== null) {
      video_html += trial.prompt;
    }
    
    display_element.innerHTML = video_html;
    
    
    
    //------------------Event handlers------------------
    
    //When video ends
    display_element.querySelector('#jspsych-video-player').onended = function(){
      end_trial();
    }

    // event handler to set timeout to end trial if video is stopped
    display_element.querySelector('#jspsych-video-player').onplay = function(){
      if(trial.stop !== null){
        if(trial.start == null){
          trial.start = 0;
        }
        jsPsych.pluginAPI.setTimeout(end_trial, (trial.stop-trial.start)*1000);
      }
    }
    
    // When set the video start time
    if(trial.start !== null){
      display_element.querySelector('#jspsych-video-player').currentTime = trial.start;
      //document.getElementById('jspsych-video-player').play();//[sivaHack]
    }

    // function to end trial when it is time
    var end_trial = function() {
      
      //Stop the animation
      stopDrawing = true;

      // gather the data to store for the trial
      var trial_data = {
        stimulus: JSON.stringify(trial.sources),
        frameTime: frameTime,
        frameTimeFromStart: frameTimeFromStart,
        magnitudes: magnitudes,
        degrees: degrees,
        height: trial.height,
        width: trial.width
      };

      // clear the display
      display_element.innerHTML = '';

      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    };
    
    
    
    //------------------Variable Setup------------------
    
    //Variables for animation (Initial values)
    var frameTime = [];
    var frameTimeFromStart = [];
    var magnitudes = [];
    var degrees = [];
    var stopDrawing = false;
    var previousTimestamp = null;
    var mouseX_global = canvasWidth/2;
    var mouseY_global = canvasHeight/2;
    var screenWidth = null;
    var screenHeight = null;
    
    //FixationCross
    var fixationCross = true;
    var fixationCrossHeight = 20;
    var fixationCrossWidth = 20;
    var fixationCrossThickness = 2;
    var fixationCrossOutlineThickness = 2;
    var fixationCrossBackgroundColor = "white";
    var fixationCrossOutlineColor = "black";
    
    // Clicking
    var clickRadius = 10;
    
    //Arrow
    var arrowBodyThickness = 2;
    var arrowHeadLength = 10;
    var arrowHeadThickness = 3;
    var arrowLineWidth = 1;
    var arrowBackgroundColor = "white";
    var arrowOutlineColor = "black";
    

    //------------------Canvas------------------
    
    //Remove the margin from the jssych content
    var jspsychContentElement = document.getElementById("jspsych-content");
    jspsychContentElement.style.maxWidth = '100%';
    
    
    //Get the video element
    var videoElement = document.getElementById('jspsych-video-player');
    videoElement.style.position = 'absolute';
    videoElement.style.zIndex = '-10';
    
    
    var canvasWidth = videoElement.clientWidth;
    var canvasHeight = videoElement.clientHeight;
    
    
    //Create a canvas element and append it to the DOM
    var canvas = document.createElement("canvas");
    jspsychContentElement.appendChild(canvas);
    
    //Get the context of the canvas so that it can be painted on.
    var ctx = canvas.getContext("2d");
    

    
    //Format the canvas
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    //canvas.style.position = 'absolute';
    canvas.style.zIndex = '10';
    canvas.style.backgroundColor = 'rgba(0,0,0,0)';
    
    //Add mousemove eventListener to the canvas
    canvas.addEventListener('mousemove', function(evt) {
      var mousePos = getMousePosition(canvas, evt);
      mouseX_global = mousePos.x; //Global variable
      mouseY_global = mousePos.y; //Global variable
    });
    
    
    //Add mousemove eventListener to the canvas
    canvas.addEventListener('click', function(evt) {
      var mousePos = getMousePosition(canvas, evt);
      mouseX_click = mousePos.x; //Global variable
      mouseY_click = mousePos.y; //Global variable
      
      //Calculate the distance from center
      var distance = Math.sqrt( 
                      Math.pow(mouseX_click-(canvasWidth/2),2) + 
                      Math.pow(mouseY_click-(canvasHeight/2),2) 
                    );
      
      //Start if distance less than threshold
      if(distance <= clickRadius){
        //Start the video and the recording of trials
        videoElement.play();
        animate();
      }
    });
    
    
    //------Fixation Cross before recording data------
      
    //Draw the fixation cross if we want it
    if(fixationCross === true){
      drawFixationCross();
    }
    
    //--------Dynamic Feedback---------
    
    //Function to update and draw the arrow
    function updateAndDraw(){
      
      //Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      
      //----- Magnitude -----
      
      //Transfer to local variables to keep it constant
      var mouseX_local = mouseX_global;
      var mouseY_local = mouseY_global;
      
      var relativePositionX = mouseX_local-(canvasWidth/2);
      var relativePositionY = mouseY_local-(canvasHeight/2);
      
      //Calculate the magnitude of the arrow
      var magnitude = Math.sqrt( 
                        Math.pow(relativePositionX,2) + 
                        Math.pow(relativePositionY,2) 
                      );
      
      //Push into the magnitudes array
      magnitudes.push(magnitude);
      
      //----- Direction -----
      
      /*
      Directions in degrees are in the form:
         0: right
        90: up
      -180: left
       -90: down
      Link to atan2 image & forum: https://math.stackexchange.com/questions/707673/find-angle-in-degrees-from-one-point-to-another-in-2d-space
      */
      
      //Calculate the degree
      var degree = Math.atan2(-relativePositionY, relativePositionX) * 180 / Math.PI;
      //-ve to relativePostionY so that up is +ve and bottom is -ve
      
      //Push into the degrees array
      degrees.push(degree);
      
      //----- Arrow -----

      //Draw the arrow
      ctx.beginPath();
      ctx.arrow(canvasWidth/2, canvasHeight/2, mouseX_local, mouseY_local, [0, arrowBodyThickness, -arrowHeadLength, arrowBodyThickness, -arrowHeadLength, arrowHeadThickness]);
      ctx.lineWidth = arrowLineWidth;
      ctx.fillStyle = arrowBackgroundColor;
      ctx.fill();
      ctx.strokeStyle = arrowOutlineColor;
      ctx.stroke();
      
      //----- Fixation Cross -----
      
      //Draw the fixation cross if we want it
      if(fixationCross === true){
        drawFixationCross();
      }
      
    }//End of updateAndDraw
    
    //Function to draw the fixation cross
    function drawFixationCross(){
        
/*        //------OUTLINES------
        
        //Horizontal line
        ctx.lineWidth = fixationCrossOutlineThickness;
        ctx.rect(canvasWidth/2 - fixationCrossWidth, 
                 canvasHeight/2 - fixationCrossThickness,
                 fixationCrossWidth*2,
                 fixationCrossThickness*2);
        ctx.fillStyle = fixationCrossBackgroundColor;
        ctx.fill();
        ctx.strokeStyle = fixationCrossOutlineColor;
        ctx.stroke();
        
        //Vertical line
        ctx.lineWidth = fixationCrossOutlineThickness;
        ctx.rect(canvasWidth/2 - fixationCrossThickness, 
                 canvasHeight/2 - fixationCrossWidth,
                 fixationCrossThickness*2,
                 fixationCrossWidth*2);
        ctx.fillStyle = fixationCrossBackgroundColor;
        ctx.fill();
        ctx.strokeStyle = fixationCrossOutlineColor;
        ctx.stroke();
*/
        //------Cross over Cross------
        
        // ---Bottom Cross---
        
        //Horizontal line
        ctx.beginPath();
        ctx.lineWidth = fixationCrossThickness+fixationCrossOutlineThickness;
        ctx.moveTo(canvasWidth/2 - (fixationCrossWidth+fixationCrossOutlineThickness/2), canvasHeight/2);
        ctx.lineTo(canvasWidth/2 + (fixationCrossWidth+fixationCrossOutlineThickness/2), canvasHeight/2);
        ctx.strokeStyle = fixationCrossOutlineColor;
        ctx.stroke();
        
        //Vertical line
        ctx.beginPath();
        ctx.lineWidth = fixationCrossThickness+fixationCrossOutlineThickness;
        ctx.moveTo(canvasWidth/2, canvasHeight/2 - (fixationCrossHeight+fixationCrossOutlineThickness/2));
        ctx.lineTo(canvasWidth/2, canvasHeight/2 + (fixationCrossHeight+fixationCrossOutlineThickness/2));
        ctx.strokeStyle = fixationCrossOutlineColor;
        ctx.stroke();
        
        
        // ---Top Cross---
        
        //Horizontal line
        ctx.beginPath();
        ctx.lineWidth = fixationCrossThickness;
        ctx.moveTo(canvasWidth/2 - fixationCrossWidth, canvasHeight/2);
        ctx.lineTo(canvasWidth/2 + fixationCrossWidth, canvasHeight/2);
        ctx.strokeStyle = fixationCrossBackgroundColor;
        ctx.stroke();
        
        //Vertical line
        ctx.beginPath();
        ctx.lineWidth = fixationCrossThickness;
        ctx.moveTo(canvasWidth/2, canvasHeight/2 - fixationCrossHeight);
        ctx.lineTo(canvasWidth/2, canvasHeight/2 + fixationCrossHeight);
        ctx.strokeStyle = fixationCrossBackgroundColor;
        ctx.stroke();
       
/*        //Horizontal line
        ctx.beginPath();
        ctx.lineWidth = fixationCrossThickness;
        ctx.moveTo(canvasWidth/2 - fixationCrossWidth, canvasHeight/2);
        ctx.lineTo(canvasWidth/2 + fixationCrossWidth, canvasHeight/2);
        ctx.fillStyle = fixationCrossBackgroundColor;
        ctx.fill();
        ctx.strokeStyle = fixationCrossOutlineColor;
        ctx.stroke();
        
        //Vertical line
        ctx.beginPath();
        ctx.lineWidth = fixationCrossThickness;
        ctx.moveTo(canvasWidth/2, canvasHeight/2 - fixationCrossHeight);
        ctx.lineTo(canvasWidth/2, canvasHeight/2 + fixationCrossHeight);
        ctx.fillStyle = fixationCrossBackgroundColor;
        ctx.fill();
        ctx.strokeStyle = fixationCrossOutlineColor;
        ctx.stroke();
*/      
    }
    
    //Function to get mouse position
    function getMousePosition(canvas, evt){
      var rect = canvas.getBoundingClientRect();
      return{
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      }
    }
    
    
    function animate() {
        //If stopping condition has been reached, then stop the animation
        if (stopDrawing) {
          window.cancelAnimationFrame(frameRequestID); //Cancels the frame request
        }
        //Else continue with another frame request
        else {
          frameRequestID = window.requestAnimationFrame(animate); //Calls for another frame request
          
          updateAndDraw(); //Update and draw the arrow
          
          //If this is before the first frame, then start the timestamp
          if(previousTimestamp === null){
            previousTimestamp = performance.now();
            trialStartTimeStamp = previousTimestamp;
          }
          //Else calculate the time and push it into the array
          else{
            var currentTimeStamp = performance.now(); //Variable to hold current timestamp
            frameTime.push(currentTimeStamp - previousTimestamp); //Push the interval into the frameRate array
            previousTimestamp = currentTimeStamp; //Reset the timestamp
            frameTimeFromStart.push(currentTimeStamp - trialStartTimeStamp);//Frame time from trial start
          }
        }
      }
    
    

  };//End of plugin

  return plugin;
})();
