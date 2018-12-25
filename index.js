const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Clone = require('../../util/clone');
const Cast = require('../../util/cast');
const Color = require('../../util/color');
const formatMessage = require('format-message');
const MathUtil = require('../../util/math-util');
const Timer = require('../../util/timer');
const ReconnectingWebSocket = require('../../util/ReconnectingWebSocket');

const CRC = require('crc-full').CRC;
var crc = new CRC("CRC16_XMODEM", 16, 0x1021, 0x0000, 0x0000, false, false);

/* Icon svg to be displayed at the left edge of each extension block, encoded as a data URI. */
const blockIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pjxzdmcgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTI4IDEyODsiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDEyOCAxMjgiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe2ZpbGw6IzFDQTJCQjt9Cgkuc3Qxe2ZpbGw6I0VBQzEwMDt9Cjwvc3R5bGU+PGcgaWQ9Il94MzFfMl8zRF9QcmludGluZyIvPjxnIGlkPSJfeDMxXzFfVlJfR2VhciIvPjxnIGlkPSJfeDMxXzBfVmlydHVhbF9yZWFsaXR5Ii8+PGcgaWQ9Il94MzlfX0F1Z21lbnRlZF9yZWFsaXR5Ii8+PGcgaWQ9Il94MzhfX1RlbGVwb3J0Ii8+PGcgaWQ9Il94MzdfX0dsYXNzZXNzIi8+PGcgaWQ9Il94MzZfX0ZvbGRpbmdfcGhvbmUiLz48ZyBpZD0iX3gzNV9fRHJvbmUiLz48ZyBpZD0iX3gzNF9fUmV0aW5hX3NjYW4iLz48ZyBpZD0iX3gzM19fU21hcnR3YXRjaCIvPjxnIGlkPSJfeDMyX19CaW9uaWNfQXJtIi8+PGcgaWQ9Il94MzFfX0NoaXAiPjxnPjxyZWN0IGNsYXNzPSJzdDAiIGhlaWdodD0iNDgiIHdpZHRoPSIzMiIgeD0iNDgiIHk9IjM2Ii8+PGNpcmNsZSBjbGFzcz0ic3QxIiBjeD0iMjAiIGN5PSIyOCIgcj0iOCIvPjxjaXJjbGUgY2xhc3M9InN0MSIgY3g9IjIwIiBjeT0iOTIiIHI9IjgiLz48Y2lyY2xlIGNsYXNzPSJzdDEiIGN4PSIxMDgiIGN5PSI1MiIgcj0iOCIvPjxjaXJjbGUgY2xhc3M9InN0MSIgY3g9Ijk2IiBjeT0iMTAwIiByPSI4Ii8+PGc+PHBhdGggZD0iTTEwOCw0MGMtNS4yLDAtOS42LDMuMy0xMS4zLDhIODRWMzJoLThWMjBoLTh2MTJoLThWMjBoLTh2MTJoLTh2MTZIMjR2LTguN2M0LjctMS43LDgtNi4xLDgtMTEuM2MwLTYuNi01LjQtMTItMTItMTIgICAgIFM4LDIxLjQsOCwyOGMwLDUuMiwzLjMsOS42LDgsMTEuM1Y1NmgyOHY4SDE2djE2LjdjLTQuNywxLjctOCw2LjEtOCwxMS4zYzAsNi42LDUuNCwxMiwxMiwxMnMxMi01LjQsMTItMTJjMC01LjItMy4zLTkuNi04LTExLjMgICAgIFY3MmgyMHYxNmg4djEyaDhWODhoOHYxMmg4Vjg4aDhWNzJoOHYxNi43Yy00LjcsMS43LTgsNi4xLTgsMTEuM2MwLDYuNiw1LjQsMTIsMTIsMTJzMTItNS40LDEyLTEyYzAtNS4yLTMuMy05LjYtOC0xMS4zVjY0SDg0ICAgICB2LThoMTIuN2MxLjcsNC43LDYuMSw4LDExLjMsOGM2LjYsMCwxMi01LjQsMTItMTJTMTE0LjYsNDAsMTA4LDQweiBNMjAsMjRjMi4yLDAsNCwxLjgsNCw0cy0xLjgsNC00LDRzLTQtMS44LTQtNFMxNy44LDI0LDIwLDI0ICAgICB6IE0yMCw5NmMtMi4yLDAtNC0xLjgtNC00czEuOC00LDQtNHM0LDEuOCw0LDRTMjIuMiw5NiwyMCw5NnogTTk2LDEwNGMtMi4yLDAtNC0xLjgtNC00czEuOC00LDQtNHM0LDEuOCw0LDRTOTguMiwxMDQsOTYsMTA0eiAgICAgIE03Niw4MEg1MlY0MGgyNFY4MHogTTEwOCw1NmMtMi4yLDAtNC0xLjgtNC00czEuOC00LDQtNHM0LDEuOCw0LDRTMTEwLjIsNTYsMTA4LDU2eiIvPjxyZWN0IGhlaWdodD0iOCIgd2lkdGg9IjgiIHg9IjU2IiB5PSI2NCIvPjwvZz48L2c+PC9nPjwvc3ZnPg==';

