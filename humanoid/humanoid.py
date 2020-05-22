import json
import pybullet as bullet
import pybullet_data
import math
import time
from socket_ import Socket
import os

class Humanoid():
    def __init__(self):
        self.physics_client = bullet.connect(bullet.GUI)
        bullet.setAdditionalSearchPath(pybullet_data.getDataPath())
        bullet.setGravity(0, -9.81, 0)
        self.step_time = 1/240
        plane_id = bullet.loadURDF("plane.urdf", [0,0,0], bullet.getQuaternionFromEuler([-math.pi * 0.5, 0, 0]))
        self.humanoid_id = bullet.loadURDF("./urdf/humanoid.urdf",
                                           [0, 0.23, 0],
                                           bullet.getQuaternionFromEuler([-math.pi * 0.5, 0, 0]),
                                           flags=bullet.URDF_USE_SELF_COLLISION | bullet.URDF_USE_SELF_COLLISION_EXCLUDE_ALL_PARENTS,
                                           useFixedBase=False)
        bullet.configureDebugVisualizer(bullet.COV_ENABLE_Y_AXIS_UP, 1)

        self.joint_id = {}
        self.joint_max_vel = {}
        self.joint_torque_enable = {}
        for i in range(bullet.getNumJoints(self.humanoid_id)):
            info = bullet.getJointInfo(self.humanoid_id, i)
            joint_name = str(info[1], encoding='utf-8')
            self.joint_id[joint_name] = i
            self.joint_max_vel[joint_name] = info[11]
            self.joint_torque_enable[joint_name] = True
            bullet.setJointMotorControl2(
                self.humanoid_id,
                jointIndex=i,
                controlMode=bullet.POSITION_CONTROL,
                targetPosition=0,
                force=7.3,
                maxVelocity=info[11]
            )
            print(joint_name)
        
        self.control_socket = Socket('../control.socket', self.socketListener)

    def socketListener(self, data):
        message = json.loads(data.decode())
        header = message['header']
        data = message['data']
        if header=='set_joint_angle':
            return_obj = {'header':'joint_torque_enable', 'data':[]}
            for d in data:
                self.setAngle(d['id'], d['angle'])
                self.joint_torque_enable[d['id']]=True
                return_obj['data'].append({'id': d['id'], 'enable': 'enable'})
            self.control_socket.send(json.dumps(return_obj))
        elif header=='get_joint_angle':
            return_obj = {'header':'joint_angle', 'data':[]}
            for d in data:
                return_obj['data'].append({'id': d['id'], 'angle': self.getAngle(d['id'])})
            self.control_socket.send(json.dumps(return_obj))
        elif header=='enable_joint_torque':
            print('called', data)
            return_obj = {'header':'joint_torque_enable', 'data':[]}
            self.enableTorque(data)
            for d in data:
                return_obj['data'].append({'id': d['id'], 'enable': 'enable' if self.joint_torque_enable[d['id']] else 'disable'})
            self.control_socket.send(json.dumps(return_obj))
        elif header=='capture_frame':
            print('called', data)
            self.enableTorque([{'id':'all_joint', 'enable':'enable'}])
            frame = {'joint_angle':{}, 'reach_time':data['reach_time']}
            for joint_name in self.joint_id:
                frame['joint_angle'][joint_name] = self.getAngle(joint_name)
            with open('./frame_file/'+data['name'], "w") as frame_file:
                frame_file.write(json.dumps(frame))
            self.sendFrameList()
        elif header=='run_frame':
            self.runFrame(data)
        elif header=='get_frame_list':
            self.sendFrameList()
        elif header=='get_sequence_list':
            self.sendSequenceList()
        elif header=='save_sequence':
            sequence = {'frame':data['frame']}
            with open('./sequence_file/'+data['name'], "w") as sequence_file:
                sequence_file.write(json.dumps(sequence))
            self.sendSequenceList()
        elif header=='run_sequence':
            self.runSequence(data['name'])

    def sendFrameList(self):
        frame_path = './frame_file'
        return_obj = {'header':'frame_list', 'data':[]}
        files_name = os.listdir(frame_path)
        for name in files_name:
            path = os.path.join(frame_path, name)
            if os.path.isfile(path):
                with open(path, 'r') as frame_file:
                    obj = json.load(frame_file)
                    return_obj['data'].append({'name':name, 'reach_time':obj['reach_time']})
        self.control_socket.send(json.dumps(return_obj))

    def runSequence(self, name):
        with open('./sequence_file/'+name) as sequence_file:
            sequence = json.load(sequence_file)
            for frame_name in sequence['frame']:
                reach_time = self.runFrame(frame_name)
                time.sleep(reach_time)


    def sendSequenceList(self):
        frame_path = './sequence_file'
        return_obj = {'header':'sequence_list', 'data':[]}
        files_name = os.listdir(frame_path)
        for name in files_name:
            if(name!='__________temp__________'):
                path = os.path.join(frame_path, name)
                if os.path.isfile(path):
                    with open(path, 'r') as sequence_file:
                        obj = json.load(sequence_file)
                        return_obj['data'].append({'name':name, 'frame':obj['frame']})
        print(return_obj)
        self.control_socket.send(json.dumps(return_obj))

    def runFrame(self, frame_name):
        with open('./frame_file/'+frame_name) as frame_file:
            frame = json.load(frame_file)
            for servo_name in frame['joint_angle']:
                self.setAngle(servo_name, frame['joint_angle'][servo_name], frame['reach_time'])
            return frame['reach_time']

    def enableTorque(self, param):
        for p in param:
            id = str(p['id'])
            if id == 'all_joint':
                for index in self.joint_id:
                    id = self.joint_id[index]
                    if p['enable']=='toggle':
                        self.joint_torque_enable[index] = not self.joint_torque_enable[index]
                    else:
                        self.joint_torque_enable[index] = (p['enable']=='enable')
                    target_angle = bullet.getJointState(self.humanoid_id, id)[0]
                    bullet.setJointMotorControl2(
                        self.humanoid_id,
                        jointIndex=id,
                        controlMode=bullet.POSITION_CONTROL,
                        targetPosition=target_angle,
                        force=7.3 if self.joint_torque_enable[index] else 0.1,
                        maxVelocity=self.joint_max_vel[index]
                    )
            else:
                if not (id in self.joint_id):
                    continue
                id = self.joint_id[id]
                if p['enable']=='toggle':
                    self.joint_torque_enable[p['id']] = not self.joint_torque_enable[p['id']]
                else:
                    self.joint_torque_enable[p['id']] = (p['enable']=='enable')
                target_angle = bullet.getJointState(self.humanoid_id, id)[0]
                bullet.setJointMotorControl2(
                    self.humanoid_id,
                    jointIndex=id,
                    controlMode=bullet.POSITION_CONTROL,
                    targetPosition=target_angle,
                    force=7.3 if self.joint_torque_enable[index] else 0.1,
                    maxVelocity=self.joint_max_vel[index]
                )

    def captureJointAction(self, t):
        x = []
        y = []
        y2 = []
        plt.title("Matplotlib demo") 
        plt.xlabel("x axis caption") 
        plt.ylabel("y axis caption") 
        for i in range(int(t//self.step_time)):
            x.append(i)
            info = bullet.getJointState(self.humanoid_id, self.joint_id['4'])
            y.append(info[0])
            y2.append(info[1])
            bullet.stepSimulation()
            time.sleep(self.step_time)
        plt.plot(x,y,"ob")
        plt.plot(x,y2,"or")
        plt.show()

    def simRun(self, run_time, sim_to_real_time_ratio=1):
        for i in range(int(run_time//self.step_time)):
            bullet.stepSimulation()
            # p, o = self.getModelState()
            # print('%.2f, %.2f, %.2f' % (p[0], p[1], p[2]))
            if sim_to_real_time_ratio != 0:
                time.sleep(self.step_time/sim_to_real_time_ratio)

    def setAngle(self, id, angle, reach_time=0):
        id = str(id)
        if not (id in self.joint_id):
            return
        present_angle = bullet.getJointState(
            self.humanoid_id, self.joint_id[id])[0]
        target_angle = math.radians(angle)
        max_vel = self.joint_max_vel[id] if reach_time == 0 else min(
            abs(target_angle-present_angle)/reach_time, self.joint_max_vel[id])
        bullet.setJointMotorControl2(
            self.humanoid_id,
            jointIndex=self.joint_id[id],
            controlMode=bullet.POSITION_CONTROL,
            targetPosition=target_angle,
            force=7.3,
            maxVelocity=max_vel
        )

    def getAngle(self, id):
        id = str(id)
        if not (id in self.joint_id):
            return
        present_angle = math.degrees(bullet.getJointState(self.humanoid_id, self.joint_id[id])[0])
        return present_angle

    def initStartPose(self, pose):
        self.start_pose = pose

    def getJointAngleVel(self, time):
        t = time
        prev_frame = self.start_pose
        joint_angle = {}
        joint_velocity = {}
        for frame in self.pose_frame:
            if t > frame['duration']:
                t -= frame['duration']
                prev_frame = frame
            else:
                for index in frame:
                    if index != 'duration' and index != '1' and index != '2' and index != '3' and index != '17':
                        vel = (frame[index]-prev_frame[index])/frame['duration']
                        joint_angle[index] = prev_frame[index]+vel*t
                        joint_velocity[index] = vel
                break
        return joint_angle, joint_velocity

    def degreeToAngleConvertion(self, id, angle):
        result = 0
        if self.joint_marks[str(id)] == 'inverted':
            result = math.radians(180-angle)
        else:
            result = math.radians(angle-180)
        if math.isnan(result) or math.isinf(result):
            print('nan', angle)
            return 0
        else:
            return result

    def angleToDegreeConvertion(self, id, angle):
        result = 0
        if self.joint_marks[str(id)] == 'inverted':
            result = 180-math.degrees(angle)
        else:
            result = math.degrees(angle)+180
        if math.isnan(result) or math.isinf(result):
            print('nan', angle)
            return 0
        else:
            return result