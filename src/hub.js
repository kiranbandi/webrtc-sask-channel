import io from 'socket.io-client';
import SimpleSignalClient from './signaller';

window.csvData = [];
// The hub will never initiate a connection with a peer
// it will only accept requests to connect 
// then once its connected to a peer , it will wait for a second
// and then start sending data "messages". Any data it receives is being 
// bounced back from the UI peer so it will log the results in a csv file.

// Connections to the hub are controlled by the socket server and it will
// ensure that only one peer UI is talking to the hub at any point in time.
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
// Join the signalling channel
signalClient.discover('join');

// store the ID of the peer so that it can be used in logging
var connectedPeerID = '';

signalClient.once('discover', () => {
    // let socket server know you are ready and give it your peerID
    socket.emit('hub-join');
    // Then start waiting for connection requests from peer UIs
    signalClient.on('request', async(request) => {
        //Accept request to connect from a peer
        const { peer, metadata } = await request.accept();
        //Store the peer ID if the connection is successfull
        connectedPeerID = metadata.customID;
        // Wait for 3 seconds (buffer for everything to get ready), then start sending data to the peer 
        wait(3000).then(() => startSendingDataToPeer(peer))
            // Also start listening to the peer for data
        peer.on('data', receiveDataFromPeer);
    })
})


// This function is called only one time after a successful connection
// has been established with a peer
// in here we can start sending data in bursts
function startSendingDataToPeer(peer) {


    var dataType = "SendToPeer";
    //var sendMessage = "1111111111";
    //console.log(dataType + ' - ' + sendMessage);

    var peer_list = signalClient.peers();
    console.log("length: " + peer_list.length);
    //console.log(peer_list);
    //console.log(peer_list[0]);

    // var message_rates = [0, 5, 10, 20, 40];
    var message_rates = [0, 5];
    var message_rates_length = message_rates.length;
    console.log(message_rates_length);
    var message_rates_index = 0;

    // var message_sizes = ["_11111111111111111111111111111111111111111111111111", "_1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111", "_111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111", "_111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111", "_11111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111", "_111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111"];
    // var message_sizes_label = ["50bytes", "100bytes", "150bytes", "300bytes", "500bytes", "1kbyte"];

    var message_sizes = ["_11111111111111111111111111111111111111111111111111", "_1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111"];
    var message_sizes_label = ["50bytes", "100bytes"];


    var message_sizes_index = 0;
    var message_sizes_length = message_sizes.length;
    console.log(message_sizes_length);

    var interval = message_rates[message_rates_index];
    //var test_interval;
    //var transmission_rate = [0, 5, 10, 20, 40];

    //for( var payload=0; payload<2; payload++){

    //var m = message_size[payload];
    //console.log(m);
    //for(var rate = 0; rate <5; rate ++){

    var i = 0;
    //var r = transmission_rate[rate];
    //console.log(r);
    var myInterval = setInterval(send_message, interval);

    function send_message() {
        //const sendMessage = i+"_11111111111111111111111111111111111111111111111111"; // 50 bytes
        //console.log(sendMessage);
        var sendMessage = i + message_sizes[message_sizes_index];
        interval = message_rates[message_rates_index];
        console.log(interval);
        //test_interval = message_rates[1];
        //console.log(sendMessage);
        peer_list[0].send(JSON.stringify({ dataType, sendMessage, 'remoteID': connectedPeerID }))



        //peer_list[1].send(JSON.stringify({ dataType, sendMessage, 'remoteID': connectedPeerID }))
        //signalClient.peers().send(JSON.stringify({ dataType, sendMessage, 'remoteID': connectedPeerID }))

        //signalClient.peers().forEach(p => { 
        //	p.send(JSON.stringify({ dataType, sendMessage, 'remoteID': connectedPeerID })); 
        //	//p.send({ dataType, sendMessage, 'remoteID': connectedPeerID });
        //	console.log("sending to hub");
        //	});


        //console.log("Send: "+sendMessage);
        //window.csvData.push(connectedPeerID + ':' + sendMessage + '_' + new Date().getTime()); 
        window.csvData.push('Server:' + sendMessage + '_' + new Date().getTime() + '_' + message_sizes_label[message_sizes_index] + '_' + message_rates[message_rates_index]);

        i += 1;

        console.log(i);
        if ((i % 1000) == 0) {
            //i=0;
            //dataType = "Flag";
            //var thxMessage = "Experiment Ended !!. Thank you";
            //peer_list[0].send(JSON.stringify({ dataType, thxMessage, 'remoteID': connectedPeerID }))
            Savedelay(message_sizes_label[message_sizes_index], message_rates[message_rates_index]);
            console.log("message_size_index before save: " + message_sizes_label[message_sizes_index]);
            //saveFile(message_sizes_label[message_sizes_index], message_rates[message_rates_index]);
            //signalClient.discover('leave-' + currentID);
            //setTimeout(saveFile(message_sizes_label[message_sizes_index], message_rates[message_rates_index]), 10000);

            //window.csvData = [];
            message_sizes_index = message_sizes_index + 1;
            interval = interval + 15000;
            //console.log("interval: "+interval);
            //

            if (message_sizes_index == message_sizes_length) {
                message_rates_index = message_rates_index + 1;
                message_sizes_index = 0;

            }


            if (i == (message_rates_length * message_sizes_length * 1000)) {
                dataType = "Flag";
                var thxMessage = "Experiment Ended !!. Thank you !! Please close the browser tab";
                peer_list[0].send(JSON.stringify({ dataType, thxMessage, 'remoteID': connectedPeerID }))
                    //clearInterval(myInterval);
            }
        }

        clearInterval(myInterval);

        if (i < (message_rates_length * message_sizes_length * 1000)) {
            myInterval = setInterval(send_message, interval);
        }

    }


}



function receiveDataFromPeer(message) {
    var parsedMessage = JSON.parse(message);
    window.csvData.push(parsedMessage.remoteID + ':' + parsedMessage.payload + '_ _ _' + new Date().getTime());
}


function Savedelay(s, r) {
    var saveInterval = setInterval(function() {
        saveFile(s, r);
        clearInterval(saveInterval);
    }, 10000);
}


function saveFile(sizes, rates) {
    console.log("Sizes: " + sizes);
    var csvData = window.csvData;
    var csvContent = "data:text/csv;charset=utf-8," + csvData.join("\n"),
        encodedUri = encodeURI(csvContent),
        link = document.createElement("a"),
        timeStamp = (new Date()).toString().split("GMT")[0];
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", sizes + '_' + rates + '_' + 'csv_export' + "-" + timeStamp + ".csv");
    link.click();
    window.csvData = [];
}

// special delay function than returns a promise which is "thennable"
function wait(duration) {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve();
        }, duration)
    });
}