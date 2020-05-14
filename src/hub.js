import io from 'socket.io-client';
import SimpleSignalClient from './signaller';

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
// Join the channel and and then let the signalling  client know that you are ready
signalClient.discover('join');
signalClient.once('discover', () => {
        // let socket know you are ready
        socket.emit('hub-join');
        //    wait for connection request from the peer
        signalClient.on('request', async(request) => {
            console.log('accepting new request from peer to connect');
            const { peer, metadata } = await request.accept();
            console.log('connected to peer - ', metadata.customID);
            listenToPeer(peer);
        })
    })
    // if a peer connection is successful then listen for data from the peer
function listenToPeer(peer) {
    peer.on('data', (message) => {
        // bounce message back
        peer.send(message);
    });
    peer.on('close', () => { console.log('peer left'); });
}