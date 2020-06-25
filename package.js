// This file has basic executing functions for solely the interpreter.

var packages = [
	{
		execute: function(line, parts, l) {
			var lineLength = line.length;

			switch (parts[0]) {
				case language["print"].t:
					terminal.message(parseString(parts[1]), "line");
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
					interpreter.variables[parts[1]] = parseString(parts[3]);
					return [l];

				case language["input"].t:
					// Create call back to the interpreter
					terminal.ask(parseString(parts[3]), function(output) {
						interpreter.variables[parts[1]] = output;
						interpreter.run(getUserCode(), [true, l + 1]);
					});

					return [-1, "kill"];

				case language["set"].t:
					interpreter.variables[parts[1]] = parseString(parts[3]);
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
			// In this case, the second part is ignored.
			return [-1, ""];
		}
	},
	{
		execute: function(line, parts, l) {
			//var parts = parseUntil(line, 2);
			//.log(parts)
			switch (parts[0]) {
				case "add":
					console.log(l)
					var variable = interpreter.variables[parts[1]];
					interpreter.variables[parts[1]][variable.length - 1] = parseString(parts[2]);

					return [l];
			}

			return [-1, ""];
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
	terminal.message("Error on line " + l + ": " + line, "line");

	return [l];
}

// Try to parse a raw "function"
function tryFunction(parts) {
	switch (parts[0]) {
		case "len":
			return interpreter.tryVariable(parts[1]).length;
	}

	var min, max;
	if (parts.length > 2) {
		max = Number(interpreter.tryVariable(parts[2]));
	}

	if (parts.length > 1) {
		min = Number(interpreter.tryVariable(parts[1]));
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
		case "sin":
			return Math.sin(min);
		default:
			return -1;
	}
}
