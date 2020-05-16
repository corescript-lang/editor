var terminal = {
	message: function(string) {
		terminal.content.innerHTML += "<span class='line'>" + string + "</span>";
	},

	ask: function(shell, callback) {
		terminal.beforeInput.innerHTML = shell;

		terminal.input.onkeydown = function(event) {
			if (event.key == "Enter") {
				terminal.message(terminal.beforeInput.innerHTML + this.value);

				terminal.reset();

				callback(this.value);
				this.value = "";
			}
		}
	},

	reset: function() {
		terminal.input.onkeydown = function() {};
		terminal.beforeInput.innerHTML = terminal.defaultShell;
	},

	terminal,
	content,
	input,
	beforeInput,
	defaultShell: ":"
}


window.onload = function () {
	terminal.content = document.getElementById("content");
	terminal.terminal = document.getElementById("terminal");
	terminal.input = document.getElementById("input");
	terminal.beforeInput = document.getElementById("beforeInput");

	terminal.terminal.onclick = function() {
		terminal.input.focus();
	}

	terminal.beforeInput.innerHTML = terminal.defaultShell;

	terminal.message(`
		Corescript Html5 Terminal, type run.
	`);
}
