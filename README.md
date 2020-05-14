# WEBRTC Sask Channel (Study)

Run the following command to install all the required dependencies from the root path containing the package.json file, this is a one time process.

``` npm install```

To get the project running, first start the backend server using the command below 

``` npm run server```

This will also start the **Hub Server** which receives and relays messages to all connected peers through webrtc.

Then start the **Peer UI** web server using the command below and then it should be live at [https://localhost:8083/ui/](https://localhost:8083/ui/)

``` npm run start```

The servers run on ports **8082**, **8083** so make sure these are free
