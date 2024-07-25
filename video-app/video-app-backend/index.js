const fs = require('fs'); //the file system
const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const path = require('path');

const socketio = require('socket.io');

const app = express();

app.use(cors()); //this will open our Express API to ANY domain

app.use(express.static('public'));

app.set('view engine', 'ejs');
app.set('views', './views');

const bodyParser = require('body-parser');
app.use(bodyParser.json()); //this will allow us to parse json in the body with the body parser
app.use(bodyParser.urlencoded({ extended: true }));

const server = http.createServer({}, app);

const io = socketio(server, {
    cors: {
      origin: '*',
    }
});

server.listen(8080, function() {
    console.log("Server is running on Port 8080");
});

const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}/${process.env.MONGO_DB}?authSource=droneDB`;
console.log(mongoURI);
mongoose.connect(mongoURI) 
    .then(() => {
        console.log("Connection Open");
    })
    .catch(error => console.log(error));

const Drone = require('./models/droneModel');

const jwt = require('jsonwebtoken');

// Drone Validation
app.post('/validate-drone', async (req, res) => {
    const { droneID, password } = req.body;
    console.log(droneID, password);
    try {
        const drone = await Drone.findOne({ droneID, password });
        console.log(drone);
	if (drone != null) { 
	    const token = jwt.sign({
		droneID  
	    },
            'this is dummy text', // secret key
            {
                expiresIn: "5h"
	    }
	    );
            console.log("token: " + token);
            res.status(200).json({ 
                success: true,
                token: token
	    });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// User Authentication
app.post('/auth-user', (req, res) => {
    try {
	const jwtToken = req.headers['authorization'].split(" ")[1];
        console.log("jwtToken: " + jwtToken);
	const verify = jwt.verify(jwtToken, 'this is dummy text');

	res.status(200).json({
           message: "Valid Token"
        });
    }
    catch(error) {
        res.status(401).json({
            message: "Invalid Token"
	});
    }
});

app.get('/fetch-drones', async (req,res) => {
    try{
        const drones = await Drone.find();
	res.status(200).json({
	    drones: drones
	});
    }
    catch(error){
        res.status(500).json(error);
    }
});

app.post('/add-drone', async (req,res) => {
    const { droneID , password } = req.body;
    try{
        const existingDrone = await Drone.findOne({ droneID });
        if(existingDrone) {
            res.status(409).send({ error: 'droneID already exists' });
        }
        else {
            const newDrone = new Drone({ droneID, password });
            await newDrone.save();

            res.status(201).send({ message: 'Drone added successfully' });
	}
    }
    catch(error){
        res.status(500).json(error);
    }
});

app.post('/delete-drone', async (req,res) => {
    const { droneID } = req.body;
    try{
        const drone = await Drone.findOne({ droneID });
        if (!drone) {
            res.status(404).json({ message: 'DroneID not found' });
        }
	else {
            await Drone.deleteOne({ droneID });

            res.status(200).json({ message: 'DroneID and Password deleted successfully' });
	}
    }
    catch(error){
        res.status(500).json(error);
    }
});

// socket io work
var userConnection = [];

io.on("connection", (socket) => {
    console.log("A user connected with id: ", socket.id);
    
    socket.on("user_info_to_signaling_server", (data) => {
        var other_users = userConnection.filter(p => p.droneID === data.droneID);
        
	var host;
        other_users.forEach(other_user => {
            if(other_user.isHost === 'true') { // Host
                host = other_user;
            }
        });

	if((host !== undefined) && (data.isHost === 'true')) {
            socket.emit('host_already_exists');
            return;
        }

        userConnection.push({
            connectionId: socket.id,
            droneID: data.droneID,
            isHost: data.isHost
        });

        console.log(`all users ${userConnection.map(a => a.connectionId)}`);
        console.log(`other users ${other_users.map(a => a.connectionId)}`);

        if(host !== undefined) {
            socket.to(host.connectionId).emit('host_to_inform', {
                connId: socket.id,
            });
        }
        
        if(data.isHost === 'false')
            socket.emit('new_connection_information', host);
    });

    socket.on('sdpProcess', (data) => {
        socket.to(data.to_connid).emit('sdpProcess', {
            message: data.message,
            from_connid: socket.id
        });
    });

    socket.on('disconnect', function() {
        var disUser = userConnection.find(p => p.connectionId == socket.id);

        userConnection = userConnection.filter(p => p.connectionId != socket.id);

        if(disUser && (disUser.isHost === 'true')) {
            var other_users = userConnection.filter(p => p.droneID === disUser.droneID);
            other_users.forEach(other_user => {
                socket.to(other_user.connectionId).emit('host_left_info');
            });
        }
        
        if(disUser && (disUser.isHost === 'false')) {
            var other_users = userConnection.filter(p => p.droneID === disUser.droneID);
            
            var host;
            other_users.forEach(other_user => {
                if(other_user.isHost === 'true')
                    host = other_user;
            });

            if(host !== undefined)
                socket.to(host.connectionId).emit('other_user_left_info', socket.id);
        }
    });
})
