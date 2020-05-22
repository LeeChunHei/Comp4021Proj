from humanoid import Humanoid
import json

h = Humanoid()

while True:
    param = []
    for i in range(17):
        param.append({'id':str(i), 'enable':'disable'})
    # h.enableTorque(param)
    h.simRun(0.01)
    return_obj = {'header':'joint_angle', 'data':[]}
    for id in h.joint_id:
        return_obj['data'].append({'id': id, 'angle': h.getAngle(id)})
    h.control_socket.send(json.dumps(return_obj))