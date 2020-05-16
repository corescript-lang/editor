var user = document.getElementById("code");
var overlay = document.getElementById("overlay");

var commandData = {
	"print": 1,
	"var": 3,
	"if": 3,
	"not": 3,
	"input": 3,
	"goto": 1,
	"set": 3
}

var settings = {
	fastMode: true
}

// These are global so that external functions
// Can access them.
var loop;
var memory = {
	variables: {},
	labels: {},
	gotoTimes: 0
}

// Execute multiple lines, with a memory reset or not.
// returnData: Return to a line (memory set required ([true, 4]))
function execute(code, returnData) {
	var l;
	if (!returnData[0]) {
		memory.labels = {};
		memory.variables = {
			"space": " ",
			"blank": ""
		};

		// Pre executing label finding
		for (var l = 0; l < code.length; l++) {
			if (code[l][0] == ':') {
				memory.labels[code[l].substring(1)] = {
					line: l,
					lastUsed: 0
				};
			}
		}

		l = 0;
	} else {
		// Return with same memory, data, from parameter
		l = returnData[1];
	}

	if (settings.fastMode) {
		for (l = l; l < code.length; l++) {
			l = executeLine(code, l);

			if (memory.gotoTimes > 500) {
				break;
				terminal.write("Goto exceeded 500, stopping program for safety.");
			}
		}
	} else {
		loop = setInterval(function() {
			if (l == code.length) {
				clearInterval(loop);
				return;
			} else {
				l = executeLine(code, l);
				l++;
			}
		}, 1);
	}
}

// Execute a single line
function executeLine(code, l) {
	var parsed = parseUntil(code[l]);
	var parts = parsed.parts;

	if (parsed.ignore) {
		return l;
	} else {
		return tryPackage(code[l], parts, l);
	}
}

// Function for executing to not repeat myself
function gotoLine(name, l) {
	var data = memory.labels[name];
	data.lastUsed = l;
	memory.gotoTimes++;
	return data.line;
}

// Grab an array via the DOM
function getUserCode() {
	return user.value.split("\n");
}

// Parse raw statements, like trying functions,
function parseRaw(raw) {
	var bitRegex = /(.+)\[([0-9a-zA-Z]+)\]/gm;

	// Try to find [0] selector
	var tryBit = bitRegex.exec(raw);
	if (tryBit != null) {
		raw = tryVariable(tryBit[1]);
		raw = raw[tryVariable(tryBit[2])];
		return raw;
	}

	// Try to parse it as a variable
	var tryFunctionParts = parseUntil(raw).parts;
	var tryOutput = tryFunction(tryFunctionParts);

	if (!tryOutput) {
		return tryVariable(raw, tryBit);
	} else {
		return tryOutput;
	}
}

// Attempt to grab a variable, if not, return false
function tryVariable(string, tryBit) {
	var tryVariable = memory.variables[string];
	if (tryVariable != undefined) {
		if (tryBit != null) {
			return tryVariable[tryBit[2]];
		} else {
			return tryVariable;
		}
	} else {
		return string;
	}
}

function parseString(string) {
	var parseRegex = /\(([^\(\)]+)\)/gm;

	var execute = [1];
	while (execute.length != 0) {
		execute = parseRegex.exec(string);
		if (execute === null) {
			return string;
		}

		string = string.replace(execute[0], parseRaw(execute[1]));
	}
}

// Find colon backwards when needed, and return the split result
function colonData(string) {
	for (var c = string.length - 1; c > 0; c--) {
		if (string[c] == ':') {
			return [
				string.substring(0, c),
				string.substring(c + 1)
			];
		}
	}
}

// Split line until we reach a certain point. This is done because in
// Corescript 0, scrings are always the last thing, with an exception
// for if statements "if name = Jim:stop"
function parseUntil(string) {
	var command = {
		parts: [],
		ignore: false,
	}

	var reading = "";
	var addPart = 0;

	// A messy solution for telling checker to ignore
	var until = -1;

	if (string == "" || string[0] == '#' || string[0] == ":") {
		command.ignore = true;
	} else {
		for (var c = 0; c < string.length; c++) {
			if (string[c] == ' ') {
				if (command.parts.length != until) {
					addPart = 2;
				}
			}

			// Add part if on last char in string
			if (c + 1 == string.length) {
				addPart = 1;
			}

			// Append char to reading
			if (addPart != 2) {
				reading += string[c];
			}

			// Add the read part to the parts array
			if (addPart != 0 && string.length != 0) {
				command.parts.push(reading);

				if(command.parts.length == 1) {
					until = commandData[reading];
				}

				reading = "";
				addPart = 0;
			}
		}
	}

	return command;
}

function interface() {
	var userSplit = getUserCode();

	execute(userSplit, [false]);
}

function handleTextarea() {
	overlay.innerHTML = user.value;
}