/* Icon svg to be displayed in the category menu, encoded as a data URI. */
const menuIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaWQ9IkxheWVyXzFfMV8iIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDY0IDY0OyIgdmVyc2lvbj0iMS4xIiB2aWV3Qm94PSIwIDAgNjQgNjQiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxnPjxnPjxwYXRoIGQ9Ik01MS4zMTQsMTQuOTI5bC00LjI0My00LjI0M2wtMi4zMzEsMS4zOTljLTAuMzUxLTAuMTY4LTAuNzExLTAuMzE4LTEuMDgxLTAuNDQ4TDQzLDloLTYgICAgbC0wLjY1OSwyLjYzN2MtMC4zNywwLjEzMS0wLjczLDAuMjgxLTEuMDgxLDAuNDQ4bC0yLjMzMS0xLjM5OWwtNC4yNDMsNC4yNDNsMS4zOTksMi4zMzFjLTAuMTY4LDAuMzUxLTAuMzE4LDAuNzExLTAuNDQ4LDEuMDgxICAgIEwyNywxOXY2bDIuNjM3LDAuNjU5YzAuMTMxLDAuMzcsMC4yODEsMC43MywwLjQ0OCwxLjA4MWwtMS4zOTksMi4zMzFsNC4yNDMsNC4yNDNsMi4zMzEtMS4zOTkgICAgYzAuMzUxLDAuMTY4LDAuNzExLDAuMzE4LDEuMDgxLDAuNDQ4TDM3LDM1aDZsMC42NTktMi42MzdjMC4zNy0wLjEzMSwwLjczLTAuMjgxLDEuMDgxLTAuNDQ4bDIuMzMxLDEuMzk5bDQuMjQzLTQuMjQzICAgIGwtMS4zOTktMi4zMzFjMC4xNjgtMC4zNTEsMC4zMTgtMC43MTEsMC40NDgtMS4wODFMNTMsMjV2LTZsLTIuNjM3LTAuNjU5Yy0wLjEzMS0wLjM3LTAuMjgxLTAuNzMtMC40NDgtMS4wODFMNTEuMzE0LDE0LjkyOXoiIHN0eWxlPSJmaWxsOiNGRkNCNTc7Ii8+PC9nPjxnPjxyZWN0IGhlaWdodD0iNCIgc3R5bGU9ImZpbGw6I0U1NjU2NTsiIHdpZHRoPSIyIiB4PSIzOSIgeT0iMiIvPjwvZz48Zz48cmVjdCBoZWlnaHQ9IjIwIiBzdHlsZT0iZmlsbDojRTU2NTY1OyIgd2lkdGg9IjIiIHg9IjM5IiB5PSI0MiIvPjwvZz48Zz48cmVjdCBoZWlnaHQ9IjIiIHN0eWxlPSJmaWxsOiNFNTY1NjU7IiB3aWR0aD0iMiIgeD0iMzkiIHk9IjM4Ii8+PC9nPjxnPjxwYXRoIGQ9Ik01NS4xMjIsOC41MTJDNTEuMDUsMy43MzgsNDQuODk5LDEsMzguMjQ5LDFoLTYuNDY4Yy0zLjQ3NSwwLTYuNjg1LDAuNjk5LTkuNTQyLDIuMDc5ICAgIEMxNC42ODksNi43MjMsMTAsMTQuMTYsMTAsMjIuNDg1YzAsMi41NjQtMS4xNDgsNC45NTMtMy4xNSw2LjU1NGwtMi4xNzgsMS43NDJsMC40ODYsMC43NThjMy4zNDgsNS4yMjIsNS44MzEsMTAuOTE1LDcuMzgsMTYuOTIxICAgIGwwLjMxMiwxLjIwOWMwLjUzNywyLjA4NCwxLjg3NSwzLjc3NSwzLjY3LDQuNjRjMS45ODcsMC45NTksNC4zMjYsMC45MSw2LjI3MS0wLjE0M2wxNC42OTktOC4yOTZsLTAuOTgyLTEuNzQybC0xNC42ODQsOC4yODcgICAgYy0xLjM2NiwwLjc0LTMuMDI0LDAuNzc0LTQuNDM2LDAuMDkzYy0xLjI2NC0wLjYwOS0yLjIxMy0xLjgyNi0yLjYwMy0zLjMzOWwtMC4zMTItMS4yMDljLTAuMDgzLTAuMzIyLTAuMTc5LTAuNjQtMC4yNjctMC45NjFIMTcgICAgdi0yaC0zLjM3OWMtMS41MTUtNC44MzktMy42Mi05LjQ2MS02LjI5OS0xMy43NzdMOC4xLDMwLjYwMWMyLjQ3OS0xLjk4MywzLjktNC45NDEsMy45LTguMTE2YzAtNy41NTIsNC4yNTctMTQuMjk3LDExLjEwOC0xNy42MDUgICAgQzI1LjY5MiwzLjYzMiwyOC42MSwzLDMxLjc4MSwzaDYuNDY4YzYuMDYzLDAsMTEuNjU5LDIuNDgyLDE1LjM1Miw2LjgxYzMuNTg5LDQuMjA2LDUuMDYyLDkuNjY4LDQuMTUyLDE1LjM4ICAgIGMtMC4zOTksMi41MDItMS4yNjMsNC44NDgtMi41NjQsNi45NzNDNDkuODMxLDQwLjkwNiw0Nyw1MC40NDMsNDcsNTkuNzQzVjYxSDI5di04aC0ydjEwaDIydi0zLjI1NyAgICBjMC04LjkzMSwyLjcyOS0xOC4xMDYsNy44OTQtMjYuNTM1YzEuNDM5LTIuMzUsMi4zOTQtNC45NDEsMi44MzQtNy43MDNDNjAuNzMyLDE5LjIwNSw1OS4wOTcsMTMuMTcsNTUuMTIyLDguNTEyeiIgc3R5bGU9ImZpbGw6IzNGM0EzNDsiLz48cmVjdCBoZWlnaHQ9IjIiIHN0eWxlPSJmaWxsOiMzRjNBMzQ7IiB3aWR0aD0iNiIgeD0iMTUiIHk9IjI2Ii8+PHBhdGggZD0iTTQ2LDIyYzAtMy4zMDktMi42OTEtNi02LTZzLTYsMi42OTEtNiw2czIuNjkxLDYsNiw2UzQ2LDI1LjMwOSw0NiwyMnogTTQwLDI2ICAgIGMtMi4yMDYsMC00LTEuNzk0LTQtNHMxLjc5NC00LDQtNHM0LDEuNzk0LDQsNFM0Mi4yMDYsMjYsNDAsMjZ6IiBzdHlsZT0iZmlsbDojM0YzQTM0OyIvPjxwYXRoIGQ9Ik0zNS4zMjYsMzMuMDQxYzAuMDU3LDAuMDI0LDAuMTE0LDAuMDQ5LDAuMTcxLDAuMDcxTDM2LjIxOSwzNmg3LjU2MmwwLjcyMi0yLjg4OCAgICBjMC4wNTctMC4wMjIsMC4xMTQtMC4wNDcsMC4xNzEtMC4wNzFsMi41NTMsMS41MzFsNS4zNDYtNS4zNDdsLTEuNTMtMi41NTJjMC4wMjMtMC4wNTcsMC4wNDctMC4xMTQsMC4wNy0wLjE3MUw1NCwyNS43ODF2LTcuNTYyICAgIGwtMi44ODgtMC43MjJjLTAuMDkyLTAuMjI3LTAuMTktMC40NTEtMC4yOTYtMC42NjlsLTEuODAzLDAuODY0YzAuMTUyLDAuMzE4LDAuMjg4LDAuNjQ2LDAuNDA3LDAuOTgybDAuMTc5LDAuNTA2bDIuNCwwLjZ2NC40MzggICAgbC0yLjQsMC42bC0wLjE3OSwwLjUwNmMtMC4xMTksMC4zMzYtMC4yNTUsMC42NjQtMC40MDcsMC45ODJsLTAuMjMzLDAuNDg1bDEuMjc0LDIuMTIzbC0zLjEzOSwzLjEzOGwtMi4xMjItMS4yNzNsLTAuNDg0LDAuMjMxICAgIGMtMC4zMiwwLjE1My0wLjY0NiwwLjI4OS0wLjk4MiwwLjQwN2wtMC41MDgsMC4xNzlMNDIuMjE5LDM0aC00LjQzOGwtMC42MDEtMi40MDFsLTAuNTA4LTAuMTc5ICAgIGMtMC4zMzYtMC4xMTgtMC42NjItMC4yNTQtMC45ODItMC40MDdsLTAuNDg0LTAuMjMxbC0yLjEyMiwxLjI3M2wtMy42OS0zLjY5bC0xLjQxNCwxLjQxNGw0Ljc5NCw0Ljc5NEwzNS4zMjYsMzMuMDQxeiIgc3R5bGU9ImZpbGw6IzNGM0EzNDsiLz48cGF0aCBkPSJNMjYsMTguMjE5djcuNTYybDIuODg4LDAuNzIyYzAuMDkyLDAuMjI3LDAuMTksMC40NTEsMC4yOTYsMC42NjlsMS44MDMtMC44NjQgICAgYy0wLjE1Mi0wLjMxOC0wLjI4OC0wLjY0Ni0wLjQwNy0wLjk4MkwzMC40LDI0LjgxOWwtMi40LTAuNnYtNC40MzhsMi40LTAuNmwwLjE3OS0wLjUwNmMwLjExOS0wLjMzNiwwLjI1NS0wLjY2NCwwLjQwNy0wLjk4MiAgICBsMC4yMzItMC40ODVsLTEuMjczLTIuMTIzbDMuMTM5LTMuMTM5bDIuMTIyLDEuMjczbDAuNDg0LTAuMjMxYzAuMzItMC4xNTMsMC42NDYtMC4yODksMC45ODItMC40MDdsMC41MDgtMC4xNzlMMzcuNzgxLDEwaDQuNDM4ICAgIGwwLjYwMSwyLjQwMWwwLjUwOCwwLjE3OWMwLjMzNiwwLjExOCwwLjY2MiwwLjI1NCwwLjk4MiwwLjQwN2wwLjQ4NCwwLjIzMWwyLjEyMi0xLjI3M2wzLjY5LDMuNjlsMS40MTQtMS40MTRsLTQuNzk0LTQuNzk1ICAgIGwtMi41NTMsMS41MzJjLTAuMDU3LTAuMDI0LTAuMTE0LTAuMDQ4LTAuMTcxLTAuMDcxTDQzLjc4MSw4aC03LjU2MmwtMC43MjIsMi44ODdjLTAuMDU3LDAuMDIzLTAuMTE0LDAuMDQ3LTAuMTcxLDAuMDcxICAgIGwtMi41NTMtMS41MzJsLTUuMzQ2LDUuMzQ3bDEuNTMsMi41NTNjLTAuMDIzLDAuMDU3LTAuMDQ3LDAuMTE0LTAuMDcsMC4xNzFMMjYsMTguMjE5eiIgc3R5bGU9ImZpbGw6IzNGM0EzNDsiLz48cmVjdCBoZWlnaHQ9IjIiIHN0eWxlPSJmaWxsOiMzRjNBMzQ7IiB3aWR0aD0iMiIgeD0iMzkiIHk9IjEyIi8+PHJlY3QgaGVpZ2h0PSIyIiBzdHlsZT0iZmlsbDojM0YzQTM0OyIgdHJhbnNmb3JtPSJtYXRyaXgoMC43MDcyIC0wLjcwNyAwLjcwNyAwLjcwNzIgLTEuMjA2OCAyOC4zNTc3KSIgd2lkdGg9IjIiIHg9IjMyLjYzNiIgeT0iMTQuNjM2Ii8+PHJlY3QgaGVpZ2h0PSIyIiBzdHlsZT0iZmlsbDojM0YzQTM0OyIgd2lkdGg9IjIiIHg9IjMwIiB5PSIyMSIvPjxyZWN0IGhlaWdodD0iMiIgc3R5bGU9ImZpbGw6IzNGM0EzNDsiIHRyYW5zZm9ybT0ibWF0cml4KDAuNzA3IC0wLjcwNzIgMC43MDcyIDAuNzA3IC0xMC4yMDQxIDMyLjA5OTMpIiB3aWR0aD0iMiIgeD0iMzIuNjM2IiB5PSIyNy4zNjQiLz48cmVjdCBoZWlnaHQ9IjIiIHN0eWxlPSJmaWxsOiMzRjNBMzQ7IiB3aWR0aD0iMiIgeD0iMzkiIHk9IjMwIi8+PHJlY3QgaGVpZ2h0PSIyIiBzdHlsZT0iZmlsbDojM0YzQTM0OyIgdHJhbnNmb3JtPSJtYXRyaXgoMC43MDcyIC0wLjcwNyAwLjcwNyAwLjcwNzIgLTYuNDc4OCA0MS4wODMpIiB3aWR0aD0iMiIgeD0iNDUuMzY0IiB5PSIyNy4zNjQiLz48cmVjdCBoZWlnaHQ9IjIiIHN0eWxlPSJmaWxsOiMzRjNBMzQ7IiB3aWR0aD0iMiIgeD0iNDgiIHk9IjIxIi8+PHJlY3QgaGVpZ2h0PSIyIiBzdHlsZT0iZmlsbDojM0YzQTM0OyIgdHJhbnNmb3JtPSJtYXRyaXgoMC43MDcgLTAuNzA3MiAwLjcwNzIgMC43MDcgMi41MjcyIDM3LjM3MTcpIiB3aWR0aD0iMiIgeD0iNDUuMzY0IiB5PSIxNC42MzYiLz48L2c+PC9nPjwvc3ZnPg==';

