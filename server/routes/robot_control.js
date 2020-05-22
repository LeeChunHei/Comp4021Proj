var express = require('express');
var router = express.Router();
var socket_io = require('../socket_io');
let robot_control = require('../robot_control');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('robot_control', { title: 'Express' });
});

socket_io.of('/robot_control').on('connection', (socket) => {
  socket.on('set_joint_angle', (data) => {
    let obj = {header:'set_joint_angle', data: data};
    robot_control.control_socket.write(JSON.stringify(obj));
  });
  socket.on('get_joint_angle', (data) => {
    let obj = {header:'get_joint_angle', data: data};
    robot_control.control_socket.write(JSON.stringify(obj));
  });
  socket.on('enable_joint_torque', (data) => {
    let obj = {header:'enable_joint_torque', data: data};
    robot_control.control_socket.write(JSON.stringify(obj));
  });
  // socket.on('disconnect', function () {
  //   let i = connected_socket.indexOf(socket);
  //   connected_socket.splice(i, 1);
  //   if(connected_socket.length===0){
  //     state_need_update=false;
  //   }
  // });
});

robot_control.control_socket.joint_angle_callback = (data) => {
  socket_io.of('/robot_control').emit('joint_angle', data);
}
robot_control.control_socket.joint_torque_enable_callback = (data) => {
  socket_io.of('/robot_control').emit('joint_torque_enable', data);
}

module.exports = router;
