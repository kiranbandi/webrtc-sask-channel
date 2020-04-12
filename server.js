const io = require('socket.io')() // create a socket.io server
var signalServer = require('simple-signal-server')(io)
var shortid = require('shortid')

var saskChannel = [],
    isHubAvailable = false,
    hubPeerID = '';

// List to discovery messages from peers or the hub 
signalServer.on('discover', (request) => {

    const custom_message = request.discoveryData;
    // currentID is a custom ID set by us for every peer who joins the channel 
    let currentID = shortid.generate();

    // If hub joins the channel then we set its details and 
    // give it the details of all the peers it should link up with
    if (custom_message == 'hub-join') {
        isHubAvailable = true;
        hubPeerID = request.socket.id;
        request.discover(hubPeerID, { peers: [...saskChannel] });
        console.log('hub joined channel');
    }
    // If hub is leaving we clear the channel and tell every connected peer to disconnect
    else if (custom_message == 'hub-left') {
        isHubAvailable = false;
        hubPeerID = '';
        saskChannel = [];
        console.log('hub left , clearing channel');
    }
    // If a peer wants to join the network
    else if (custom_message == 'peer-join') {
        // let all the other peers know that a new peer has joined the channel 
        saskChannel.forEach((peer) => {
            request.forward(peer.peerID, {
                'message': 'peer-join',
                'peerInfo': currentID
            })
        });
        //  If the HUB has joined the channel then pass his info on so peer will link up with hub
        if (isHubAvailable) {
            console.log(currentID, 'joined channel');
            request.discover(request.socket.id, {
                'message': 'discovery',
                currentID,
                hubPeerID,
                peerList: [...saskChannel],
                hubReady: true
            });
        }
        // if HUB isnt ready yet peer is told to wait
        // and peers' info is added to the channel list which will be sent to hub once it joins
        else {
            console.log(currentID, 'wants to join channel but hub not ready');
            request.discover(request.socket.id, {
                'message': 'discovery',
                hubReady: false,
                currentID,
                peerList: [...saskChannel],
            });
        }
        // add new peer to channel list
        saskChannel.push({ peerID: request.socket.id, customID: currentID });
    }
    // if peer was already in a room
    // get the peer's ID from the message and let all peers know and remove it from channel
    else if (custom_message.indexOf('leave') > -1) {
        let leaveID = custom_message.split('-')[1];
        console.log(leaveID, 'left channel');
        // Inform the HUB to remove it from the channel store or the waiting channel wherever his info is
        saskChannel = saskChannel.filter((peer) => peer.customID == leaveID);
        // let all the other peers know that a new peer has joined the channel 
        saskChannel.forEach((peer) => {
            request.discover(peer.peerID, {
                'message': 'peer-left',
                'peerInfo': currentID
            })
        });
    }
})


io.listen(8082)