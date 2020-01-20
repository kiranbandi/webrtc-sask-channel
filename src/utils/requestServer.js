import toastr from './toastr';
import axios from 'axios';
import endPoints from './endPoints';
import _ from 'lodash';

var requestServer = {};

requestServer.requestLogin = function(googleResponse) {
    return new Promise((resolve, reject) => {

        // Call the API , if successfull resolve with data else reject promise
        axios.post(endPoints.firstendpoint)
            .then((response) => {
                toastr["success"]("Call Successful");
                resolve(response.data);
            })
            .catch((err) => errorCallback(err, reject));
    });
}


function errorCallback(error, reject) {
    if (error.response && error.response.data) {
        if (error.response.data.message) {
            toastr["error"](error.response.data.message, "ERROR");
        } else {
            toastr["error"](error.response.data, "ERROR");
        }
    } else {
        toastr["error"]("Error connecting to the server", "ERROR");
    }
    reject();
}

module.exports = requestServer;