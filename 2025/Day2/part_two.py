# Solution to part two, day 2 of Advent code 2025

from itertools import filterfalse
from typing import Generator


def main() -> None:
    invalid_ids: set = set()
    invalid_ids.update(*map(get_invalid_ids, get_ranges()))
    print(f"Invalid ID sum: {sum(invalid_ids)}")


def get_ranges() -> Generator[range, None, None]:
    with open("input.txt") as input_file:
        coded_ranges: str = input_file.read()
    coded_ranges_list: list[str] = coded_ranges.split(",")
    for range_str in coded_ranges_list:
        range_start_str, range_end_str = range_str.split("-")
        yield range(int(range_start_str), int(range_end_str) + 1)


def get_invalid_ids(in_range: range) -> Generator[int, None, None]:
    yield from filterfalse(is_valid_id, in_range)


def is_valid_id(id_number: int) -> bool:
    id_number_str: str = str(id_number)
    id_number_str_len: int = len(id_number_str)
    return not any(
        id_number_str == id_number_str[:char_count] * (id_number_str_len // char_count)
        for char_count in range(1, id_number_str_len // 2 + 1)
    )


if __name__ == "__main__":
    main()
