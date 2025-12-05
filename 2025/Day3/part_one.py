# Solution to part one, day 3 of Advent code 2025

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
    first_digit: str = sorted(battery[:-1], reverse=True)[0]
    first_digit_position: int = battery.index(first_digit)
    second_digit: str = sorted(battery[first_digit_position + 1 :], reverse=True)[0]
    return int(first_digit) * 10 + int(second_digit)


if __name__ == "__main__":
    main()
