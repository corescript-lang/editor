var commandData = {
	"print": 1,
	"var": 3,
	"if": 3,
	"not": 3,
	"input": 3,
	"goto": 1,
	"set": 3
}

var loop;

function interface() {
	var user = document.getElementById("code");
	user = user.value.split("\n");

	execute(user);
}

var memory = {
	variables: {},
	labels: {}
}

function execute(code) {
	memory.labels = {};
	memory.variables = {
		"space": " ",
		"blank": ""
	};

	// Add in labels
	for (var l = 0; l < code.length; l++) {
		if (code[l][0] == ':') {
			memory.labels[code[l].substring(1)] = l;
		}
	}

	var l = 0;
	loop = setInterval(function() {
		if (l == code.length) {
			clearInterval(loop);
			return;
		}

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
				"set": parts[0] == "set"
			}

			if (test["print"]) {
				console.log(parseString(parts[1]));
			} else if (test["if"]) {
				var first = parseRaw(parts[1]);
				var findColon = colonData(parseString(parts[3]));

				if (first == findColon[0]) {
					l = memory.labels[findColon[1]];
				}
			} else if (parts[2] == '=') {
				var stringParsed = parseString(parts[3]);
				if (test["var"]) {
					memory.variables[parts[1]] = parseString(stringParsed);
				} else if (test["input"]) {
					memory.variables[parts[1]] = prompt(stringParsed);
				} else if (test["set"]) {
					memory.variables[parts[1]] = parseString(stringParsed);
				}
			} else if (test["goto"]) {
				l = memory.labels[parts[1]];
			} else if (test["stop"]) {
				return;
			} else {
				console.log("error", code[l]);
			}
		}

		l++
	}, 1);
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
		return string
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

	// A messy solution for
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
