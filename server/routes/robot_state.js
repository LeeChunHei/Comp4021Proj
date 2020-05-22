var express = require('express');
var router = express.Router();
var socket_io = require('../socket_io');
const system_info = require('systeminformation');

let connected_socket = [];

socket_io.of('/robot_state').on('connection', (socket) => {
  state_need_update = true;
  setTimeout(checkCPUTemperature, 1000);
  setTimeout(checkCPUCurrentSpeed, 1000);
  setTimeout(checkCurrentLoad, 1000);
  setTimeout(checkMemUsage, 1000);
  connected_socket.push(socket);

  socket.on('disconnect', function () {
    let i = connected_socket.indexOf(socket);
    connected_socket.splice(i, 1);
    if(connected_socket.length===0){
      state_need_update=false;
    }
  });
});

var state_need_update = false;

let checkCPUTemperature = () => {
  if (state_need_update) {
    system_info.cpuTemperature()
      .then(data => {
        let temperature = {main: data.main, cores: data.cores};
        socket_io.of('/robot_state').emit('cpu_temperature', temperature);
        setTimeout(checkCPUTemperature, 1000);
      })
      .catch(error => console.log(error));
  }
}

let checkCPUCurrentSpeed = () => {
  if (state_need_update) {
    system_info.cpuCurrentspeed()
      .then(data => {
        let speed = {avg: data.avg, cores: data.cores};
        socket_io.of('/robot_state').emit('cpu_current_speed', speed);
        setTimeout(checkCPUCurrentSpeed, 1000);
      })
      .catch(error => console.log(error));
  }
}

let checkCurrentLoad = () => {
  if (state_need_update) {
    system_info.currentLoad()
      .then(data => {
        let load = {avg_load: data.currentload, cores:[]};
        data.cpus.forEach(cpu => {
          load.cores.push(cpu.load);
        });
        socket_io.of('/robot_state').emit('current_load', load);
        setTimeout(checkCurrentLoad, 1000);
      })
      .catch(error => console.log(error));
  }
}

let checkMemUsage = () => {
  if (state_need_update) {
    system_info.mem()
      .then(data => {
        let memory_usage = {total:data.total, used:data.active}
        socket_io.of('/robot_state').emit('memory_usage', memory_usage);
        setTimeout(checkMemUsage, 1000);
      })
      .catch(error => console.log(error));
  }
}

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('robot_state', { title: 'Express' });
});

module.exports = router;