const	START_SYS = 0xF0,
		SET_OUTPUT = 0xF1,
		SET_SERVO = 0xF2,
		SET_PWM = 0xF3,
		SET_ANIM = 0xF4,
		SET_RGB = 0xF5,
		DFP_MSG = 0xF6,
		END_SYS = 0xF7;

const 	ANIM_NUM = 0xE0,
		LEDS_ON = 0xE1,
		LEDS_MOVE = 0xE2;

		
const 	PLAY_SONG = 0x03,
		NEXT = 0x01,
		PREV = 0x02,
		PLAY = 0x0D,
		PAUSE = 0x0E,
		VOLUME = 0x06;
  
var 	DigitalInByte,
		Distance,
		PotValue,
		LightValue,
		Servo1Pos,
		Servo2Pos,
		RGB1,
		RGB2;
	

function mapValues(val, aMin, aMax, bMin, bMax) {
	var output = (((bMax - bMin) * (val - aMin)) / (aMax - aMin)) + bMin;
	if(output > 255)
		output = 255;
	if(output < 0)
		output = 0;
	return Math.round(output);
};

var startTime = Date.now();
function millis(){
	return Date.now() - startTime;
}

 
const ArduinoConnectionState = ['Connesso', 'Disconnesso'];
//const ArduinoAnalogOut = ['3', '5', '6'];

