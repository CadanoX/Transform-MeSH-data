const fs = require("fs");

const path = "./data/changes/";
const outputPath = "./output/changes/";

// create output folder
fs.mkdirSync(outputPath, { recursive: true });

// read all input files
fs.readdirSync(path).forEach(filename => {
  let data = readDataFile(path + filename);
  if (!!data)
    storeDataFile(outputPath + "new" + filename, data);
});

function readDataFile(filepath) {
  let data = [];
  let content = fs.readFileSync(filepath, "utf8");
  let lines = content.split("\n");

  let contentStartRow = findContentStart(lines);
  if (contentStartRow == -1) { console.error("No table found"); return; }
  let columnStarts = getColumnStarts(lines[contentStartRow - 1])

  // go through the content lines
  let previousName;
  for (let row = contentStartRow; row < lines.length; row++) {
    let line = lines[row];
    if (line == "") continue; // ignore blank lines
    if (line.includes("(")) continue; // ignore comments in parantheses

    let content = findEntries(line, columnStarts);
    data.push(content);
  }
  return data;
}

function storeDataFile(filepath, data) {
  let file = fs.createWriteStream(filepath);
  file.on("error", function(err) {
    console.error("open file error");
  });
  data.forEach(column => {
    file.write(column.join(";") + "\n");
  });
  file.end();
}

function isID(string) {
  let chars = string.split("");
  if (isDigit(chars[1]) && isDigit(chars[chars.length - 1])) return true;
  return false;
}

function isDigit(char) {
  return char >= "0" && char <= "9";
}

function findContentStart(lines) {
  let tableStart = 0;
  for (let line of lines) {
    tableStart++;
    if (line.startsWith("---"))
      return tableStart;
  }
  return -1;
}

function getColumnStarts(line) {
  let columnStarts = [];
  let i = 0;
  let lastChar = " ";
  for (let char of line.split("")) {
    if (lastChar == " " && char == "-") columnStarts.push(i);
    lastChar = char;
    i++;
  }
  return columnStarts;
}

function findEntries(line, columnStarts) {
  let contentRanges = { start: [], end: [] };
  let col = 0;
  let lastChar;
  let i = 0;
  for (let char of line.split("")) {
    // find start of column content
    if (typeof contentRanges.start[col] === "undefined") {
      if (char != " ") contentRanges.start[col] = i;
    } else {
      // find end of column content (defined by double space)
      let endOfContentFound = char == " " && lastChar == " ";
      if (endOfContentFound) {
        contentRanges.end[col] = i - 1;
        col++; // find next content
      }
    }
    lastChar = char;
    i++;
  }

  //finish last column which does not end on double space
  contentRanges.end[col] = i;

  let content = [];
  for (let i = 0; i < contentRanges.start.length; i++)
    content[i] = line.slice(contentRanges.start[i], contentRanges.end[i]);

  // the content should be "name, oldID, newID"
  // if the name is missing, use the name of the previous row
  // if the oldId is missing, it is a new node
  // if the newId is missing, the node is deleted
  let name, oldId, newId;
  if (contentRanges.start.length === 3) {
    previousName = name = content[0];
    oldId = content[1];
    newId = content[2];
  } else if (contentRanges.start.length === 2) {
    // if name is defined
    if (contentRanges.start[0] == columnStarts[0]) {
      previousName = name = content[0];
      // only 1 id is given
      if (contentRanges.start[1] == columnStarts[1]) oldId = content[1];
      else newId = content[1];
    } else {
      name = previousName;
      oldId = content[0];
      newId = content[1];
    }
  } else {
    // only 1 id is defined
    name = previousName;
    if (contentRanges.start[0] == columnStarts[1]) oldId = content[0];
    else newId = content[0];
  }

  return [name, oldId, newId];
}