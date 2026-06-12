import express from 'express';
import{createServer} from "node:http";

import {Server} from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);

import { connectToSocket } from "./controllers/socketManager.js";
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use("/api/v1/users", userRoutes);


app.get("/", (req,res) =>{

    res.send("Hello World!!!");
});

const start = async () => {
    const connectionDb = await mongoose.connect("mongodb+srv://aajhaa2022_db_user:anamikajha@cluster0.nnvtmm9.mongodb.net/");
    server.listen(app.get("port"), () => {
        console.log("Server is running on port " + app.get("port"));
    });
}
start();