const ArduinoBoolValues = ['Attivo', 'Disattivo'];
const ArduinoAnalogIn = ['Potenziometro','Luce'];
const ArduinoDigitalIn = ['A', 'B', 'C', 'D' ];
const ArduinoRGBn = ['RGB1', 'RGB2'];
const ArduinoRGBch = ['Red', 'Green', 'Blue'];
const ArduinoServos = ['Motore1', 'Motore2'];
const ArduinoDFPlayer = ['PLAY', 'STOP', 'NEXT', 'PREVIOUS'];
const ArduinoAnimations = ['Nessuna', 'Fuoco', 'Battito', 'Gradiente', 'Sinelon', 'BPM', 'Confetti', 'Glitter'];
const ArduinoDirections = ['Sinistra', 'Destra'];

/**
 * Class for the "Arduino" extension's blocks in Scratch 3.0
 * @param {Runtime} runtime - the runtime instantiating this block package.
 * @constructor
 */
class Scratch3ArduinoBlocks {

	constructor (runtime) {
		this.runtime = runtime;
		startTime = Date.now();
		this.lastMillis = 0;
		RGB1 = Cast.toRgbColorObject('#000000');
		RGB2 = Cast.toRgbColorObject('#000000');
		
		this.ws = new ReconnectingWebSocket("ws://localhost:8081");
		this.ws.binaryType = 'arraybuffer';
		
		this.ws.onmessage =  this._getWsData;
		this.ws.onopen =  this._openSocket;
		this.ws.onclose =  this._closeSocket;
		this.ws.onerror =  this._errorSocket;		
		
		this._sendWsData = this._sendWsData.bind(this);
		this._getWsData = this._getWsData.bind(this);
		this._openSocket = this._openSocket.bind(this);
		this._closeSocket = this._closeSocket.bind(this);
		this._errorSocket = this._errorSocket.bind(this);
	}

