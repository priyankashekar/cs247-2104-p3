// Initial code by Borui Wang, updated by Graham Roth
// For CS247, Spring 2014

var largeVideoSize = 500;
var smallVideoSize = 100;

var fb_new_chat_room; 
var fb_instance_users;
var fb_instance_stream; 
var my_color; 

var username;


(function() {

  var cur_video_blob = null;
  var fb_instance;

  $(document).ready(function(){
    $("#information").hide();
    $("#informationToRecord").hide();
    $("#second_counter").hide();
    connect_to_chat_firebase();
    connect_webcam();
  });

  function connect_to_chat_firebase(){
    /* Include your Firebase link here!*/
    fb_instance = new Firebase("https://p3-pshekar-sierrakn.firebaseio.com");

    // generate new chatroom id or use existing id
    var url_segments = document.location.href.split("/#");
    if(url_segments[1]){
      fb_chat_room_id = url_segments[1];
    }else{
      fb_chat_room_id = Math.random().toString(36).substring(7);
    }
    display_msg({m:"Share this url with your friend to join this chat: "+ document.location.origin+"/#"+fb_chat_room_id,c:"red"})

    // set up variables to access firebase data structure
    fb_new_chat_room = fb_instance.child('chatrooms').child(fb_chat_room_id);
    fb_instance_users = fb_new_chat_room.child('users');
    fb_instance_stream = fb_new_chat_room.child('stream');
    my_color = "#"+((1<<24)*Math.random()|0).toString(16);

    // listen to events
    fb_instance_users.on("child_added",function(snapshot){
      display_msg({m:snapshot.val().name+" joined the room",c: snapshot.val().c});
    });
    fb_instance_stream.on("child_added",function(snapshot){
      display_msg(snapshot.val());
    });

    // block until username is answered
    username = window.prompt("Welcome, warrior! please declare your name?");
    if(!username){
      username = "anonymous"+Math.floor(Math.random()*1111);
    }
    fb_instance_users.push({ name: username,c: my_color});
    $("#waiting").remove();

    // bind submission box
    $("#submission input").keydown(function( event ) {
      if (event.which == 13) {
        // if(has_emotions($(this).val())){
        //   fb_instance_stream.push({m:username+": " +$(this).val(), v:cur_video_blob, c: my_color});
        // }else{
          fb_instance_stream.push({m:username+": " +$(this).val(), c: my_color});
        //}
        $(this).val("");
      }
    });
  }

  // creates a message node and appends it to the conversation
  function display_msg(data){
    $("#conversation").append("<div class='msg' style='color:"+data.c+"'>"+data.m+"</div>");
    if(data.v){
      // for video element
      var video = document.createElement("video");
      video.autoplay = true;
      video.controls = false; // optional
      video.loop = false;
      video.width = 120;

      var source = document.createElement("source");
      source.src =  URL.createObjectURL(base64_to_blob(data.v));
      source.type =  "video/webm";

      video.appendChild(source);

      // for gif instead, use this code below and change mediaRecorder.mimeType in onMediaSuccess below
      // var video = document.createElement("img");
      // video.src = URL.createObjectURL(base64_to_blob(data.v));

      document.getElementById("conversation").appendChild(video);
    }
    // Scroll to the bottom every time we display a new message
    scroll_to_bottom(0);
  }

  function scroll_to_bottom(wait_time){
    // scroll to bottom of div
    setTimeout(function(){
      $("html, body").animate({ scrollTop: $(document).height() }, 200);
    },wait_time);
  }

  function connect_webcam(){
    // we're only recording video, not audio
    var mediaConstraints = {
      video: true,
      audio: false
    };

    // callback for when we get video stream from user.
    var onMediaSuccess = function(stream) {
      $("#welcome").hide();
      $("#information").show();
      
      // create video element, attach webcam stream to video element
      var video_width= smallVideoSize;
      var video_height= smallVideoSize;
      var webcam_stream = document.getElementById('webcam_stream');
      var video = document.createElement('video');
      video.setAttribute("id","myVideo");
      webcam_stream.innerHTML = "";
      // adds these properties to the video
      video = mergeProps(video, {
          controls: false,
          width: video_width,
          height: video_height,
          src: URL.createObjectURL(stream)
      });
      video.play();
      webcam_stream.appendChild(video);

      enableExpandingVideo(video_width, video_height, stream);

      

      // counter
      // var time = 0;
      // var second_counter = document.getElementById('second_counter');
      // var second_counter_update = setInterval(function(){
      //   second_counter.innerHTML = time++;
      // },1000);

      
    }

    // callback if there is an error when we try and get the video stream
    var onMediaError = function(e) {
      console.error('media error', e);
    }

    // get video stream from user. see https://github.com/streamproc/MediaStreamRecorder
    navigator.getUserMedia(mediaConstraints, onMediaSuccess, onMediaError);
  }

  // check to see if a message qualifies to be replaced with video.
  var has_emotions = function(msg){
    var options = ["lol",":)",":("];
    for(var i=0;i<options.length;i++){
      if(msg.indexOf(options[i])!= -1){
        return true;
      }
    }
    return false;
  }

  function enableExpandingVideo(video_width, video_height, stream) {

      $(document).keydown(function(event) {    
          //Using 13 = enter key
          //Could use 38 = up or 37 = left
        if(event.which== 38 && event.shiftKey){
          event.preventDefault();
          $("#webcam_stream").click();
          console.log("Expand video!");
          //space bar key code = 32
        } else if($("#webcam_stream").hasClass("webcam_expanded") && event.which==32)  {
          enableRecording(video_width, video_height, stream);
        }
      });
  
      $("#webcam_stream").click(function() {
        console.log("Video clicked!");
        var video = document.getElementById("myVideo");

        if($("#webcam_stream").hasClass("webcam_small")) {
          // video.setAttribute("width", "\"" + largeVideoSize + "\"");
          // video.setAttribute("height", "\"" + largeVideoSize + "\"");
          video.width = largeVideoSize;
          video.height = largeVideoSize;
          $("#webcam_stream").removeClass("webcam_small");
          $("#webcam_stream").addClass("webcam_expanded");
          //Change opacity divs
          $("#topDiv").removeClass("div_small");
          $("#topDiv").addClass("div_expanded");
          $("#bottomDiv").removeClass("div_small");
          $("#bottomDiv").addClass("div_expanded");

          $("#informationToRecord").show();
          $("#information").hide();
        } else {
          // video.setAttribute("width", "\"" + smallVideoSize + "\"");
          // video.setAttribute("height", "\"" + smallVideoSize + "\"");
          video.width = smallVideoSize;
          video.height = smallVideoSize;
          $("#webcam_stream").removeClass("webcam_expanded");
          $("#webcam_stream").addClass("webcam_small");  
          //Change opacity divs
          $("#topDiv").removeClass("div_expanded");
          $("#topDiv").addClass("div_small");
          $("#bottomDiv").removeClass("div_expanded"); 
          $("#bottomDiv").addClass("div_small");

          $("#informationToRecord").hide();
          $("#information").show();
        }
      });

  }

  function enableRecording(video_width, video_height, stream) {
    console.log("connect to media stream!");
    // now record stream in 5 seconds interval
    var video_container = document.getElementById('video_container');
    var mediaRecorder = new MediaStreamRecorder(stream);
    var index = 1;

    mediaRecorder.mimeType = 'video/webm';
    // mediaRecorder.mimeType = 'image/gif';
    // make recorded media smaller to save some traffic (80 * 60 pixels, 3*24 frames)
    mediaRecorder.video_width = video_width/2;
    mediaRecorder.video_height = video_height/2;

    mediaRecorder.ondataavailable = function (blob) {

        //console.log("new data available!");
        video_container.innerHTML = "";

        // convert data into base 64 blocks
        blob_to_base64(blob,function(b64_data){
          cur_video_blob = b64_data;

          fb_instance_stream.push({m:username+": ", v:cur_video_blob, c: my_color});

          //Extra playback of video since won't work in chat with opaqueness
          var video = document.createElement("video");
          video.autoplay = true;
          video.controls = false; // optional
          video.loop = false;
          video.width = 200;

          var source = document.createElement("source");
          source.src =  URL.createObjectURL(base64_to_blob(b64_data));
          source.type =  "video/webm";

          video.appendChild(source);
          var playbackVideoDiv = document.getElementById("playback_video");
          while (playbackVideoDiv.hasChildNodes()) {
              playbackVideoDiv.removeChild(playbackVideoDiv.lastChild);
          }
          playbackVideoDiv.appendChild(video);
        });
    };

    //add count down timer in corner of video
    
    var second_counter = document.getElementById('second_counter');
    var count = 3;
    second_counter.innerHTML = "";
    $("#second_counter").show();
    var second_counter_update = setInterval(timer, 1000);

    function timer() {
      if(count <=0) {
        //Hide counter after recording and return video to small
        clearInterval(second_counter_update);
        $("#second_counter").hide();
        var video = document.getElementById("myVideo");
        video.width = smallVideoSize;
        video.height = smallVideoSize;
        $("#webcam_stream").removeClass("webcam_expanded");
        $("#webcam_stream").addClass("webcam_small"); 
         //Change opacity divs
        $("#topDiv").removeClass("div_expanded");
        $("#topDiv").addClass("div_small");
        $("#bottomDiv").removeClass("div_expanded"); 
        $("#bottomDiv").addClass("div_small"); 

        $("#informationToRecord").hide();
        $("#information").show();
        return;
      }
      if(count == 3) mediaRecorder.start(3000);
      second_counter.innerHTML = count--;
    }

  }


  // some handy methods for converting blob to base 64 and vice versa
  // for performance bench mark, please refer to http://jsperf.com/blob-base64-conversion/5
  // note useing String.fromCharCode.apply can cause callstack error
  var blob_to_base64 = function(blob, callback) {
    var reader = new FileReader();
    reader.onload = function() {
      var dataUrl = reader.result;
      var base64 = dataUrl.split(',')[1];
      callback(base64);
    };
    reader.readAsDataURL(blob);
  };

  var base64_to_blob = function(base64) {
    var binary = atob(base64);
    var len = binary.length;
    var buffer = new ArrayBuffer(len);
    var view = new Uint8Array(buffer);
    for (var i = 0; i < len; i++) {
      view[i] = binary.charCodeAt(i);
    }
    var blob = new Blob([view]);
    return blob;
  };

})();
