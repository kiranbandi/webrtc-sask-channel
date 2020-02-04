const io = require('socket.io')() // create a socket.io server
var SimpleSignalServer = require('simple-signal-server')
var shortid = require('shortid')
var signal = new SimpleSignalServer(io)

var saskChannel = [];

// when a peer starts, it will request a list of all peers 
signal.on('discover', (request) => {
    const custom_message = request.discoveryData;
    // the currentID is a custom ID set by us 
    // in future it can also be set by the person joining the channel
    let currentID = shortid.generate();
    // Peer is initiating a new request and wants a list of all peers
    if (custom_message == 'join') {
        console.log(currentID, 'joined channel');
        request.discover(request.socket.id, { currentID, peers: [...saskChannel] });
        // add peer to channel
        saskChannel.push({ peerID: request.socket.id, customID: currentID });
    } else if (custom_message.indexOf('leave') > -1) {
        // if peer was already in a room
        // get the peer's ID from the message and remove it from channel
        let leaveID = custom_message.split('-')[1];
        console.log(leaveID, 'left channel');
        // remove peer from channel
        saskChannel = saskChannel.filter((peer) => peer.customID == leaveID);
    }
})

io.listen(8082)