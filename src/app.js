/*global $*/
import io from 'socket.io-client';
import SimpleSignalClient from './custom-signal';
import cuid from 'cuid';
import _ from 'lodash';
import drawing from './drawing';



// Initialize canvas drawing and attach a callback that is called when the user starts drawing
let canvasContext = drawing((positions) => {
    sendDataToPeers('canvas-line', positions);
});

// answer discussion UDP/TCP switch and how to test which
// https://stackoverflow.com/questions/18897917/does-webrtc-use-tcp-or-udp

var dataChannelOptions = {
    ordered: false, // do not guarantee order
    //maxRetransmitTime: 0,    // in milliseconds, for other options go to https://www.html5rocks.com/en/tutorials/webrtc/datachannels/
    reliable: false, // reliability is controlled by maxRetransmitTime or maxRetransmits parameters. 
    // For TCP keep them commented and for UDP assign them value 0. default value 65535.
    maxRetransmits: 3000, // can't be used maxRetransmitTime and maxRetransmits both
}

const socket = io('gwf-hci.usask.ca:8083'); // setup the socket.io socket
const signalClient = new SimpleSignalClient(socket, { dataChannelOptions }); // construct the signal client

let currentID = '';

let currentPeerCount = 0;

let colorScale = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];


// make a call to join the channel 
console.log('requesting to join sask channel');

signalClient.discover('join')
    // then listen for reply from signalling server 
    // containing list of all existing peers in the channel,
    //  so we subscribe only once
signalClient.once('discover', (response) => {
    // store our ID that server gives so we can use it to identify our data 
    currentID = response.currentID;
    // Set the current ID on screen
    $("#innerID").text('  ' + currentID);
    // for every peer we create a connection
    response.peers.forEach(peer => connectToPeer(peer)) // connect to all peers in new room
});
// if a new peer joins the room at a later point after this client 
// has joined he will make a request which will be accepted in the following block 
// and a new connection will be made with him
signalClient.on('request', async(request) => {
    const { peer, metadata } = await request.accept();
    startListeningToPeer(peer, metadata.customID);
})

function startListeningToPeer(peer, customPeerID) {

    createCursor(customPeerID);

    let peerMessage;

    peer.on('data', (message) => {

        const data = JSON.parse(message);

        switch (data.dataType) {
            case 'mouse-position':
                $('#' + customPeerID).css({ 'left': data.payload[0] + 'px', top: data.payload[1] + 'px' })
                break;
            case 'chat-message':
                $('#content').append('<p><b>' + customPeerID + ': </b>' + data.payload + '_' + new Date().getTime() + '</p>');
				//const send_back = "11111111111111111111111111111111111111111111111111";   // 50 byte
                sendDataToPeers('chat-message-back', data.payload);
				break;
				
			case 'chat-message-back':
                $('#content').append('<p><b>' + customPeerID + ': </b>' + data.payload + '_' + new Date().getTime() + '</p>');
				break;
				
            case 'canvas-line':

                const { start, end } = data.payload;

                canvasContext.beginPath();
                canvasContext.moveTo(start[0], start[1]);
                canvasContext.lineTo(end[0], end[1]);
                canvasContext.strokeStyle = 'black';
                canvasContext.lineWidth = 2;
                canvasContext.stroke();
                canvasContext.closePath();

                break;
            default:
                // cdo nothing here
        }


    });
    // remove a peers corresponding cursor if he has left channel
    peer.on('close', () => { $('#' + customPeerID).remove() });

}

// connects to a peer
async function connectToPeer(peerInfo) {
    console.log('connecting to peer', peerInfo.customID);
    try {
        // while making a connection also send your customID to the remote so he 
        // knows what to name your cursor
        const { peer } = await signalClient.connect(peerInfo.peerID, { customID: currentID }) // connect to the peer
        console.log('connected to peer', peerInfo.customID);
        startListeningToPeer(peer, peerInfo.customID);
    } catch (err) {
        console.log('couldnt connect to peer');
    }

}

// Code cleanup when a client is closed or refreshed
window.addEventListener("beforeunload", function(e) {
    // intimate everyother peer that you are disconnecting
    signalClient.peers().forEach(peer => {
        peer.destroy();
    });
    // intimate signalling server that you are leaving the channel
    signalClient.discover('leave-' + currentID);
});

var rootElement = $('#root');
var topOffsetX = rootElement.offset().left;
var topOffsetY = rootElement.offset().top;

// broadcast mousemovement to all other connected peers
rootElement.on('mousemove', (e) => {
    sendDataToPeers('mouse-position', [e.pageX - topOffsetX, e.pageY - topOffsetY]);
})

// broadcast text message to all other connected peers when send button is clicked
$("#send-button").on('click', (e) => {
    //const messageToBeSent = $("#send-message").val();
	//const messageToBeSent = "ABCDE_".concat(new Date().getTime());
    // send your message here 
	for(var i=0; i<1000; i++){
		//const messageToBeSent = i+"_1111111111111111111111111111111111111111111111111"; // 50 bytes
		const messageToBeSent = i+"_111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111"; // 100 bytes
		sendDataToPeers('chat-message', messageToBeSent);
	
		// add the message also to your own content box
		$('#content').append('<p><b>' + currentID + ': </b>' + messageToBeSent + '_' + new Date().getTime() + '</p>');
		// clean input box after message is sent
		$('#send-message').val('');
	}
})




// function to create a new cursor in a random color on the box to represent to a peer
function createCursor(mountID) {

    const colorHash = colorScale[currentPeerCount];
    currentPeerCount = currentPeerCount >= 9 ? 0 : currentPeerCount + 1;

    let cursorElement = "<svg fill='" + colorHash + "' height='25' width='25'><g transform='scale(0.075)'><path d='M247.094,297c-2.831,0-5.549-1.125-7.551-3.129l-82.835-82.868l-34.905,60.448c-2.046,3.544-5.936,5.61-10.017,5.31c-4.081-0.296-7.634-2.896-9.148-6.697L0.825,14.632c-1.58-3.965-0.648-8.489,2.369-11.505C6.212,0.108,10.735-0.82,14.7,0.761l255.317,101.86c3.799,1.515,6.397,5.067,6.693,9.148c0.295,4.079-1.766,7.968-5.308,10.015l-60.435,34.929l82.839,82.878c4.168,4.169,4.168,10.926,0.001,15.096l-39.162,39.186C252.643,295.873,249.927,297,247.094,297z M154.422,182.934c2.813,0,5.534,1.112,7.551,3.129l85.121,85.156l24.067-24.082l-85.126-85.162c-2.347-2.348-3.469-5.651-3.036-8.941c0.433-3.291,2.371-6.191,5.244-7.852l53.427-30.879L29.86,29.801l84.462,211.902l30.853-53.433c1.66-2.874,4.563-4.813,7.854-5.246C153.494,182.964,153.959,182.934,154.422,182.934z'></path></g></svg>";
    let containerDiv = $('<div/>', { id: mountID, 'class': 'cursor-container' }).appendTo('#root');

    containerDiv.html(cursorElement)
        .append('<span style="color:' + colorHash + '">' + mountID + '</span>')
        .css({
            'position': 'absolute',
            'top': '0px',
            'left': '0px'
        });

}


function sendDataToPeers(dataType, payload) {
    signalClient.peers().forEach(peer => {
        // send your message here 
        peer.send(JSON.stringify({ dataType, payload }));
    });
}