// create file structure
1. Install apache
2. clone this repo in the directory /var/www
3. go to /var/www/video-app/video-app-backend
4. Install node and nodemon
5. run the cmd npm install

// Set up mongodb
1. Install mongodb using docker (refer chatgpt)
2. Enter the running MongoDB container:
   docker exec -it mongodb bash
3. Start the MongoDB shell:
   mongosh
4. To create a database named "droneDB", run the cmd use droneDB
5. Insertion
   > db.drones.insertOne({ droneID: "1", password: "123" });
   > db.drones.insert([{ droneID: "2", password: "123" }, { droneID: "3", password: "123"}]); // can pass just an object as well
6. Find
   > db.drones.find()


