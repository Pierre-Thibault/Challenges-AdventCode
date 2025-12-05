# Solution to part one, day 1 of Advent code 2025

from dataclasses import dataclass
from enum import StrEnum
from operator import add, sub
from typing import Callable, Generator


class Direction(StrEnum):
    LEFT = "L"
    RIGHT = "R"


direction_operation: dict[Direction, Callable[[int, int], int]] = {
    Direction.LEFT: sub,
    Direction.RIGHT: add,
}


@dataclass
class Instruction:
    direction: Direction
    click: int


def main() -> None:
    dial_position: int = 50
    zero_count: int = 0
    instruction: Instruction
    for instruction in get_instructions():
        dial_position = direction_operation[instruction.direction](
            dial_position, instruction.click
        )
        zero_count += dial_position % 100 == 0
    print(f"zero_count = {zero_count}")


def get_instructions() -> Generator[Instruction, None, None]:
    with open("input.txt") as input_file:
        for coded_instruction in input_file:
            yield Instruction(
                direction=Direction(coded_instruction[0]),
                click=int(coded_instruction[1:]),
            )


if __name__ == "__main__":
    main()
