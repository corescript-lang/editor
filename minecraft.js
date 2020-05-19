// Functions for generating minecraft commands
function generate(commands) {
	var generateCommand = [
		`summon falling_block ~ ~1 ~ {Time:1,BlockState:{Name:redstone_block},Passengers:[{id:falling_block,Passengers:[{id:falling_block,Time:1,BlockState:{Name:activator_rail},Passengers:[`,
		`{id:command_block_minecart,Command:'`,
		`'},`,
		`{id:command_block_minecart,Command:'kill @e[type=command_block_minecart,distance=..1]'}]}]}]}`
	]

	var generated = "";
	generated += generateCommand[0];
	for (var i = 0; i < commands.length; i++) {
		generated += generateCommand[1];
		generated += commands[i];
		generated += generateCommand[2];
	}

	generated += generateCommand[3];

	return generated;
}

function compileCommands(commands, config) {
	var toGenerate = [];
	var height = 2;

	// Add a stone button for easy activation
	toGenerate.push(`setblock ~ ~` + height + ` ~1 stone_button[facing=south]`);

	for (var c = 0; c < commands.length; c++) {

		// Use four since JS counts it, and minecraft does too.
		commands[c].text = commands[c].text.replace(/\"/gm, '\\\\"');

		// Calculate NBT, ID for chain/regular
		var nbt, id;
		if (commands[c].type == "chain") {
			nbt = `{Command:"` + commands[c].text + `", auto: 1b}`
			id = `chain_command_block`;
		} else if (commands[c].type == "regular") {
			nbt = `{Command:"` + commands[c].text + `"}`
			id = `command_block`;
		}

		height += commands[c].heightAdd;

		// Add the generated command
		toGenerate.push(`setblock ~ ~` + height +` ~ ` + id + `[facing=up]` + nbt);

		// Add comment
		if (config.comments) {
			toGenerate.push(`setblock ~-1 ~` + height +` ~ oak_wall_sign[facing=west]{Text1: \\'"` + commands[c].comment + `"\\'}`);
		}

		height++;
	}

	return generate(toGenerate);
}
