// ==UserScript==
// @name         Button
// @namespace    http://tampermonkey.net/
// @version      2025-09-19
// @description  try to take over the world!
// @author       You
// @match        http://127.0.0.1/*
// @match        *://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const newButton = document.createElement('button');
    newButton.textContent = 'Click Me!';
    newButton.style.padding = '30px';
    newButton.style.margin = '30px';
    newButton.style.backgroundColor = 'red';
    newButton.style.color = 'white';
  //  newButton.style.font-weight = 'bold';
    newButton.onclick = () => {
        alert('Button clicked!');
    };

    // Append the button to the body or another specific element
    document.body.prepend(newButton);
})();
// Your code here...