// Advent of Code 2025 - Day 10

// Read the file:
function* readInput(filename: string): Generator<string> {
  try {
    const content = Deno.readTextFileSync(filename);
    const lines = content.split("\n");

    for (const line of lines) {
      if (line.length > 0) {
        yield line;
      }
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.error(`Error: File '${filename}' not found`);
    } else if (error instanceof Deno.errors.PermissionDenied) {
      console.error(`Error: Permission denied reading '${filename}'`);
    } else {
      console.error(`Error reading file '${filename}':`, error);
    }
    Deno.exit(1);
  }
}

// The indexes of switched the button toggles in ascending order:
type Button = number[];

// The state of the switches of a machine or desired state:
type Switches = boolean[];

// The result of parsing the input file:
type Puzzle = [Machine, Switches][];

class Machine {
  #switches: Switches;
  #buttons: Button[];

  // A map associating a switch number to the indexes of the buttons changing its state
  // (some switches might not be present if there are no buttons to change them)
  #switchNumberToButtonIndexes: Map<number, number[]>;

  constructor(switches: Switches, buttons: Button[]) {
    this.#switches = switches;
    this.#buttons = buttons;

    this.#switchNumberToButtonIndexes = new Map<number, number[]>();
    const switchNumberToButtonIndexes = this.#switchNumberToButtonIndexes;
    for (let i = 0; i < buttons.length; ++i) {
      const button = buttons[i];
      for (const buttonNumber of button) {
        if (!switchNumberToButtonIndexes.has(buttonNumber)) {
          switchNumberToButtonIndexes.set(buttonNumber, []);
        }
        switchNumberToButtonIndexes.get(buttonNumber)!.push(i);
      }
    }
  }

  static isDesiredStateReach(state: Switches, desiredState: Switches): boolean {
    const result = state.every((s, i) => s === desiredState[i]);
    return result;
  }

  static applyButton(state: Switches, button: Button): Switches {
    const result = [...state];

    for (const switchNumber of button) {
      result[switchNumber] = !result[switchNumber];
    }

    return result;
  }

  getMinimalCountForDesiredState(desiredState: Switches): number {
    let buttonPushedCount = 0;
    if (!Machine.isDesiredStateReach(this.#switches, desiredState)) {
      const machineNode: MachineNode = new MachineNode(this.#switches);
      while (true) {
        ++buttonPushedCount;
        if (machineNode.exploreDeeper(this, desiredState)) {
          break;
        }
      }
    }
    return buttonPushedCount;
  }

  getUsefulButtons(state: Switches, desiredState: Switches): Button[] {
    function getSwitchesNeedingToSwitch(): Button {
      const switchNumber: Button = [];

      for (let i = 0; i < state.length; ++i) {
        if (state[i] !== desiredState[i]) {
          switchNumber.push(i);
        }
      }

      return switchNumber;
    }

    const result: Button[] = [];
    const switchNeedingSwitching: Button = getSwitchesNeedingToSwitch();
    for (const switchNumber of switchNeedingSwitching) {
      const buttonIndexes = this.#switchNumberToButtonIndexes.get(switchNumber);
      if (!buttonIndexes) {
        console.error("There is no button that can change the state of switch. This problem is unsolvable.");
        Deno.exit(1);
      }
      for (const buttonIndex of buttonIndexes) {
        result.push(this.#buttons[buttonIndex]);
      }
    }
    return result;
  }
}

// Keep the state of the switches at each button level
class MachineNode {
  switches: Switches;
  children: MachineNode[];

  constructor(switches: Switches) {
    this.switches = [...switches];
    this.children = [];
  }

  exploreDeeper(machine: Machine, desiredState: Switches): boolean {
    const exploredSolutions = new Set<string>();

    function serializeSwitches(switches: Switches): string {
      return switches.map((s) => s ? "#" : ".").join("");
    }

    function deserializeSwitches(switches: string): Switches {
      return switches.split("").map((s) => s == "#" ? true : false);
    }

    function exploreDeeperImpl(machineNode: MachineNode): boolean {
      if (machineNode.children.length) {
        for (const child of machineNode.children) {
          if (exploreDeeperImpl(child)) {
            return true;
          }
        }
      } else {
        for (const button of machine.getUsefulButtons(machineNode.switches, desiredState)) {
          const newState = Machine.applyButton(machineNode.switches, button);
          if (Machine.isDesiredStateReach(newState, desiredState)) {
            return true;
          }
          const serializedSwitches = serializeSwitches(newState);
          if (!exploredSolutions.has(serializedSwitches)) {
            machineNode.children.push(new MachineNode(newState));
            exploredSolutions.add(serializedSwitches);
          }
        }
      }
      return false;
    }
    return exploreDeeperImpl(this);
  }
}

// Part one

// Return the machines with their desired state
function getPuzzle(lines: Generator<string>): Puzzle {
  const result: Puzzle = [];
  for (const line of lines) {
    const parts = line.split(" ");
    const desiredStateStr = parts[0].slice(1, -1); // Remove surrounding []
    const buttonsStr: string[] = parts.slice(1, -1); // Everything between first and last

    // Convert desiredState to boolean
    const desiredState: Switches = desiredStateStr.split("").map((c) => {
      if (c === ".") return false;
      if (c === "#") return true;
      console.error(`Cannot parse switch state: ${c}`);
      Deno.exit(1);
    });
    const switches = new Array(desiredState.length).fill(false); // Initial state

    const buttons: Button[] = buttonsStr.map((buttonStr) => buttonStr.slice(1, -1).split(",").map((s) => parseInt(s)));
    result.push([new Machine(switches, buttons), desiredState]);
  }

  return result;
}

function partTwo(lines: Generator<string>): number {
  // TODO: Implement part two
  for (const line of lines) {
    // Process each line
  }

  return 0;
}

if (import.meta.main) {
  // Part one:
  const puzzle: Puzzle = getPuzzle(readInput("input"));
  const pushButtonCount = puzzle.reduce(
    (sum, [machine, desiredState]) => sum + machine.getMinimalCountForDesiredState(desiredState),
    0,
  );
  console.log(
    "To set all the machines in the desired state, a minimal of " + pushButtonCount + " button press is needed.",
  );
}
