const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const colors = require("colors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const userRoutesf = require("./routes/userRoutesf");
const projectRoutes = require("./routes/projectRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const blogRoutes = require("./routes/blogRoutes");
const app = express();
dotenv.config();
connectDB();

app.use(express.json());
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("API is running");
});
app.use("/api/projects", projectRoutes);
app.use("/api/user", userRoutes);
app.use("/api/users", userRoutesf);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/blogs", blogRoutes);


app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5008;
const server = app.listen(
  PORT,
  console.log(`Server started on port ${PORT}`.yellow.bold)
);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io".cyan.underline);
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });
  socket.on("new message", (newMessageReceived) => {
    var chat = newMessageReceived.chat;
    if (!chat.users) return console.log("chat.users not defined");
    chat.users.forEach((user) => {
      if (user._id == newMessageReceived.sender._id) return;
      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));
  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});
