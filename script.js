var user = document.getElementById("code");
var overlay = document.getElementById("overlay");

// This is a minimal object to store
// data for both the interpreter and compiler.
// It is also used for languages.
var language = {
	"print": {
		string: true,
		t: "print",
		min: 2
	},
	"var": {
		string: true,
		t: "var",
		min: 4
	},
	"if": {
		string: true,
		t: "if",
		min: 4
	},
	"not": {
		string: true,
		t: "not",
		min: 4
	},
	"input": {
		string: true,
		t: "input",
		min: 4
	},
	"goto": {
		string: true,
		t: "goto",
		min: 2
	},
	"set": {
		string: true,
		t: "set",
		min: 4
	},
	"stop": {
		string: false,
		t: "stop",
		min: 1
	},
	"return": {
		string: true,
		t: "return",
		min: 2
	},
}

// Fastmode uses a JS setInterval loop vs a standard for loop.
// false is safer for recursion. (only for interpreter)
var settings = {
	fastMode: true
}

// These are global so that external functions
// Can access them. (only for interpreter)
var interpreter = {
	variables: {},
	labels: {},
	gotoTimes: 0,
	loop: 0,

	// Interpret a single line, goes to the interpreter.
	executeLine: function(code, l) {
		var parsed = parseUntil(code[l]);
		var parts = parsed.parts;

		if (parsed.ignore) {
			return [l];
		} else {
			return tryPackage(code[l], parts, l);
		}
	},

	gotoLine: function(name, l) {
		interpreter.gotoTimes++;

		var data = interpreter.labels[name];
		if (data === undefined) {
			return [-1, "Label not found"];
		}

		data.lastUsed = l;
		return [data.line];
	},

	// Attempt to grab a variable, if not, return false
	tryVariable: function(string, tryBit) {
		var tryVariable = interpreter.variables[string];
		if (tryVariable != undefined) {
			if (tryBit != null) {
				return tryVariable[tryBit[2]];
			} else {
				return tryVariable;
			}
		} else {
			return string;
		}
	},

	// Execute multiple lines, with a interpreter reset or not.
	// returnData: Return to a line (interpreter set required ([true, 4]))
	run: function(code, returnData) {
		var l;
		if (!returnData[0]) {
			interpreter.gotoTimes = 0;
			interpreter.labels = {};
			interpreter.variables = {
				"space": " ",
				"blank": "",
				"array": []
			};

			// Pre executing label finding
			for (l = 0; l < code.length; l++) {
				if (code[l][0] == ':') {
					interpreter.labels[code[l].substring(1)] = {
						line: l,
						lastUsed: 0
					};
				}
			}

			l = 0;
		} else {
			// Return with same interpreter, data, from parameter
			l = returnData[1];
		}

		// Both of these are kind of the same thing, and there is
		// Not a lot I can do to not repeat myself.
		if (settings.fastMode) {
			for (l = l; l < code.length; l++) {
				var executedResult = interpreter.executeLine(code, l);
				if (executedResult[1] == "kill") {
					break;
				}

				// Set l the returned line from the command.
				// It is the default one that we sent if not changed.
				l = executedResult[0];

				// A little bit of safety if something goes wrong.
				if (interpreter.gotoTimes > 1000) {
					terminal.message("Goto exceeded 1000, stopping program for safety.", "line");
					break;
				}
			}
		} else {
			interpreter.loop = setInterval(function() {
				if (l == code.length) {
					clearInterval(interpreter.loop);
					return;
				} else {
					var executedResult = interpreter.executeLine(code, l);
					if (executedResult[1] == "kill") {
						clearInterval(interpreter.loop);
					}

					l = executedResult[0];

					l++;
				}
			}, 1);
		}
	}
}

// Grab an array via the DOM
function getUserCode() {
	return user.value.split("\n");
}

// Parse entire string
function parseString(string) {
	var parseRegex = /\(([^\(\)]+)\)/gm;

	// Execute until no more variables are found
	var execute = [1];
	while (execute.length != 0) {
		execute = parseRegex.exec(string);
		if (execute === null) {
			return string;
		}

		string = string.replace(execute[0], parseRaw(
			execute[1],
			interpreter.tryVariable,
			tryFunction
		));
	}
}

// Parse raw functions, or varibles, without parenthesis.
// Requires a variable parser and a function parser, so it
// Can be used for compiling and interpreting.
function parseRaw(raw, variableParser, functionParser) {
	var bitRegex = /(.+)\[([0-9a-zA-Z]+)\]/gm;

	// Try to find [0] selector
	var tryBit = bitRegex.exec(raw);
	if (tryBit != null) {
		// Try to get the variable
		raw = variableParser(tryBit[1]);

		// Try to get variable inside the []
		raw = raw[variableParser(tryBit[2])];

		return raw;
	}

	// Try to parse it as a variable
	var tryFunctionParts = parseUntil(raw).parts;
	var tryOutput = functionParser(tryFunctionParts);

	if (tryOutput == -1) {
		return variableParser(raw, tryBit);
	} else {
		return tryOutput;
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
function parseUntil(string, customUntil) {
	var command = {
		parts: [],
		string: "",
		ignore: false,
	}

	var reading = "";
	var addPart = 0;

	// Simple way to set until to customUntil if it
	// is defined.
	var until;
	if (customUntil != undefined) {
		until = customUntil;
	} else {
		// A messy solution for telling checker to ignore
		until = -1;
	}

	if (string == "" || string[0] == '#' || string[0] == ":") {
		command.ignore = true;
	} else {
		var inString = false;
		for (var c = 0; c < string.length; c++) {

			// We only have to parse by space for this
			if (string[c] == ' ') {
				// Check if we are in the string
				if (command.parts.length != until) {
					addPart = 2;
				}
			}

			// Add part if on last char in string
			if (c + 1 == string.length) {
				addPart = 1;
			}

			// Append char to reading
			// Addpart = 2 means that we don't append char
			if (addPart != 2) {
				reading += string[c];
			}

			// Add the read part to the parts array
			if (addPart != 0 && string.length != 0) {
				command.parts.push(reading);

				// We can use the minimum required parameters - 1
				// To check for the string, since the string is
				// always at the last part of the line
				if(command.parts.length == 1) {
					var tryFindCommand = language[reading];
					if (tryFindCommand != undefined) {
						until = language[reading].min - 1;
					}
				}

				// Reset for next part
				reading = "";
				addPart = 0;
			}
		}
	}

	return command;
}

// Some interface handlers
function interface() {
	var userSplit = getUserCode();

	interpreter.run(userSplit, [false]);
}

function handleTextarea() {
	overlay.innerHTML = user.value;
}
