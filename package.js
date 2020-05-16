function tryPackage(line, parts, l) {
	var lineLength = line.length;

	var stringParsed;
	switch (parts[0]) {
		// If case, or input, parse third part
		case "var":
		case "input":
		case "set":
			stringParsed = parseString(parts[3]);
			break;
	}

	switch (parts[0]) {
		case "print":
			terminal.message(parseString(parts[1]));
			break;
		case "if":
			var first = parseRaw(parts[1]);
			var findColon = colonData(parseString(parts[3]));

			// Find things inbetween colon ("hello:top")
			if (parts[2] == "=") {
				if (first == findColon[0]) {
					return gotoLine(findColon[1], l);
				}
			} else if (parts[2] == "<") {
				if (Number(first) < Number(findColon[0])) {
					return gotoLine(findColon[1], l);
				}
			} else if (parts[2] == ">") {
				if (Number(first) > Number(findColon[0])) {
					return gotoLine(findColon[1], l);
				}
			}

			return l;

		case "var":
			memory.variables[parts[1]] = parseString(stringParsed);
			break;

		case "input":
			// Create call back to the interpreter
			terminal.ask(stringParsed, function(output) {
				memory.variables[parts[1]] = output;
				execute(getUserCode(), [true, l + 1]);
			});

			break;

		case "set":
			memory.variables[parts[1]] = parseString(stringParsed);
			break;
		case "goto":
			return gotoLine(parts[1], l);
		case "stop":
			return;
		case "return":
			return memory.labels[parts[1]].lastUsed;
		default:
			var testLastTwo = line.substring(lineLength - 2);
			var toIncrement = line.substring(0, lineLength - 2);

			// I don't like taking advantage of JS's recursive functions,
			// But I may as well..
			if (testLastTwo == "++") {
				executeLine([
					"set " + toIncrement + " = (add " + toIncrement + " 1)"
				], 0);
			} else if (testLastTwo == "--") {
				executeLine([
					"set " + toIncrement + " = (sub " + toIncrement + " 1)"
				], 0);
			} else {
				terminal.message("Error on line" + l + ": " + line);
			}

	}

	return l;
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
			min = Number(tryVariable(parts[1]));
			max = Number(tryVariable(parts[2]));
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
