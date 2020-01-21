/*global $*/
import io from 'socket.io-client';
import SimpleSignalClient from './custom-signal';

const remoteVideoContainer = document.getElementById('remoteVideos')

// creates a video element, sets a mediastream as it's source, and appends it to the DOM
function createVideoElement(container, mediaStream, muted = false) {
    const videoElement = document.createElement('video')
    videoElement.autoplay = true
    videoElement.srcObject = mediaStream
    videoElement.muted = muted
    container.appendChild(videoElement)
    return videoElement
}

const socket = io('localhost:8080') // setup the socket.io socket
const signalClient = new SimpleSignalClient(socket) // construct the signal client

function onPeer(peer, localStream) {
    peer.addStream(localStream)
    peer.on('stream', (remoteStream) => {
        const videoElement = createVideoElement(remoteVideoContainer, remoteStream)
        peer.on('close', () => {
            remoteVideoContainer.removeChild(videoElement)
        })
    })
}

// connects to a peer and handles media streams
async function connectToPeer(peerID, localStream) {
    console.log('connecting to peer', peerID);
    const { peer } = await signalClient.connect(peerID) // connect to the peer
    console.log('connected to peer', peerID);
    onPeer(peer, localStream)
}


// request local webcam
navigator.getUserMedia({
    audio: true,
    video: true
}, (localStream) => {

    // make a call to join the channel 
    console.log('requesting to join sask channel');
    signalClient.discover('join')
        // then listen for reply from signalling server 
        // containing list of all existing peers in the channel,
        //  so we subscribe only once
    signalClient.once('discover', (response) => {
        // for every peer we create a connection
        response.peers.forEach(peerID => connectToPeer(peerID, localStream)) // connect to all peers in new room
    });
    // if a new peer joins the room at a later point after this client 
    // has joined he will make a request which will be accepted in the following block 
    // and a new connection will be made with him
    signalClient.on('request', async(request) => {
        const { peer } = await request.accept();
        onPeer(peer, localStream);
    })

}, () => alert('No webcam access!'));


// Code cleanup when a client is closed or refreshed
window.addEventListener("beforeunload", function(e) {
    // intimate everyother peer that you are disconnecting
    signalClient.peers().forEach(peer => {
        peer.destroy();
    });
    // intimate signalling server that you are leaving the channel
    signalClient.discover('leave');
});