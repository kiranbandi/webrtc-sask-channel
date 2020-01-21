/*global $*/
import io from 'socket.io-client';
import SimpleSignalClient from './custom-signal';

const localVideoContainer = document.getElementById('localVideo')
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
var currentRoom = 'sask' // keeps track of current room

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
    const { peer } = await signalClient.connect(peerID, currentRoom) // connect to the peer
    console.log('connected to peer', peerID);
    onPeer(peer, localStream)
}


// request local webcam
navigator.getUserMedia({
    audio: true,
    video: true
}, (localStream) => {


    const videoElement = createVideoElement(localVideoContainer, localStream, true) // display local video

    // make a call to join the channel 
    console.log('requesting to join sask channel');
    signalClient.discover('join')

    // then listen for reply from signalling server 
    // containing list of all existing peers in the channel,
    //  so we subscribe only once
    signalClient.once('discover', (response) => {
        response.peers.forEach(peerID => connectToPeer(peerID, localStream)) // connect to all peers in new room
    });


    signalClient.on('request', async(request) => {
        const { peer } = await request.accept();
        onPeer(peer, localStream);
    })


}, () => alert('No webcam access!'))


window.addEventListener("beforeunload", function(e) {
    // intimate everyother peer that you are disconnecting
    signalClient.peers().forEach(peer => {
        peer.destroy();
    });
    // intimate signalling server that you are leaving the channel
    signalClient.discover('leave');
});