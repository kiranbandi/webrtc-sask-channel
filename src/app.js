/*global $*/
import io from 'socket.io-client';
import SimpleSignalClient from './signaller';

var dataChannelOptions = {
    ordered: false, // do not guarantee order
    //maxRetransmitTime: 0,    // in milliseconds, for other options go to https://www.html5rocks.com/en/tutorials/webrtc/datachannels/
    reliable: false, // reliability is controlled by maxRetransmitTime or maxRetransmits parameters. 
    // For TCP keep them commented and for UDP assign them value 0. default value 65535.
    maxRetransmits: 3000, // can't be used maxRetransmitTime and maxRetransmits both
}

const socket = io('localhost:8082'); // setup the socket.io socket
const signal = new SimpleSignalClient(socket, { dataChannelOptions }); // construct the signal client

var hub = null;
var peerID = '';

// Join the channel and and then let the signalling  client know that you are ready
console.log('requesting to join channel');
signal.discover('join');
signal.once('discover', (r) => {
    // broadcast joining message
    socket.emit('peer-join');
    // then listen for reply from signaling server 
    socket.on('notify', (response) => {
        peerID = response.customID;
        connectToHub(response.hubPeerID, peerID);
    });
});


function startListeningToHub(hub) {
    hub = hub;
    hub.on('data', (message) => {
        // const data = JSON.parse(message),
        //     payload = data.payload,
        //     remoteID = data.remoteID;
        alert('received message from hub');

        // when got message from hub

    });
    hub.send('hello');
}

// connects to hub
async function connectToHub(hubPeerID) {
    console.log('connecting to hub');
    try {
        // while making a connection also send your customID to the remote so he 
        // knows what to store your data as 
        const { peer } = await signal.connect(hubPeerID, { customID: peerID }) // connect to the hub
        console.log('connected to hub');
        startListeningToHub(peer);
    } catch (err) {
        console.log('failed to connect to hub');
    }
}

// Code cleanup when a client is closed or refreshed
window.addEventListener("beforeunload", function(e) {
    // intimate signalling server that you are leaving the channel
    socket.emit('peer-left', peerID);
    // intimate the hub that you are disconnecting
    hub.destroy();
});

function sendDataToHub(dataType, payload) {
    hub.send(JSON.stringify({ dataType, payload, 'remoteID': peerID }));
}