// This file has basic executing functions for solely the interpreter.

var packages = [
	{
		execute: function(line, parts, l) {
			var lineLength = line.length;

			// If case, or input, parse third part
			var stringParsed;
			switch (parts[0]) {
				case "var":
				case "input":
				case "set":
					stringParsed = parseString(parts[3]);
					break;
			}

			switch (parts[0]) {
				case language["print"].t:
					terminal.message(parseString(parts[1]));
					return [l];

				case language["if"].t:
					var first = parseRaw(parts[1], interpreter.tryVariable, tryFunction);
					var findColon = colonData(parseString(parts[3]));

					// Find things inbetween colon ("hello:top")
					if (parts[2] == "=") {
						if (first == findColon[0]) {
							return interpreter.gotoLine(findColon[1], l);
						}
					} else if (parts[2] == "<") {
						if (Number(first) < Number(findColon[0])) {
							return interpreter.gotoLine(findColon[1], l);
						}
					} else if (parts[2] == ">") {
						if (Number(first) > Number(findColon[0])) {
							return interpreter.gotoLine(findColon[1], l);
						}
					}

					return [l];

				case language["var"].t:
					interpreter.variables[parts[1]] = parseString(stringParsed);
					return [l];

				case language["input"].t:
					// Create call back to the interpreter
					terminal.ask(stringParsed, function(output) {
						interpreter.variables[parts[1]] = output;
						execute(getUserCode(), [true, l + 1]);
					});

					return [l];

				case language["set"].t:
					interpreter.variables[parts[1]] = parseString(stringParsed);
					return [l];

				case language["goto"].t:
					return [interpreter.gotoLine(parts[1], l)];

				case language["stop"].t:
					return [-1, "kill"];

				case language["return"].t:
					return [interpreter.labels[parts[1]].lastUsed];

				default:
					// This is less spahgetti code than the last code,
					// But still not.. perfect.
					var testLastTwo = line.substring(lineLength - 2);
					var toIncrement = line.substring(0, lineLength - 2);

					// I don't like taking advantage of JS's recursive functions,
					// But I may as well..
					if (testLastTwo == "++") {
						interpreter.executeLine([
							"set " + toIncrement + " = (add " + toIncrement + " 1)"
						], 0);

						return [l];
					} else if (testLastTwo == "--") {
						interpreter.executeLine([
							"set " + toIncrement + " = (sub " + toIncrement + " 1)"
						], 0);

						return [l];
					} else {
						break;
					}
			}

			// Nothing worked, signal error
			return [-1, "comd err"];
		}
	}
]

function tryPackage(line, parts, l) {
	var lineLength = line.length;

	for (var p = 0; p < packages.length; p++) {
		var tryPackage = packages[p].execute(line, parts, l);

		// Package worked, return
		// Else, try the next one.
		if (tryPackage[0] != -1 || tryPackage[1] == "kill") {
			return tryPackage;
		}
	}

	// No packages worked, throw unknown error
	terminal.message("Error on line " + l + ": " + line);

	return [l];
}

// Try to parse a raw "function"
function tryFunction(parts) {
	var min, max;
	switch (parts[0]) {
		// Test for number functions
		case "add":
		case "rand":
		case "sub":
		case "mult":
		case "div":
			min = Number(interpreter.tryVariable(parts[1]));
			max = Number(interpreter.tryVariable(parts[2]));
	}

	switch (parts[0]) {
		case "add":
			return min + max;
		case "sub":
			return min - max;
		case "div":
			return min / max;
		case "mult":
			return min * max;
		case "rem":
			return min % max;
		case "rand":
			return Math.floor(Math.random() * max) + min;

		// Regular string functions
		case "len":
			return tryVariable(parts[1]).length;

		default:
			return false;
	}
}