	/**
	 * @returns {object} metadata for this extension and its blocks.
	 */
	getInfo () {
		return {
			id: 'arduino',
			name: formatMessage({
				id: 'arduino.categoryName',
				default: 'Arduino',
				description: 'Arduino extension'
			}),
			menuIconURI: menuIconURI,
			blockIconURI: blockIconURI,
			blocks: [
				
				/*
				{
					opcode: 'ifConnected',
					blockType: BlockType.BOOLEAN,					
					text: 'Se Arduino è [CONNECTION]',
					arguments: {
						CONNECTION: {
							type: ArgumentType.BOOL,
							menu: 'mConnection',
							defaultValue: ArduinoConnectionState[0]
						}
					}
				},
				*/
				
				{
					opcode: 'ifDigitalRead',
					blockType: BlockType.BOOLEAN,
					text: 'Pulsante[DIGITAL_IN]=[BOOL_VAL]',
					
					arguments: {
						DIGITAL_IN: {
							type: ArgumentType.STRING,
							menu: 'mDigitalIn',
							defaultValue: ArduinoDigitalIn[1]
						},
						BOOL_VAL: {
							type: ArgumentType.STRING,
							menu: 'mBoolVal',
							defaultValue: ArduinoBoolValues[0]
						},
					}
				},

				{
					opcode: 'analogRead',
					blockType: BlockType.REPORTER,
					text: 'Leggi [ANALOG_IN]',					
					arguments: {
						ANALOG_IN: {
							type: ArgumentType.STRING,
							menu: 'mAnalogIn',
							defaultValue: ArduinoAnalogIn[0]
						}
					}
				},
				
				{
					opcode: 'distance',
					blockType: BlockType.REPORTER,
					text: 'Distanza (cm)',										
				},
				
				/*
				{
					opcode: 'analogWrite',
					blockType: BlockType.COMMAND,
					text: 'Imposta[ANALOG_OUT]al[PWM_VALUE]%',
					arguments: {
						ANALOG_OUT: {
							menu: 'mAnalogOut',
							defaultValue: ArduinoAnalogOut[0]
						},
						PWM_VALUE: {
							type: ArgumentType.NUMBER,
							defaultValue: 50
						}
					}					
				},
				*/
				
				//{opcode: 'doNothing1',blockType: BlockType.HAT,text: 'Servo Motori                ', func : 'doNothing'},
				
				{
					opcode: 'servoWritePos',
					blockType: BlockType.COMMAND,
					text: 'Ruota[SERVO_N]a[POS_VAL]°',
					arguments: {
						SERVO_N: {
							menu: 'mServos',
							defaultValue: ArduinoServos[0]
						},
						POS_VAL: {
							type: ArgumentType.NUMBER,
							defaultValue: 90
						}
					}
				},
				
				{
					opcode: 'servoMovePos',
					blockType: BlockType.COMMAND,
					text: 'Sposta[SERVO_N]di[POS_VAL]°',
					arguments: {
						SERVO_N: {
							menu: 'mServos',
							defaultValue: ArduinoServos[0]
						},
						POS_VAL: {
							type: ArgumentType.NUMBER,
							defaultValue: 10
						}
					}
				},
				
				//{opcode: 'doNothing2',blockType: BlockType.HAT,text: 'Luci RGB (Red Green Blue)   ', func : 'doNothing'},
				
				{
					opcode: 'setAnimation',
					blockType: BlockType.COMMAND,
					text: 'Avvia animazione[ANIMATION]',
					arguments: {
						ANIMATION: {
							menu: 'mAnimation',
							defaultValue: ArduinoAnimations[1]
						}
					}
				},
				
				{
					opcode: 'on_nLed',
					blockType: BlockType.COMMAND,
					text: 'Accendi[N_LED]LED',
					arguments: {
						N_LED: {
							type: ArgumentType.NUMBER,
							defaultValue: 10
						}
					}
				},
				
				{
					opcode: 'move_nLed',
					blockType: BlockType.COMMAND,
					text: 'Sposta LED di [N_MOVE] a [DIR]',
					arguments: {
						N_MOVE: {
							type: ArgumentType.NUMBER,
							defaultValue: 2
						},
						DIR: {
							menu: 'mDirections',
							defaultValue: ArduinoDirections[0]
						}
					}
				},
				
				{
					opcode: 'setRGBtoColor',
					blockType: BlockType.COMMAND,
					text: 'Imposta[RGB_N]al colore[COLOR]',
					arguments: {
						RGB_N: {
							menu: 'mRGBn',
							defaultValue: ArduinoRGBn[0]
						},
						COLOR: {
							type: ArgumentType.COLOR,
							defaultValue: '#c700ff'
						}
					}
				},
				
				{
					opcode: 'setRandomRGB',
					blockType: BlockType.COMMAND,
					text: 'Un colore a caso per[RGB_N]',
					arguments: {
						RGB_N: {
							type: ArgumentType.STRING,
							menu: 'mRGBn',
							defaultValue: ArduinoRGBn[0]
						}
					}
				},

				{
					opcode: 'setColorOfRGB',
					blockType: BlockType.COMMAND,
					text: 'Imposta[RGB_CH][RGB_N]a[COLOR_VAL]',
					arguments: {
						RGB_CH: {
							type: ArgumentType.STRING,
							menu: 'mRGBch',
							defaultValue: ArduinoRGBch[0]
						},
						RGB_N: {
							type: ArgumentType.STRING,
							menu: 'mRGBn',
							defaultValue: ArduinoRGBn[0]
						},
						COLOR_VAL: {
							type: ArgumentType.NUMBER,
							defaultValue: 100
						}
					}
				},
				{
					opcode: 'addToColorOfRGB',
					blockType: BlockType.COMMAND,
					text: 'Modifica[RGB_CH][RGB_N]di[VAL]',
					arguments: {
						RGB_CH: {
							type: ArgumentType.STRING,
							menu: 'mRGBch',
							defaultValue: ArduinoRGBch[0]
						},
						RGB_N: {
							type: ArgumentType.STRING,
							menu: 'mRGBn',
							defaultValue: ArduinoRGBn[0]
						},
						VAL: {
							type: ArgumentType.NUMBER,
							defaultValue: 5
						}
					}
				},		
				
				//{opcode: 'doNothing3',blockType: BlockType.HAT,text: 'MP3 Player                         ', func: 'doNothing'},
				
				{
					opcode: 'setDFPVolume',
					blockType: BlockType.COMMAND,
					text: 'Volume MP3 Player:[VOLUME]',
					arguments: {						
						VOLUME: {
							type: ArgumentType.NUMBER,
							defaultValue: 20
						}
					}
				},
				
				{
					opcode: 'setDFPSong',
					blockType: BlockType.COMMAND,
					text: 'Suona canzone n°[SONG]',
					arguments: {						
						SONG: {
							type: ArgumentType.NUMBER,
							defaultValue: 5
						}
					}
				},
				
				{
					opcode: 'controlDFPlayer',
					blockType: BlockType.COMMAND,
					text: 'Controlla MP3 player[DFP_CMD]',
					arguments: {						
						DFP_CMD: {
							type: ArgumentType.STRING,
							menu: 'mMusicDFP',
							defaultValue: ArduinoDFPlayer[0]
						}
					}
				},
					
				
			],
			
			menus: {
				//mConnection: this._formatMenu(ArduinoConnectionState),
				mBoolVal:    this._formatMenu(ArduinoBoolValues),
				mDigitalIn:  this._formatMenu(ArduinoDigitalIn),	
				mAnalogIn:   this._formatMenu(ArduinoAnalogIn),
				//mAnalogOut:  this._formatMenu(ArduinoAnalogOut),
				mRGBn:		 this._formatMenu(ArduinoRGBn),
				mRGBch:		 this._formatMenu(ArduinoRGBch),
				mServos: 	 this._formatMenu(ArduinoServos),
				mMusicDFP:	 this._formatMenu(ArduinoDFPlayer),	
				mAnimation:  this._formatMenu(ArduinoAnimations),
				mDirections: this._formatMenu(ArduinoDirections)
			}
		};
	}		
	
