/*global $*/
import io from 'socket.io-client';
import SimpleSignalClient from './custom-signal';
import _ from 'lodash';
import drawing from './drawing';

// Initialize canvas drawing and attach a callback that is called when the user starts drawing
let canvasContext = drawing((positions) => {
    sendDataToHub('canvas-line', positions);
});

var peer_or_signal_server = 0;
var temp = peer_or_signal_server;

var dataChannelOptions = {
    ordered: false, // do not guarantee order
    //maxRetransmitTime: 0,    // in milliseconds, for other options go to https://www.html5rocks.com/en/tutorials/webrtc/datachannels/
    reliable: false, // reliability is controlled by maxRetransmitTime or maxRetransmits parameters. 
    // For TCP keep them commented and for UDP assign them value 0. default value 65535.
    maxRetransmits: 0, // can't be used maxRetransmitTime and maxRetransmits both
}

const socket = io('192.168.0.66:8082'); // setup the socket.io socket
const signalClient = new SimpleSignalClient(socket, { dataChannelOptions }); // construct the signal client

var hubPeerInstance = null;
var currentID = '';

// Join the channel and and then let the signalling  client know that you are ready
console.log('requesting to join channel');
signalClient.discover('join');

//signalClient.once('discover', (r) => {
signalClient.on('discover', (r) => {

    if (r.flag == 'SendFromServer') {
        console.log("SendFromServer");
        $("#innerID").text(' ' + currentID);
        let return_message = r.msg;
        signalClient.discover('returnToServer-' + return_message);
        peer_or_signal_server += 1; //used to switch signalling server to peer-to-peer


    }

});

signalClient.once('discover', (r) => {

    console.log("PRINTING ELSE");
    // broadcast joining message
    socket.emit('peer-join');
    // then listen for reply from signaling server 
    socket.on('notify', (response) => {
        currentID = response.customID;
        // Set the current ID on screen
        $("#innerID").text('  ' + currentID);
        //$("#innerID").text('  ' + "AAA");
        // Create cursors for everyone else in the channel 
        response.peerList.forEach(peer => { createCursor(peer.customID) });
        // if waiting is false then we link to the hub
        if (response.hubReady) {
            connectToHub(response.hubPeerID, currentID);
        }
    });
    // when a new peer joins create a cursor for it
    socket.on('peer-join', (p) => { createCursor(p) });
    // when a peer exits the channel remove cursor from dom
    socket.on('peer-left', (p) => { $('#' + p).remove(); });
    // if a hub is ready, show on dom that hub is ready 
    socket.on('hub-join', (p) => { console.log('hub-ready') });
    // if a hub has left channel
    socket.on('hub-left', (p) => { location.reload() });


});

// if hub joins the room at a later point after this client 
// it will make a request which will be accepted in the following block 
// and a new webrtc connection will be made
signalClient.on('request', async(request) => {
    const { peer } = await request.accept();
    startListeningToHub(peer);
})

function startListeningToHub(hub) {

    hubPeerInstance = hub;

    hub.on('data', (message) => {
        //console.log(message);
        const data = JSON.parse(message),
            //console.log(data.payload);

            payload = data.payload,
            remoteID = data.remoteID;

        // ignore own messages if they are being relayed back
        //if (currentID != remoteID) {
        if (currentID == remoteID) {
            switch (data.dataType) {
                case 'mouse-position':
                    $('#' + remoteID).css({ 'left': payload[0] + 'px', top: payload[1] + 'px' })
                    break;
                case 'chat-message':
                    //$('#content').append('<p><b>' + remoteID + ': </b>' + payload + '</p>');
                    break;
                case 'SendToPeer':
                    $('#content').append('<p><b>' + remoteID + ': </b>' + data.sendMessage + '</p>');
                    sendDataBackToHub('backToHub', data.sendMessage);
                    break;
                case 'Flag':
                    $('#content').append('<p><b>' + data.thxMessage + '</p>');
                    //$('#content').append('<p><b>' + "Saving File.. + '</p>');
                    break;

                case 'canvas-line':
                    const { start, end } = payload;
                    canvasContext.beginPath();
                    canvasContext.moveTo(start[0], start[1]);
                    canvasContext.lineTo(end[0], end[1]);
                    canvasContext.strokeStyle = 'black';
                    canvasContext.lineWidth = 2;
                    canvasContext.stroke();
                    canvasContext.closePath();
                    break;
                default:
                    // do nothing here
            }
        }
    });
}

