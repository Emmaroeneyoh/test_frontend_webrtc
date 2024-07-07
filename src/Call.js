import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";

const socket = io("https://webrtcback-9144f1cb0f93.herokuapp.com"); // Replace with your server URL
// const socket = io("http://localhost:5000"); // Replace with your server URL

function Call() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

    useEffect(() => {
      console.log('socket worked')
    // Get user media (audio only for this example)
    socket.emit("join");
    socket.on("user-connected", (data) => {
      console.log("user joined", data);
    });
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false})
      .then((stream) => {
        console.log("stream", stream);
        setLocalStream(stream);
        console.log("local stream", localStream);
        localVideoRef.current.srcObject = stream;

        // // Listen for signaling messages from server
        socket.on("message", (message) => {
          if (message.type === "offer" && !peerRef.current) {
            console.log("offer", message);
            const newPeer = new SimplePeer({
              initiator: false,
              trickle: false,
            });
            // setPeer(newPeer);
            peerRef.current = newPeer;

            //     // Set remote description and answer
            newPeer.signal(message.sdp);
            console.log("signal peered");
            newPeer.on("signal", (answer) => {
              console.log("signal answered");
              socket.emit("message", {
                type: "answer",
                sdp: answer,
                friendroomId: "yourRoomId",
              });
              console.log("answer emitted");
            });

            //     // Handle incoming stream
            newPeer.on("stream", (remoteStream) => {
              setRemoteStream(remoteStream);
              remoteVideoRef.current.srcObject = remoteStream;
            });
          } else if (message.type === "answer" && peerRef) {
            console.log("answer", message);
            peerRef.current.signal(message.sdp);
          } else if (message.type === "candidate" && peerRef) {
            peerRef.current.signal(message.candidate);
          }
        });
      })
      .catch((error) => console.error("Error accessing media devices:", error));

    // Clean up on component unmount
    // return () => {
    //   socket.disconnect();
    //   if (peer) peer.destroy();
    //   if (localStream) localStream.getTracks().forEach(track => track.stop());
    // };
  }, []);

  // Function to start a call
  const startCall = () => {
    console.log("start calling");
    const newPeer = new SimplePeer({ initiator: true, trickle: false });
    console.log("newpeeer", newPeer);
    setPeer(newPeer);
    peerRef.current = newPeer;

    if (!peer) {
      console.log("peer not defined");
    }
    console.log("this is peeer", peer, "peerref :", peerRef.current);

    // Send signaling message for offer
    newPeer.on("signal", (offer) => {
      socket.emit("message", {
        type: "offer",
        sdp: offer,
        friendroomId: "yourRoomId",
      });
    });

    // Handle incoming stream
    newPeer.on("stream", (remoteStream) => {
      setRemoteStream(remoteStream);
      remoteVideoRef.current.srcObject = remoteStream;
    });

    // Add local stream to peer connection
    if (localStream) {
      newPeer.addStream(localStream);
      localVideoRef.current.srcObject = localStream;
    }
  };

  return (
    <div className="App">
      <h1>WebRTC Audio Call</h1>
      <div className="video-container">
        <div className="local-video">
          <h1>me</h1>
          <video ref={localVideoRef} autoPlay playsInline muted></video>
        </div>
        <div className="remote-video">
          <h1>visitor</h1>
          <video ref={remoteVideoRef} autoPlay playsInline></video>
        </div>
      </div>
      <button onClick={startCall}>Start Call</button>
    </div>
  );
}

export default Call;
