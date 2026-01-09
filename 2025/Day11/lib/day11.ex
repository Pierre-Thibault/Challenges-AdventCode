defmodule Day11 do
  @moduledoc """
  Advent of Code 2025 - Day 11
  """

  @type device_set :: MapSet.t(String.t())
  @type device_map :: %{String.t() => device_set()}
  
  @doc """
  Solve part 1
  """
  @spec part1(String.t()) :: integer()
  def part1(input) do
    input
    |> parse()
    |> solve_part1()
  end

  @doc """
  Solve part 2
  """
  @spec part2(String.t()) :: integer()
  def part2(input) do
    input
    |> parse()
    |> solve_part2()
  end

  # Parse the input
  @spec parse(String.t()) :: [String.t()]
  defp parse(input) do
    input
    |> String.trim()
    |> String.split("\n")
  end

  # Solve part 1 logic
  @spec solve_part1([String.t()]) :: integer()
  defp solve_part1(data) do
    device_connections = create_map_from_data(data)
    explored_paths = MapSet.new()
    explore_paths(device_connections, device_connections["you"], explored_paths)
  end

  @spec explore_paths(device_map(), device_set(), device_set()) :: integer()
  defp explore_paths(device_connections, paths, explored) do
    # Add ALL current paths to explored BEFORE exploring them
    new_explored = MapSet.union(explored, paths)

    # Iterate through all paths and accumulate the result
    Enum.reduce(paths, 0, fn path, count ->
      if MapSet.member?(explored, path) do
        # Already explored before this call
        count
      else
        if path == "out" do
          count + 1
        else
          next_paths = Map.get(device_connections, path, MapSet.new())
          count + explore_paths(device_connections, next_paths, new_explored)
        end
      end
    end)
  end

  # Solve part 2 logic
  @spec solve_part2([String.t()]) :: integer()
  defp solve_part2(data) do
    device_connections = create_map_from_data(data)
    visited = MapSet.new()
    required = ["dac", "fft"]

    # Create ETS table for memoization
    :ets.new(:memo, [:set, :public, :named_table])

    result = count_paths_memo(device_connections, "svr", visited, required)

    :ets.delete(:memo)
    result
  end

  @spec count_paths_memo(device_map(), String.t(), device_set(), [String.t()]) :: integer()
  defp count_paths_memo(device_connections, node, visited, required) do
    cond do
      # If we've already visited this node (cycle), return 0
      MapSet.member?(visited, node) ->
        0

      # If we reach "out", check if we visited all required nodes
      node == "out" ->
        has_all = Enum.all?(required, fn r -> MapSet.member?(visited, r) end)
        if has_all, do: 1, else: 0

      # Otherwise, explore recursively with memoization
      true ->
        # Calculate which required nodes we've already visited
        required_visited = Enum.filter(required, fn r -> MapSet.member?(visited, r) end) |> Enum.sort()
        cache_key = {node, required_visited}

        # Look up in the cache
        case :ets.lookup(:memo, cache_key) do
          [{^cache_key, cached_result}] ->
            cached_result

          [] ->
            new_visited = MapSet.put(visited, node)
            neighbors = Map.get(device_connections, node, MapSet.new())

            result = Enum.reduce(neighbors, 0, fn neighbor, count ->
              count + count_paths_memo(device_connections, neighbor, new_visited, required)
            end)

            # Save in the cache
            :ets.insert(:memo, {cache_key, result})
            result
        end
    end
  end

  # Create the map from the file
  @spec create_map_from_data([String.t()]) :: device_map()
  defp create_map_from_data(lines) do
    Enum.reduce(lines, %{}, fn line, acc ->
      [key | values] = String.split(line, ": ")
      value_set =
        values
        |> List.first()
        |> String.split(" ")
        |> MapSet.new()

      Map.put(acc, key, value_set)
    end)
  end
end
