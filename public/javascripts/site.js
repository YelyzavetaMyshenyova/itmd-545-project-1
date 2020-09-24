var socket = io.connect("/");

socket.on("message", function (data) {
  console.log("Message received: " + data);
  //test if client received message
  socket.emit('message received', 'Yea, I got your message');
});
