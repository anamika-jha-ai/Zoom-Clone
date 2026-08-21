import React, { useRef, useState, useEffect } from "react";
import io, { connect } from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.module.css";
import { CallEnd } from '@mui/icons-material'
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat'


// import server from '../environment';

const server_url = "http://localhost:8000";

var connections = {}

const peerConfigConnection = {
    "iceServers": [
        { urls: "stun:stun.l.google.com:19302" }]
}



export default function VideoMeetComponent() {
    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoRef = useRef();
    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [video, setVideo] = useState();
    let [audio, setAudio] = useState();
    let [screen, setScreen] = useState();
    let [showModal, setModal] = useState(true);
    let [screenAvailable, setScreenAvailable] = useState();
    let [messages, setMessages] = useState([]);
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(3);
    let [askForUsername, setAskForUsername] = useState(true);//for guest users
    let [userName, setUserName] = useState("");
    let [participantNames, setParticipantNames] = useState({});

    const videoRef = useRef([]);

    let [videos, setVideos] = useState([]);


    // TO DO LATER 
    //if(isChrome() === false){
    //}

    const getPermission = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
            } else {
                setVideoAvailable(false);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
            } else {
                setAudioAvailable(false);
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }
            let userMediaStream;
            if (videoAvailable || audioAvailable) {
                userMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            }
            if (userMediaStream) {
                window.localStream = userMediaStream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = userMediaStream;
                }
            }
        }
        catch {

        }
    }

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
            console.log("SET STATE HAS ", video, audio);

        }


    }, [video, audio])


    let getMedia = () => {

        setAskForUsername(false);

        console.log("1. getMedia called");

        setVideo(videoAvailable);
        setAudio(audioAvailable);

        connectToSocketServer();
    }

    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }
    let handleVideo = () => {
        setVideo(!video);
    }
    let handleAudio = () => {
        setAudio(!audio);
    }

    let getDisplayMediaSucess = async (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop());
        } catch (e) {
            console.log(e);
        }

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            stream.getTracks().forEach(track => {
                connections[id].addTrack(track, stream);
            });

            try {
                const offer = await connections[id].createOffer();

                await connections[id].setLocalDescription(offer);

                socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({
                        sdp: connections[id].localDescription
                    })
                );
            } catch (e) {
                console.log("Screen share offer error:", e);
            }
        }

        stream.getVideoTracks()[0].onended = () => {
            setScreen(false);

            getUserMedia();
        };
    };


    let getDisplayMedia = () => {
        if (navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                .then(getDisplayMediaSucess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        }
    }
    // useEffect(() => {
    //     if (video !== undefined && audio !== undefined) {
    //         getUserMedia();
    //     }
    // }, [screen])

    let handleScreen = () => {
        if (!screen) {
            setScreen(true);
            getDisplayMedia();
        } else {
            setScreen(false);
            getUserMedia();
        }
    }

     let handleEndCall = () => {
        try {
            let tracks = localVideoRef.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }
        window.location.href = "/home "
    }

    let getUserMediaSucess = (stream) => {
        // try {
        //     window.localStream.getTracks().forEach(track => track.stop())
        // } catch (e) {
        //     console.log(e);
        // }
        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) continue;
            window.localStream.getTracks().forEach(track => {
                connections[id].addTrack(track, window.localStream);
            });

            // connections[id].addStream(window.localStream)

            // connections[id].createOffer().then((description) => {
            //     connections[id].setLocalDescription(description)
            //         .then(() => {
            //             socketRef.current.emit("signal", id, JSON.stringify({ "sdp": description }))
            //         })
            //         .catch(e => console.log(e))
            // })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false)
            setAudio(false);

            try {
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) {
                console.log(e);
            }
            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;
        })
    }

    let silence = () => {
        let ctx = new AudioContext();
        let oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination()); //dst means destination and oscillator is a sound wave generator

        oscillator.start();
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })

    }
    function black({ width = 640, height = 480 } = {}) {
        const canvas = Object.assign(document.createElement("canvas"), {
            width,
            height,
        });

        canvas.getContext("2d").fillRect(0, 0, width, height);

        const stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    }



    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices
                .getUserMedia({
                    video,
                    audio
                })
                .then(getUserMediaSucess) //TODO GET USERMEDIA SUCESS
                // .then((stream) => { })
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop())
            } catch (e) {

            }
        }
    }

    useEffect(() => {
        getPermission();
    }, []);

    // useEffect(() => {
    //     if (video !== undefined && audio !== undefined) {
    //         getUserMedia();
    //     }
    // }, [audio, video]);

    //TODO
    // let gotMessageFromServer = (fromId, message) => {
    //     var signal = JSON.parse(message);
    //     if (fromId !== socketIdRef.current) {
    //         if (signal.sdp) {
    //             connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
    //                 if (signal.sdp.type === "offer") {
    //                     connections[fromId].createAnswer().then((description) => {
    //                         connections[fromId].setLocalDescription(description).then(() => {
    //                             socketRef.current.emit("signal", fromId, JSON.stringify({ "sdp": description }))
    //                         }).catch(e => console.log(e))
    //                     }).catch(e => console.log(e))
    //                 }
    //             }).catch(e => console.log(e))
    //         }
    //     }
    //     if (signal.ice) {
    //         connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
    //     }
    // }
    let gotMessageFromServer = async (fromId, message) => {
        const signal = JSON.parse(message);

        if (fromId === socketIdRef.current) return;

        const peer = connections[fromId];

        // Peer connection doesn't exist yet
        if (!peer) {
            console.log("No peer connection yet for:", fromId);
            return;
        }

        try {
            if (signal.sdp) {
                await peer.setRemoteDescription(
                    new RTCSessionDescription(signal.sdp)
                );

                if (signal.sdp.type === "offer") {
                    const answer = await peer.createAnswer();

                    await peer.setLocalDescription(answer);

                    socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                            sdp: answer
                        })
                    );
                }
            }

            if (signal.ice) {
                if (peer.remoteDescription) {
                    await peer.addIceCandidate(
                        new RTCIceCandidate(signal.ice)
                    );
                } else {
                    console.log(
                        "ICE skipped because remote description is not ready:",
                        fromId
                    );
                }
            }
        } catch (e) {
            console.error("WebRTC signaling error:", e);
        }
    };

    //TODO -todo
    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };

    const sendMessage = () => {
        console.log("Sending message:", message);

        socketRef.current.emit("chat-message", message, userName);

        setMessage("");
    };

    const connectToSocketServer = () => {
        console.log("2. connectToSocketServer called");
        socketRef.current = io(server_url, { secure: false });
        socketRef.current.on('signal', gotMessageFromServer);
        socketRef.current.on("chat-message", addMessage);

        socketRef.current.on("connect", () => {
            console.log("Socket connected");
            console.log("Socket ID:", socketRef.current.id);

            socketIdRef.current = socketRef.current.id;
            socketRef.current.emit("join-call", window.location.href, userName);

            socketRef.current.on("connect_error", (err) => {
                console.log(err);
            });



            socketRef.current.on("user-left", (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on("user-joined", (id, clients, names = {}) => {

                /////////////
                console.log("========== USER JOINED ==========");
                console.log("Joined ID:", id);
                console.log("Clients:", clients);
                /////////////

                setParticipantNames((currentNames) => ({ ...currentNames, ...names }));


                clients.forEach((socketListId) => {
                    // connections[socketListId] = new RTCPeerConnection(peerConfigConnection);


                    ///////////
                    // Don't create a peer connection with yourself
                    if (socketListId === socketIdRef.current) return;

                    // Don't recreate an existing peer connection
                    if (connections[socketListId]) return;
                    ///////

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnection);

                    connections[socketListId].onicecandidate = (event) => { // ICE is a protocol its name is interactive connectivity establishment this whole code is to establish connection btw two
                        if (event.candidate !== null) {
                            socketRef.current.emit("signal", socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    connections[socketListId].ontrack = (event) => {

                        const remoteStream = event.streams[0];

                        console.log("Remote stream received:", socketListId);
                        console.log(remoteStream);

                        setVideos(prevVideos => {

                            const existingVideo = prevVideos.find(
                                video => video.socketId === socketListId
                            );

                            if (existingVideo) {

                                const updatedVideos = prevVideos.map(video =>
                                    video.socketId === socketListId
                                        ? {
                                            ...video,
                                            stream: remoteStream
                                        }
                                        : video
                                );

                                videoRef.current = updatedVideos;

                                return updatedVideos;
                            }

                            const newVideo = {
                                socketId: socketListId,
                                userName: names[socketListId] || socketListId,
                                stream: remoteStream,
                                autoPlay: true,
                                playsInline: true
                            };

                            const updatedVideos = [...prevVideos, newVideo];

                            videoRef.current = updatedVideos;

                            return updatedVideos;
                        });
                    };
                    //Object with window keyword can be accsessed anywhere even in browser console window
                    if (window.localStream) {
                        window.localStream.getTracks().forEach(track => {
                            connections[socketListId].addTrack(track, window.localStream);
                        });
                    } else {
                        let blackSilence = (...args) => new MediaStream([
                            black(...args),
                            silence()
                        ]);

                        window.localStream = blackSilence();

                        window.localStream.getTracks().forEach(track => {
                            connections[socketListId].addTrack(track, window.localStream);
                        });
                    }
                })

                //offer letter
                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        // try {
                        //     window.localStream.getTracks().forEach(track => {
                        //         connections[id2].addTrack(track, window.localStream);
                        //     });
                        // } catch (e) {

                        // }
                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit("signal", id2, JSON.stringify({ "sdp": description })) //sdp means session description
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        });
    };


    return (
        <div>
            {
                askForUsername === true ?
                    <div>
                        <h2>Enter into lobby</h2>
                        <TextField
                            id="outlined-basic"
                            label="Username"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            variant="outlined"
                        />
                        <Button
                            variant="contained"
                            onClick={getMedia}
                        >
                            Connect
                        </Button>
                        <div>
                            <video ref={localVideoRef} autoPlay muted></video>
                        </div>



                    </div> :
                    <div className={styles.meetVideoContainer}>
                        {showModal ? <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <h1>Chat</h1>

                                <div className={styles.chattingDisplay}>

                                    {messages.length !== 0 ? messages.map((item, index) => {

                                        console.log(messages)
                                        return (
                                            <div style={{ marginBottom: "20px" }} key={index}>
                                                <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                                                
                                                <p>{item.data}</p>
                                            </div>
                                        )
                                    }) : <p>No Messages Yet</p>}


                                </div>

                                <div className={styles.chattingArea}>
                                    <TextField
                                        id="outlined-basic"
                                        label="Message"
                                        variant="outlined"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    />
                                    <Button variant='contained' onClick={sendMessage}>
                                        Send
                                    </Button>
                                </div>
                            </div>
                        </div> : <></>}

                        <div className={styles.buttonContainers}>
                            <IconButton onClick={handleVideo} style={{ color: "white" }}>
                                {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                            </IconButton>
                            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                                <CallEndIcon />
                            </IconButton>
                            <IconButton onClick={handleAudio} style={{ color: "white" }}>
                                {audio === true ? <MicIcon></MicIcon> : <MicOffIcon></MicOffIcon>}
                            </IconButton>
                            {screenAvailable === true ?
                                <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                    {screen === true ?  <ScreenShareIcon></ScreenShareIcon> : <StopScreenShareIcon></StopScreenShareIcon> }
                                </IconButton>
                                : null
                            }
                            <Badge badgeContent={newMessages} color="secondary">
                                <IconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}>
                                    <ChatIcon></ChatIcon>
                                </IconButton>
                            </Badge>

                        </div>
                        <div className={styles.localVideoContainer}>
                            <h2>{userName}</h2>
                            <video className={styles.meetUserVideo} ref={localVideoRef} autoPlay muted></video>
                        </div>
                        <div className={styles.conferenceView}>
                            {videos.map((video) => (
                                <div key={video.socketId}>
                                    <h2>{video.userName || participantNames[video.socketId] || video.socketId}</h2>
                                    <video
                                        data-socket={video.socketId}
                                        ref={ref => {
                                            if (ref && video.stream) {
                                                ref.srcObject = video.stream;
                                            }
                                        }}
                                        autoPlay
                                        playsInline
                                    />


                                </div>

                            ))}
                        </div>

                    </div>
            }
        </div >
    )
}