var terminal = {
	content: document.getElementById("content"),
	terminal: document.getElementById("terminal"),
	input: document.getElementById("input"),
	beforeInput: document.getElementById("beforeInput"),
	defaultShell: ":",

	message: function(string) {
		terminal.content.innerHTML += "<span class='line'>" + string + "</span>";
	},

	ask: function(shell, callback) {
		terminal.beforeInput.innerHTML = shell;

		terminal.input.onkeydown = function(event) {
			if (event.key == "Enter") {

				callback(terminal.input.value);
				terminal.reset();
			}
		}
	},

	return: function() {
		terminal.message(terminal.beforeInput.innerHTML + terminal.input.value);

	},

	// Reset default input handler, prompt text,
	reset: function() {
		terminal.return();
		terminal.beforeInput.innerHTML = terminal.defaultShell;

		terminal.input.onkeydown = function() {
			if (event.key == "Enter") {
				terminal.return();

				if (this.value == "run") {
					execute(getUserCode(), [false]);
				} else if (this.value == "fast") {
					settings.fastMode = true;
					terminal.message("Speed set to fast.");
				} else if (this.value == "slow") {
					settings.fastMode = false;
					terminal.message("Speed set to slow.");
				} else if (this.value == "memory") {
					terminal.message(JSON.stringify(memory));
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
	`);
}
