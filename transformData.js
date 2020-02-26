const fs = require("fs");

const path = "./data/changes/";
const outputPath = "./output/changes/";

// create output folder
fs.mkdirSync(outputPath, { recursive: true });

// read all input files
fs.readdirSync(path).forEach(filename => {
  let data = readDataFile(path + filename);
  if (!!data) storeDataFile(outputPath + "new" + filename, data);
});

function readDataFile(filepath) {
  let data = [];
  let content = fs.readFileSync(filepath, "utf8");
  let lines = content.split("\n");

  let contentStartRow = findContentStart(lines);
  if (contentStartRow == -1) {
    console.error("No table found");
    return;
  }
  let columnStarts = getColumnStarts(lines[contentStartRow - 1]);

  // go through the content lines
  let previousName;
  let prevIdType;
  let prevOldId;

  for (let row = contentStartRow; row < lines.length; row++) {
    let line = lines[row];
	// remove \r, otherwise we get non-empty lines only including that character
    line = line.replace("\r", "");
	// ignore blank lines
    if (line == "") continue;
	// ignore comments in parantheses
    if (line.includes("(Replaced")) continue;
    let columns = findColumns(line);

    // the content should be "name, oldID, newID"
    // if the name is missing, use the name of the previous row
    // if the oldId is missing, it is a new node
    // if the newId is missing, the node is deleted
    let name, oldId, newId;
    let firstIsName = false;
    let onlyName = false;

    if (!isId(columns[0].text)) {
      previousName = name = columns[0].text;
      firstIsName = true;
      prevIdType = null;
      prevOldId = null;
    } else name = previousName;

    // if all entries are given
    if (columns.length === 3) {
      oldId = columns[1].text;
      newId = columns[2].text;
    }
	// if 2 entries are given
	else if (columns.length === 2) {
      if (firstIsName) {
        // only 1 id is given --> find out which
        if (columns[1].start == columnStarts[1]) {
          oldId = columns[1].text;
          prevIdType = "old";
        } else {
          newId = columns[1].text;
          prevIdType = "new";
        }
      } else {
        // both entries are IDs
        oldId = columns[0].text;
        newId = columns[1].text;
      }
    }
	// if 1 entry is given
	else {
      if (firstIsName) onlyName = true;
      // if the only entry is a name, the IDs stand on the next line
      else {
        // entry is id, find out which
        if (columns[0].start == columnStarts[1]) oldId = columns[0].text;
        else if (columns[0].start == columnStarts[2]) newId = columns[0].text;
        else {
          // format is screwed up
          // id is in the next line in the column of the name
          // we do not know if the id is old or new
          // our best guess is that the id will be of the same type as the id on the previous line
          if (prevIdType == "old") oldId = columns[0].text;
          else if (prevIdType == "new") newId = columns[0].text;
          // if there is no previous id for the given name, assume that the node got removed
          else oldId = columns[0].text;
        }
      }
    }

    if (!onlyName) {
      // if a node moved, check if other nodes with the same name were added
      // and include them as a split
      if (!oldId)
        oldId = prevOldId;
      else
        prevOldId = oldId;

      oldId = correctId(oldId);
      newId = correctId(newId);
      data.push([name, oldId, newId]);
    }
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

function isId(string) {
  return /^[A-Z]\d+(.\d+)*$/.test(string);
}

function isDigit(char) {
  return char >= "0" && char <= "9";
}

function findContentStart(lines) {
  let tableStart = 0;
  for (let line of lines) {
    tableStart++;
    if (line.startsWith("---")) return tableStart;
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

function findColumns(line) {
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

  let entries = [];
  for (let i = 0; i < contentRanges.start.length; i++)
    entries.push({
      start: contentRanges.start[i],
      text: line.slice(contentRanges.start[i], contentRanges.end[i])
    });

  return entries;
}

// add preceding zeros to IDs to form groups of 3 characters (G1.23 --> G01.023)
function correctId(id) {
  if (id) {
    let parts = id.split('.');

    // correct first part of the ID which starts with a character
    let chars = parts[0].split('');
    if (chars.length == 2)
      parts[0] = chars[0] + '0' + chars[1];
    
    // correct all other parts by adding preceding zeros and trimming to 3 digits
    for (let i = 1; i < parts.length; i++)
      parts[i] = ("000" + parts[i]).slice(-3);

    return parts.join('.');
  }
}