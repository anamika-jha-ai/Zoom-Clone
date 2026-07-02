import React, { useRef, useState, useEffect } from "react";
import io, { connect } from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
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

    const videoRef = useRef([]);

    let [videos, setVideos] = useState();


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

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then((getUserMediaSucess) => { })//TODO GET USERMEDIA SUCESS
                .then((stream) => { })
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

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [audio, video]);

    //TODO
    let gotMessageFromServer = (fromId, message) => {

    }

    //TODO 
    let addMessage = () => {

    }

    const connectToSocketServer = () => {
        socketRef.current = io(server_url, { secure: false });
        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on("connect", () => {
            socketRef.current.emit("join-call", window.location.href);

            socketIdRef.current = socketRef.current.id;

            socketRef.current.on("chat-message", addMessage);

            socketRef.current.on("user-left", (id) => {
                setVideo((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on("user-joined", (id, clients) => {
                clients.forEach((socketListId) => {
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnection);
                    connections[socketListId].onicecandidate = (event) => { // ICE is a protocol its name is interactive connectivity establishment this whole code is to establish connection btw two
                        if (event.candidate !== null) {
                            socketRef.current.email("signal", socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    connections[socketListId].onaddstream = (event) => {

                        // "..." is a spread operater in JS used when we don't want to push 
                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);
                        if (videoExists) {
                            setVideo(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            })
                        }else{
                            let newVideo = {
                                socketId : socketListId,
                                stream: event.stream,
                                autoPlay: true,
                                playsinline: true

                            }
                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }



                    };
                    //Object with window keyword can be accsessed anywhere even in browser console window
                    if(window.localStream !== undefined && window.localStream !== null){
                        connections[socketListId].addStream(window.localStream);
                    }else{
                        //TODO BLACKSILENCE
                    }
                })

                //offer letter
                if(id === socketIdRef.current){
                    for(let id2 in connections){
                        if(id2===socketIdRef.current) continue

                        try{
                            connections[id2].addStream(window.localStream)
                        }catch(e){

                        }
                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                            .then(()=>{
                                socketRef.current.emit("signal", id2, JSON.stringify({"sdp": connections[id2].setLocalDescription})) //sdp means session description
                            })
                            .catch(e => console.log(e))
                        })
                    }
                }
            })
        });
    };
    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }

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


                    </div> : <></>
            }
        </div>
    )
}