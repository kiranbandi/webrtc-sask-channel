'use strict';


var message_1;
var imageObj = new Image();
var old_x = 400, old_y = 10; // initial value of x and y
var interval = 1;
var lag_arr = new Array (0);
workspace_TP();


///--------------log items------------

var delay_duration = 0;            // assign delay here
var timeout;
var current_time;

function mouse_movement(){
	
	if(new Date().getTime() >= current_time + delay_duration)       // 'delay_duratin' is the amount of lag
	{
		var xxx = lag_arr.shift();
		console.log("xxx: "+xxx);
		dataChannel[0].send(xxx);
		//dataChannel[1].send(xxx);
	}
	// the following line can be commented otu as it introduces lag
	/* clearTimeout(timeout);
	timeout = setTimeout(function(){
		//alert("move your mouse");
		//console.log("TIMEOUT");
		for(var i=lag_arr.length-1; i>=0; i--){
			var xxx = lag_arr.shift();
			//console.log("xxx from 100 to low: "+xxx);
			dataChannel[0].send(xxx);
			//dataChannel[1].send(xxx);
		}
		interval = 1;
		
		}, 1000); */	
	
}

stage.addEventListener('mousemove', function(event){           //class draging
	
	if(interval == 1){
		current_time = new Date().getTime();
	//	//console.log("CURRENT TIME: "+interval);
		interval = 2;
	}
		
	var x = event.clientX;
	var y = event.clientY;	
	
	message_1 = x+"_"+y+"_tele";
	lag_arr.push(message_1);
	mouse_movement();
	
},false);


/****************************************************************************
* Initial setup
****************************************************************************/

// var configuration = {
//   'iceServers': [{
//     'urls': 'stun:stun.l.google.com:19302'
//   }]
// };


var dataChannelOptions = {
	ordered: true,				// do not guarantee order
	//maxRetransmitTime: 0,    // in milliseconds, for other options go to https://www.html5rocks.com/en/tutorials/webrtc/datachannels/
	reliable: true,			// reliability is controlled by maxRetransmitTime or maxRetransmits parameters. For TCP keep them commented and for UDP assign them value 0. default value 65535.
	//maxRetransmits: 65535,    // can't be used maxRetransmitTime and maxRetransmits both
};

var configuration = null;


// Create a random room if not already present in the URL.
var isInitiator;
var room = window.location.hash.substring(1);
if (!room) {
  room = window.location.hash = randomToken();
  //room = 1;
  }


/****************************************************************************
* Signaling server
****************************************************************************/

// Connect to the signaling server
var socket = io.connect();
var number_peer_connected = 0;

socket.on('ipaddr', function(ipaddr) {
  //console.log('Server IP address is: ' + ipaddr);
  // updateRoomURL(ipaddr);
});

socket.on('created', function(room, clientId, clientNumber) {
  console.log('Created room', room, '- my client ID is', clientId);
  console.log("client number: "+clientNumber);
  isInitiator = true;
  //grabWebCamVideo();
});

socket.on('joined', function(room, clientId, clientNumber) {
  //console.log('This peer has joined room', room, 'with client ID', clientId);
  number_peer_connected = clientNumber;
  isInitiator = false;
  createPeerConnection(isInitiator, configuration, clientNumber);
  //grabWebCamVideo();
});

socket.on('full', function(room) {
  alert('Room ' + room + ' is full. We will create a new room for you.');
  window.location.hash = '';
  window.location.reload();
});

socket.on('ready', function(room, clientNumber) {
  console.log('Socket is ready');
  //console.log("room and client number in ready: "+room+" , "+clientNumber);
  createPeerConnection(isInitiator, configuration, clientNumber);
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

socket.on('message', function(message) {             // section for collaboration over socket
	
	
	
   //message = message_1;
  signalingMessageCallback(message);
});





// Join a room
socket.emit('create or join', room);

if (location.hostname.match(/localhost|127\.0\.0/)) {
  socket.emit('ipaddr');
}

/**
* Send message to signaling server
*/
function sendMessage(message) {
  //console.log('Client sending message: ', message);
  //var message = "HIIIIIIIIIIIIIII";
  socket.emit('message', message);
}


/****************************************************************************
* WebRTC peer connection and data channel
****************************************************************************/

var peerConn;
//var dataChannel;
var dataChannel = [];


function signalingMessageCallback(message) {
  if (message.type === 'offer') {
    console.log('Got offer. Sending answer to peer.');
    peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {},
                                  logError);
    peerConn.createAnswer(onLocalSessionCreated, logError);

  } else if (message.type === 'answer') {
    console.log('Got answer.');
    peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {},
                                  logError);

  } else if (message.type === 'candidate') {
    peerConn.addIceCandidate(new RTCIceCandidate({
      candidate: message.candidate
    }));

  } else if (message === 'bye') {
// TODO: cleanup RTC connection?
}
}

