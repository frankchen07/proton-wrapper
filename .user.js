// ==UserScript==
// @name         Gmail Shortcuts for Proton Mail
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Implements Gmail-like keyboard shortcuts in Proton Mail
// @author       You
// @match        https://mail.proton.me/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function() {
    'use strict';

    // SECURITY: This script does NOT:
    // - Make network requests (no fetch/XHR/XMLHttpRequest)
    // - Access localStorage/sessionStorage/cookies directly
    // - Exfiltrate data to external servers
    // - Use @require to load external scripts
    // - Access browser APIs beyond DOM manipulation

    // Configuration
    const CONFIG = {
        enabled: true,
        debug: false // SECURITY: Keep false in production to avoid console.log leaks
    };

    // Helper: Log debug messages (only when debug enabled)
    function log(...args) {
        if (CONFIG.debug) {
            // SECURITY: Only log non-sensitive operation info, never email content
            console.log('[Gmail Shortcuts]', ...args);
        }
    }

    // Helper: Check if focus is in an input/textarea/contenteditable
    function isInputFocused() {
        const active = document.activeElement;
        if (!active) return false;
        
        const tagName = active.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea') {
            return true;
        }
        
        // Check for contenteditable (compose editor)
        if (active.contentEditable === 'true' || active.isContentEditable) {
            return true;
        }
        
        // Check if inside a contenteditable parent
        let parent = active.parentElement;
        while (parent && parent !== document.body) {
            if (parent.contentEditable === 'true' || parent.isContentEditable) {
                return true;
            }
            parent = parent.parentElement;
        }
        
        return false;
    }

    // Helper: Find element with multiple selector strategies
    function findElement(selectors) {
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) {
                log('Found element:', selector);
                return el;
            }
        }
        log('Element not found for selectors:', selectors);
        return null;
    }

    // Helper: Click element safely (no network side effects)
    function clickElement(el) {
        if (!el) return false;
        
        try {
            // SECURITY: Only triggers UI clicks, no data exfiltration
            el.click();
            return true;
        } catch (e) {
            log('Click failed:', e);
            // Try dispatchEvent as fallback
            try {
                el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                return true;
            } catch (e2) {
                log('DispatchEvent failed:', e2);
                return false;
            }
        }
    }

    // ... rest of helper functions remain the same ...

    // Helper: Get message list items
    function getMessageItems() {
        // Common selectors for message list items
        const selectors = [
            '[data-shortcut-target="item-container"]',
            '[data-testid="message-item"]',
            '[role="listitem"]',
            '.conversation-list-item',
            '.item-container'
        ];
        
        for (const selector of selectors) {
            const items = Array.from(document.querySelectorAll(selector));
            if (items.length > 0) {
                return items;
            }
        }
        return [];
    }

    // Helper: Get currently selected/focused message
    function getCurrentMessage() {
        const items = getMessageItems();
        
        // Try to find focused/selected item
        let current = items.find(item => {
            return item.classList.contains('selected') ||
                   item.classList.contains('active') ||
                   item.classList.contains('item-is-selected') ||
                   item.getAttribute('aria-selected') === 'true' ||
                   item === document.activeElement ||
                   item.contains(document.activeElement);
        });
        
        return current || items[0] || null;
    }

    // Helper: Navigate to next/previous message
    function navigateMessage(direction) {
        const items = getMessageItems();
        if (items.length === 0) return;
        
        const current = getCurrentMessage();
        const currentIndex = current ? items.indexOf(current) : -1;
        
        let targetIndex;
        if (direction === 'next') {
            targetIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        } else {
            targetIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        }
        
        const target = items[targetIndex];
        if (target) {
            target.focus();
            target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            clickElement(target);
            log(`Navigated to message ${targetIndex + 1}/${items.length}`);
        }
    }

    // Helper: Archive current message
    function archiveMessage() {
        const selectors = [
            'button[title*="Archive" i]',
            'button[aria-label*="Archive" i]',
            '[data-testid*="archive" i]',
            '[class*="archive" i]',
            'button:has(svg[class*="archive"])'
        ];
        
        const btn = findElement(selectors);
        if (btn) {
            clickElement(btn);
            log('Archived message');
            return true;
        }
        
        // Fallback: look in toolbar
        const toolbarSelectors = [
            '[class*="toolbar"] button[title*="Archive" i]',
            '[class*="action"] button[title*="Archive" i]'
        ];
        
        for (const selector of toolbarSelectors) {
            const btn = document.querySelector(selector);
            if (btn && btn.offsetParent !== null) { // Check if visible
                clickElement(btn);
                log('Archived message via toolbar');
                return true;
            }
        }
        
        log('Archive button not found');
        return false;
    }

    // Helper: Delete current message
    function deleteMessage() {
        const selectors = [
            'button[title*="Delete" i]',
            'button[aria-label*="Delete" i]',
            '[data-testid*="delete" i]',
            '[class*="delete" i]',
            'button:has(svg[class*="trash"])'
        ];
        
        const btn = findElement(selectors);
        if (btn) {
            clickElement(btn);
            log('Deleted message');
            return true;
        }
        
        log('Delete button not found');
        return false;
    }

    // Helper: Reply to message
    function replyMessage() {
        const selectors = [
            'button[title*="Reply" i]',
            'button[aria-label*="Reply" i]',
            '[data-testid*="reply" i]',
            'button:has(svg[class*="reply"])',
            'button:not([title*="Reply all"]):has(svg[class*="arrow-left"])'
        ];
        
        const btn = findElement(selectors);
        if (btn) {
            clickElement(btn);
            log('Reply clicked');
            return true;
        }
        
        log('Reply button not found');
        return false;
    }

    // Helper: Reply all
    function replyAllMessage() {
        const selectors = [
            'button[title*="Reply all" i]',
            'button[aria-label*="Reply all" i]',
            '[data-testid*="reply-all" i]'
        ];
        
        const btn = findElement(selectors);
        if (btn) {
            clickElement(btn);
            log('Reply all clicked');
            return true;
        }
        
        log('Reply all button not found');
        return false;
    }

    // Helper: Forward message
    function forwardMessage() {
        const selectors = [
            'button[title*="Forward" i]',
            'button[aria-label*="Forward" i]',
            '[data-testid*="forward" i]',
            'button:has(svg[class*="forward"])'
        ];
        
        const btn = findElement(selectors);
        if (btn) {
            clickElement(btn);
            log('Forward clicked');
            return true;
        }
        
        log('Forward button not found');
        return false;
    }

    // Helper: Star/unstar message
    function starMessage() {
        const selectors = [
            'button[title*="Star" i]',
            'button[title*="Unstar" i]',
            'button[aria-label*="Star" i]',
            '[data-testid*="star" i]',
            'button:has(svg[class*="star"])'
        ];
        
        const btn = findElement(selectors);
        if (btn) {
            clickElement(btn);
            log('Star toggled');
            return true;
        }
        
        log('Star button not found');
        return false;
    }

    // Helper: Mark as unread
    function markUnread() {
        const selectors = [
            'button[title*="Unread" i]',
            'button[aria-label*="Unread" i]',
            '[data-testid*="unread" i]'
        ];
        
        const btn = findElement(selectors);
        if (btn) {
            clickElement(btn);
            log('Marked as unread');
            return true;
        }
        
        log('Unread button not found');
        return false;
    }

    // Helper: Compose new message
    function composeMessage() {
        const selectors = [
            'button[title*="Compose" i]',
            'button[aria-label*="Compose" i]',
            '[data-testid*="compose" i]',
            'button:has(svg[class*="pen"])',
            '.compose-button',
            'button[class*="compose"]'
        ];
        
        const btn = findElement(selectors);
        if (btn) {
            clickElement(btn);
            log('Compose clicked');
            return true;
        }
        
        log('Compose button not found');
        return false;
    }

    // Helper: Search
    function focusSearch() {
        const selectors = [
            'input[placeholder*="Search" i]',
            'input[type="search"]',
            '[data-testid*="search" i]',
            'input[aria-label*="Search" i]'
        ];
        
        const input = findElement(selectors);
        if (input) {
            input.focus();
            input.select();
            log('Search focused');
            return true;
        }
        
        log('Search input not found');
        return false;
    }

    // Main keyboard handler
    function handleKeyDown(e) {
        // Don't intercept if typing in inputs
        if (isInputFocused()) {
            return;
        }

        // Don't intercept if modifier keys are pressed (except Shift for capital letters)
        if (e.ctrlKey || e.metaKey || e.altKey) {
            return;
        }

        const key = e.key.toLowerCase();
        let handled = false;

        switch(key) {
            case 'j': // Next message
                e.preventDefault();
                navigateMessage('next');
                handled = true;
                break;

            case 'k': // Previous message
                e.preventDefault();
                navigateMessage('prev');
                handled = true;
                break;

            case ']': // Next conversation (same as j)
            case '}':
                e.preventDefault();
                navigateMessage('next');
                handled = true;
                break;

            case '[': // Previous conversation (same as k)
            case '{':
                e.preventDefault();
                navigateMessage('prev');
                handled = true;
                break;

            case 'e': // Archive
                e.preventDefault();
                archiveMessage();
                handled = true;
                break;

            case '#': // Delete
            case '3':
                if (e.shiftKey && key === '#') {
                    e.preventDefault();
                    deleteMessage();
                    handled = true;
                } else if (key === '3' && !e.shiftKey) {
                    e.preventDefault();
                    deleteMessage();
                    handled = true;
                }
                break;

            case 'r': // Reply
                e.preventDefault();
                replyMessage();
                handled = true;
                break;

            case 'a': // Reply all
                e.preventDefault();
                replyAllMessage();
                handled = true;
                break;

            case 'f': // Forward
                e.preventDefault();
                forwardMessage();
                handled = true;
                break;

            case '*': // Star/unstar
            case '8':
                if (e.shiftKey && key === '*') {
                    e.preventDefault();
                    starMessage();
                    handled = true;
                } else if (key === '8' && !e.shiftKey) {
                    e.preventDefault();
                    starMessage();
                    handled = true;
                }
                break;

            case 'u': // Mark as unread
                e.preventDefault();
                markUnread();
                handled = true;
                break;

            case 'c': // Compose
                e.preventDefault();
                composeMessage();
                handled = true;
                break;

            case '/': // Focus search
                e.preventDefault();
                focusSearch();
                handled = true;
                break;

            case 'x': // Select message
                e.preventDefault();
                const currentMsg = getCurrentMessage();
                if (currentMsg) {
                    // Try to find checkbox
                    const checkbox = currentMsg.querySelector('input[type="checkbox"]');
                    if (checkbox) {
                        checkbox.click();
                        log('Message selected');
                    }
                }
                handled = true;
                break;
        }

        if (handled) {
            log(`Handled key: ${key}`);
        }
    }

    // Initialize
    function init() {
        // SECURITY: Verify we're on the expected domain
        if (!window.location.hostname.includes('proton.me')) {
            log('Script disabled: wrong domain');
            return;
        }

        log('Gmail Shortcuts for Proton Mail initialized');
        
        // Add event listener with capture phase for early interception
        document.addEventListener('keydown', handleKeyDown, true);
        
        // SECURITY: Removed unused MutationObserver - no need to observe DOM changes
        // The selectors work on-demand when functions are called
        
        log('Event listeners attached');
    }

    // Wait for DOM to be ready (document-idle is safer than document-start)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Use setTimeout to ensure DOM is fully ready even if readyState is 'complete'
        setTimeout(init, 0);
    }

})();