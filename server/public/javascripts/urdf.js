class URDFModel {
    constructor(url, scene, THREE, STLLoader) {
        this.loading_manager = new THREE.LoadingManager();
        this.stl_loader = new STLLoader(this.loading_manager);
        var _this = this;
        this.loading_manager.onStart = function (url, itemsLoaded, itemsTotal) {
            console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
        };

        this.loading_manager.onLoad = function () {
            console.log('Loading complete!');
            _this.rotateFromEular(-Math.PI/2,0,0);
            scene.add(_this.origin);
        };

        this.loading_manager.onProgress = function (url, itemsLoaded, itemsTotal) {
            console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
        };

        this.loading_manager.onError = function (url) {
            console.log('There was an error loading ' + url);
        };
        this.links = [];
        this.joints = [];
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var parser = new DOMParser();
                var xml_doc = parser.parseFromString(this.responseText, "text/xml");
                var link_dom = xml_doc.getElementsByTagName("robot")[0].getElementsByTagName("link")
                for(let dom of link_dom){
                    let link = new Link(dom, _this.stl_loader, THREE);
                    _this.links.push(link);
                }
                var joint_dom = xml_doc.getElementsByTagName("robot")[0].getElementsByTagName("joint")
                for(let dom of joint_dom){
                    let joint = new Joint(dom, _this.links, THREE);
                    _this.joints.push(joint);
                }
                let child_links = [];
                for(let joint of _this.joints){
                    child_links.push(joint.child.name);
                }
                for(let link of _this.links){
                    if(!child_links.includes(link.name)){
                        _this.origin = link.origin;
                        break;
                    }
                }
            }
        };
        xhttp.open("GET", url, true);
        xhttp.send();
    }

    rotateFromEular(roll, pitch, yaw){
        this.origin.rotateX(roll);
        this.origin.rotateY(pitch);
        this.origin.rotateZ(yaw);
    }

    setJointAngle(name, angle){
        for(let joint of this.joints){
            if(joint.name===name){
                joint.setAngle(angle);
            }
        }
    }

    getJointAngle(name){
        for(let joint of this.joints){
            if(joint.name===name){
                return joint.getAngle();
            }
        }
    }
}

class Link {
    constructor(link_dom, stl_loader, THREE) {
        this.name = link_dom.getAttribute("name");
        var visual = link_dom.getElementsByTagName("visual")[0];
        var visual_origin_pos = visual.getElementsByTagName("origin")[0].getAttribute("xyz").split(" ").map(x => +x);
        var visual_origin_rpy = visual.getElementsByTagName("origin")[0].getAttribute("rpy").split(" ").map(x => +x);
        var mesh_loc = visual.getElementsByTagName("geometry")[0].getElementsByTagName("mesh")[0].getAttribute("filename");
        var material = visual.getElementsByTagName("material")[0];
        var material_color = material.getElementsByTagName("color")[0].getAttribute("rgba").split(" ").map(x => +x);
        // this.material_texture = material.getElementsByTagName("texture")[0].getAttribute("filename");
        this.origin = new THREE.Group();
        var _this = this;
        stl_loader.load(mesh_loc, function (geometry) {
            var material = new THREE.MeshPhongMaterial({ color: new THREE.Color(material_color[0], material_color[1], material_color[2]), specular: 0x111111, shininess: 200 });
            var mesh = new THREE.Mesh(geometry, material);

            mesh.position.set(...visual_origin_pos);
            mesh.rotation.set(...visual_origin_rpy);

            mesh.castShadow = true;
            mesh.receiveShadow = true;

            _this.origin.add(mesh)
        });
    }
}

class Joint {
    constructor(joint_dom, link_list, THREE) {
        this.name = joint_dom.getAttribute("name");
        this.type = joint_dom.getAttribute("type");
        this.axis = new THREE.Vector3(...joint_dom.getElementsByTagName("axis")[0].getAttribute("xyz").split(" ").map(x => +x));
        this.lower_limit = +joint_dom.getElementsByTagName("limit")[0].getAttribute("lower");
        this.upper_limit = +joint_dom.getElementsByTagName("limit")[0].getAttribute("upper");
        var parent_name = joint_dom.getElementsByTagName("parent")[0].getAttribute("link");
        var child_name = joint_dom.getElementsByTagName("child")[0].getAttribute("link");
        for (let link of link_list) {
            if (link.name === parent_name) {
                this.parent = link;
            } else if (link.name === child_name) {
                this.child = link;
            }
            if (this.parent !== undefined && this.child !== undefined) {
                break;
            }
        }
        var origin_pos = joint_dom.getElementsByTagName("origin")[0].getAttribute("xyz").split(" ").map(x => +x);
        var origin_rpy = [...joint_dom.getElementsByTagName("origin")[0].getAttribute("rpy").split(" ").map(x => +x), "ZYX"];
        var origin = new THREE.Group();
        origin.rotation.fromArray(origin_rpy);
        origin.position.fromArray(origin_pos);
        this.parent.origin.add(origin);
        origin.add(this.child.origin);
        this.joint_value = 0;
    }

    setAngle(angle){
        this.joint_value = Math.max(this.lower_limit, Math.min(this.upper_limit, angle));
        this.child.origin.setRotationFromAxisAngle(this.axis, this.joint_value);
    }

    getAngle(angle){
        return this.joint_value;
    }
}

export { URDFModel };