	doNothing(){
		return;
	}
	
	on_nLed(args){
		let n_led =  Cast.toNumber(args.N_LED); 		
		return this._sendWsData(SET_ANIM, LEDS_ON, n_led);
	}
	
	move_nLed(args){
		let n_pos =  Cast.toNumber(args.N_MOVE);
		let dir = ArduinoDirections.indexOf(args.DIR);
		return this._sendWsData(SET_ANIM, LEDS_MOVE, n_pos, dir);
	}
	
	setAnimation(args){
		let anim_name = args.ANIMATION; 
		let anim_num = ArduinoAnimations.indexOf(anim_name);
		return this._sendWsData(SET_ANIM, ANIM_NUM, anim_num);
	}
		
	controlDFPlayer(args){
		let cmd = args.DFP_CMD; 
		let msg = 0x00;		
		switch(cmd) {
		  case ArduinoDFPlayer[0]:
			msg = PLAY;
			break;
		  case ArduinoDFPlayer[1]:
			msg = PAUSE;
			break;
		  case ArduinoDFPlayer[2]:
			msg = NEXT;
			break;
		  case ArduinoDFPlayer[2]:
			msg = PREV;
			break;
		}
		return this._sendWsData(DFP_MSG, msg, 0x00);
	}
	
	setDFPVolume(args){
		let volume = Cast.toNumber(args.VOLUME);
		return this._sendWsData(DFP_MSG, VOLUME, volume);
	}
	
