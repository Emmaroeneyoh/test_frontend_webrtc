import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";

// const socket = io("http://localhost:5000"); // Replace with your server URL
const socket = io("https://webrtccalltest-fce07ae94d2f.herokuapp.com/"); // Replace with your server URL

function Call() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [visitor, setvisitor] = useState("");
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    console.log("socket worked");
    // Get user media (audio only for this example)
    const calldata = { roomid: "123456" };
    socket.emit("join", calldata);
    socket.on("user-connected", (data) => {
      setvisitor("client has joined");
      console.log("user joined", data);
    });
    navigator.mediaDevices
      .getUserMedia({ audio: true  })
      .then((stream) => {
        console.log("stream", stream);
        setLocalStream(stream);
        localVideoRef.current.srcObject = stream;

        // Listen for signaling messages from serve
        socket.on("message", (message) => {
          if (message.type === "offer" && !peerRef.current) {
            console.log("offer", message);
            const newPeer = new SimplePeer({
              initiator: false,
              trickle: false,
              stream: stream, // Add local stream to the peer
            });
            peerRef.current = newPeer;

            // Set remote description and answer
            newPeer.signal(message.sdp);
            console.log("signal peered");
            newPeer.on("signal", (answer) => {
              console.log("signal answered");
              socket.emit("message", {
                type: "answer",
                sdp: answer,
                friendroomId: "123456",
              });
              console.log("answer emitted");
            });

            // Handle incoming stream
            newPeer.on("stream", (remoteStream) => {
              console.log("remote stream received", remoteStream);
              console.log("remote", remoteStream);
              setRemoteStream(remoteStream);

              remoteVideoRef.current.srcObject = remoteStream;
            });
          } else if (message.type === "answer" && peerRef.current) {
            console.log("answer", message);
            peerRef.current.signal(message.sdp);
          } else if (message.type === "candidate" && peerRef.current) {
            console.log("candidate", message);
            peerRef.current.signal(message.candidate);
          }
        });
      })
      .catch((error) => console.error("Error accessing media devices:", error));

    // Clean up on component unmount
    // return () => {
    //   socket.disconnect();
    //   if (peerRef.current) peerRef.current.destroy();
    //   if (localStream) localStream.getTracks().forEach(track => track.stop());
    // };
  }, []);

  useEffect(() => {
    if (localStream) {
      console.log("local stream updated", localStream);
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream) {
      console.log("remote stream updated", remoteStream);
    }
  }, [remoteStream]);

  // Function to start a call
  const startCall = () => {
    console.log("start calling");
    const newPeer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: localStream,
    });
    console.log("newpeer", newPeer);
    peerRef.current = newPeer;

    // Send signaling message for offer
    newPeer.on("signal", (offer) => {
      socket.emit("message", {
        type: "offer",
        sdp: offer,
        friendroomId: "123456",
      });
    });

    // // Handle incoming stream
    newPeer.on("stream", (remoteStream) => {
      console.log("remote stream received 1");
      console.log("remote stream received 2");
      setRemoteStream(remoteStream);
      remoteVideoRef.current.srcObject = remoteStream;
    });

    // Handle ICE candidate messages
    newPeer.on("iceCandidate", (candidate) => {
      socket.emit("message", {
        type: "candidate",
        candidate: candidate,
      });
    });

    // Handle connection state changes
    newPeer.on("connect", () => {
      console.log("Connected to remote peer");
    });

    newPeer.on("close", () => {
      console.log("Connection closed");
      //   setPeer(null);
    });
  };

  const endCall = () => {
    console.log("Ending call");

    if (peerRef.current) {
      // peerRef.current.destroy();
      peerRef.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    setRemoteStream(null);
    setvisitor("");
  };

  return (
    <div className="App">
      <h1>WebRTC Audio Call</h1>
      <div className="video-container">
        <div className="local-video">
          <h1>me</h1>
          <h1>{visitor}</h1>
          <video ref={localVideoRef} autoPlay playsInline muted></video>
        </div>
        <div className="remote-video">
          <h1>visitor</h1>
          <video ref={remoteVideoRef} autoPlay playsInline></video>
        </div>
      </div>
      <button onClick={startCall}>Start Call</button>
      {/* <button onClick={endCall}>end Call</button> */}
    </div>
  );
}

export default Call;
