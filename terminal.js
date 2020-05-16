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
		terminal.input.value = "";
	},

	reset: function() {
		terminal.return();
		terminal.beforeInput.innerHTML = terminal.defaultShell;

		terminal.input.onkeydown = function() {
			if (event.key == "Enter") {
				if (this.value == "run") {
					terminal.return();
					execute(getUserCode(), [false]);
				}
			}
		};
	}
}


window.onload = function () {
	terminal.terminal.onclick = function() {
		terminal.input.focus();
	}

	// Reset default input handler, prompt text,
	terminal.reset();

	terminal.message(`
		Corescript Html5 Terminal, type run.
	`);
}
