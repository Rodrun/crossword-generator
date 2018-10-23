// Helpful snippets
function randInt(a, b) {
  return a + Math.floor(Math.random() * (++b - a))
}

function getUrlParam(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function shuffleArray(arr) {
  return arr.sort(x => 0.5 - Math.random());
}
//


// Usable characters when generating crossword blank
const CHARS = "abcdefghijklmnopqrstuvwxyz";
// All possible base offsets
const OFFSETS = [[1, 0], [0, 1], [-1, 0], [0, -1], [-1, -1], [1, -1], [-1, 1]];


/**
 * Check if there is a conflict at a point; if a letter at a point
 * is different. This is to prevent overlapping of words that may
 * "ruin" a word search grid by replacing letters of other words
 * already on the grid.
 * map - Map of words and their corresponding plotted points.
 * p2 - Point to check.
 * letter - Letter to check for conflict at p2.
 * RETURNS: True if there is a conflict.
 * NOTE: Is case-sensitive.
 */
function conflictingPoints(map, p2, letter) {
  let used = map.get(pointToKey(p2[0], p2[1])); // If exists, value should be single-char string
  // If there is no reserved character at point, no conflicts exist
  if (used != null) {
    // Check for conflict of characters, which is when they're not the same
    return letter != used;
  }
  return false;
}


/**
 * Used to map out word from a given origin.
 * A loop is used to map each letter from the origin using a "base offset", which is a
 * point where both of its components are within the range [-1, 0, 1]. The base offset
 * is added to the previously accessed point on the character map. For example:
 *  Our word is 3 characters in length, origin at (4, 4), base offset is (-1, 1).
 *  Our resulting mapped points would be:
 *    - (4, 4), because we want to start from the origin.
 *    - (4, 4) + (-1, 1) = (3, 5)
 *    - (3, 5) + (-1, 1) = (2, 6)
 */
class MappedWord {
  constructor(word) {
    this.word = word;
    this.wordLength = word.length;
  }
  
  /**
   * Get an array of absolute points given the base offset and origin.
   * baseOffset - Point to offset other points.
   * maxX, maxY - Maximum X and Y values, if any of these are suprassed, will return null
   *  to denote that this baseOffset cannot be used to map within bounds of the grid.
   * usedPoints - Map object containing point-character elements that denote already in-use points.
   * RETURN: Array of mapped points that can be used to apply to the original grid, or null if it
   *        cannot be due to boundary or other word conflicts.
   * NOTE: That this will also return null if an x or y component of any of the mapped
   *      points are < 0.
   */
  getMappedPoints(origin, baseOffset, maxX, maxY, usedPoints) {
    if (this.wordLength >= 1) {
      baseOffset = MappedWord.normalizeOffset(baseOffset);

      let mapped = [origin]; // Mapped points on parent grid
      let prevPoint = origin;
      // Iterate thru every letter and hope to avoid conflicts
      for (let w = 1; w < this.wordLength; w++) { // Skips the first letter
        // Get current point
        let pt = addPoints(prevPoint, baseOffset);

        // Check if within bounds or does not conflict
        if (pt.every(component => component >= 0) // Each point component is positive?
            && pt[0] <= maxX && pt[1] <= maxY // Point within grid boundaries?
            && !conflictingPoints(usedPoints, pt, this.word[w]) // No word conflicts?
            ) {
          // Proceed to next iteration
          mapped.push(pt);
          prevPoint = pt;
        } else {
          return null;
        }
      }
      console.log(mapped);
      return mapped;
    }
    return origin; // If its just a letter (or even none), then why do anything?
  }
  
  /**
   * "Normalize" a base offset pair. Keeping each component within [-1, 0, 1].
   */
  static normalizeOffset(base) {
    return Array.from(base, c => normalizePN(c));
  }
}

/**
 * The visible word search grid.
 */
class WordsearchGrid {
  
  /**
   * characters - Character string to use when filling random characters.
   */
  constructor(width, height, characters) {
    this.grid = WordsearchGrid.createNewGrid(width, height, characters); // Create blank
    this.w = width;
    this.h = height;
    this.cheat = false; // Bolden added words?
    /**
     * Map that records points with modified letters (from adding words to the grid).
     */
    this.used = new Map();
    this.addedWords = []; // Array of successfully added words
  }

  /**
   * Generate a grid of randomized printable characters using a given character string.
   * width - Width of map.
   * height - Height of map.
   * charMap - Character string to use.
   */
  static createNewGrid(width, height, charMap) {
    let whole = [];
    for (let y = 0; y < height; y++) {
      whole.push([]); // Row
      for (let x = 0; x < width; x++) {
        whole[y].push(charMap[randInt(0, charMap.length - 1)]);
      }
    }
    return whole;
  }

  /**
   * Check if theres a conflict at (x, y) with given letter.
   */
  pointConflictAt(x, y, letter) {
    return conflictingPoints(this.used, [x, y], letter);
  }

  /**
   * Attempt to add a given word to the grid.
   * RETURNS: True, if successfully added.
   */
  addWord(word) {
    if (word.length <= this.w) {
      // Maximum amount of attempts is w^2 (every point possible on the grid)
      let attempts = this.w * this.w;
      while (attempts --> 0) {
        let reversed = false;
        let origin = WordsearchGrid.randomPoint(this.w, this.h);

        let finalMapping = null;
        if (!this.pointConflictAt(origin[0], origin[1], word[0])) { // NO conflict at origin?
          // Try to map from origin
          let mw = new MappedWord(word);
          // 8 possible baseOffsets, choose them in random order
          let shuffledBases = shuffleArray(OFFSETS);
          for (let bo of shuffledBases) {
            finalMapping = mw.getMappedPoints(origin, bo, this.w -1 , this.w - 1, this.used);
            if (finalMapping != null) {
              break; // Found first successful offset
            }
          }
        }

        if (finalMapping != null) { // Plot as soon as a valid mapping has been found
          this.plotLetters(word, finalMapping);
          this.addedWords.push(word);
          console.log(`Successfully plotted '${word}' AT ${origin}`);
          return true;
        }
      }
    }
    return false; // Fail
  }
  
  /**
   * Force a word onto the grid, this does not check for conflicts.
   * NOTE: Will only plot of length of word and points are equal.
   */
  plotLetters(word, points) {
    if (word.length == points.length) {
      for (let x = 0; x < word.length; x++) {
        this.setLetterAt(word[x], points[x][0], points[x][1]);
      }
    }
  }

  static randomPoint(w, h) {
    return [randInt(0, w-1), randInt(0, h-1)];
  }

  /**
   * Get character at (x, y).
   */
  at(x, y) {
    return this.grid[y][x];
  }
  
  /**
   * Set letter l at point (x, y). Sets values in used map.
   */
  setLetterAt(l, x, y) {
    this.grid[y][x] = `${this.cheat ? "<b>" : ""}${l}${this.cheat ? "</b>" : ""}`;
    this.used.set(pointToKey(x, y), l);
  }
  
  /**
   * Look for used character point at (x, y). Will return undefined if not found.
   */
  getUsed(x, y) {
    return this.used.get(pointToKey(x, y));
  }
  
  toHtmlString() {
    let rep = "";
    for (let y = 0; y < this.grid.length; y++) {
      for (let ch of this.grid[y]) {
        rep += ch + " ";
      }
      rep += "<br>";
    }
    return rep;
  }
  
  /**
   * If true, added words will be boldened.
   */
  setCheatMode(flag) {
    this.cheat = flag;
    console.log(`Cheat mode set to ${flag}`);
  }
}

/**
 * List out the added words nicely in a <ul>/list element.
 * NOTE: Does not track any words.
 */
class WordListOutput {
  constructor(id) {
    this.id = id; // Element ID
    this.container = document.getElementById(this.id);
  }
  
  /**
   * Add a word to the list.
   */
  append(word) {
    //let container = document.getElementById(this.id);
    this.container.insertAdjacentHTML("beforeend", WordListOutput.createElement(word));
  }

  setVisible(flag) {
    if (flag == true) {
      this.container.style.visibility = "visible";
    } else {
      this.container.style.visibility = "hidden";
    }
  }

  static createElement(txt) {
    return `<li>${txt}</li`;
  }
}

/**
 * Get the sum of two points. NOTE: assumes point array length >= 2 and contain numerical values.
 */
function addPoints(a, b) {
  return [a[0] + b[0], a[1] + b[1]];
}

/**
 * Keep n within (-1, 0, 1).
 */
function normalizePN(n) {
  if (n == 0)
    return 0;
  return n > 0 ? 1 : -1;
}

/**
 * Convert a point to a key string for a Map.
 */
function pointToKey(x, y) {
  return `${x},${y}`;
}

/**
 * Get the character map as a string.
 */
function charMapToString(map) {
  return map.join(" ");
}

function loadOutput() {
  // Parameters
  let width = Math.abs(parseInt(getUrlParam("w"))); // Width of grid
  let words = getUrlParam("words"); // Comma separated input
  let cheat = getUrlParam("cheat"); // Show words in bold
  let showList = getUrlParam("show_list"); // Hide the word list?
  words = words.split(",");

  // Put words into random places
  console.log("Grid width of: " + width);
  console.log("Placing words: " + words);
  let list = new WordListOutput("list");
  list.setVisible(showList.toLowerCase() == "true"); // Might be useless if client reads the URL...
  let grid = new WordsearchGrid(width, width, CHARS);
  grid.setCheatMode(cheat.toLowerCase() == "true"); // True if it exists
  for (let w of words) {
    let success = grid.addWord(w);
    if (success) { // Update list if succesfully added to grid
      list.append(w);
    }
  }
  console.log("Done.");
  document.getElementById("output").innerHTML = grid.toHtmlString();
}

loadOutput();
