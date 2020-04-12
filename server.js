const io = require('socket.io')() // create a socket.io server
var shortid = require('shortid');
var SimpleSignalServer = require('simple-signal-server');
var signal = new SimpleSignalServer(io);

signal.on('discover', (request) => {
    // bounce back discovery messages
    request.discover(request.socket.id, {});
});


var saskChannel = [],
    isHubAvailable = false,
    hubPeerID = '';

io.on('connection', function(socket) {
    // If hub joins the channel then we set its details and 
    // give it the details of all the peers it should link up with
    socket.on('hub-join', function(msg) {
        isHubAvailable = true;
        hubPeerID = socket.id;
        socket.emit('notify', { peers: [...saskChannel] });
        console.log('hub joined channel', hubPeerID);
        socket.broadcast.emit('hub-ready');
    });
    // If hub is leaving we clear the channel and tell every connected peer to disconnect
    socket.on('hub-left', function(msg) {
        isHubAvailable = false;
        hubPeerID = '';
        saskChannel = [];
        console.log('hub left so clearing channel');
        socket.broadcast.emit('hub-left');
    });
    // If a peer wants to join the network
    socket.on('peer-join', function(msg) {
        let customID = shortid.generate();
        // let everyone else know that a new peer has joined the channel 
        socket.broadcast.emit('peer-join', customID);
        console.log(customID, 'joined channel');
        //  If the HUB has joined the channel then pass his info on so peer will link up with hub
        if (isHubAvailable) {
            socket.emit('notify', {
                customID,
                hubPeerID,
                peerList: [...saskChannel],
                hubReady: true
            });
        }
        // if HUB isnt ready yet peer is told to wait
        else {
            socket.emit('notify', {
                hubReady: false,
                customID,
                peerList: [...saskChannel],
            });
        }
        // add new peer to channel list
        saskChannel.push({ peerID: socket.id, customID });
    });

    socket.on('peer-left', function(peerCustomID) {
        console.log(peerCustomID, 'left channel');
        // remove it from the channel store
        saskChannel = saskChannel.filter((peer) => peer.customID != peerCustomID);
        // let all the other peers know that a new peer has joined the channel 
        socket.broadcast.emit('peer-left', peerCustomID);
    });
});


io.listen(8082)