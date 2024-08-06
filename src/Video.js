import React, { useEffect } from "react";
import { connect, createLocalVideoTrack } from "twilio-video";

function VideoCall({ identity, roomName }) {
  useEffect(() => {
    const startVideoCall = async () => {
      try {
        console.log('Requesting local video track...');

        // Add detailed error handling for getUserMedia
        try {
          const videoTrack = await createLocalVideoTrack();
          console.log('Local video track created:', videoTrack);
          
          const response = await fetch(
            `http://localhost:5000/user/token?identity=${identity}&type=video`
          );
          const data = await response.json();
          console.log('Received token:', data);

          const room = await connect(data.data, {
            name: roomName,
            tracks: [videoTrack],
          });
          console.log('Connected to room:', room);

          const videoContainer = document.getElementById("video-container");

          // Attach local participant's video track
          room.localParticipant.videoTracks.forEach((trackPublication) => {
            videoContainer.appendChild(trackPublication.track.attach());
          });

          // Handle remote participants
          room.participants.forEach((participant) => {
            participant.tracks.forEach((trackPublication) => {
              if (trackPublication.track.kind === "video") {
                videoContainer.appendChild(trackPublication.track.attach());
              }
            });

            participant.on("trackSubscribed", (track) => {
              if (track.kind === "video") {
                videoContainer.appendChild(track.attach());
              }
            });

            participant.on("trackUnsubscribed", (track) => {
              if (track.kind === "video") {
                track.detach().forEach((element) => element.remove());
              }
            });
          });

          // Handle new participant connections
          room.on("participantConnected", (participant) => {
            participant.tracks.forEach((trackPublication) => {
              if (trackPublication.track.kind === "video") {
                videoContainer.appendChild(trackPublication.track.attach());
              }
            });

            participant.on("trackSubscribed", (track) => {
              if (track.kind === "video") {
                videoContainer.appendChild(track.attach());
              }
            });

            participant.on("trackUnsubscribed", (track) => {
              if (track.kind === "video") {
                track.detach().forEach((element) => element.remove());
              }
            });
          });

          // Clean up when the room is disconnected
          room.on("disconnected", () => {
            videoContainer.innerHTML = "";
          });
        } catch (mediaError) {
          console.error("Error creating local video track:", mediaError);
          alert("Error creating local video track: " + mediaError.message);
          return; // Early exit if media track creation fails
        }
      } catch (error) {
        console.error("Error starting video call:", error);
        alert("Error starting video call: " + error.message);
      }
    };

    startVideoCall();
  }, [identity, roomName]);

  return (
    <div>
      <h2>Video Call</h2>
      <div
        id="video-container"
        style={{ display: "flex", flexDirection: "row" }}
      ></div>
    </div>
  );
}

export default VideoCall;
