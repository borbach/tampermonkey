// ==UserScript==
// @name         Ask Claude
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Add an "Ask Claude" button to any webpage with screenshot and chat functionality
// @author       You
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    // Get or prompt for API key
    function getApiKey() {
        let apiKey = GM_getValue('anthropic_api_key', '');

        if (!apiKey) {
            apiKey = prompt('Please enter your Anthropic API key (it will be saved for future use):');
            if (apiKey) {
                GM_setValue('anthropic_api_key', apiKey);
            }
        }

        return apiKey;
    }

    // Function to reset API key (useful if key is invalid)
    function resetApiKey() {
        GM_setValue('anthropic_api_key', '');
        return getApiKey();
    }

    // Create the floating button
    const button = document.createElement('button');
    button.textContent = 'Ask Claude';
    button.style.cssText = `
        position: fixed;
        top: 50%;
        right: 20px;
        transform: translateY(-50%);
        z-index: 10000;
        background: #e53e3e;
        color: white;
        border: none;
        padding: 15px 20px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
    `;

    // Add hover effects
    button.addEventListener('mouseenter', () => {
        button.style.background = '#c53030';
        button.style.transform = 'translateY(-50%) scale(1.05)';
    });

    button.addEventListener('mouseleave', () => {
        button.style.background = '#e53e3e';
        button.style.transform = 'translateY(-50%) scale(1)';
    });

    // Add the button to the page
    document.body.appendChild(button);

    // Function to take screenshot using html2canvas
    async function takeScreenshot() {
        try {
            // Load html2canvas library if not already loaded
            if (typeof html2canvas === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                document.head.appendChild(script);

                // Wait for library to load
                await new Promise((resolve) => {
                    script.onload = resolve;
                });
            }

            const canvas = await html2canvas(document.body, {
                height: window.innerHeight,
                width: window.innerWidth,
                scrollX: 0,
                scrollY: 0
            });

            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error('Screenshot failed:', error);
            return null;
        }
    }

    // Function to create the popup window
    function createPopup(screenshot) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 20000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // Create popup container
        const popup = document.createElement('div');
        popup.style.cssText = `
            background: white;
            border-radius: 12px;
            width: 80%;
            max-width: 800px;
            height: 80%;
            max-height: 600px;
            position: relative;
            display: flex;
            flex-direction: column;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;

        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            background: #2d3748;
            color: white;
            padding: 20px;
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Ask Claude about this page';
        title.style.margin = '0';

        const headerButtons = document.createElement('div');
        headerButtons.style.cssText = `
            display: flex;
            gap: 10px;
            align-items: center;
        `;

        const settingsButton = document.createElement('button');
        settingsButton.textContent = '⚙️';
        settingsButton.title = 'Reset API Key';
        settingsButton.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 5px;
            border-radius: 3px;
        `;

        settingsButton.addEventListener('click', () => {
            if (confirm('Reset your API key? You will need to enter it again.')) {
                resetApiKey();
            }
        });

        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        closeButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        headerButtons.appendChild(settingsButton);
        headerButtons.appendChild(closeButton);
        header.appendChild(title);
        header.appendChild(headerButtons);

        // Create chat container
        const chatContainer = document.createElement('div');
        chatContainer.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 20px;
            overflow: hidden;
        `;

        // Create messages area
        const messagesArea = document.createElement('div');
        messagesArea.style.cssText = `
            flex: 1;
            overflow-y: auto;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            background: #f7fafc;
        `;

        // Add initial message
        const initialMessage = document.createElement('div');
        initialMessage.style.cssText = `
            background: #e2e8f0;
            padding: 10px 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            font-size: 14px;
            color: #4a5568;
        `;
        initialMessage.textContent = 'Hi! I can see the current page and answer questions about its content. What would you like to know?';
        messagesArea.appendChild(initialMessage);

        // Create input area
        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = `
            display: flex;
            gap: 10px;
        `;

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Ask me anything about this page...';
        input.style.cssText = `
            flex: 1;
            padding: 12px;
            border: 1px solid #cbd5e0;
            border-radius: 6px;
            font-size: 14px;
        `;

        const sendButton = document.createElement('button');
        sendButton.textContent = 'Send';
        sendButton.style.cssText = `
            background: #4299e1;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        `;

        // Function to add message to chat
        function addMessage(content, isUser = false) {
            const messageDiv = document.createElement('div');
            messageDiv.style.cssText = `
                background: ${isUser ? '#4299e1' : '#white'};
                color: ${isUser ? 'white' : '#2d3748'};
                padding: 12px 15px;
                border-radius: 8px;
                margin-bottom: 10px;
                max-width: 80%;
                ${isUser ? 'margin-left: auto; text-align: right;' : ''}
                border: ${isUser ? 'none' : '1px solid #e2e8f0'};
                word-wrap: break-word;
                white-space: pre-wrap;
            `;
            messageDiv.textContent = content;
            messagesArea.appendChild(messageDiv);
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }

        // Function to send message to Claude
        async function sendToClaude(userMessage) {
            return new Promise((resolve) => {
                const apiKey = getApiKey();

                if (!apiKey) {
                    resolve('Please set your API key using the settings button (⚙️) in the header.');
                    return;
                }

                try {
                    const messages = [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: `I'm looking at a webpage. Here's my question about it: ${userMessage}\n\nPage URL: ${window.location.href}\nPage Title: ${document.title}`
                                }
                            ]
                        }
                    ];

                    // Add screenshot if available
                    if (screenshot) {
                        messages[0].content.push({
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: "image/png",
                                data: screenshot.split(',')[1]
                            }
                        });
                    }

                    GM_xmlhttpRequest({
                        method: "POST",
                        url: "https://api.anthropic.com/v1/messages",
                        headers: {
                            "Content-Type": "application/json",
                            "x-api-key": apiKey,
                            "anthropic-version": "2023-06-01"
                        },
                        data: JSON.stringify({
                            model: "claude-3-5-sonnet-20241022",
                            max_tokens: 1000,
                            messages: messages
                        }),
                        onload: function(response) {
                            try {
                                if (response.status === 200) {
                                    const data = JSON.parse(response.responseText);
                                    resolve(data.content[0].text);
                                } else if (response.status === 401) {
                                    resolve('Authentication failed. Please check your API key using the settings button (⚙️).');
                                } else {
                                    console.error('API request failed:', response.status, response.responseText);
                                    resolve(`Sorry, I encountered an error (${response.status}). Please try again or check your API key.`);
                                }
                            } catch (error) {
                                console.error('Error parsing Claude API response:', error);
                                resolve('Sorry, I received an invalid response. Please try again.');
                            }
                        },
                        onerror: function(error) {
                            console.error('Error calling Claude API:', error);
                            resolve('Sorry, I encountered a network error while processing your request. Please try again.');
                        }
                    });
                } catch (error) {
                    console.error('Error preparing Claude API request:', error);
                    resolve('Sorry, I encountered an error while preparing your request. Please try again.');
                }
            });
        }

        // Handle sending messages
        async function handleSend() {
            const message = input.value.trim();
            if (!message) return;

            addMessage(message, true);
            input.value = '';
            sendButton.disabled = true;
            sendButton.textContent = 'Sending...';

            const response = await sendToClaude(message);
            addMessage(response, false);

            sendButton.disabled = false;
            sendButton.textContent = 'Send';
        }

        sendButton.addEventListener('click', handleSend);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSend();
            }
        });

        // Assemble the popup
        inputContainer.appendChild(input);
        inputContainer.appendChild(sendButton);
        chatContainer.appendChild(messagesArea);
        chatContainer.appendChild(inputContainer);
        popup.appendChild(header);
        popup.appendChild(chatContainer);
        overlay.appendChild(popup);

        // Add to page
        document.body.appendChild(overlay);

        // Focus on input
        setTimeout(() => input.focus(), 100);
    }

    // Handle button click
    button.addEventListener('click', async () => {
        const apiKey = getApiKey();
        if (!apiKey) {
            alert('Please enter your Anthropic API key to use this feature.');
            return;
        }

        button.textContent = 'Taking screenshot...';
        button.disabled = true;

        const screenshot = await takeScreenshot();

        button.textContent = 'Ask Claude';
        button.disabled = false;

        createPopup(screenshot);
    });

})();