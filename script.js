var loop;
var commandData = {
	"print": 1,
	"var": 3,
	"if": 3,
	"not": 3,
	"input": 3,
	"goto": 1,
	"set": 3
}

var user = document.getElementById("code");
var overlay = document.getElementById("overlay");

function interface() {
	var userSplit = getUserCode();

	execute(userSplit, [false]);
}

function handleTextarea() {
	overlay.innerHTML = user.value;
}

var memory = {
	variables: {},
	labels: {}
}

// Return to a line (memory set required)
// [true, 4]
function execute(code, returnData) {
	var l;
	if (!returnData[0]) {
		memory.labels = {};
		memory.variables = {
			"space": " ",
			"blank": ""
		};

		// Add in labels
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
		l = returnData[1];
	}

	// var l = 0;
	// loop = setInterval(function() {
	// 	if (l == code.length) {
	// 		clearInterval(loop);
	// 		return;
	// 	}

	for (l = l; l < code.length; l++) {

		var parsed = parseUntil(code[l]);
		var parts = parsed.parts;

		if (code[l][0] != '#' && code[l][0] != ':' && code[l] != '') {
			var test = {
				"print": parts[0] == "print",
				"var": parts[0] == "var",
				"if": parts[0] == "if",
				"input": parts[0] == "input",
				"stop": parts[0] == "stop",
				"goto": parts[0] == "goto",
				"return": parts[0] == "return",
				"set": parts[0] == "set"
			}

			if (test["print"]) {
				terminal.message(parseString(parts[1]));
			} else if (test["if"]) {
				var first = parseRaw(parts[1]);
				var findColon = colonData(parseString(parts[3]));

				if (first == findColon[0]) {
					l = gotoLine(findColon[1], l);
				}
			} else if (parts[2] == '=') {
				var stringParsed = parseString(parts[3]);
				if (test["var"]) {
					memory.variables[parts[1]] = parseString(stringParsed);
				} else if (test["input"]) {
					// Call back to the interpreter
					terminal.ask(stringParsed, function(output) {
						memory.variables[parts[1]] = output;
						execute(getUserCode(), [true, l + 1]);
					});

					return;
				} else if (test["set"]) {
					memory.variables[parts[1]] = parseString(stringParsed);
				}
			} else if (test["goto"]) {
				l = gotoLine(parts[1], l);
			} else if (test["stop"]) {
				return;
			} else if (test["return"]) {
				l = memory.labels[parts[1]].lastUsed;
			} else {
				terminal.message("error", code[l]);
			}
		}

	//	l++
	//}, 1);

	}
}

function gotoLine(name, l) {
	var data = memory.labels[name];
	data.lastUsed = l;
	return data.line;
}

function getUserCode() {
	return user.value.split("\n");
}

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
	var tryFunction = parseUntil(raw).parts;

	var test = {
		"random": tryFunction[0] == "random",
		"add": tryFunction[0] == "add",
		"len": tryFunction[0] == "len"
	}

	if (test.random || test.add) {
		tryFunction[1] = Number(tryVariable(tryFunction[1]));
		tryFunction[2] = Number(tryVariable(tryFunction[2]));

		if (tryFunction[0] == "random") {
			var min = tryFunction[1];
			var max = tryFunction[2];

			return Math.floor(Math.random() * max) + min;
		} else if (tryFunction[0] == "add") {
			var min = tryFunction[1];
			var max = tryFunction[2];

			return max + min;
		}
	} else if (test.len) {
		return tryVariable(tryFunction[1]).length;
	} else {
		return tryVariable(raw, tryBit);
	}
}

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

	if (string == "" || string[0] == '#') {
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
