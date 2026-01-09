// ==UserScript==
// @name         Gmail Shortcuts for Proton Mail
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Gmail-style keyboard shortcuts for Proton Mail (no clicking required)
// @author       You
// @match        https://mail.proton.me/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        enabled: true,
        debug: true
    };

    let cursorIndex = -1;
    const CURSOR_CLASS = 'gmail-shortcuts-cursor';
    let gKeyPressed = false;
    let gKeyTimeout = null;

    function log(...args) {
        if (CONFIG.debug) {
            console.log('[Gmail Shortcuts]', ...args);
        }
    }

    function addCursorStyles() {
        if (document.getElementById('gmail-shortcuts-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'gmail-shortcuts-styles';
        style.textContent = `
            .${CURSOR_CLASS} {
                background-color: rgba(66, 133, 244, 0.1) !important;
                outline: 2px solid rgba(66, 133, 244, 0.5) !important;
                outline-offset: -2px !important;
                position: relative !important;
            }
            .${CURSOR_CLASS}::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 3px;
                background-color: rgba(66, 133, 244, 0.8) !important;
                z-index: 1000;
            }
        `;
        document.head.appendChild(style);
    }

    function isInputFocused() {
        const active = document.activeElement;
        if (!active) return false;
        
        const tagName = active.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea') return true;
        
        if (active.contentEditable === 'true' || active.isContentEditable) return true;
        
        let parent = active.parentElement;
        while (parent && parent !== document.body) {
            if (parent.contentEditable === 'true' || parent.isContentEditable) return true;
            parent = parent.parentElement;
        }
        
        return false;
    }

    // Check if a message is currently open/viewing
    function isMessageOpen() {
        // Look for message detail view indicators
        const indicators = [
            '[class*="message-view"]',
            '[class*="message-detail"]',
            '[class*="conversation-view"]',
            '[data-testid*="message-view"]',
            '[data-testid*="conversation-view"]',
            '[role="article"]'
        ];
        
        for (const selector of indicators) {
            const view = document.querySelector(selector);
            if (view && view.offsetParent !== null) {
                // Check if it's actually visible (not just in DOM)
                const rect = view.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    return true;
                }
            }
        }
        return false;
    }

    // Close any open message and return to list view
    function closeMessage() {
        // Look for close/back buttons
        const closeSelectors = [
            'button[title*="Close" i]',
            'button[aria-label*="Close" i]',
            'button[title*="Back" i]',
            'button[aria-label*="Back" i]',
            '[data-testid*="close"]',
            '[data-testid*="back"]',
            'button:has(svg[class*="arrow-left"])',
            'button:has(svg[class*="close"])'
        ];
        
        for (const selector of closeSelectors) {
            const btn = document.querySelector(selector);
            if (btn && btn.offsetParent !== null && !btn.disabled) {
                btn.click();
                log('Closed message view');
                return true;
            }
        }
        
        // Try pressing Escape key
        const escapeEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            code: 'Escape',
            keyCode: 27,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(escapeEvent);
        
        return false;
    }

    function getMessageItems() {
        const selectors = [
            '[data-shortcut-target="item-container"]',
            '[data-testid*="message"]',
            '[data-testid*="conversation"]',
            '[role="listitem"]',
            '[class*="conversation-item"]',
            '[class*="message-item"]',
            '[class*="item-container"]'
        ];
        
        for (const selector of selectors) {
            const items = Array.from(document.querySelectorAll(selector));
            const validItems = items.filter(item => {
                const text = item.textContent || '';
                return text.trim().length > 0 && item.offsetHeight > 0;
            });
            if (validItems.length > 0) {
                return validItems;
            }
        }
        return [];
    }

    function getCurrentMessage() {
        const items = getMessageItems();
        if (items.length === 0) return null;
        
        if (cursorIndex >= 0 && cursorIndex < items.length) {
            return items[cursorIndex];
        }
        
        const selected = items.find(item => {
            return item.classList.contains('selected') ||
                   item.classList.contains('active') ||
                   item.getAttribute('aria-selected') === 'true' ||
                   item.querySelector('input[type="checkbox"]:checked') !== null;
        });
        
        if (selected) {
            cursorIndex = items.indexOf(selected);
            return selected;
        }
        
        cursorIndex = 0;
        return items[0];
    }

    function clearCursorHighlight() {
        document.querySelectorAll(`.${CURSOR_CLASS}`).forEach(el => {
            el.classList.remove(CURSOR_CLASS);
        });
    }

    function setCursor(index) {
        const items = getMessageItems();
        if (items.length === 0) {
            cursorIndex = -1;
            return;
        }
        
        if (index < 0) index = items.length - 1;
        if (index >= items.length) index = 0;
        
        cursorIndex = index;
        clearCursorHighlight();
        
        const current = items[cursorIndex];
        if (current) {
            if (!current.hasAttribute('tabindex')) {
                current.setAttribute('tabindex', '-1');
            }
            
            current.classList.add(CURSOR_CLASS);
            current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            current.focus();
            
            log(`Cursor at ${cursorIndex + 1}/${items.length}`);
        }
    }

    function navigateCursor(direction) {
        const items = getMessageItems();
        if (items.length === 0) return;
        
        // If a message is open, close it and open next/previous
        if (isMessageOpen()) {
            log('Message is open, closing and navigating');
            closeMessage();
            
            // Wait a bit for the view to close, then navigate
            setTimeout(() => {
                if (cursorIndex < 0) {
                    const current = getCurrentMessage();
                    cursorIndex = current ? items.indexOf(current) : 0;
                }
                
                const targetIndex = direction === 'next' ? cursorIndex + 1 : cursorIndex - 1;
                const clampedIndex = targetIndex < 0 ? items.length - 1 : (targetIndex >= items.length ? 0 : targetIndex);
                
                cursorIndex = clampedIndex;
                const target = items[cursorIndex];
                if (target) {
                    // Open the message
                    target.click();
                    log(`Opened message ${cursorIndex + 1}/${items.length}`);
                }
            }, 200);
            return;
        }
        
        // Normal navigation in list view
        if (cursorIndex < 0) {
            const current = getCurrentMessage();
            cursorIndex = current ? items.indexOf(current) : 0;
        }
        
        setCursor(direction === 'next' ? cursorIndex + 1 : cursorIndex - 1);
    }

    // Selection function - find and toggle checkbox with better React integration
    function toggleSelection() {
        const current = getCurrentMessage();
        if (!current) {
            log('No current message for selection');
            return false;
        }
        
        log('Toggling selection for current message');
        
        // Find checkbox - search in current element and parents
        let checkbox = null;
        let searchElement = current;
        
        for (let i = 0; i < 4 && searchElement; i++) {
            checkbox = searchElement.querySelector('input[type="checkbox"]');
            if (checkbox) {
                log(`Found checkbox at level ${i}`);
                break;
            }
            searchElement = searchElement.parentElement;
        }
        
        if (checkbox) {
            const wasChecked = checkbox.checked;
            log(`Checkbox currently: ${wasChecked}`);
            
            // Method 1: Direct click (most reliable for React)
            try {
                checkbox.click();
                log('Clicked checkbox directly');
            } catch (err) {
                log('Direct click failed:', err);
            }
            
            // Method 2: Toggle state and trigger events
            checkbox.checked = !wasChecked;
            
            // Trigger all possible React events
            const events = ['input', 'change', 'click'];
            events.forEach(eventType => {
                const event = new Event(eventType, { 
                    bubbles: true, 
                    cancelable: true 
                });
                checkbox.dispatchEvent(event);
            });
            
            // Method 3: Try MouseEvent with more details
            const mouseEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
                button: 0,
                buttons: 1,
                detail: 1
            });
            checkbox.dispatchEvent(mouseEvent);
            
            // Method 4: Try to find and click the label if it exists
            const label = checkbox.closest('label');
            if (label) {
                label.click();
                log('Clicked label');
            }
            
            // Small delay then verify state changed and re-focus cursor
            setTimeout(() => {
                const newState = checkbox.checked;
                log(`Checkbox state after toggle: ${newState} (was ${wasChecked})`);
                
                // Re-focus the cursor element to prevent getting stuck
                const items = getMessageItems();
                if (cursorIndex >= 0 && cursorIndex < items.length) {
                    const cursorItem = items[cursorIndex];
                    if (cursorItem) {
                        cursorItem.focus();
                        cursorItem.classList.add(CURSOR_CLASS);
                    }
                }
            }, 50);
            
            return true;
        }
        
        log('No checkbox found');
        return false;
    }

    function getSelectedMessages() {
        const items = getMessageItems();
        return items.filter(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox && checkbox.checked) return true;
            
            // Also check parent checkboxes
            let parent = item.parentElement;
            for (let i = 0; i < 2 && parent; i++) {
                const parentCheckbox = parent.querySelector('input[type="checkbox"]');
                if (parentCheckbox && parentCheckbox.checked) return true;
                parent = parent.parentElement;
            }
            
            return item.classList.contains('selected') ||
                   item.getAttribute('aria-selected') === 'true' ||
                   item.getAttribute('aria-checked') === 'true';
        });
    }

    function refocusSelection() {
        const selected = getSelectedMessages();
        if (selected.length === 0) return false;
        
        log(`Refocusing ${selected.length} selected items`);
        
        // Click on the first selected item to "refresh" the toolbar state
        // This helps Proton Mail recognize the selection is still active
        const firstSelected = selected[0];
        if (firstSelected) {
            // Small delay to ensure UI is ready
            setTimeout(() => {
                // Try clicking the item itself (but not the checkbox)
                const rect = firstSelected.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    // Click slightly to the right of the checkbox area to avoid toggling
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        button: 0,
                        buttons: 1,
                        detail: 1,
                        clientX: rect.left + rect.width * 0.3, // Click in middle-left area
                        clientY: rect.top + rect.height / 2
                    });
                    firstSelected.dispatchEvent(clickEvent);
                    
                    // Also try a focus event
                    firstSelected.focus();
                    
                    log('Refocused selection');
                }
            }, 100);
            return true;
        }
        return false;
    }

    function performAction(actionFn) {
        const selected = getSelectedMessages();
        const current = getCurrentMessage();
        const wasMessageOpen = isMessageOpen();
        
        log(`Selected: ${selected.length}, Current: ${current ? 'yes' : 'no'}, Message open: ${wasMessageOpen}`);
        
        // If a message is open and we have multiple selections, close it first
        if (selected.length > 1 && wasMessageOpen) {
            log('Message is open with multiple selections, closing message first');
            closeMessage();
            
            // After closing, refocus the selection to reactivate toolbar
            setTimeout(() => {
                refocusSelection();
                
                // Then perform the action after toolbar is reactivated
                setTimeout(() => {
                    actionFn();
                }, 300);
            }, 200);
            return;
        }
        
        if (selected.length > 0) {
            log(`Performing action on ${selected.length} selected items`);
            
            // If we just came back from a message view, refocus first
            if (wasMessageOpen) {
                refocusSelection();
            }
            
            // Longer delay for multiple selections to ensure UI has fully updated
            // Even longer if we just closed a message
            const baseDelay = selected.length > 1 ? 300 : 150;
            const delay = wasMessageOpen ? baseDelay + 200 : baseDelay;
            setTimeout(() => {
                actionFn();
            }, delay);
        } else if (current) {
            log('No selection, selecting cursor item first');
            toggleSelection();
            // Wait longer for UI to update after selection
            setTimeout(() => {
                actionFn();
            }, 300);
        } else {
            log('No current message or selection');
        }
    }

    // Archive - look in toolbar when items are selected
    function archiveAction() {
        log('Looking for archive button...');
        
        // First try toolbar buttons (when items are selected)
        const toolbarSelectors = [
            '[class*="toolbar"]',
            '[class*="action-bar"]',
            '[class*="actions"]',
            '[role="toolbar"]'
        ];
        
        for (const toolbarSel of toolbarSelectors) {
            const toolbar = document.querySelector(toolbarSel);
            if (toolbar) {
                const btn = toolbar.querySelector('button[title*="Archive" i], button[aria-label*="Archive" i], [data-testid*="archive" i]');
                if (btn && btn.offsetParent !== null && !btn.disabled) {
                    btn.click();
                    log('Archive clicked from toolbar');
                    return true;
                }
            }
        }
        
        // Try global selectors
        const selectors = [
            'button[title*="Archive" i]',
            'button[aria-label*="Archive" i]',
            '[data-testid*="archive" i]',
            'button:has(svg[class*="archive"])',
            'button[class*="archive"]'
        ];
        
        for (const selector of selectors) {
            const btn = document.querySelector(selector);
            if (btn && btn.offsetParent !== null && !btn.disabled) {
                btn.click();
                log('Archive clicked');
                return true;
            }
        }
        
        log('Archive button not found');
        return false;
    }

    function deleteAction() {
        log('Looking for delete button...');
        
        const toolbarSelectors = [
            '[class*="toolbar"]',
            '[class*="action-bar"]',
            '[class*="actions"]',
            '[role="toolbar"]'
        ];
        
        let btn = null;
        
        // First, try to find toolbar and search all buttons
        for (const toolbarSel of toolbarSelectors) {
            const toolbar = document.querySelector(toolbarSel);
            if (toolbar) {
                log(`Found toolbar: ${toolbarSel}`);
                
                // Try specific selectors first
                btn = toolbar.querySelector('button[title*="Delete" i], button[aria-label*="Delete" i], button[title*="Trash" i], button[aria-label*="Trash" i], [data-testid*="delete" i], [data-testid*="trash" i]');
                if (btn && btn.offsetParent !== null && !btn.disabled) {
                    log('Found delete button with specific selector');
                    break;
                }
                
                // Try finding by SVG icon
                const buttons = toolbar.querySelectorAll('button');
                for (const button of buttons) {
                    const svg = button.querySelector('svg');
                    if (svg) {
                        const svgClasses = svg.className || '';
                        const svgPath = svg.innerHTML || '';
                        if (svgClasses.includes('trash') || svgClasses.includes('delete') || 
                            svgPath.includes('trash') || svgPath.includes('delete') ||
                            button.title?.toLowerCase().includes('delete') ||
                            button.title?.toLowerCase().includes('trash') ||
                            button.getAttribute('aria-label')?.toLowerCase().includes('delete') ||
                            button.getAttribute('aria-label')?.toLowerCase().includes('trash')) {
                            if (button.offsetParent !== null && !button.disabled) {
                                btn = button;
                                log('Found delete button by SVG/content');
                                break;
                            }
                        }
                    }
                }
                if (btn) break;
                btn = null;
            }
        }
        
        // If not found in toolbar, try global selectors
        if (!btn) {
            const selectors = [
                'button[title*="Delete" i]',
                'button[aria-label*="Delete" i]',
                'button[title*="Trash" i]',
                'button[aria-label*="Trash" i]',
                '[data-testid*="delete" i]',
                '[data-testid*="trash" i]',
                'button:has(svg[class*="trash"])',
                'button:has(svg[class*="delete"])',
                'button[class*="delete"]',
                'button[class*="trash"]'
            ];
            
            for (const selector of selectors) {
                btn = document.querySelector(selector);
                if (btn && btn.offsetParent !== null && !btn.disabled) {
                    log(`Found delete button with selector: ${selector}`);
                    break;
                }
                btn = null;
            }
        }
        
        // Final fallback: search all visible buttons in toolbar areas
        if (!btn) {
            for (const toolbarSel of toolbarSelectors) {
                const toolbar = document.querySelector(toolbarSel);
                if (toolbar) {
                    const allButtons = Array.from(toolbar.querySelectorAll('button'));
                    for (const button of allButtons) {
                        if (button.offsetParent === null || button.disabled) continue;
                        
                        const text = (button.textContent || '').toLowerCase();
                        const title = (button.title || '').toLowerCase();
                        const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
                        const dataTestId = (button.getAttribute('data-testid') || '').toLowerCase();
                        
                        if (text.includes('delete') || text.includes('trash') ||
                            title.includes('delete') || title.includes('trash') ||
                            ariaLabel.includes('delete') || ariaLabel.includes('trash') ||
                            dataTestId.includes('delete') || dataTestId.includes('trash')) {
                            btn = button;
                            log('Found delete button by text/content fallback');
                            break;
                        }
                    }
                    if (btn) break;
                }
            }
        }
        
        if (btn) {
            // Delay then click with multiple methods
            setTimeout(() => {
                // Scroll button into view if needed
                btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                
                // Focus and click
                btn.focus();
                
                // Try multiple click methods for better reliability
                try {
                    btn.click();
                } catch (err) {
                    log('Click failed:', err);
                }
                
                // Also try programmatic click with events
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    button: 0,
                    buttons: 1,
                    detail: 1
                });
                btn.dispatchEvent(clickEvent);
                
                // Try mousedown/mouseup sequence (more natural)
                const mouseDown = new MouseEvent('mousedown', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    button: 0,
                    buttons: 1
                });
                const mouseUp = new MouseEvent('mouseup', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    button: 0,
                    buttons: 1
                });
                btn.dispatchEvent(mouseDown);
                setTimeout(() => {
                    btn.dispatchEvent(mouseUp);
                    btn.dispatchEvent(clickEvent);
                }, 10);
                
                log('Delete clicked');
            }, 200);
            return true;
        }
        
        log('Delete button not found');
        return false;
    }

    function replyAction() {
        const current = getCurrentMessage();
        if (current) {
            current.click();
            setTimeout(() => {
                const selectors = [
                    'button[title*="Reply" i]:not([title*="Reply all" i])',
                    'button[aria-label*="Reply" i]:not([aria-label*="Reply all" i])',
                    '[data-testid*="reply"]:not([data-testid*="reply-all"])'
                ];
                
                for (const selector of selectors) {
                    const btn = document.querySelector(selector);
                    if (btn && btn.offsetParent !== null) {
                        btn.click();
                        return;
                    }
                }
            }, 200);
        }
    }

    function replyAllAction() {
        const selected = getSelectedMessages();
        
        // If multiple items are selected, only reply to the current/first one
        if (selected.length > 1) {
            log('Multiple items selected, replying to first selected item');
            const firstSelected = selected[0];
            if (firstSelected) {
                firstSelected.click();
                setTimeout(() => {
                    const selectors = [
                        'button[title*="Reply all" i]',
                        'button[aria-label*="Reply all" i]',
                        '[data-testid*="reply-all" i]'
                    ];
                    
                    for (const selector of selectors) {
                        const btn = document.querySelector(selector);
                        if (btn && btn.offsetParent !== null) {
                            btn.click();
                            return;
                        }
                    }
                }, 200);
            }
            return;
        }
        
        // Normal case: single item or no selection
        const current = getCurrentMessage();
        if (current) {
            current.click();
            setTimeout(() => {
                const selectors = [
                    'button[title*="Reply all" i]',
                    'button[aria-label*="Reply all" i]',
                    '[data-testid*="reply-all" i]'
                ];
                
                for (const selector of selectors) {
                    const btn = document.querySelector(selector);
                    if (btn && btn.offsetParent !== null) {
                        btn.click();
                        return;
                    }
                }
            }, 200);
        }
    }

    function forwardAction() {
        const current = getCurrentMessage();
        if (current) {
            current.click();
            setTimeout(() => {
                const selectors = [
                    'button[title*="Forward" i]',
                    'button[aria-label*="Forward" i]',
                    '[data-testid*="forward" i]'
                ];
                
                for (const selector of selectors) {
                    const btn = document.querySelector(selector);
                    if (btn && btn.offsetParent !== null) {
                        btn.click();
                        return;
                    }
                }
            }, 200);
        }
    }

    function starAction() {
        const current = getCurrentMessage();
        if (current) {
            const selectors = [
                'button[title*="Star" i]',
                'button[title*="Unstar" i]',
                '[data-testid*="star" i]',
                'button:has(svg[class*="star"])'
            ];
            
            for (const selector of selectors) {
                const btn = current.querySelector(selector);
                if (btn) {
                    btn.click();
                    return true;
                }
            }
        }
        return false;
    }

    function markUnreadAction() {
        log('Looking for mark as unread button...');
        
        // Try toolbar first (when items are selected)
        const toolbarSelectors = [
            '[class*="toolbar"]',
            '[class*="action-bar"]',
            '[class*="actions"]',
            '[role="toolbar"]'
        ];
        
        let btn = null;
        
        for (const toolbarSel of toolbarSelectors) {
            const toolbar = document.querySelector(toolbarSel);
            if (toolbar) {
                btn = toolbar.querySelector('button[title*="Unread" i], button[aria-label*="Unread" i], [data-testid*="unread" i]');
                if (btn && btn.offsetParent !== null && !btn.disabled) {
                    break;
                }
                btn = null;
            }
        }
        
        // If not found in toolbar, try global selectors
        if (!btn) {
            const selectors = [
                'button[title*="Unread" i]',
                'button[aria-label*="Unread" i]',
                '[data-testid*="unread" i]',
                'button:has(svg[class*="unread"])'
            ];
            
            for (const selector of selectors) {
                btn = document.querySelector(selector);
                if (btn && btn.offsetParent !== null && !btn.disabled) {
                    break;
                }
                btn = null;
            }
        }
        
        if (btn) {
            // Delay then click with multiple methods
            setTimeout(() => {
                // Scroll button into view if needed
                btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                
                // Focus and click
                btn.focus();
                
                // Try multiple click methods for better reliability
                try {
                    btn.click();
                } catch (err) {
                    log('Click failed:', err);
                }
                
                // Also try programmatic click with events
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    button: 0,
                    buttons: 1,
                    detail: 1
                });
                btn.dispatchEvent(clickEvent);
                
                // Try mousedown/mouseup sequence (more natural)
                const mouseDown = new MouseEvent('mousedown', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    button: 0,
                    buttons: 1
                });
                const mouseUp = new MouseEvent('mouseup', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    button: 0,
                    buttons: 1
                });
                btn.dispatchEvent(mouseDown);
                setTimeout(() => {
                    btn.dispatchEvent(mouseUp);
                    btn.dispatchEvent(clickEvent);
                }, 10);
                
                log('Marked as unread');
            }, 200);
            return true;
        }
        
        log('Mark as unread button not found');
        return false;
    }

    function markReadAction() {
        log('Looking for mark as read button...');
        
        const toolbarSelectors = [
            '[class*="toolbar"]',
            '[class*="action-bar"]',
            '[class*="actions"]',
            '[role="toolbar"]'
        ];
        
        let btn = null;
        
        for (const toolbarSel of toolbarSelectors) {
            const toolbar = document.querySelector(toolbarSel);
            if (toolbar) {
                btn = toolbar.querySelector('button[title*="Read" i], button[aria-label*="Read" i], [data-testid*="read" i]');
                if (btn && btn.offsetParent !== null && !btn.disabled) {
                    break;
                }
                btn = null;
            }
        }
        
        // If not found in toolbar, try global selectors
        if (!btn) {
            const selectors = [
                'button[title*="Read" i]',
                'button[aria-label*="Read" i]',
                '[data-testid*="read" i]',
                'button:has(svg[class*="read"])'
            ];
            
            for (const selector of selectors) {
                btn = document.querySelector(selector);
                if (btn && btn.offsetParent !== null && !btn.disabled) {
                    break;
                }
                btn = null;
            }
        }
        
        if (btn) {
            // Delay then click with multiple methods
            setTimeout(() => {
                // Scroll button into view if needed
                btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                
                // Focus and click
                btn.focus();
                
                // Try multiple click methods for better reliability
                try {
                    btn.click();
                } catch (err) {
                    log('Click failed:', err);
                }
                
                // Also try programmatic click with events
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    button: 0,
                    buttons: 1,
                    detail: 1
                });
                btn.dispatchEvent(clickEvent);
                
                // Try mousedown/mouseup sequence (more natural)
                const mouseDown = new MouseEvent('mousedown', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    button: 0,
                    buttons: 1
                });
                const mouseUp = new MouseEvent('mouseup', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    button: 0,
                    buttons: 1
                });
                btn.dispatchEvent(mouseDown);
                setTimeout(() => {
                    btn.dispatchEvent(mouseUp);
                    btn.dispatchEvent(clickEvent);
                }, 10);
                
                log('Marked as read');
            }, 200);
            return true;
        }
        
        log('Mark as read button not found');
        return false;
    }

    function labelAction() {
        log('Looking for label button...');
        
        // Try toolbar first (when items are selected)
        const toolbarSelectors = [
            '[class*="toolbar"]',
            '[class*="action-bar"]',
            '[class*="actions"]',
            '[role="toolbar"]'
        ];
        
        let btn = null;
        
        for (const toolbarSel of toolbarSelectors) {
            const toolbar = document.querySelector(toolbarSel);
            if (toolbar) {
                // Look for label/tag button - common names: Label, Tag, Labels, Tags
                btn = toolbar.querySelector('button[title*="Label" i], button[aria-label*="Label" i], button[title*="Tag" i], button[aria-label*="Tag" i], [data-testid*="label" i], [data-testid*="tag" i]');
                if (btn && btn.offsetParent !== null && !btn.disabled) {
                    log(`Found button in toolbar with selector: ${toolbarSel}`);
                    break;
                }
                btn = null;
            }
        }
        
        // If not found in toolbar, try global selectors
        if (!btn) {
            const selectors = [
                'button[title*="Label" i]',
                'button[aria-label*="Label" i]',
                'button[title*="Tag" i]',
                'button[aria-label*="Tag" i]',
                '[data-testid*="label" i]',
                '[data-testid*="tag" i]',
                'button:has(svg[class*="label"])',
                'button:has(svg[class*="tag"])'
            ];
            
            for (const selector of selectors) {
                btn = document.querySelector(selector);
                if (btn && btn.offsetParent !== null && !btn.disabled) {
                    log(`Found button with global selector: ${selector}`);
                    break;
                }
                btn = null;
            }
        }
        
        // Final fallback: search all visible buttons in toolbar areas
        if (!btn) {
            for (const toolbarSel of toolbarSelectors) {
                const toolbar = document.querySelector(toolbarSel);
                if (toolbar) {
                    const allButtons = Array.from(toolbar.querySelectorAll('button'));
                    for (const button of allButtons) {
                        if (button.offsetParent === null || button.disabled) continue;
                        
                        const text = (button.textContent || '').toLowerCase();
                        const title = (button.title || '').toLowerCase();
                        const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
                        const dataTestId = (button.getAttribute('data-testid') || '').toLowerCase();
                        
                        if (text.includes('label') || text.includes('tag') ||
                            title.includes('label') || title.includes('tag') ||
                            ariaLabel.includes('label') || ariaLabel.includes('tag') ||
                            dataTestId.includes('label') || dataTestId.includes('tag')) {
                            btn = button;
                            log(`Found label button by text/content fallback`);
                            break;
                        }
                    }
                    if (btn) break;
                }
            }
        }
        
        if (btn) {
            log(`Button found: className=${btn.className}`);
            
            // Single, clean click after ensuring button is ready
            setTimeout(() => {
                // Scroll button into view if needed
                btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                
                // Wait for scroll to complete, then get fresh position
                setTimeout(() => {
                    // Get fresh button position (may have changed after scroll)
                    const rect = btn.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    
                    // Use a single, natural click sequence
                    // First mousedown
                    const mouseDown = new MouseEvent('mousedown', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        button: 0,
                        buttons: 1,
                        clientX: centerX,
                        clientY: centerY
                    });
                    
                    // Then mouseup
                    const mouseUp = new MouseEvent('mouseup', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        button: 0,
                        buttons: 0,
                        clientX: centerX,
                        clientY: centerY
                    });
                    
                    // Then click
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        button: 0,
                        buttons: 0,
                        detail: 1,
                        clientX: centerX,
                        clientY: centerY
                    });
                    
                    // Dispatch in proper sequence with small delays
                    btn.dispatchEvent(mouseDown);
                    setTimeout(() => {
                        btn.dispatchEvent(mouseUp);
                        setTimeout(() => {
                            btn.dispatchEvent(clickEvent);
                            log('Label button clicked (single clean click)');
                        }, 10);
                    }, 10);
                }, 150);
            }, 200);
            return true;
        }
        
        log('Label button not found');
        return false;
    }
    
    function composeAction() {
        const selectors = [
            'button[title*="Compose" i]',
            'button[aria-label*="Compose" i]',
            '[data-testid*="compose" i]',
            'button:has(svg[class*="pen"])'
        ];
        
        for (const selector of selectors) {
            const btn = document.querySelector(selector);
            if (btn && btn.offsetParent !== null) {
                btn.click();
                return true;
            }
        }
        return false;
    }

    function focusSearchAction() {
        const selectors = [
            'input[placeholder*="Search" i]',
            'input[type="search"]',
            '[data-testid*="search" i]'
        ];
        
        for (const selector of selectors) {
            const input = document.querySelector(selector);
            if (input) {
                input.focus();
                input.select();
                return true;
            }
        }
        return false;
    }

    // Navigation shortcuts (g+i, g+s, etc.)
    function handleGNavigation(key) {
        const navMap = {
            'i': { 
                selectors: [
                    'a[href*="inbox" i]',
                    '[data-testid*="inbox" i]',
                    'button[title*="Inbox" i]',
                    '[aria-label*="Inbox" i]',
                    '[class*="inbox"]',
                    'nav a[href*="inbox" i]'
                ], 
                name: 'Inbox' 
            },
            's': { 
                selectors: [
                    'a[href*="starred" i]',
                    '[data-testid*="starred" i]',
                    'button[title*="Starred" i]',
                    '[aria-label*="Starred" i]'
                ], 
                name: 'Starred' 
            },
            'd': { 
                selectors: [
                    'a[href*="drafts" i]',
                    '[data-testid*="drafts" i]',
                    'button[title*="Drafts" i]',
                    '[aria-label*="Drafts" i]'
                ], 
                name: 'Drafts' 
            },
            'a': { 
                selectors: [
                    'a[href*="all" i]',
                    '[data-testid*="all" i]',
                    'button[title*="All" i]',
                    '[aria-label*="All" i]'
                ], 
                name: 'All Mail' 
            },
            't': { 
                selectors: [
                    'a[href*="sent" i]',
                    '[data-testid*="sent" i]',
                    'button[title*="Sent" i]',
                    '[aria-label*="Sent" i]'
                ], 
                name: 'Sent' 
            }
        };
        
        const nav = navMap[key];
        if (nav) {
            log(`Looking for ${nav.name}...`);
            for (const selector of nav.selectors) {
                const el = document.querySelector(selector);
                if (el && el.offsetParent !== null) {
                    el.click();
                    log(`Navigated to ${nav.name}`);
                    return true;
                }
            }
            log(`${nav.name} not found`);
        }
        return false;
    }

    // Main keyboard handler - prevent native shortcuts aggressively
    function handleKeyDown(e) {
        if (isInputFocused()) return;
        
        const key = e.key.toLowerCase();
        const isShift = e.shiftKey;
        
        // Note: Shift+I is now mark as read, not inbox navigation
        
        // Handle 'g' key for navigation shortcuts
        if (key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey && !isShift) {
            if (!gKeyPressed) {
                e.preventDefault();
                e.stopPropagation();
                gKeyPressed = true;
                
                if (gKeyTimeout) clearTimeout(gKeyTimeout);
                gKeyTimeout = setTimeout(() => {
                    gKeyPressed = false;
                }, 1000);
                return false;
            }
        }
        
        // If 'g' was pressed, handle navigation
        if (gKeyPressed && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            e.stopPropagation();
            gKeyPressed = false;
            if (gKeyTimeout) clearTimeout(gKeyTimeout);
            handleGNavigation(key);
            return false;
        }
        
        // Don't block modifier keys except for specific cases
        if (e.ctrlKey || e.metaKey || e.altKey) {
            if (!isShift || (key !== '3' && key !== '8' && key !== 'i')) {
                return;
            }
        }

        let handled = false;

        switch(key) {
            case 'j':
                e.preventDefault();
                e.stopPropagation();
                navigateCursor('next');
                handled = true;
                break;

            case 'k':
                e.preventDefault();
                e.stopPropagation();
                navigateCursor('prev');
                handled = true;
                break;

            case ']':
            case '}':
                e.preventDefault();
                navigateCursor('next');
                handled = true;
                break;

            case '[':
            case '{':
                e.preventDefault();
                navigateCursor('prev');
                handled = true;
                break;

            case 'x':
                e.preventDefault();
                e.stopPropagation();
                toggleSelection();
                handled = true;
                break;

            case 'e':
                e.preventDefault();
                e.stopPropagation();
                performAction(archiveAction);
                handled = true;
                break;

            case '#':
            case '3':
                if (key === '#' || (key === '3' && isShift)) {
                    e.preventDefault();
                    e.stopPropagation();
                    performAction(deleteAction);
                    handled = true;
                }
                break;

            case 'r':
                e.preventDefault();
                replyAction();
                handled = true;
                break;

            case 'a':
                if (!gKeyPressed) {
                    e.preventDefault();
                    replyAllAction();
                    handled = true;
                }
                break;

            case 'f':
                e.preventDefault();
                forwardAction();
                handled = true;
                break;

            case '*':
            case '8':
                if (isShift && key === '*') {
                    e.preventDefault();
                    starAction();
                    handled = true;
                } else if (key === '8' && !isShift) {
                    e.preventDefault();
                    starAction();
                    handled = true;
                }
                break;

            case 'u':
                if (isShift) {
                    // Shift+U: Mark as unread
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    performAction(markUnreadAction);
                    handled = true;
                }
                break;

            case 'i':
                if (isShift) {
                    // Shift+I: Mark as read (not inbox navigation)
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    performAction(markReadAction);
                    handled = true;
                }
                break;

            case 'c':
                e.preventDefault();
                composeAction();
                handled = true;
                break;

            case '/':
                e.preventDefault();
                focusSearchAction();
                handled = true;
                break;

            case 'l':
                // Only work when items are selected
                const selected = getSelectedMessages();
                if (selected.length > 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    performAction(labelAction);
                    handled = true;
                }
                break;
        }

        if (handled) {
            log(`Handled: ${key}`);
            return false;
        }
    }

    function init() {
        if (!window.location.hostname.includes('proton.me')) {
            return;
        }

        log('Gmail Shortcuts initialized');
        addCursorStyles();
        
        // Use capture phase and make sure we run first
        document.addEventListener('keydown', handleKeyDown, true);
        
        // Maintain cursor highlight
        setInterval(() => {
            const current = getCurrentMessage();
            if (current && cursorIndex >= 0) {
                current.classList.add(CURSOR_CLASS);
            }
        }, 300);
        
        const observer = new MutationObserver(() => {
            const items = getMessageItems();
            if (cursorIndex >= items.length) {
                cursorIndex = -1;
                clearCursorHighlight();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 0);
    }

})();