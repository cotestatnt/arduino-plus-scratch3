.... work in progress.

# arduino-plus-scratch3
Scratch 3 extensions + Arduino board (custom firmware)

Follow instructions to install scratch-gui (forked from original).
https://github.com/cotestatnt/scratch-gui

In order to use an Arduino Uno with Scratch 3.0 we need to access serial port. 
It's not possible directly from Scratch, so we can use node.js and websockets: Scratch extension will receive data from websocket.

npm install serialport
npm install websocket
npm install crc-full

Arduino Uno is programmed with a custom firmware (based on firmata). The purpose for this project is educational so small students can control 2 servos, 4 buttons, several addressable RGB leds, 1 pot, 1 ultrasonic sensor, 1 LDR and play some mp3 with a DFPlayer mini.
I'm sorry, but only Italian labels are available at the moment. You can translate or add yours following the schema.



First we need to create link for custom extension:
create folder "arduino" and put inside arduino.jpg and arduino-small.png

After edit index.jsx
..\scratch-gui\src\lib\libraries\extensions\index.jsx


Now we need the code for communicate with arduino.
Create a folder for extension in
..\scratch-gui\node_modules\scratch-vm\src\extensions\scratch3_arduino

and put inside the files
..\scratch-gui\node_modules\scratch-vm\src\extension-support\extension-manager.js
..\scratch-gui\node_modules\scratch-vm\src\util\ReconnectingWebSocket.js

We are ready to start scratch-gui with

npm start

then we need to start the websocket/serial script with
node path/to/serialport/wsServer.js
