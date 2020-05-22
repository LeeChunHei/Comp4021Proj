This code is only tested with Ubuntu 18.04 and should only work with a Linux system.
This webpage only tested with Chrome Version 81.0.4044.138 on Ubuntu 18.04

Install Prerequest:
    python3
    pip
    nodejs
    npm

Install Guide:
    Open terminal with directory same as this readme
    If you installed conda, you can use pip instead of pip3
    Enter command:
        pip3 install pybullet
        cd server
        npm install

Startup Guide
    Open terminal with directory same as this readme
        Enter command:
            cd humanoid
            python3 main
    Open a new terminal tab and back to the readme directory
        Enter command:
            cd server
            npm start
    Open browser and access localhost:3000 to discover this project

Troubleshoot
If there are any error shows avoid the python program run, check if there is a missing package, and install it