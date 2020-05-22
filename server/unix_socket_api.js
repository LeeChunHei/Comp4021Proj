let unix_socket = require('net');

unix_socket.control_socket = unix_socket.connect('../control.socket', function () {
    console.log('Connected to control server');
});

unix_socket.control_socket.on('error', function(err){
    console.log("Error: "+err.message);
})

unix_socket.control_socket.buffer = Buffer.from(' ');

unix_socket.control_socket.on('data', (data) => {
    try {
        message = JSON.parse(data);
        switch (message.header) {
            case 'joint_angle':
                unix_socket.control_socket.joint_angle_callback(message.data);
                break;
            case 'joint_torque_enable':
                unix_socket.control_socket.joint_torque_enable_callback(message.data);
                break;
            case 'frame_list':
                unix_socket.control_socket.frame_list_callback(message.data);
                break;
            case 'sequence_list':
                unix_socket.control_socket.sequence_list_callback(message.data);
            default:
                break;
        }
    } catch (error) {
        console.log(error, data, String(data));
    }
    // let start_index = data.indexOf('broadcast_ping_result:{');
    // if (start_index != -1) {
    //     console.log(String(data));
    //     let end_index = data.indexOf('}');
    //     let data_new = data.slice(start_index + 'broadcast_ping_result:{'.length, end_index);
    //     data_new = String(data_new);
    //     data_new = data_new.replace(/\(/g, '');
    //     data_new = data_new.replace(/\)/g, '');
    //     unix_socket.control_socket.broadcast_ping_listener(String(data_new).split(','));
    //     return;
    // }
    // start_index = data.indexOf('pose_list_result:{');
    // if (start_index != -1) {
    //     console.log(String(data));
    //     let end_index = data.indexOf('}');
    //     let data_new = data.slice(start_index + 'pose_list_result:{'.length, end_index);
    //     data_new = String(data_new);
    //     data_new = data_new.replace(/\(/g, '');
    //     data_new = data_new.replace(/\)/g, '');
    //     unix_socket.control_socket.get_pose_list_listener(String(data_new).split(','));
    //     return;
    // }
    // start_index = data.indexOf('sequence_list_result:{');
    // if (start_index != -1) {
    //     console.log(String(data));
    //     let end_index = data.indexOf('}');
    //     let data_new = data.slice(start_index + 'sequence_list_result:{'.length, end_index);
    //     data_new = String(data_new);
    //     data_new = data_new.replace(/\(/g, '');
    //     data_new = data_new.replace(/\)/g, '');
    //     unix_socket.control_socket.get_sequence_list_listener(String(data_new).split(','));
    //     return;
    // }
    // start_index = data.indexOf('sequence_data_result:{');
    // if (start_index != -1) {
    //     let end_index = data.indexOf(')}');
    //     let data_new = data.slice(start_index + 'sequence_data_result:{('.length, end_index);
    //     unix_socket.control_socket.get_sequence_data_listener(String(data_new));
    //     return;
    // }
    // start_index = data.indexOf('servo_angle_result:{');
    // if (start_index != -1) {
    //     let end_index = data.indexOf('}');
    //     let data_new = data.slice(start_index + 'servo_angle_result:{'.length, end_index);
    //     unix_socket.control_socket.get_angle_result_listener(String(data_new).split(','));
    //     return;
    // }
});

module.exports = unix_socket;
