/*global $*/
import io from 'socket.io-client';
import SimpleSignalClient from './custom-signal';
import cuid from 'cuid';
import _ from 'lodash';

// answer discussion UDP/TCP switch and how to test which
// https://stackoverflow.com/questions/18897917/does-webrtc-use-tcp-or-udp

var dataChannelOptions = {
    ordered: false, // do not guarantee order
    //maxRetransmitTime: 0,    // in milliseconds, for other options go to https://www.html5rocks.com/en/tutorials/webrtc/datachannels/
    // reliable: false, // reliability is controlled by maxRetransmitTime or maxRetransmits parameters. 
    // For TCP keep them commented and for UDP assign them value 0. default value 65535.
    maxRetransmits: 3000, // can't be used maxRetransmitTime and maxRetransmits both
}

const socket = io('localhost:80'); // setup the socket.io socket
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
    // for every peer we create a connection
    response.peers.forEach(peerID => connectToPeer(peerID)) // connect to all peers in new room
});
// if a new peer joins the room at a later point after this client 
// has joined he will make a request which will be accepted in the following block 
// and a new connection will be made with him
signalClient.on('request', async(request) => {
    const { peer } = await request.accept();
    startListeningToPeer(peer, request.initiator);
})

function startListeningToPeer(peer, peerID) {

    createCursor(peerID, colorScale[currentPeerCount++]);

    let peerCursor;
    peer.on('data', (message) => {
        // the message from every person is received here 
        peerCursor = message.toString('utf8').split(',');
        $('#' + peerID).css({ 'left': peerCursor[0] + 'px', top: peerCursor[1] + 'px' })

    });
    // remove a peers corresponding cursor if he has left channel
    peer.on('close', () => { $('#' + peerID).remove() });

}

// connects to a peer
async function connectToPeer(peerID) {
    console.log('connecting to peer', peerID);
    try {
        const { peer } = await signalClient.connect(peerID) // connect to the peer
        console.log('connected to peer', peerID);
        startListeningToPeer(peer, peerID);
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

signalClient.peers().forEach(peer => {
    // send your message here 
    peer.send(['sadasd', 12, 10]);
});

var rootElement = $('#root');
var topOffsetX = rootElement.offset().left;
var topOffsetY = rootElement.offset().top;

// broadcast mousemovement to all other connected peers
rootElement.on('mousemove', (e) => {
    signalClient.peers().forEach(peer => {
        // send your message here 
        peer.send([e.pageX - topOffsetX, e.pageY - topOffsetY]);
    });
})


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