function createPeerConnection(isInitiator, config, peerNumber) {
  console.log('Creating Peer connection as initiator?', isInitiator, 'config:', config);
  console.log("Peer number: ",peerNumber);
  peerConn = new RTCPeerConnection(config);

	// send any ice candidates to the other peer
	peerConn.onicecandidate = function(event) {
	  console.log('icecandidate event:', event);
	  console.log(event.candidate);
	  if (event.candidate) {
		sendMessage({
		  type: 'candidate',
		  label: event.candidate.sdpMLineIndex,
		  id: event.candidate.sdpMid,
		  candidate: event.candidate.candidate
		});
	  } else {
		console.log('End of candidates.');
		//console.log("Peer number: ",parseInt(peerNumber));
		console.log("number_peer_connected: ", number_peer_connected);
	  }
	};

	if (isInitiator) {
	  console.log('Creating Data Channel');
	  
	  for(var ch=0; ch<2; ch++){
		console.log("channel number: "+ch); 
		dataChannel[ch] = peerConn.createDataChannel('photos', dataChannelOptions);
		onDataChannelCreated(dataChannel[ch]);

		
		console.log('Creating an offer');
		peerConn.createOffer(onLocalSessionCreated, logError);
	  }
	  
	} 
	
	
	//if (peerNumber === 2) {
	if(number_peer_connected === 2){
		console.log("Peer number: ",peerNumber);
		peerConn.ondatachannel = function(event) {
			console.log('ondatachannel:', event.channel);
			dataChannel[0] = event.channel;
			onDataChannelCreated(dataChannel[0]);
	  };
	}
	
	
	//if (peerNumber === 3) {
	if(number_peer_connected === 3){
		console.log("Peer number: ",peerNumber);
	  peerConn.ondatachannel = function(event) {
		console.log('ondatachannel:', event.channel);
		dataChannel[1] = event.channel;
		onDataChannelCreated(dataChannel[1]);
	  };
	}
	
	/*
	else {
	  peerConn.ondatachannel = function(event) {
		console.log('ondatachannel:', event.channel);
		dataChannel[0] = event.channel;
		onDataChannelCreated(dataChannel[0]);
	  };
	}
	*/
	

}

function onLocalSessionCreated(desc) {
  console.log('local session created:', desc);
  peerConn.setLocalDescription(desc, function() {
    console.log('sending local desc:', peerConn.localDescription);
    sendMessage(peerConn.localDescription);
  }, logError);
}

function onDataChannelCreated(channel) {
  console.log('onDataChannelCreated:', channel);

  channel.onopen = function() {
    console.log('CHANNEL opened!!!');
	console.log("CurrentTime,pieceNumber,delay,pieceX,pieceY,collision");
  };

  channel.onmessage = (adapter.browserDetails.browser === 'firefox') ?
  receiveDataFirefoxFactory() : receiveDataChromeFactory();
}

function receiveDataChromeFactory() {
  var buf, buf_arr, count, temp;

  return function onmessage(event) {
	  
	//console.log("message");


    if (typeof event.data === 'string') {                                               //section for collaboration over peer-to-peer connection
	  var buf_byte = (new TextEncoder('utf-8').encode(event.data)).length;             // size of data in byte
	  //console.log("Data size: " + buf_byte + " bytes");
	  count = 0;
	  buf = event.data;
	  buf_arr=buf.split("_");
	  	
		if(buf_arr[2] == "tele"){
			//console.log("telepointer");
			telepointer_remote(buf_arr[0],buf_arr[1]);
		
		}	

	return;
    }

	
	
    var data = new Uint8ClampedArray(event.data);
    buf.set(data, count);
    count += data.byteLength;
    //console.log('count: ' + count);
    if (count === buf.byteLength) {
		//console.log('Done. Rendering photo.');
}
};
}


function randomToken() {
  return Math.floor((1 + Math.random()) * 1e16).toString(16).substring(1);
}

function logError(err) {
  if (!err) return;
  if (typeof err === 'string') {
    console.warn(err);
  } else {
    console.warn(err.toString(), err);
  }
}




/****************************************************************************
* Remote computer activities
****************************************************************************/

