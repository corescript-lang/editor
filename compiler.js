var compiler = {
	minecraft: {
		compileLine: function(parsed, l, code) {
			var type = "chain";
			var parts = parsed.parts;

			// If jumping, then set type to regular (not chain)
			if (this.memory.nextHeightAdd > 0) {
				type = "regular";
			}

			switch (parts[0]) {
				case language["print"].t:
					this.memory.toGenerate.push({
						text: `tellraw @a {"text": "` + parts[1] + `"}`,
						type: type,
						heightAdd: this.memory.nextHeightAdd,
						comment: code[l]
					});

					break;
				case language["var"].t:
					this.memory.requires["corescript"] = true;

					this.memory.toGenerate.push({
						text: `data modify storage minecraft:0 corescript.variables set value {"` + parts[1] + `":"` + parts[3] + `"}`,
						type: type,
						heightAdd: this.memory.nextHeightAdd,
						comment: code[l]
					});

					break;
				case "domath":
					this.memory.requires["math"] = true;

					this.memory.toGenerate.push({
						text: `scoreboard players set @a math ` + parts[1],
						type: type,
						heightAdd: this.memory.nextHeightAdd,
						comment: code[l]
					});

					this.memory.toGenerate.push({
						text: `scoreboard players set @a temp ` + parts[2],
						type: type,
						heightAdd: this.memory.nextHeightAdd,
						comment: code[l]
					});

					this.memory.toGenerate.push({
						text: `/scoreboard players operation @a math /= @a temp`,
						type: type,
						heightAdd: this.memory.nextHeightAdd,
						comment: code[l]
					});

					this.memory.toGenerate.push({
						text: `/tellraw @a {"score":{"name":"@a","objective":"math"}}`,
						type: type,
						heightAdd: this.memory.nextHeightAdd,
						comment: code[l]
					});

					break;
				case "printv":
					this.memory.requires["corescript"] = true;

					if (parts[1] == "add") {
						this.memory.toGenerate.push({
							text: `/tellraw @a {"storage":"minecraft:0","nbt":"corescript.variables.` + parts[1] +`"}`,
							type: type,
							heightAdd: this.memory.nextHeightAdd,
							comment: code[l]
						});
					}

					break;
				case language["goto"].t:
					if (this.memory.labelBlocks[parts[1]] != undefined) {
						var goDown = this.memory.currentHeight - this.memory.labelBlocks[parts[1]] + 2;

						this.memory.toGenerate.push({
							text: `setblock ~ ~-` + goDown + ` ~ redstone_block`,
							type: type,
							heightAdd: this.memory.nextHeightAdd,
							comment: code[l]
						});
					}
			}

			// Labels require the next block to to go up two
			this.memory.nextHeightAdd = 0;
			if (code[l][0] == ":") {
				this.memory.labelBlocks[code[l].substring(1)] = l;

				// Activate the label, since we put a space between them.
				// The next command will remove that block.
				this.memory.toGenerate.push({
					text: `setblock ~ ~1 ~ redstone_block`,
					type: type,
					heightAdd: 0,
					comment: code[l]
				});

				// Reset for when this label is called again
				this.memory.toGenerate.push({
					"text": `setblock ~ ~-1 ~ air`,
					type: "regular",
					heightAdd: 1,
					comment: "-Reset label"
				});
			}

			// Keep up to date with the current height
			this.memory.currentHeight = this.memory.nextHeightAdd + l;
		},
		memory: {
			nextHeightAdd: 0,
			currentHeight: 0,

			labels: {},
			labelBlocks: {},

			toGenerate: [],
			requires: {}
		},

		reset: function() {
			this.memory.toGenerate = [];
			this.memory.nextHeightAdd = 0;
			this.memory.currentHeight = 0;

			this.memory.labels = {};
			this.memory.labelBlocks = {};

			this.memory.requires = {
				corescript: false,
				math: false
			}
		},

		finished: function() {
			var requiredArray = [];

			var compiled = compileCommands(
				this.memory.toGenerate, {
					comments: true,
					requires: this.memory.requires
				}
			);
			prompt("Copy this:", compiled);
		},

		parseString: function(string) {
			var parseRegex = /(^[(]*([^\(\)]+)[)]*)/gm;
			var parsed = [];

			var tryParse = parseRegex.exec(string);
			while (tryParse != null) {
				// Get the first and last chars
				var first = tryParse[0][0];
				var last = tryParse[0][tryParse[0].length - 1];

				if (first == "(" && last == ")") {
					parsed.push(this.parseRaw(tryParse[2]));
				} else {
					parsed.push(tryParse[2]);
				}

				string = string.replace(tryParse[0], "");

				tryParse = parseRegex.exec(string);
				console.log(tryParse);
			}

			return parsed;
		},

		// This is temporary code. Maybe. I don't know.
		parseRaw: function(string) {
			var integer = parseInt(string);

			if (isNaN(integer)) {
				return `{"storage":"minecraft:0","nbt":"corescript.` + string + `.name"}`;
			} else {
				return string;
			}
		}
	}
}

function compile(code) {
	compiler.minecraft.reset();

	// Store variables
	var labels = {}
	for (var l = 0; l < code.length; l++) {
		if (code[l][0] == ':') {
			labels[code[l].substring(1)] = l;
		}
	}

	compiler.minecraft.memory.labels = labels;

	// compile each line
	for (var l = 0; l < code.length; l++) {
		var parsed = parseUntil(code[l]);

		compiler.minecraft.compileLine(parsed, l, code);
	}

	// Run finished(), the cherry on top
	compiler.minecraft.finished();
}
