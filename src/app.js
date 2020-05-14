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

const socket = io('52.60.139.103:8082'); // setup the socket.io socket
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
        $("#initial-box").text("Please fill out the questionaire and click submit when you are done");
        $("#submit-box").show();
        $("#submit-button").on('click', () => {
            // disable page reload on submit
            event.preventDefault();
            $("#submit-box").hide();
            $("#initial-box").hide();
            $("#study-box").show();
            var systemInfo = [navigator.userAgent,
                $("#submit-message-device").val(),
                $("#submit-message-line").val(),
                $("#submit-message-connection").val(),
                $("#submit-message-city").val()
            ].join('\n');

            $("#step-1").show();
            $("#step-2").show();
            socket.emit('system-info', systemInfo);
        })
    });

    socket.on('sent-from-server', (message) => {
        socket.emit('return-to-server', message)
    });

    socket.on('server-busy', (response) => {
        $("#study-box").remove();
        $("#submit-box").remove();
        $('#error-box').show();
    });

    socket.on('start-webrtc', (response) => {
        $("#step-3").show();
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
                $("#step-5").show();
                wait(10000).then(() => {
                    $("#step-6").show();
                    $('#study-message').text(data.thxMessage);
 		hubInstance.destroy();
                    socket.disconnect();

                });
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
        $("#step-4").show();
        startListeningToHub(peer);
    } catch (err) {
        console.log('failed to connect to hub');
        socket.emit('hub-fail', { peerID })
        wait(5000).then(() => {
            $("#initial-box").remove();
            $("#study-box").remove();
            $("#error-box").text("We were unable to link up with the remote webrtc server. Thanks again for your time. Please close this tab").show();
            socket.disconnect()
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