	setDFPSong(args){
		let song = Cast.toNumber(args.SONG);
		return this._sendWsData(DFP_MSG, PLAY_SONG, song);		
	}
	
	ifConnected(args){
		let val = args.CONNECTION; 
		let res = false;
		if (this.ws.readyState)
			res = true;
		if( val == ArduinoConnectionState[1])
			res = ! res;
		return res;
	}
	
	// inByte = ( digitalRead(inPins[i]) << i) | inByte;
	ifDigitalRead(args){		
		//console.log(RGB1);
		//console.log(RGB2);
		let pin_name = Cast.toString(args.DIGITAL_IN);
		let pin = ArduinoDigitalIn.indexOf(pin_name);
		let pattern = (0x01 << pin);
		let result = (pattern & DigitalInByte);
		let state = false;
		if (pattern == result)
			state = true;		
		if (args.BOOL_VAL == ArduinoBoolValues[0])
			state = !state;		
		return state;
	}
	
	analogRead(args) {		
		if(args.ANALOG_IN === ArduinoAnalogIn[0])
			return  Cast.toNumber(PotValue);
		else
			return Cast.toNumber(LightValue);
	}
	
	distance() {
		let dist = Cast.toNumber(Distance);		
		if(dist <= 255)
			return  dist;
	}

	analogWrite(args) {
		let pin = Cast.toNumber(args.ANALOG_OUT);
		let val = Cast.toNumber(args.PWM_VALUE);
		val = mapValues(val, 0, 100, 0, 255);
		return this._sendWsData(SET_PWM, pin, val);
	}
	
	servoWritePos(args) {
		let pin = (args.SERVO_N == ArduinoServos[0]) ? 1 : 2;
		let actualPos = args.SERVO_N == ArduinoServos[0] ? Servo1Pos : Servo2Pos;
		let newPos = Cast.toNumber(args.POS_VAL);
		//console.log(newPos, actualPos);
		if (newPos != actualPos)
			return this._sendWsData(SET_SERVO, pin, newPos);
	}
	
	servoMovePos(args) {
		let pin = (args.SERVO_N == ArduinoServos[0]) ? 1 : 2;
		let actualPos = args.SERVO_N == ArduinoServos[0] ? Servo1Pos : Servo2Pos;
		let newPos = actualPos + Cast.toNumber(args.POS_VAL);
		//console.log(newPos, actualPos);
		if (actualPos > 180)
			actualPos = 180;
		if (actualPos < 0)
			actualPos = 0;
		if (newPos != actualPos)
			return this._sendWsData(SET_SERVO, pin, newPos);
	}

