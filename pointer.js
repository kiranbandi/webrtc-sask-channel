'use strict';

var message_1;
var imageObj = new Image();
var old_x = 400,
    old_y = 10; // initial value of x and y
var interval = 1;
var lag_arr = new Array(0);
workspace_TP();

///--------------log items------------

var delay_duration = 0; // assign delay here
var timeout;
var current_time;

function mouse_movement() {

    if (new Date().getTime() >= current_time + delay_duration) // 'delay_duratin' is the amount of lag
    {
        var xxx = lag_arr.shift();
        console.log("xxx: " + xxx);
        dataChannel[0].send(xxx);
    }


}

stage.addEventListener('mousemove', function(event) { //class draging

    if (interval == 1) {
        current_time = new Date().getTime();
        //	//console.log("CURRENT TIME: "+interval);
        interval = 2;
    }

    var x = event.clientX;
    var y = event.clientY;

    message_1 = x + "_" + y + "_tele";
    lag_arr.push(message_1);
    mouse_movement();

}, false);


/****************************************************************************
 * WebRTC peer connection and data channel
 ****************************************************************************/

var peerConn;
//var dataChannel;
var dataChannel = [];


function onDataChannelCreated(channel) {
    channel.onmessage = receiveDataChromeFactory();
}

function receiveDataChromeFactory() {
    var buf, buf_arr, count, temp;

    return function onmessage(event) {

        //console.log("message");

        if (typeof event.data === 'string') { //section for collaboration over peer-to-peer connection
            var buf_byte = (new TextEncoder('utf-8').encode(event.data)).length; // size of data in byte
            //console.log("Data size: " + buf_byte + " bytes");
            count = 0;
            buf = event.data;
            buf_arr = buf.split("_");

            if (buf_arr[2] == "tele") {
                //console.log("telepointer");
                telepointer_remote(buf_arr[0], buf_arr[1]);

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