import React, { useState } from 'react';
import VideoCall from './Video';
import AudioCall from './Audio';

function App() {
  const [identity, setIdentity] = useState('');
  const [callType, setCallType] = useState('');
  const [roomName, setRoomName] = useState('');

  return (
    <div className="App">
      <h1>Twilio Audio/Video Call</h1>
      <input 
        type="text" 
        value={identity} 
        onChange={(e) => setIdentity(e.target.value)} 
        placeholder="Enter your identity" 
      />
      <input 
        type="text" 
        value={roomName} 
        onChange={(e) => setRoomName(e.target.value)} 
        placeholder="Enter room name" 
      />
      <button onClick={() => setCallType('audio')}>Audio Call</button>
      <button onClick={() => setCallType('video')}>Video Call</button>

      {callType === 'audio' && <AudioCall identity={identity} />}
      {callType === 'video' && <VideoCall identity={identity} roomName={roomName} />}
    </div>
  );
}

export default App;