	setRGBtoColor (args) {
		let rgb_n = (args.RGB_N == 'RGB1') ? 1:2;
		let rgb = Cast.toRgbColorObject(args.COLOR);				
		var RGB;
		(rgb_n == 1) ? RGB = RGB1 : RGB = RGB2;
		let r = rgb.r;
		let g = rgb.g;
		let b = rgb.b;
		return this._sendWsData(SET_RGB, rgb_n, r, g, b);
	}
	
	setColorOfRGB (args) {
		let rgb_n = (args.RGB_N == 'RGB1') ? 1:2;
		let ch_type = args.RGB_CH;
		let ch_val = Cast.toNumber(args.COLOR_VAL);
		ch_val = mapValues(ch_val, 0, 100, 0, 255);		
		
		var RGB;
		(rgb_n == 1) ? RGB = RGB1 : RGB = RGB2;
		if(ch_type == ArduinoRGBch[0])
			RGB.r = ch_val;
		else if(ch_type == ArduinoRGBch[1])
			RGB.g = ch_val;
		else if(ch_type == ArduinoRGBch[2])
			RGB.b = ch_val;
			
		return this._sendWsData(SET_RGB, rgb_n, RGB.r, RGB.g, RGB.b);	
	}
	
	addToColorOfRGB (args) {
		let rgb_n = (args.RGB_N == 'RGB1') ? 1:2;
		let ch_type = args.RGB_CH;
		let add_val = Cast.toNumber(args.VAL);		
		
		var RGB;
		(rgb_n == 1) ? RGB = RGB1 : RGB = RGB2;
		
		if(ch_type == ArduinoRGBch[0])
			RGB.r = Math.abs((RGB.r + add_val)%256);
		else if(ch_type == ArduinoRGBch[1])
			RGB.g = Math.abs((RGB.g + add_val)%256);
		else if(ch_type == ArduinoRGBch[2])
			RGB.b = Math.abs((RGB.b + add_val)%256);

		return this._sendWsData(SET_RGB, rgb_n, RGB.r, RGB.g, RGB.b);	
	}
	
	setRandomRGB (args){		
		let rgb_n = (args.RGB_N == 'RGB1') ? 1:2;
		var RGB;
		(rgb_n == 1) ? RGB = RGB1 : RGB = RGB2;		
		RGB.r = Math.floor(Math.random() * 256); 
		RGB.g = Math.floor(Math.random() * 256); 
		RGB.b = Math.floor(Math.random() * 256); 
		return this._sendWsData(SET_RGB, rgb_n, RGB.r, RGB.g, RGB.b);	
	}
	
	
	/**
     * Formats menus into a format suitable for block menus, and loading previously
     * saved projects:
     * [
     *   {
     *    text: label,
     *    value: index
     *   },
     *   {
     *    text: label,
     *    value: index
     *   },
     *   etc...
     * ]
     *
     * @param {array} menu - a menu to format.
     * @return {object} - a formatted menu as an object.
     * @private
     */	
	_formatMenu (menu) {
        const m = [];
        for (let i = 0; i < menu.length; i++) {
            const obj = {};
            obj.text = menu[i];
            //obj.value = menu[i]; //i.toString();			
            m.push(obj);
        }
        return m;
	}
	
	/* openSocket(), set ping timings and connection status */
	_openSocket() {
		console.log('WebSocket connection: ', this.ws.readyState);
	}
	/* closeSocket() */
	_closeSocket() {
		console.log('WebSocket connection: ', this.ws.readyState);
	}
	/* errorSocket() */
	_errorSocket(err) {
		console.log(err);	
	}
	
	_sendWsData(cmd, elem, par1, par2 =0, par3=0, par4=0) {
		mils = millis();
		var msg = [START_SYS, cmd, elem, par1, par2, par3, par4, END_SYS];
		var computed_crc = crc.compute(msg);
		msg.push(computed_crc >> 8);
		msg.push(computed_crc & 0xFF);
		//console.log( mils, this.lastMillis )
		if(mils - this.lastMillis > 5){
			this.lastMillis = mils;
			this.ws.send(msg);
			console.log(msg);
		}
		
	}
	
	/* get called whenever there is new Data from the ws server. */
    _getWsData(msg) {
		dataArray = JSON.parse(msg.data);
		//console.log(msg);
		try {
			DigitalInByte = dataArray.data[1];
			Distance = dataArray.data[2];
			PotValue = dataArray.data[3];
			LightValue = dataArray.data[4];
			Servo1Pos = dataArray.data[5];
			Servo2Pos = dataArray.data[6];			
			RGB1.r = dataArray.data[7];
			RGB1.g = dataArray.data[8];
			RGB1.b = dataArray.data[9];
			RGB2.r = dataArray.data[10];
			RGB2.g = dataArray.data[11];
			RGB2.b = dataArray.data[12];
			
		}
		catch(err){;}	
	}
}

module.exports = Scratch3ArduinoBlocks;