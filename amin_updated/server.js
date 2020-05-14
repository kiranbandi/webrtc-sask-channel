const io = require('socket.io')() // create a socket.io server
var shortid = require('shortid');
var SimpleSignalServer = require('simple-signal-server');
var signal = new SimpleSignalServer(io);

const fs = require('fs');
var First_ID;
var filename;

signal.on('discover', (request) => {
	
	const custom_message = request.discoveryData;
	//console.log("custom_message:"+custom_message);
	//console.log("AAA");
	if(custom_message.indexOf('initiatorFlag') > -1){
		console.log("initiator flag");
		
		let customID = shortid.generate();
		First_ID = customID;
		var message_rates = [0, 5, 10, 20, 40];
		var message_rates_length = message_rates.length;
		console.log(message_rates_length);
		var message_rates_index = 0;
				
				
		var message_sizes = ["_11111111111111111111111111111111111111111111111111", "_1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111", "_111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111", "_111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111", "_11111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111", "_111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111"];
		var message_sizes_label = ["50bytes", "100bytes", "150bytes", "300bytes", "500bytes", "1kbyte"];
		var message_sizes_index = 0;
		var message_sizes_length = message_sizes.length;
		console.log(message_sizes_length);		
		
		var interval = message_rates[message_rates_index];
		
		//var interval = 100;
		var interval_flag = 0;
		var i=0;
		var timeStamp1 = (new Date()).toString().split("GMT")[0];
		Filename = message_sizes_label[message_sizes_index].concat('_', message_rates[message_rates_index], 'ms_', new Date(). getMonth(), '_', new Date().getDate(), '_', new Date().getHours(), '_', new Date().getMinutes(), '_', new Date().getSeconds(), '.txt');
		console.log("filename:"+Filename);
		
		fs.appendFile(Filename, request.socket.handshake.address +' Time: ', (err) => {
			if(err) throw err;
		});
		fs.appendFile(Filename, (new Date()).toString()+'\n', (err) => {
			if(err) throw err;
		});
		
		var myInterval = setInterval(send_message, interval);
		function send_message(){
			
			if(interval_flag == 1){
				Filename = message_sizes_label[message_sizes_index].concat('_', message_rates[message_rates_index], 'ms_', new Date().getMonth(), '_' , new Date().getDate(), '_', new Date().getHours(), '_', new Date().getMinutes(), '_', new Date().getSeconds(), '.txt');
				interval_flag = 0;
			}
			var messageToBeSent = i + message_sizes[message_sizes_index];
			interval = message_rates[message_rates_index];
			console.log(interval);			
			
			//var messageToBeSent = i + "_11111";
			request.discover(request.socket.id, {customID, flag:'SendFromServer', msg:messageToBeSent});
			var save_sent = 'Server: '+ messageToBeSent + '_' + new Date().getTime() + '_' + message_sizes_label[message_sizes_index] + '_' + message_rates[message_rates_index] + '\n';
			//fs.appendFile('datafile.txt', save_sent, (err) => {
			fs.appendFile(Filename, save_sent, (err) => {
				if(err) throw err;
			});
			
			
			
			i +=1;
			console.log(i);
			if((i%1000)==0){
				message_sizes_index = message_sizes_index + 1;
				interval = interval + 20000;
				interval_flag = 1;
				//Filename = message_sizes_label[message_sizes_index].concat('_', message_rates[message_rates_index], 'ms_', new Date(). getMonth(), '_', new Date().getDate(), '_', new Date().getHours(), '_', new Date().getMinutes(), '_', new Date().getSeconds(), '.txt');

				if(message_sizes_index == message_sizes_length){
					message_rates_index = message_rates_index + 1;
					message_sizes_index = 0;
					
					//test_file = message_sizes_label[message_sizes_index] + message_rates[message_rates_index]
									
				}				
				
			}
			
			clearInterval(myInterval);
			//if(i<(message_rates_length*message_sizes_length*1000)){
			if(i<5000){
				myInterval = setInterval(send_message, interval);
			
			}
			
		}
			
	}
	if(custom_message.indexOf('returnToServer') > -1){
		let incoming_message = custom_message.split('-')[1];
		var save_return = First_ID + '_' + incoming_message + '_ _ _' + new Date().getTime() + '\n';
		fs.appendFile(Filename, save_return, (err) => {
			if(err) throw err;
		});
		
		console.log("retuned message: " + incoming_message);
		
		
	}
	
    // bounce back discovery messages
    request.discover(request.socket.id, {});
	//console.log(request.socket.handshake.address);
	
	/*
	fs.appendFile('IP_LIST.txt', request.socket.handshake.address +' Time: ', (err) => {
		if(err) throw err;
	});
	fs.appendFile('IP_LIST.txt', (new Date()).toString()+'\n', (err) => {
		if(err) throw err;
	});
	*/
	
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