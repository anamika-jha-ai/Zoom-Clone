import React, { useRef, useState, useEffect } from "react";
// import io from "socket.io-client";
// import { Badge, IconButton, TextField } from '@mui/material';
// import { Button } from '@mui/material';
// import VideocamIcon from '@mui/icons-material/Videocam';
// import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.css";
// import CallEndIcon from '@mui/icons-material/CallEnd'
// import MicIcon from '@mui/icons-material/Mic'
// import MicOffIcon from '@mui/icons-material/MicOff'
// import ScreenShareIcon from '@mui/icons-material/ScreenShare';
// import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
// import ChatIcon from '@mui/icons-material/Chat'
// import server from '../environment';

const server_url = "http://localhost:8000";

var connections = {}

const peerConfigConnection = {
    "iceServers": [
        { "urls": "stun:sturn.l.google.com:19302" }
    ]
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
    let[newMessages , setNewMessages] = useState(3);
    let[askForUsername , setAskForUsername] = useState(true);//for guest users
    let[userName , setUserName] = useState("");
    
    const videoRef = useRef([]);

    let[videos , setVideos] = useState();


    // TO DO LATER 
    //if(isChrome() === false){
    //}




    return (
        <div> 
            {
                askForUsername ===true?
                <div>

                </div> : <></>
            }
        </div>
    )
}