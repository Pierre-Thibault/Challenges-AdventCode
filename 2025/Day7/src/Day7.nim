import std/[strutils]

type LineChar = enum
  Space = "."
  Start = "S"
  Splitter = "^"
  Beam = "|"

var splitCount = 0

proc startProcessor(nextLine: string, position:int): string =
  nextLine[0..<position] & $Beam & nextLine[position + 1..^1]

template withFileLines(fileName: string, body: untyped) =
  let inputFile = open(fileName, fmRead)
  defer: inputFile.close()

  var line {.inject.}: string
  var lineRead {.inject.} = true
  while lineRead:
    lineRead = inputFile.readLine(line)
    body

proc processLines(fileName: string) =
  var currentLine = ""
  var nextLine = ""

  withFileLines(fileName):
    if line == "" and (currentLine == "" or nextLine == ""):
      quit("Empty line. Don't know what to do!", 1)
    if currentLine == "":
      currentLine = line
      continue
    if nextLine == "":
      nextLine = line
      continue

    for position, character in currentLine:
      case parseEnum[LineChar]($character)
      of Start:
        nextLine = startProcessor(nextLine, position)
      of Beam:
        let nextChar: char = nextLine[position]
        case parseEnum[LineChar]($nextChar)
        of Space:
          nextLine = startProcessor(nextLine, position)
        of Splitter:
          inc splitCount
          nextLine = nextLine[0..<position - 1] & $Beam & $Splitter & $Beam & nextLine[position + 2..^1]
        of Beam:
          discard
        else:
          quit("Unexpected char: '" & $nextChar & "'", 1)
      else:
        discard

    currentLine = nextLine
    nextLine = line


when isMainModule:
  processLines("input")
  echo "Split count: " & $splitCount
