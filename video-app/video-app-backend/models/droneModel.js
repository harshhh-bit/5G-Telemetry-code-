const mongoose = require('mongoose');

const droneSchema = new mongoose.Schema({
    droneID: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
});

const Drone = mongoose.model('Drone', droneSchema);
module.exports = Drone;
