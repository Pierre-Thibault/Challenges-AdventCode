import std/[strutils, tables]

type LineChar = enum
  Space = "."
  Start = "S"
  Splitter = "^"
  Beam = "|"

##########################################################################
# Part 1
##########################################################################

func startProcessor(nextLine: string, position:int): string =
  nextLine[0..<position] & $Beam & nextLine[position + 1..^1]

proc getLineIterator(fileName: string): iterator(): string =
  iterator(): string =
    let inputFile = open(fileName, fmRead)
    defer: inputFile.close()

    var line: string
    while inputFile.readLine(line):
      yield line  

proc processLines(lines: iterator(): string): int =
  var splitCount = 0
  var currentLine = ""
  var nextLine = ""

  proc processLine() =
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
    
  for line in lines():
    if line == "" and (currentLine == "" or nextLine == ""):
      quit("Empty line. Don't know what to do!", 1)
    if currentLine == "":
      currentLine = line
      continue
    if nextLine == "":
      nextLine = line
      continue

    processLine()

    currentLine = nextLine
    nextLine = line

  processLine()

  splitCount


##########################################################################
# Part 2
##########################################################################

proc getLines(fileName: string): seq[string] =
    readFile(fileName).splitLines()

proc processBeam(lines: openArray[string], row: int, column: int): int =
  var splitterPathCount: Table[int, Table[int, int]] = initTable[int, Table[int, int]]()

  proc processBeamImpl(lines: openArray[string], row: int, column: int): int =
    for row in (row + 1)..<lines.len:
      if lines[row].len > column and $lines[row][column] == $Splitter:
        if row in splitterPathCount and column in splitterPathCount[row]:
          return splitterPathCount[row][column]
        let pathCount = processBeamImpl(lines, row + 1, column - 1) + processBeamImpl(lines, row + 1, column + 1)
        withValue(splitterPathCount, row, value):
          value[][column] = pathCount
        do:
          splitterPathCount[row] = { column: pathCount }.toTable
        return pathCount
    1

  processBeamImpl(lines, row, column)
  
proc processStart(lines: openArray[string]): int =
  for row, line in lines:
    for column, char in line:
      if $char == $Start:
        return processBeam(lines, row + 1, column)
  
  
when isMainModule:
  let splitCount = "input".getLineIterator().processLines()
  echo "Split count: " & $splitCount

  let pathCount = "input".getLines().processStart()
  echo "Path count: " & $pathCount
  
