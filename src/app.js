/*global $*/
import io from 'socket.io-client';
import SimpleSignalClient from './custom-signal';
import cuid from 'cuid';
import _ from 'lodash';

const randomId = cuid();

$('#clicker').html(randomId);

$('#clicker').on('click', () => {
    signalClient.peers().forEach(peer => {
        // send your message here 
        peer.send('yoda is awesome' + signalClient.peers().length);
    });
});

const socket = io('localhost:8080') // setup the socket.io socket
const signalClient = new SimpleSignalClient(socket) // construct the signal client

// make a call to join the channel 
console.log('requesting to join sask channel');
signalClient.discover('join')
    // then listen for reply from signalling server 
    // containing list of all existing peers in the channel,
    //  so we subscribe only once
signalClient.once('discover', (response) => {
    // for every peer we create a connection
    response.peers.forEach(peerID => connectToPeer(peerID)) // connect to all peers in new room
});
// if a new peer joins the room at a later point after this client 
// has joined he will make a request which will be accepted in the following block 
// and a new connection will be made with him
signalClient.on('request', async(request) => {
    const { peer } = await request.accept();
    onPeer(peer);
})

function onPeer(peer) {
    peer.on('data', (message) => {
        // the message from every person is received here 
        // and the peer._id can identify who it is from 
        // so deal with it accordingly
        alert(message.toString('utf8'));
    });
}

// connects to a peer
async function connectToPeer(peerID) {
    console.log('connecting to peer', peerID);

    try {
        const { peer } = await signalClient.connect(peerID) // connect to the peer
        console.log('connected to peer', peerID);
        onPeer(peer);
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
    signalClient.discover('leave');
});