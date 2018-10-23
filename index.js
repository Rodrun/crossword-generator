
/**
 * Modify a list element with button list items that remove itself on click. Keeps track of
 * added words.
 */
class WordList {
  constructor(id) {
    this.id = id;
    this.element = document.getElementById(id);
    this.list = new Set();
    this.longestWordLength = 0; // Keep track of the longest word; it'll be the minimum grid width
  }
  
  /**
   * Add a word to the list. Automatically handles button onClick to remove itself from the list.
   * Will not add empty strings, and cannot add already exisiting words.
   * name - Word to add.
   * onClick - Name of the function 
   */
  add(name) {
    name = WordList.formatWord(name); // Format the word prior to any handling
    if (!this.list.has(name) && name != "") {
      // Generate button HTML
      let id = WordList.createId(name);
      this.element.insertAdjacentHTML("beforeend", WordList.newItem(id, name));
      
      // Add the word to the list
      this.list.add(name);
      let wlen = name.length;
      if (wlen > this.longestWordLength) { // Update longest word length if needed
        this.longestWordLength = wlen;
      }
      
      // Add remove handler
      let parent = this;
      let dynamic = document.getElementById(id);
      dynamic.onclick = function() {
        const id = this.id;
        parent.removeFromList(name);
        parent.element.removeChild(dynamic);
      }
      console.log(`Added word ${name} with ID: ${id}`);
    } else {
      console.log("Cannot add existing word: " + name);
    }
  }


  /**
   * Remove a word from the list, if found. This does NOT remove from the display.
   * name - Word to remove. NOTE: assumes the word is formatted.
   */
  removeFromList(name) {
    console.log("Requested to remove word " + name);
    let success = this.list.delete(name);
    console.log("Remove " + name + " success: " + success);
  }

  /**
   * Get the words as an array.
   */
  getWords() {
    return Array.from(this.list);
  }

  /**
   * Format a word. This removes any whitespace.
   */
  static formatWord(wd) {
    return wd.replace(/\s+/g, "");
  }

  /**
   * Try to retrieve word from a formatted list item ID.
   * RETURNS: Word if successful, null otherwise.
   */
  static getWordFromId(id) {
    try {
      return id.split("LIST_")[1];
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  /**
   * Create an ID for the word. The word will be formatted in order to be a valid ID.
   * RETURNS: Formatted ID for the word button.
   */
  static createId(name) {
    name = WordList.formatWord(name); // Replace all whitespace with underscore
    return "LIST_" + name;
  }
  
  /**
   * Generate an HTML <li> item with a button. Assumes w3-css is used.
   * NOTE: ALL parameters should be strings.
   */
  static newItem(id, txt) {
    return `<li id='${id}'><button class="w3-btn w3-bar w3-red" type=button">${txt} <b>&times;</b></button></li>`;
  }
}

//////////////////////////////////Entry Point///////////////////////////////////////////////

var wlist = new WordList("words");
const textInput = document.getElementById("txtInput");
const wSlider = document.getElementById("wrange");
const cheatCheck = document.getElementById("cheat");
const show_listCheck = document.getElementById("show_list");
const widthLabel = document.getElementById("widthLbl");

// Update width display when slider modified
wSlider.oninput = function() {
  //widthLabel.innerHTML = "Width: " + this.value;
  setWidth(this.value);
}

function setWidth(x) {
  wSlider.value = x;
  widthLabel.innerHTML = "Width: " + x;
}

/**
 * Create output URL to redirect the user to the output.html page with given parameters.
 * paramMap - Map of parameters and their respective values.
 */
function getOutputUrl(paramMap) {
  let out = "output.html?";
  paramMap.forEach((val, key, map) => out += [key, val].join("=") + "&");
  return out.substring(0, out.length - 1); // Exclude the trailing &
}

/**
 * Event triggered when add button is clicked.
 */
function addBtnTrigger() {
  let value = textInput.value;
  if (value != null && value != "") {
    wlist.add(textInput.value);
    // Update minimum grid length
    wSlider.min = "" + wlist.longestWordLength;
    if (wSlider.value < wSlider.min) {
      wSlider.value = wSlider.min
    }
  }
  textInput.value = ""; // Empty after adding
}

/**
 * Event triggered when generate button is clicked. This will redirect the user to
 * the crossword generation page with GET values in the URL.
 */
function generateBtnTrigger() {
  map = new Map(); // Options
  map.set("show_list", show_listCheck.checked);
  map.set("w", wSlider.value);
  map.set("cheat", cheatCheck.checked);
  map.set("words", wlist.getWords().join(","));
  window.location.href = getOutputUrl(map); // Redirect to output page
}
