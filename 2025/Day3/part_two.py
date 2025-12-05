# Solution to part two, day 3 of Advent code 2025

from typing import Generator, NewType

Battery = NewType("Battery", str)


def main() -> None:
    print(f"Total voltage: {sum(get_voltage(battery) for battery in get_batteries())}")


def get_batteries() -> Generator[Battery, None, None]:
    with open("input") as battery_file:
        battery: str
        for battery in battery_file:
            yield Battery(battery.strip())


def get_voltage(battery: Battery) -> int:
    digit_count: int = 12
    digit_number: int  # The left most digit is at position zero
    voltage: int = 0
    current_search_index: int = 0
    for digit_number in range(digit_count):
        search_segment: str = (
            battery[current_search_index : -digit_count + digit_number + 1]
            if digit_number + 1 < digit_count
            else battery[current_search_index:]
        )
        current_digit_str: str = sorted(
            search_segment,
            reverse=True,
        )[0]
        current_search_index += search_segment.index(current_digit_str) + 1
        current_digit_int: int = int(current_digit_str)
        voltage += current_digit_int * pow(10, digit_count - digit_number - 1)
    return voltage


if __name__ == "__main__":
    main()
