var express = require('express');
var router = express.Router();
var socket_io = require('../socket_io');
let robot_control = require('../robot_control');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('motion_program', { title: 'Express' });
});

socket_io.of('/motion_program').on('connection', (socket) => {
  socket.on('capture_frame', (data) => {
    let obj = {header:'capture_frame', data: data};
    console.log(obj);
    robot_control.control_socket.write(JSON.stringify(obj));
  });
  socket.on('run_frame', (data) => {
    let obj = {header:'run_frame', data: data};
    robot_control.control_socket.write(JSON.stringify(obj));
  });
  socket.on('get_frame_list', (data) => {
    let obj = {header:'get_frame_list', data: data};
    robot_control.control_socket.write(JSON.stringify(obj));
  });
  socket.on('get_sequence_list', (data) => {
    let obj = {header:'get_sequence_list', data: data};
    robot_control.control_socket.write(JSON.stringify(obj));
  });
  socket.on('save_sequence', (data) => {
    let obj = {header:'save_sequence', data: data};
    robot_control.control_socket.write(JSON.stringify(obj));
  });
  socket.on('run_sequence', (data) => {
    let obj = {header:'run_sequence', data: data};
    robot_control.control_socket.write(JSON.stringify(obj));
  });
});

robot_control.control_socket.frame_list_callback = (data) => {
  socket_io.of('/motion_program').emit('frame_list', data);
}
robot_control.control_socket.sequence_list_callback = (data) => {
  socket_io.of('/motion_program').emit('sequence_list', data);
}

module.exports = router;
