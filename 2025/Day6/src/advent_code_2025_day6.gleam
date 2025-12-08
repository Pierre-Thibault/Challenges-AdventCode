import simplifile

import gleam/int
import gleam/io
import gleam/list
import gleam/result
import gleam/string

pub fn main() {
  let result1 = compute_total_part1("input")

  case result1 {
    Ok(total) -> io.println("Total part1 = " <> int.to_string(total))
    Error(msg) -> io.println("Error : " <> msg)
  }

  io.println("")

  let result2 = compute_total_part2("input")

  case result2 {
    Ok(total) -> io.println("Total part2 = " <> int.to_string(total))
    Error(msg) -> io.println("Error : " <> msg)
  }
}

pub fn compute_total_part1(file_path: String) -> Result(Int, String) {
  use file_content: String <- result.try(
    simplifile.read(from: file_path)
    |> result.map_error(fn(_) { "Unable to read file" }),
  )
  use lines: List(String) <- result.try(
    case file_content |> string.split("\n") {
      [] -> Error("File is empty")
      [_] -> Error("File contains only one line")
      lines -> Ok(list.filter(lines, fn(line) { !string.is_empty(line) }))
    },
  )

  let grid: List(List(Int)) =
    list.take(lines, list.length(lines) - 1)
    |> list.map(fn(line) {
      line
      |> string.trim
      |> string.split(" ")
      |> list.filter(fn(x) { x != " " && x != "" })
      |> list.filter_map(int.parse)
    })

  let symbols: List(String) =
    list.last(lines)
    |> result.unwrap("")
    |> string.trim
    |> string.split(" ")
    |> list.filter(fn(x) { x != " " && x != "" })

  Ok(
    list.fold(symbols, #(0, grid), fn(acc, symbol) {
      #(
        acc.0
          + list.fold(
          acc.1,
          case symbol {
            "+" -> 0
            "*" -> 1
            _ -> panic
          },
          fn(acc: Int, line: List(Int)) {
            case list.length(line) {
              0 -> panic
              _ -> Nil
            }
            let value = result.unwrap(list.first(line), 0)
            case symbol {
              "+" -> acc + value
              "*" -> acc * value
              _ -> panic
            }
          },
        ),
        list.map(acc.1, fn(line: List(Int)) { list.drop(line, 1) }),
      )
    }).0,
  )
}

type SymbolAcc {
  SymbolAcc(symbols: List(String), symbol_positions: List(Int), value: Int)
}

pub fn compute_total_part2(file_path: String) -> Result(Int, String) {
  use file_content: String <- result.try(
    simplifile.read(from: file_path)
    |> result.map_error(fn(_) { "Unable to read file" }),
  )
  use lines: List(String) <- result.try(
    case file_content |> string.split("\n") {
      [] -> Error("File is empty")
      [_] -> Error("File contains only one line")
      lines -> Ok(list.filter(lines, fn(line) { !string.is_empty(line) }))
    },
  )

  let grid = list.take(lines, list.length(lines) - 1)
  let last_line = result.unwrap(list.last(lines), "")
  let symbol_acc_tmp: SymbolAcc =
    last_line
    |> string.to_graphemes()
    |> list.fold(SymbolAcc([], [], 0), fn(acc: SymbolAcc, char: String) {
      case char == "+" || char == "*" {
        True ->
          SymbolAcc(
            [char, ..acc.symbols],
            [acc.value, ..acc.symbol_positions],
            acc.value + 1,
          )
        _ -> SymbolAcc(acc.symbols, acc.symbol_positions, acc.value + 1)
      }
    })

  let symbol_acc =
    SymbolAcc(
      list.reverse(symbol_acc_tmp.symbols),
      // Put the list back in right order
      list.reverse([
        string.length(last_line) + 1,
        // Add an imaginary last column to use the same logic for the last column
        ..symbol_acc_tmp.symbol_positions
      ]),
      0,
    )

  Ok(
    list.fold(symbol_acc.symbols, symbol_acc, fn(acc, symbol: String) {
      let column_positions: List(Int) = list.take(acc.symbol_positions, 2)
      let column_start: Int = list.first(column_positions) |> result.unwrap(0)
      let column_end: Int =
        list.drop(column_positions, 1)
        |> list.first()
        |> result.unwrap(0)
        |> int.subtract(2)
      let operation_result: Int =
        list.fold(
          list.range(column_end, column_start),
          case symbol {
            "+" -> 0
            "*" -> 1
            _ -> panic
          },
          fn(acc, column_position: Int) {
            let new_number =
              list.fold(grid, 0, fn(acc, line: String) {
                let digit = string.slice(line, column_position, 1)
                case int.parse(digit) {
                  Ok(value) -> acc * 10 + value
                  Error(_) -> acc
                }
              })
            case symbol {
              "+" -> acc + new_number
              "*" -> acc * new_number
              _ -> panic
            }
          },
        )
      SymbolAcc(
        [],
        list.drop(acc.symbol_positions, 1),
        acc.value + operation_result,
      )
    }).value,
  )
}
