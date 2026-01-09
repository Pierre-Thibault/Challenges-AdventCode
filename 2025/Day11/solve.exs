# Load the Day11 module
Code.require_file("lib/day11.ex", __DIR__)

# Read input file
input = File.read!("input")

# Solve part 1
part1_result = Day11.part1(input)
IO.puts("There are #{part1_result} path from you to out.")

# Solve part 2
part2_result = Day11.part2(input)
IO.puts("There are: #{part2_result} path from svr to out passing by both dac and fft.")
