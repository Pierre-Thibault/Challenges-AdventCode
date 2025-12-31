// Advent of Code 2025 - Day 10

// The indexes of switched the button toggles in ascending order:
type Button = number[];

// The different joltage values
type Joltages = number[];

// The state of the switches of a machine or desired state:
type Switches = boolean[];

// The result of parsing the input file:
type Puzzle = [Machine, Switches, Joltages][];

class Machine {
  // Common stuff

  #switches: Switches;
  #buttons: Button[];
  #joltages: Joltages;

  // A map associating a switch number to the indexes of the buttons changing its state
  // (some switches might not be present if there are no buttons to change them)
  #switchNumberToButtonIndexes: Map<number, number[]>;

  constructor(switches: Switches, buttons: Button[], joltages: Joltages) {
    this.#switches = switches;
    this.#buttons = buttons;
    this.#joltages = joltages;

    this.#switchNumberToButtonIndexes = new Map<number, number[]>();
    const switchNumberToButtonIndexes = this.#switchNumberToButtonIndexes;
    for (const [i, button] of buttons.entries()) {
      for (const buttonNumber of button) {
        if (!switchNumberToButtonIndexes.has(buttonNumber)) {
          switchNumberToButtonIndexes.set(buttonNumber, []);
        }
        switchNumberToButtonIndexes.get(buttonNumber)!.push(i);
      }
    }
  }

  // Part one

  static isDesiredStateReach(state: Switches, desiredState: Switches): boolean {
    return areArraysEqual(state, desiredState);
  }

