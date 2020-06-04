var terminal = {
	content: document.getElementById("content"),
	terminal: document.getElementById("terminal"),
	input: document.getElementById("input"),
	beforeInput: document.getElementById("beforeInput"),
	defaultShell: ":",

	// Change class to work as as display block or not. (line/text)
	message: function(string, className) {
		var span = document.createElement("span");
		span.className = className;
		span.innerHTML = string;
		terminal.content.appendChild(span);
	},

	ask: function(shell, callback) {
		terminal.beforeInput.innerHTML = shell;
		terminal.input.value = "";

		terminal.input.onkeydown = function(event) {
			if (event.key == "Enter") {
				terminal.reset();
				callback(terminal.input.value);
			}
		}
	},

	return: function() {
		terminal.message(terminal.beforeInput.innerHTML + terminal.input.value, "line");
	},

	// Reset default input handler, prompt text,
	reset: function() {
		terminal.return();
		terminal.beforeInput.innerHTML = terminal.defaultShell;

		terminal.input.onkeydown = function() {
			if (event.key == "Enter") {
				terminal.return();

				if (this.value == "run") {
					interpreter.run(getUserCode(), [false]);
				} else if (this.value == "compile") {
					compile(getUserCode());
				} else if (this.value == "fast") {
					settings.fastMode = true;
					terminal.message("Speed set to fast.", "line");
				} else if (this.value == "slow") {
					settings.fastMode = false;
					terminal.message("Speed set to slow.", "line");
				} else if (this.value == "memory") {
					terminal.message(JSON.stringify([
						interpreter.variables,
						interpreter.labels,
						interpreter.label,
						interpreter.gotoLines
					]), "line");
				} else if (this.value == "clear") {
					while (terminal.content.lastChild) {
						terminal.content.removeChild(terminal.content.lastChild);
					}
			   }
			}
		};
	}
}


window.onload = function () {
	terminal.terminal.onclick = function() {
		terminal.input.focus();
	}

	terminal.reset();

	terminal.message(`
		Corescript Html5 Terminal, type run.
	`, "line");
}
