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

var hubInstance = null;
var peerID = '';

// Join the channel and and then let the signalling  client know that you are ready
console.log('requesting to join channel');
signal.discover('join');
signal.once('discover', (r) => {
    // broadcast joining message
    socket.emit('participant-ready');
    // then listen for reply from socket server
    socket.on('all-okay', (response) => {
        peerID = response.customID;
        // show questionaire and ask user to fill it out 
        $("#message-box").text("Please fill out the questionaire and click submit when you are done");
        $("#submit-box").show();
        $("#submit-button").on('click', () => {
            // disable page reload on submit
            event.preventDefault();
            $("#submit-box").hide();
            $("#message-box").text("Thanks, we will now start testing the socket network. Please holdby.");
            var systemInfo = [navigator.userAgent,
                $("#submit-message-device").val(),
                $("#submit-message-line").val(),
                $("#submit-message-connection").val(),
                $("#submit-message-city").val()
            ].join('\n');
            socket.emit('system-info', systemInfo);
        })
    });

    socket.on('sent-from-server', (message) => {
        socket.emit('return-to-server', message)
    });

    socket.on('server-busy', (response) => {
        $("#message-box").remove();
        $("#submit-box").remove();
        $('#busy-box').text('sorry but a study is ongoing at the moment, please close this page and try again later.');
    });

    socket.on('start-webrtc', (response) => {
        $("#message-box").text("The socket test is complete. We are now linking with the webrtc server");
        // wait for a couple of seconds before linking to peer
        wait(5000).then(() => connectToHub(response.hubPeerID, peerID));
    });
});


function startListeningToHub(hub) {
    hubInstance = hub;
    hub.on('data', (message) => {
        const data = JSON.parse(message);
        switch (data.dataType) {
            case 'SendToPeer':
                sendDataBackToHub('backToHub', data.sendMessage);
                break;
            case 'Flag':
                $('#message-box').append('<p><b>' + data.thxMessage + '</p>');
                break;
            default:
                // do nothing here
        }
    });
}

// connects to hub
async function connectToHub(hubPeerID) {
    console.log('connecting to hub');
    try {
        // while making a connection also send your customID to the remote so he 
        // knows what to store your data as 
        const { peer } = await signal.connect(hubPeerID, { customID: peerID }) // connect to the hub
        console.log('connected to hub');
        $("#message-box").text("webrtc linking was successful, we are now testing the webrtc link. Please await further instructions.");
        startListeningToHub(peer);
    } catch (err) {
        console.log('failed to connect to hub');
        socket.emit('hub-fail', { peerID })
        wait(5000).then(() => {
            $("#message-box").text("We were unable to link up with the remote webrtc server. Thanks again for your time. Please close this tab");
        });
    }
}

// Code cleanup when a client is closed or refreshed
window.addEventListener("beforeunload", function(e) {
    // intimate the hub that you are disconnecting
    hubInstance.destroy();
});

function sendDataBackToHub(dataType, payload) {
    hubInstance.send(JSON.stringify({ dataType, payload, 'remoteID': peerID }));
}


// special delay function than returns a promise which is "thennable"
function wait(duration) {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve();
        }, duration)
    });
}