  static applyButtonToSwitches(state: Switches, button: Button): Switches {
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

  // Part two

  getCountForDesiredJoltages(desiredJoltages: Joltages): number {
    // Equation Term type:
    type Term =
      | "a"
      | "b"
      | "c"
      | "d"
      | "e"
      | "f"
      | "g"
      | "h"
      | "i"
      | "j"
      | "k"
      | "l"
      | "m"
      | "n"
      | "o"
      | "p"
      | "q"
      | "r"
      | "s"
      | "t"
      | "u"
      | "v"
      | "w"
      | "x"
      | "y"
      | "z";

    // Result of an equation:
    type Value = number;

    // We represent an equation by a set:
    type Equation = Set<Term>; // The + sign is implicit between the terms

    // The equation with its associated value:
    type EquationSystem = [Equation, Value][];

    // Mapping of terms with their corresponding values:
    type TermToValue = Map<Term, Value>;

    const buttons = this.#buttons;
    let currentJoltages = [...this.#joltages];

    function applyButtonToJoltage(joltages: Joltages, button: Button, count: number): Joltages {
      const result = [...joltages];

      for (const switchNumber of button) {
        result[switchNumber] += count;
      }

      return result;
    }

    function applyTermValuesToJoltage(termToValue: TermToValue): Joltages {
      let joltages = [...currentJoltages];
      for (const [term, value] of termToValue) {
        joltages = applyButtonToJoltage(joltages, buttons[termToButtonIndex(term)], value);
      }

      return joltages;
    }

    function isValidSolution(termToValue: TermToValue): boolean {
      function isDesiredJoltageReach(joltages: Joltages): boolean {
        return areArraysEqual(joltages, desiredJoltages);
      }

      if ([...termToValue.values()].some((value) => value < 0)) {
        return false;
      }
      return isDesiredJoltageReach(applyTermValuesToJoltage(termToValue));
    }

    /**
     * Convert a button index to a term for our equation.
     * @returns A term "a" to "z"
     */
    function buttonIndexToTerm(buttonIndex: number): Term {
      const A_CODE = "a".charCodeAt(0); // 97

      if (buttonIndex < 0 || buttonIndex > 25) {
        throw new Error(`Number ${buttonIndex} is out of range (0-25)`);
      }
      return String.fromCharCode(A_CODE + buttonIndex) as Term;
    }

    function termToButtonIndex(term: Term): number {
      const A_CODE = "a".charCodeAt(0); // 97

      return term.charCodeAt(0) - A_CODE;
    }

    /**
     * Replace a term by its value in the equation system.
     * @param equationSystem
     * @param term Term to replace
     * @param value Value of the term replaced
     */
    function replaceTermByValueFromEquationSystem(equationSystem: EquationSystem, term: Term, value: Value) {
      for (let equationIndex = equationSystem.length - 1; equationIndex >= 0; --equationIndex) {
        const equation: Equation = equationSystem[equationIndex][0];
        if (equation.has(term)) {
          equation.delete(term);
          equationSystem[equationIndex][1] -= value;
          if (equation.size === 0) {
            equationSystem.splice(equationIndex, 1);
          }
        }
      }
    }

    /**
     * Replace all the term from a term mapping.
     */
    function replaceTermsByValueFromEquationSystem(equationSystem: EquationSystem, termToValue: TermToValue) {
      for (const [term, value] of termToValue) {
        replaceTermByValueFromEquationSystem(equationSystem, term, value);
      }
    }

    /**
     * Remove the equation from the equation system if found.
     */
    function removeEquationFromEquationSystem(equationSystem: EquationSystem, equation: Equation) {
      for (let equationIndex = equationSystem.length - 1; equationIndex >= 0; --equationIndex) {
        const equationFromSystem: Equation = equationSystem[equationIndex][0];
        if (equationFromSystem.isSubsetOf(equation) && equationFromSystem.isSupersetOf(equation)) {
          equationSystem.splice(equationIndex, 1);
        }
      }
    }

    /**
     * Subtract joltages and return the new joltages.
     */
    function getJoltagesDiff(joltagesA: Joltages, joltagesB: Joltages): Joltages {
      return joltagesA.map((joltage, joltageIndex) => joltage - joltagesB[joltageIndex]);
    }

    // We are going to represent our problem as system of equations where each button activating a joltage
    // has a coefficient and we'll try to solve this system of equations to find how many button-press we
    // need to get to the desired joltage by replacing the coefficients by their corresponding numerical
    // values. 'a', is the number to press the first button, 'b' is for the second and so on...
    // The goal is to replace the terms by their values as much as we can.

    /**
     * Creates the equation system from the button and the desired joltages
     */
    function createEquationSystem(desiredJoltages: Joltages): EquationSystem {
      const equationSystem: EquationSystem = [];
      for (const [joltageIndex, desiredJoltage] of desiredJoltages.entries()) {
        const equation: Equation = new Set();
        for (const [buttonIndex, button] of buttons.entries()) {
          if (button.includes(joltageIndex)) {
            equation.add(buttonIndexToTerm(buttonIndex));
          }
        }
        equationSystem.push([equation, desiredJoltage]);
      }

      return equationSystem;
    }

    /**
     * Returns a deep copy of an EquationSystem.
     */
    function duplicateEquationSystem(equationSystem: EquationSystem): EquationSystem {
      return equationSystem.map(([equation, value]) => [new Set(equation), value] as [Equation, Value]);
    }

    // Create the equation system:
    desiredJoltages = getJoltagesDiff(desiredJoltages, currentJoltages);
    const equationSystem: EquationSystem = createEquationSystem(desiredJoltages);

    /**
     * Returns True if the equation system contains the equation.
     */
    function isEquationSystemContainsEquation(equationSystem: EquationSystem, equation: Equation): boolean {
      return equationSystem.some(([e, _]) => e.isSubsetOf(equation) && e.isSupersetOf(equation));
    }

    /**
     * Solves, or try to solve the equation system in place.
     * @returns A map of the terms isolated and their values.
     */
    function solveEquationSystem(equationSystem: EquationSystem): TermToValue {
      const termToValue = new Map<Term, Value>();
      while (true) { // Repeat until no new values can be found
        let equationSystemHasChanged = false;
        // Enrich the equation system with what we can deduce:

        // Find equations that are a subset of another equation:
        equationLoop: for (const [equationA, valueA] of equationSystem) {
          for (const [equationB, valueB] of equationSystem) {
            if (equationA.size !== equationB.size && equationB.isSubsetOf(equationA)) {
              const equationSubset = setDifference(equationA, equationB);
              if (isEquationSystemContainsEquation(equationSystem, equationSubset)) {
                continue; // Continue: the equation system already contains the subset found
              }
              equationSystem.push([equationSubset, valueA - valueB]); // Add the smaller equation
              removeEquationFromEquationSystem(equationSystem, equationA); // Remove the bigger equation
              equationSystemHasChanged = true;
              break equationLoop;
            }
          }
        }

        // If an equation has only one term, we can find its value:
        for (const [equation, equationValue] of equationSystem) {
          if (equation.size === 1) {
            const termFound: Term = equation.values().next().value!;
            replaceTermByValueFromEquationSystem(equationSystem, termFound, equationValue);
            removeEquationFromEquationSystem(equationSystem, equation);
            termToValue.set(termFound, equationValue);
            equationSystemHasChanged = true;
            break;
          }
        }

        if (!equationSystemHasChanged) {
          break;
        }
      }

      return termToValue;
    }

    const termToValue: TermToValue = solveEquationSystem(equationSystem);
    let result = [...termToValue.values()].reduce(sum, 0);
    if (equationSystem.length === 0) { // Every term found! (There was just one solution)
      if (!isValidSolution(termToValue)) {
        throw new Error("Solution found invalid!");
      }
      return result;
    }
    currentJoltages = applyTermValuesToJoltage(termToValue);

    // We were not able to fully solve the equation system. So, we are going to try a value for a term and see if
    // we can infere the other values.

    // Find the shortest equations with the smallest values:
    equationSystem.sort(([equationA, valueA], [equationB, valueB]) =>
      (equationA.size * 1000 + valueA) - (equationB.size * 1000 + valueB)
    );

    const termToMaxValue = new Map<Term, Value>();
    const termsFoundWhileSolving = new Set<Term>();
    let solutionFound = false;
    equationSystemLoop: for (const [equation, value] of equationSystem) {
      for (const term of equation) {
        if (termsFoundWhileSolving.has(term) || termToMaxValue.has(term)) continue;

        termToMaxValue.set(term, value);
        const equationSystemTmp = duplicateEquationSystem(equationSystem);
        replaceTermsByValueFromEquationSystem(equationSystemTmp, termToMaxValue);
        const termToValue: TermToValue = solveEquationSystem(equationSystemTmp);
        termToValue.keys().forEach((term) => termsFoundWhileSolving.add(term));
        if (equationSystemTmp.length === 0) {
          solutionFound = true;
          break equationSystemLoop;
        }
      }
    }

    if (!solutionFound) {
      throw new Error("Unable to solve equation system");
    }

    // Test all combinations, test if it works, find the one with the less button-press

    // The Combination generator. It returns all the possible combination of values for the terms.
    // missingTermMaxima contains the maximum possible to each term. The minimum value is zero. So,
    // the possible combination for a term is its maximum + 1. The yieled Map contains the value for
    // each term (the number of times to push the corresponding button).
    function* getCombinationGenerator(missingTermMaxima: TermToValue): Generator<TermToValue> {
      const multiplicationFactors: number[] = [];
      const terms: Term[] = [...missingTermMaxima.keys()];
      let previousMaximumKey: null | Term = null;
      for (const maximumKey of terms.slice().reverse()) {
        multiplicationFactors.push(
          previousMaximumKey === null ? 1 : multiplicationFactors[multiplicationFactors.length - 1] *
            (missingTermMaxima.get(previousMaximumKey)! + 1),
        );
        previousMaximumKey = maximumKey;
      }
      multiplicationFactors.reverse();
      const combinationCount: number = terms.reduce((acc, current) => acc * (missingTermMaxima.get(current)! + 1), 1);
      for (let combinationIndex = 0; combinationIndex < combinationCount; ++combinationIndex) {
        const result = new Map<Term, Value>();
        let remainder = combinationIndex;
        for (const [termIndex, term] of terms.entries()) {
          const multiplicationFactor: number = multiplicationFactors[termIndex];
          const termValue = Math.floor(remainder / multiplicationFactor);
          remainder -= termValue * multiplicationFactor;
          result.set(term, termValue);
        }

        yield result;
      }
    }

    // Do the testing work here and find its minimum value:
    let minimumButtonCount: Value | null = null;
    for (const combination of getCombinationGenerator(termToMaxValue)) {
      const equationSystemTmp: EquationSystem = duplicateEquationSystem(equationSystem);
      replaceTermsByValueFromEquationSystem(equationSystemTmp, combination);
      const resultTermsToValue: TermToValue = solveEquationSystem(equationSystemTmp);
      if (!isValidSolution(new Map([...combination, ...resultTermsToValue]))) {
        continue;
      }
      const buttonCount = [...combination.values(), ...resultTermsToValue.values()].reduce(sum, 0);
      if (minimumButtonCount === null || buttonCount < minimumButtonCount) {
        minimumButtonCount = buttonCount;
      }
    }
    result += minimumButtonCount!;

    return result;
  }

  // Part one

  getUsefulButtonsForDesiredState(state: Switches, desiredState: Switches): Button[] {
    function getSwitchesNeedingToSwitch(): Button {
      const switchNumber: Button = [];

      for (const [switchIndex, theSwitch] of state.entries()) {
        if (theSwitch !== desiredState[switchIndex]) {
          switchNumber.push(switchIndex);
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

    function exploreDeeperImpl(machineNode: MachineNode): boolean {
      if (machineNode.children.length) {
        for (const child of machineNode.children) {
          if (exploreDeeperImpl(child)) {
            return true;
          }
        }
      } else {
        for (const button of machine.getUsefulButtonsForDesiredState(machineNode.switches, desiredState)) {
          const newState = Machine.applyButtonToSwitches(machineNode.switches, button);
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

// Utility functions

function areArraysEqual<T>(arrayA: T[], arrayB: T[]): boolean {
  return arrayA.every((s, i) => s === arrayB[i]) && arrayA.length === arrayB.length;
}

// set a - set b
function setDifference<T>(a: Set<T>, b: Set<T>): Set<T> {
  return new Set([...a].filter((x) => !b.has(x)));
}

const sum = (a: number, b: number): number => a + b;

// Common for part one and two

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

// Return the machines with their desired state
function getPuzzle(lines: Generator<string>): Puzzle {
  // Extract integer values from a button or joltage string:
  function getIntegersValues(values: string): number[] {
    return values.slice(1, -1).split(",").map((j) => parseInt(j));
  }

  const result: Puzzle = [];
  for (const line of lines) {
    const parts: string[] = line.split(" ");
    const desiredStateStr: string = parts[0].slice(1, -1); // Remove surrounding []
    const buttonsStr: string[] = parts.slice(1, -1); // Everything between first and last
    const [joltageStr]: string[] = parts.slice(-1);

    // Convert desiredState to boolean
    const desiredState: Switches = desiredStateStr.split("").map((c) => {
      if (c === ".") return false;
      if (c === "#") return true;
      console.error(`Cannot parse switch state: ${c}`);
      Deno.exit(1);
    });
    const switches = new Array(desiredState.length).fill(false); // Initial state
    const joltages = new Array(desiredState.length).fill(0); // Initial state

    const buttons: Button[] = buttonsStr.map(getIntegersValues);

    const desiredJoltages: Joltages = getIntegersValues(joltageStr);

    result.push([new Machine(switches, buttons, joltages), desiredState, desiredJoltages]);
  }

  return result;
}

if (import.meta.main) {
  const puzzle: Puzzle = getPuzzle(readInput("input"));

  // Part one:
  let pushButtonCount = puzzle.reduce(
    (sum, [machine, desiredState, _]) => sum + machine.getMinimalCountForDesiredState(desiredState),
    0,
  );
  console.log(
    "To set all the machines in the desired switch state, a minimal of " + pushButtonCount + " button-press is needed.",
  );

  // Part two:
  console.log("Wait a few minutes, please.");
  pushButtonCount = puzzle.reduce(
    (sum, [machine, _, desiredJoltages]) => sum + machine.getCountForDesiredJoltages(desiredJoltages),
    0,
  );
  console.log(
    "To set all the machines in the desired joltages, a minimal of " + pushButtonCount + " button-press is needed.",
  );
}
