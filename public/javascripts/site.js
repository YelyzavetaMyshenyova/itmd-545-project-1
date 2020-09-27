var socket = io.connect("/");

socket.on("message", function (data) {
  console.log("Message received: " + data);
  //test if client received message
  if(data == 'Successfully connected.'){
    socket.emit('message received', 'Yeah, I got your message');
  }
});

socket.on("diffed changes", function(data) {
  console.log(`This are the diffed changes: ${data}`);
})
