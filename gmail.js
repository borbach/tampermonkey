// ==UserScript==
// @name         Gmail Auto-Reply for PDFs and URLs
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically reply "Very Interesting Article" to emails with PDFs or URLs
// @author       You
// @match        https://mail.google.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const processedEmails = new Set();
    const REPLY_TEXT = "Very Interesting Article";
    
    // Check if email contains PDF attachment or URL
    function containsPdfOrUrl(emailElement) {
        // Check for PDF attachments
        const attachments = emailElement.querySelectorAll('[data-tooltip*=".pdf"], [aria-label*=".pdf"]');
        if (attachments.length > 0) {
            return true;
        }
        
        // Check for URLs in email body
        const emailBody = emailElement.querySelector('[data-message-id]');
        if (emailBody) {
            const text = emailBody.innerText || emailBody.textContent;
            // Simple URL regex pattern
            const urlPattern = /(https?:\/\/[^\s]+)/g;
            if (urlPattern.test(text)) {
                return true;
            }
        }
        
        return false;
    }
    
    // Get unique email ID
    function getEmailId(emailElement) {
        const messageId = emailElement.querySelector('[data-message-id]');
        return messageId ? messageId.getAttribute('data-message-id') : null;
    }
    
    // Click reply button and send reply
    function sendAutoReply(emailElement) {
        // Find and click reply button
        const replyButton = emailElement.querySelector('[aria-label*="Reply"], [data-tooltip*="Reply"]');
        if (!replyButton) {
            console.log('Reply button not found');
            return;
        }
        
        replyButton.click();
        
        // Wait for compose box to appear
        setTimeout(() => {
            // Find the compose textarea
            const composeBox = document.querySelector('[aria-label*="Message Body"], [role="textbox"][aria-label*="Message"]');
            if (composeBox) {
                composeBox.focus();
                composeBox.innerHTML = REPLY_TEXT;
                
                // Trigger input event to enable send button
                const inputEvent = new Event('input', { bubbles: true });
                composeBox.dispatchEvent(inputEvent);
                
                // Wait a bit then click send
                setTimeout(() => {
                    const sendButton = document.querySelector('[aria-label*="Send"], [data-tooltip*="Send"]');
                    if (sendButton && !sendButton.disabled) {
                        sendButton.click();
                        console.log('Auto-reply sent: "Very Interesting Article"');
                    }
                }, 500);
            }
        }, 1000);
    }
    
    // Monitor for new emails
    function checkForNewEmails() {
        const emails = document.querySelectorAll('[data-message-id]');
        
        emails.forEach(email => {
            const emailId = getEmailId(email);
            
            // Skip if already processed
            if (!emailId || processedEmails.has(emailId)) {
                return;
            }
            
            // Check if email contains PDF or URL
            if (containsPdfOrUrl(email)) {
                console.log('Found email with PDF or URL, sending auto-reply...');
                processedEmails.add(emailId);
                sendAutoReply(email);
            }
        });
    }
    
    // Run checks periodically
    setInterval(checkForNewEmails, 3000);
    
    // Initial check after page load
    setTimeout(checkForNewEmails, 3000);
    
    console.log('Gmail Auto-Reply script loaded');
})();


