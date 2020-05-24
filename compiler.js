var compiler = {
	minecraft: {
		compileLine: function(parsed, l, code) {
			var parts = parsed.parts;

			switch (parts[0]) {
				case language["print"].t:
					this.memory.toGenerate.push({
						text: `tellraw @a {"text": "` + parts[1] + `"}`,
						heightAdd: this.memory.nextHeightAdd,
						comment: code[l]
					});

					break;
				case language["var"].t:
					this.memory.requires["corescript"] = true;

					this.memory.toGenerate.push({
						text: `data modify storage minecraft:0 corescript.variables set value {"` + parts[1] + `":"` + parts[3] + `"}`,
						heightAdd: this.memory.nextHeightAdd,
						comment: code[l]
					});

					break;
				case "domath":
					this.memory.requires["math"] = true;

					this.memory.toGenerate.push({
						text: `scoreboard players set @a math ` + parts[1],
						heightAdd: this.memory.nextHeightAdd,
						comment: code[l]
					});

					this.memory.toGenerate.push({
						text: `scoreboard players set @a temp ` + parts[2],
						heightAdd: this.memory.nextHeightAdd,
						comment: code[l]
					});

					this.memory.toGenerate.push({
						text: `/scoreboard players operation @a math /= @a temp`,
						heightAdd: this.memory.nextHeightAdd,
						comment: code[l]
					});

					this.memory.toGenerate.push({
						text: `/tellraw @a {"score":{"name":"@a","objective":"math"}}`,
						heightAdd: this.memory.nextHeightAdd,
						comment: code[l]
					});

					break;
				case "printv":
					this.memory.requires["corescript"] = true;

					if (parts[1] == "add") {
						this.memory.toGenerate.push({
							text: `/tellraw @a {"storage":"minecraft:0","nbt":"corescript.variables.` + parts[1] +`"}`,
							heightAdd: this.memory.nextHeightAdd,
							comment: code[l]
						});
					}

					break;
				case language["goto"].t:
					// Right now, GOTO requires the label to already be stated.
					// For labels that havn't been declared, it can be set aside to be set once
					// it has been.
					if (this.memory.labelBlocks[parts[1]] != undefined) {
						var goDown = this.memory.currentHeight - this.memory.labelBlocks[parts[1]] + 2;

						this.memory.toGenerate.push({
							text: `setblock ~ ~-` + goDown + ` ~ redstone_block`,
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
					heightAdd: 0,
					comment: code[l]
				});

				// Reset for when this label is called again
				this.memory.toGenerate.push({
					"text": `setblock ~ ~-1 ~ air`,
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

		// Reset the "memory" before a run.
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

			// First, we add the init/deinit commands, like math scoreboards
			// And the Corescript storage object.
			var requiredArray = [];

			// If variables/data is used, create a "corescript" storage object
			if (this.memory.requires.corescript) {
				requiredArray.push({
					text:`data modify storage minecraft:0 corescript set value {"variables":{}}`,
					heightAdd: 0,
					comment: "-Init variable"
				});
			}

			// Create a "math" and "temp" scoreboard for math
			if (this.memory.requires.math) {
				requiredArray.push({
					text:`scoreboard objectives add temp dummy`,
					heightAdd: 0,
					comment: "-Init temp"
				});

				requiredArray.push({
					text:`scoreboard objectives add math dummy`,
					heightAdd: 0,
					comment: "-Init math"
				});
			}

			// Append the actual compiled commands to newly generated array
			requiredArray = requiredArray.concat(this.memory.toGenerate);

			// Delete everything we created so that it doesn't
			// clutter the world.
			if (this.memory.requires.math) {
				requiredArray.push({
					text:`scoreboard objectives remove temp`,
					heightAdd: 0,
					comment: "-Deinit temp"
				});

				requiredArray.push({
					text:`scoreboard objectives remove math`,
					heightAdd: 0,
					comment: "-Deinit math"
				});
			}

			// Same thing for the Corescript minecraft:0 storage.
			if (this.memory.requires.corescript) {
				requiredArray.push({
					text:`/data remove storage minecraft:0 corescript`,
					heightAdd: 0,
					comment: "-Deinit temp"
				});
			}

			var compiled = compileCommands(
				requiredArray, {
					comments: true,
					requires: this.memory.requires
				}
			);

			prompt("Copy this:", compiled);
		},

		// Unfinished function to parse a string into a tellraw command
		parseString: function(string) {
			var parseRegex = /(^[(]*([^\(\)]+)[)]*)/gm;
			var parsed = [];

			var tryParse = parseRegex.exec(string);
			while (tryParse != null) {
				// Get the first and last chars
				var first = tryParse[0][0];
				var last = tryParse[0][tryParse[0].length - 1];

				// Check if it is inside parenthesis
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

		// This is temporary code. Probably.
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
