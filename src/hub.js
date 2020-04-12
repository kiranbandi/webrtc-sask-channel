/*global $*/
import io from 'socket.io-client';
import SimpleSignalClient from './custom-signal';

// for extended options go to https://www.html5rocks.com/en/tutorials/webrtc/datachannels/
var dataChannelOptions = {
    ordered: false, // do not guarantee order
    //maxRetransmitTime: 0,    // in milliseconds, 
    reliable: false, // reliability is controlled by maxRetransmitTime or maxRetransmits parameters. 
    // For TCP keep them commented and for UDP assign them value 0. default value 65535.
    maxRetransmits: 3000, // can't be used maxRetransmitTime and maxRetransmits both
}

// setup the socket.io connection
const socket = io('localhost:8082');
// construct the webrtc signalling client and pass in the channel options
const signalClient = new SimpleSignalClient(socket, { dataChannelOptions });

// Join the channel, get a list of peers and initiate connection with each one of them
signalClient.discover('hub-join')
signalClient.once('discover', (response) => { response.peers.forEach(p => { connectToPeer(p) }) })

// If a peer joins the channel after the hub has joined the channel
// then accept the connection from it and start listening for data 
signalClient.on('request', async(request) => {
    console.log('accepting new request from peer to connect');
    const { peer, metadata } = await request.accept();
    console.log('connected to peer - ', metadata.customID);
    listenToPeer(peer);
})

// if a peer connection is successful then listen for data from the peer
// and relay it on to everyone else
function listenToPeer(peer) {
    peer.on('data', (message) => { signalClient.peers().forEach(p => { p.send(message) }) });
}

// connect to peer
async function connectToPeer(peerInfo) {
    const peerCustomID = peerInfo.customID;
    try {
        console.log('trying to connect to peer - ', peerCustomID);
        const { peer } = await signalClient.connect(peerInfo.peerID);
        console.log('connected to peer - ', peerCustomID);
        listenToPeer(peer);
    } catch (err) {
        console.log('failed to connect to peer - ', peerCustomID);
    }
}

// intimate signalling server that you are leaving the channel when page is closed
window.addEventListener("beforeunload", function(e) { signalClient.discover('hub-left') });

// clear up the DOM as we are reusing same html file for hub and peer UI
$("#currentID").text("HUB Ready");
// clear other stuff 
$("#root").remove();
$("#message-box").remove();