# WEBRTC Sask Channel (Mesh Topology)

First run the following command to install all the required dependencies from the root path containing the package.json file.
``` npm install```

Then start the backend signalling server using the command below
``` npm run signal_server```

Finally start the UI server using the command below and then it should be live [here](https://localhost:8083/)
``` npm run start```

For now we have implemented mouse tracking but there will be more updates in future.
Try opening the localhost link in multiple tabs and then moving the mouse around. You should see the mouse movements being tracked and replicated on screen for all the users.