// connects to hub
async function connectToHub(hubPeerID) {
    console.log('connecting to hub');
    try {
        // while making a connection also send your customID to the remote so he 
        // knows what to store your data as 
        const { peer } = await signalClient.connect(hubPeerID, { customID: currentID }) // connect to the hub
        console.log('connected to hub');
        startListeningToHub(peer);
    } catch (err) {
        console.log('failed to connect to hub');
    }
}

// Code cleanup when a client is closed or refreshed
window.addEventListener("beforeunload", function(e) {
    // intimate signalling server that you are leaving the channel
    socket.emit('peer-left', currentID);
    // intimate the hub that you are disconnecting
    hubPeerInstance.destroy();
});

var rootElement = $('#root');
var topOffsetX = rootElement.offset().left;
var topOffsetY = rootElement.offset().top;

// broadcast mousemovement to hub
rootElement.on('mousemove', (e) => {
    sendDataToHub('mouse-position', [e.pageX - topOffsetX, e.pageY - topOffsetY]);
})

/*
// broadcast text message to hub
$("#send-button").on('click', (e) => {
    const messageToBeSent = $("#send-message").val();
    // send your message here 
    sendDataToHub('chat-message', messageToBeSent);
    // add the message also to your own content box
    $('#content').append('<p><b>' + currentID + ': </b>' + messageToBeSent + '</p>');
    // clean input box after message is sent
    $('#send-message').val('');
})
*/

$("#send-button").on('click', (e) => {
    const messageToBeSent = $("#send-message").val();
    // send your message here 




    //sendDataToHub('initiatorFlag', messageToBeSent);			//sending message over WebRTC Server
    signalClient.discover('initiatorFlag-' + currentID); //sending message over signalling server

    peer_or_signal_server

    var checkInterval = setInterval(function() {
        if ((peer_or_signal_server - temp) == 0) {
            sendDataToHub('initiatorFlag', messageToBeSent);
            clearInterval(checkInterval);

        } else
            temp = peer_or_signal_server;

    }, 30000);



    // add the message also to your own content box
    //$('#content').append('<p><b>' + currentID + ': </b>' + messageToBeSent + '</p>');
    // clean input box after message is sent
    $('#send-message').val('');
})


$("#submit-button").on('click', (e) => {
    const systemInfo = navigator.userAgent + '_' + $("#submit-message-device").val() + '_' + $("#submit-message-line").val() + '_' + $("#submit-message-connection").val() + '_' + $("#submit-message-city").val();
    sendDataToHub('systemInfo', systemInfo);

    //signalClient.discover('submitMessage-'+ submitMessage);
    //console.log("navigator: "+navigator.userAgent);
    //http://useragentstring.com/				//to analyze the user agent
})


// function to create a new cursor in a random color on the box to represent to a peer
function createCursor(mountID) {

    let cursorElement = "<svg height='25' width='25'><g transform='scale(0.075)'><path d='M247.094,297c-2.831,0-5.549-1.125-7.551-3.129l-82.835-82.868l-34.905,60.448c-2.046,3.544-5.936,5.61-10.017,5.31c-4.081-0.296-7.634-2.896-9.148-6.697L0.825,14.632c-1.58-3.965-0.648-8.489,2.369-11.505C6.212,0.108,10.735-0.82,14.7,0.761l255.317,101.86c3.799,1.515,6.397,5.067,6.693,9.148c0.295,4.079-1.766,7.968-5.308,10.015l-60.435,34.929l82.839,82.878c4.168,4.169,4.168,10.926,0.001,15.096l-39.162,39.186C252.643,295.873,249.927,297,247.094,297z M154.422,182.934c2.813,0,5.534,1.112,7.551,3.129l85.121,85.156l24.067-24.082l-85.126-85.162c-2.347-2.348-3.469-5.651-3.036-8.941c0.433-3.291,2.371-6.191,5.244-7.852l53.427-30.879L29.86,29.801l84.462,211.902l30.853-53.433c1.66-2.874,4.563-4.813,7.854-5.246C153.494,182.964,153.959,182.934,154.422,182.934z'></path></g></svg>";
    let containerDiv = $('<div/>', { id: mountID, 'class': 'cursor-container' }).appendTo('#root');

    containerDiv.html(cursorElement)
        .append('<span>' + mountID + '</span>')
        .css({
            'position': 'absolute',
            'top': '0px',
            'left': '0px'
        });
}

function sendDataToHub(dataType, payload) {
    if (hubPeerInstance) {
        console.log("Sending to hub");
        hubPeerInstance.send(JSON.stringify({ dataType, payload, 'remoteID': currentID }));
    }
}

function sendDataBackToHub(dataType, payload) {
    if (hubPeerInstance) {
        hubPeerInstance.send(JSON.stringify({ dataType, payload, 'remoteID': currentID }));
    }
}