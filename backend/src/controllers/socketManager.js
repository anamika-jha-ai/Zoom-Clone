import { Server } from "socket.io";

let connections = {} // Stores meeting rooms and their connected socket ids
let messages = {} //Stores chat history.
let timeOnline = {} //Stores join time,used in call time calculation but does not stores in db or anything

export const connectToSocket = (server) => { //Receives Express HTTP server.

    //NOT IN PRODUCTION, FOR TESTING PURPOSES ONLY
    //used to connect to the socket and listen for events, merging scoket to the server, and allowing cross-origin requests from any domain
    const io = new Server(server, { //Attaches Socket.IO to Express server.
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowHeaders: ["my-custom-header"],
            credentials: true
        }
    }); //Now Socket.IO can listen for connections.

    //event liseteners whenever a client connects to the socket
    io.on("connection", (socket) => {

        socket.on("join-call", (path) => { //path = room name
            // Handle join-call event

            if (connections[path] == undefined) { //Create room if doesn't exist
                connections[path] = [];
            }
            connections[path].push(socket.id);


            timeOnline[socket.id] = Date.now();

            //Chat History Logic
            //Loop through users in room.
            if (messages[path]) {
                for (let a = 0; a < messages[path].length; a++) {
                    io.to(socket.id).emit(
                        "chat-message",
                        messages[path][a].data,
                        messages[path][a].sender,
                        messages[path][a]["socket-id-sender"]
                    );
                }
            }
        });


        //Video/audio doesn't go through your server. It uses:
        // WebRTC But WebRTC first needs help finding peers.
        // This process is called: Signaling

        socket.on("signal", (toId, signalData) => {
            // Handle signal event ,This is WebRTC signaling.
            io.to(toId).emit("signal", socket.id, signalData); //Send signal data to the intended recipient.
        });




        socket.on("chat-message", (message) => {
            // Handle message event,Runs whenever someone sends chat.
            const [matchingRoom, found] = Object.entries(connections)//is just finding:Which room contains this socket.id?
                .reduce(([rom, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }

                    return [room, isFound];
                }, [null, false]);
            if (found == true) {
                if (messages[matchingRoom] == undefined) {
                    messages[matchingRoom] = [];
                }
                messages[matchingRoom].push({ data: message, sender: socket.id, "socket-id-sender": socket.id });
            }
        });


        socket.on("disconnect", () => {
            // Handle disconnect event
            //Runs automatically when:Browser closes,Internet disconnects,User leaves meeting
            var diffTime = Math.abs(timeOnline[socket.id] - new Date());
            var key
            //Find Room
            for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
                for (let a = 0; a < v.length; a++) {
                    if (v[a] == socket.id) {
                        key = k
                        for (let a = 0; a < connections[k].length; a++) {
                            //Notify Everyone When leaving:
                            io.to(connections[k][a]).emit("chat-message", "User left the meeting", "System", socket.id)
                        }

                        //Remove User ,Find index:
                        var index = connections[k].indexOf(socket.id);
                        connections[k].splice(index, 1);
                    }

                    //Delete Empty Room
                    if (connections[k].length == 0) {
                        delete connections[k]
                        delete messages[k]
                    }
                }
            }
        });


    });

    return io;
}

// export default connectToSocket;

// User opens meeting
//         │
//         ▼
// Socket connects
//         │
//         ▼
// connection
//         │
//         ▼
// join-call
//         │
//         ▼
// Added to room
//         │
//         ▼
// signal
//         │
//         ▼
// WebRTC peer connection
//         │
//         ▼
// Video + Audio starts
//         │
//         ▼
// message
//         │
//         ▼
// Chat works
//         │
//         ▼
// disconnect
//         │
//         ▼
// User leaves meeting