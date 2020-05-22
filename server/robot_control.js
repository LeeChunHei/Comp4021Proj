var robot_control = {};
robot_control.control_socket = require('./unix_socket_api').control_socket;

let broadcast_ping_result = [];
let post_list_result = [];
let sequence_list_result = [];
let sequence_data = '';
let servo_angle = [];

robot_control.control_socket.broadcast_ping_listener = (data) => {
    broadcast_ping_result = data;
};

robot_control.broadcastPing = async () => {
    broadcast_ping_result = []
    robot_control.control_socket.write('broadcast_ping:{()}');
    var waitForBroadcastPingResult = () => {
        return new Promise((resolve, reject) => {
            var check = () => {
                if (broadcast_ping_result.length === 0) {
                    setTimeout(check, 100);
                } else {
                    resolve();
                }
            }
            setTimeout(check, 100);
        });
    };
    await waitForBroadcastPingResult();
    return broadcast_ping_result;
};

robot_control.control_socket.get_pose_list_listener = (data) => {
    post_list_result = data;
};

robot_control.getPoseList = async () => {
    post_list_result = []
    robot_control.control_socket.write('get_pose_list:{()}');
    var waitForPoseList = () => {
        return new Promise((resolve, reject) => {
            var check = () => {
                if (post_list_result.length === 0) {
                    setTimeout(check, 100);
                } else {
                    resolve();
                }
            }
            setTimeout(check, 100);
        });
    };
    await waitForPoseList();
    return post_list_result;
};

robot_control.control_socket.get_sequence_list_listener = (data) => {
    sequence_list_result = data;
};

robot_control.getSequenceList = async () => {
    sequence_list_result = [];
    robot_control.control_socket.write('get_sequence_list:{()}');
    var waitForPoseList = () => {
        return new Promise((resolve, reject) => {
            var check = () => {
                if (sequence_list_result.length === 0) {
                    setTimeout(check, 100);
                } else {
                    resolve();
                }
            }
            setTimeout(check, 100);
        });
    };
    await waitForPoseList();
    return sequence_list_result;
};

robot_control.control_socket.get_sequence_data_listener = (data) => {
    sequence_data = data;
};

robot_control.getSequenceData = async (sequence_name) => {
    sequence_data = '';
    robot_control.control_socket.write('get_sequence_data:{('+sequence_name+')}');
    var waitForSequenceData = () => {
        return new Promise((resolve, reject) => {
            var check = () => {
                if (sequence_data === '') {
                    setTimeout(check, 100);
                }else{
                    resolve();
                }
            }
            setTimeout(check, 100);
        });
    };
    await waitForSequenceData();
    return sequence_data;
};

robot_control.control_socket.get_angle_result_listener = (data) => {
    servo_angle = {};
    for (let servo_data of data) {
        let new_data = servo_data.slice(1, servo_data.length - 2);
        let id_angle = String(new_data).split(':');
        servo_angle[id_angle[0]]=id_angle[1];
    }
    robot_control.servo_angle_changed(servo_angle);
}



module.exports = robot_control;