# WEBRTC Sask Channel (Star Topolgy)

Run the following command to install all the required dependencies from the root path containing the package.json file, this is a one time process.

``` npm install```


To get the project running, first start the backend signaling server using the command below 

``` npm run signal_server```


Then start the hub server, this is a web server for the **Hub UI** which receives and relays messages to all connected peers through webrtc.

``` npm run start_hub```

Then open the **Hub UI**, by opening this link only once [https://localhost:8084](https://localhost:8084) in Chrome preferably.


Finally start the **Peer UI** web server using the command below and then it should be live at [https://localhost:8083](https://localhost:8083/)

``` npm run start```

For now we have implemented real time mouse tracking, drawing and chatting.
Try opening the Peer UI link in multiple tabs and then moving the mouse around. 
You should see the mouse movements being tracked and replicated on screen for all the users.

The servers run on ports **8082**, **8083** and **8084** so make sure these are free
