const peerConnections = {};
const config = {
  iceServers: [
    // { 
    //   "urls": "stun:stun.l.google.com:19302",
    // },
    { 
      "urls": "turn:35.65.84.41:3478?transport=tcp",
      "username": "test",
      "credential": "test123"
    }
  ]
};

const socket = io.connect(window.location.origin);

socket.on("answer", (id, description) => {
  peerConnections[id].setRemoteDescription(description);
});

socket.on("watcher", id => {
  const peerConnection = new RTCPeerConnection(config);
  peerConnections[id] = peerConnection;

  let stream = videoElement.srcObject;
  stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };

  peerConnection
    .createOffer()
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("offer", id, peerConnection.localDescription);
    });
});

socket.on("candidate", (id, candidate) => {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("disconnectPeer", id => {
  peerConnections[id].close();
  delete peerConnections[id];
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
};

// Get camera and microphone
const videoElement = document.querySelector("video");

getStream()

function getStream() {
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  const constraints = {
    audio: false,
    video: true
  };

  var raspividStream = require('raspivid-stream');
 
  var videoStream = raspividStream();
  
  // To stream over websockets:
  videoStream.on('data', (data) => {
      ws.send(data, { binary: true }, (error) => { if (error) console.error(error); });
  });

  a = navigator.mediaDevices
  .getUserMedia(constraints)
  .then(gotStream)
  .catch(handleError)

  console.log(typeof a)
  console.log(a)
  
  return a;
}

function gotStream(stream) {
  window.stream = stream;
  videoElement.srcObject = stream;
  socket.emit("broadcaster");
}

function handleError(error) {
  console.error("Error: ", error);
}