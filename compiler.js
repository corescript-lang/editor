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
						"text": `tellraw @a {"text": "` + parts[1] +`"}`,
						type: type,
						heightAdd: this.memory.nextHeightAdd,
						comment: code[l]
					});

					break;
				case language["var"].t:
					this.memory.toGenerate.push({
						"text": `data modify storage minecraft:0 corescript.variables set value {"` + parts[1] + `":"` + parts[3] + `"}`,
						type: type,
						heightAdd: this.memory.nextHeightAdd,
						comment: code[l]
					});

					break;
				case "domath":
					this.memory.toGenerate.push({
						"text": `scoreboard players set @a math ` + parts[1],
						type: type,
						heightAdd: this.memory.nextHeightAdd,
						comment: code[l]
					});

					this.memory.toGenerate.push({
						"text": `scoreboard players set @a temp ` + parts[2],
						type: type,
						heightAdd: this.memory.nextHeightAdd,
						comment: code[l]
					});

					this.memory.toGenerate.push({
						"text": `/scoreboard players operation @a math /= @a temp`,
						type: type,
						heightAdd: this.memory.nextHeightAdd,
						comment: code[l]
					});

					this.memory.toGenerate.push({
						"text": `/tellraw @a {"score":{"name":"@a","objective":"math"}}`,
						type: type,
						heightAdd: this.memory.nextHeightAdd,
						comment: code[l]
					});

					break;
				case "printv":
					if (parts[1] == "add") {
						this.memory.toGenerate.push({
							"text": `/tellraw @a {"storage":"minecraft:0","nbt":"corescript.variables.` + parts[1] +`"}`,
							type: type,
							heightAdd: this.memory.nextHeightAdd,
							comment: code[l]
						});
					}

					break;
				case language["goto"].t:
					if (this.memory.labelBlocks[parts[1]] != undefined) {
						var goDown = this.memory.currentHeight - this.memory.labelBlocks[parts[1]] + 1;

						this.memory.toGenerate.push({
							"text": `setblock ~ ~-` + goDown + ` ~ redstone_block`,
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
					"text": `setblock ~ ~1 ~ redstone_block`,
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
			this.memory.currentHeight += this.memory.nextHeightAdd + l;
		},
		memory: {
			nextHeightAdd: 0,
			currentHeight: 0,

			labels: {},
			labelBlocks: {},

			toGenerate: [
				{
					text:`data modify storage minecraft:0 corescript set value {"variables":{}}`,
					type: "regular",
					heightAdd: 0,
					comment: "-Init variable"
				},

				{
					text:`scoreboard objectives add temp dummy`,
					type: "chain",
					heightAdd: 0,
					comment: "-Init temp"
				},

				{
					text:`scoreboard objectives add math dummy`,
					type: "chain",
					heightAdd: 0,
					comment: "-Init math"
				},
			]
		},

		finished: function() {
			this.memory.toGenerate.push({
				text:`/data remove storage minecraft:0 corescript`,
				type: "chain",
				heightAdd: 0,
				comment: "-Deinit Corescript"
			});

			this.memory.toGenerate.push({
				text:`/scoreboard objectives remove math`,
				type: "chain",
				heightAdd: 0,
				comment: "-Deinit math"
			});

			this.memory.toGenerate.push({
				text:`/scoreboard objectives remove temp`,
				type: "chain",
				heightAdd: 0,
				comment: "-Deinit temp"
			});

			var compiled = compileCommands(this.memory.toGenerate, {comments: true});
			prompt("Copy this:", compiled);
		}
	}
}

function compile(code) {
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
