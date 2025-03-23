// ==UserScript==
// @name         Myrient Filter and download script (Enhanced)
// @namespace    http://tampermonkey.net/
// @version      03.23.2025.01
// @description  Filters game lists on Myrient, highlights terms, and adds link collection functionality
// @author       ChatGPT o3-mini-high / Claude 3.7 Extended (with search) / Claude 3.7 Sonnet
// @match        *://*/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    //=============================================================================
    // CONFIGURATION SECTION - Modify these variables to customize the script
    //=============================================================================
    
    // Site detection - The script will only run if this text is found on the page
    const SITE_DETECTION_TEXT = "Thanks for using Myrient";
    
    // Platform configurations - Different game lists for different platforms
    const PLATFORM_CONFIGS = {
        // PlayStation 1 Games
        'PlayStation': {
            searchTerms: 'Ace Combat, Ape Escape, Breath of Fire, Bust a Groove, Castlevania, Chrono, Colin McRae Rally, Command and Conquer, Crash Bandicoot, Dino Crisis, Diablo, Doom, Dragon Quest, Driver, Dynasty Warriors, Final Fantasy, Frogger, Gran Turismo, Grand Theft Auto, Harry Potter, Hot Shots Golf, Jet Moto, Klonoa, Legacy of Kain, Medal of Honor, Mega Man, Metal Gear Solid, Mortal Kombat, NASCAR, Need for Speed, NFL GameDay, NHL, Oddworld, PaRappa, Parasite Eve, Point Blank, Quake, Rayman, Resident Evil, Ridge Racer, Silent Hill, Spyro, Street Fighter, Syphon Filter, Tekken, Tenchu, Tomb Raider, Tony Hawk, Twisted Metal, Vagrant Story, Vigilante, Warcraft, Wipeout, WWF SmackDown',
            pathMatch: 'Sony - PlayStation',
            additionalHighlightTerms: ['USA'] //example: 'USA', 'World', 'Japan', 'Europe'
        },
        
        // Nintendo 64 Games
        'Nintendo64': {
            searchTerms: 'Banjo, Bomberman, Conker, Diddy Kong, Donkey Kong, GoldenEye, Harvest Moon, Kirby, Legend of Zelda, Mario, Mario Kart, Mario Party, Mega Man, Mortal Kombat, Perfect Dark, Pokémon, Rayman, Resident Evil, Star Fox, Star Wars, Super Smash Bros, Turok, Wave Race, Yoshi',
            pathMatch: 'Nintendo - Nintendo 64',
            additionalHighlightTerms: ['USA'] //example: 'USA', 'World', 'Japan', 'Europe'
        },
        
        // Sega Saturn Games
        'Saturn': {
            searchTerms: 'Castlevania, Daytona USA, Dragon Force, Fighting Vipers, Guardian Heroes, House of the Dead, Marvel Super Heroes, Nights, Panzer Dragoon, Resident Evil, Sega Rally, Shining Force, Sonic, Street Fighter, Virtua Cop, Virtua Fighter',
            pathMatch: 'Sega - Saturn',
            additionalHighlightTerms: ['USA'] //example: 'USA', 'World', 'Japan', 'Europe'
        }
    };
    
    // Highlight colors - adjust for different page backgrounds
    const HIGHLIGHT_COLORS = {
        primary: 'rgba(255, 255, 0, 0.5)',      // Brighter yellow for main terms
        secondary: 'rgba(0, 120, 255, 0.5)'    // True blue for special terms (region)
    };
    
    // Control panel appearance
    const CONTROL_PANEL = {
        backgroundColor: 'rgba(40, 44, 52, 0.95)', // Darker charcoal background
        borderColor: '#3a3a3a',                  // Subtle gray border
        textColor: '#ffffff',
        windowsButtonColor: '#0078d7',          // Windows blue
        linuxButtonColor: 'rgba(255, 255, 255, 0.2)',  // Lighter teal for better icon visibility
        clearButtonColor: '#6e3b3b'              // Muted red
    };
    
    //=============================================================================
    // END OF CONFIGURATION SECTION
    //=============================================================================
    
    // Store SVG data once to avoid duplication
    const PLUS_ICON_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMyMTk2RjMiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxwYXRoIGQ9Ik0xMiA4djgiLz48cGF0aCBkPSJNOCAxMmg4Ii8+PC9zdmc+';
    
    // Custom Windows logo SVG
    const WINDOWS_LOGO_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCwyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ij48cGF0aCBkPSJNMyA1LjVsNy0xdjcuNUgzVjUuNXoiIGZpbGw9IiNmZmZmZmYiLz48cGF0aCBkPSJNMTEgNC4zbDktMS4zdjloLTlWNC4zeiIgZmlsbD0iI2ZmZmZmZiIvPjxwYXRoIGQ9Ik0zIDEzaDd2Ny41bC03LTFWMTN6IiBmaWxsPSIjZmZmZmZmIi8+PHBhdGggZD0iTTExIDEzaDl2OWwtOS0xLjNWMTN6IiBmaWxsPSIjZmZmZmZmIi8+PC9zdmc+';
    
    // Custom Linux Penguin SVG
    const LINUX_LOGO_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCwyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ij48cGF0aCBkPSJNMTIgNmMtLjk4IDAtMS44NS40NC0yLjQyIDEuMTItLjU3LjY4LS44OSAxLjYtLjc3IDIuNTMuMTEuOTQuNSAxLjg2IDEuMTEgMi41Mi42LjY3IDEuMTYgMS4xMiAxLjE2IDEuMTJzLjI5LS40My40Ni0xLjA0Yy4xOC0uNjEuMjYtMS4zLjI5LTEuOTQuMDQtLjY0LS4wMy0xLjI0LS4xOS0xLjY1cy0uNDEtLjctLjc3LS44OWMuMDQtLjQzLjMtLjc3LjYzLS45M3MuNzYtLjE4IDEuMjMtLjA1Yy4zLjA4LjM0LjE4LjQuMjZzLjE0LjE3LjI5LjI1Yy4xNS4wOC4zOS4xNC43Mi4xNC4zMyAwIC41Ny0uMDYuNzItLjE0LjE1LS4wOC4yMy0uMTcuMjktLjI1cy4xLS4xOC40LS4yNmMuNDgtLjEzLjktLjExIDEuMjMuMDVzLjU5LjUuNjMuOTNjLS4zNS4xOS0uNjEuNDgtLjc3Ljg5LS4xNi40MS0uMjMgMS0uMTkgMS42NS4wMy42NC4xMSAxLjMzLjI5IDEuOTQuMTcuNjEuNDYgMS4wNC40NiAxLjA0cy41Ni0uNDUgMS4xNi0xLjEyYy42LS42NiAxLTEuNTggMS4xMS0yLjUyLjEyLS45My0uMi0xLjg1LS43Ny0yLjUzQzEzLjg1IDYuNDQgMTIuOTggNiAxMiA2em0tMy4xOSA3LjdjLS41LS4wMi0uOTYuMjMtMS4yOC42MmwtLjM2LjQ0LS4zNi0uNDRjLS4zMi0uMzktLjc4LS42NC0xLjI4LS42Mi0uNTQuMDItMS4wMi4zMy0xLjMuODItLjI3LjQ5LS4yNyAxLjA5IDAgMS41OGwxLjk4IDMuNGMuMTUuMjcuNDYuNDMuNzcuMzlsLjE5LS4wNS4xOS4wNWMuMzEuMDQuNjItLjEyLjc3LS4zOWwxLjk4LTMuNGMuMjctLjQ5LjI3LTEuMDkgMC0xLjU4LS4yOC0uNDktLjc2LS44LTEuMy0uODJ6bTguMzggMGMtLjU0LjAyLTEuMDIuMzMtMS4zLjgyLS4yNy40OS0uMjcgMS4wOSAwIDEuNThsMS45OCAzLjRjLjE1LjI3LjQ2LjQzLjc3LjM5bC4xOS0uMDUuMTkuMDVjLjMxLjA0LjYyLS4xMi43Ny0uMzlsMS45OC0zLjRjLjI3LS40OS4yNy0xLjA5IDAtMS41OC0uMjgtLjQ5LS43Ni0uOC0xLjMtLjgyLS41LS4wMi0uOTYuMjMtMS4yOC42MmwtLjM2LjQ0LS4zNi0uNDRjLS4zMi0uMzktLjc4LS42NC0xLjI4LS42MnoiIGZpbGw9IiNmZmZmZmYiLz48L3N2Zz4=';
    
    // Custom Trash icon SVG
    const TRASH_ICON_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ij48cGF0aCBkPSJNOSAzdjFINHYyaDFWMjBhMiAyIDAgMDAyIDJoMTBhMiAyIDAgMDAyLTJWNmgxVjRoLTV2LUg5em0wIDJoNnYtMUg5djF6IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMS41Ii8+PHBhdGggZD0iTTEwIDlWMThoMVY5aC0xeiIgZmlsbD0iI2ZmZmZmZiIvPjxwYXRoIGQ9Ik0xMyA5VjE4aDFWOS0xeiIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPg==';
  
    // Determine which platform configuration to use based on the current URL
    function getPlatformConfig() {
        // Get the decoded URL for better matching
        const currentUrl = decodeURIComponent(window.location.href);
        console.log("Checking URL: " + currentUrl);
        
        for (const platform in PLATFORM_CONFIGS) {
            if (currentUrl.includes(PLATFORM_CONFIGS[platform].pathMatch)) {
                console.log(`Detected platform: ${platform}`);
                return {
                    platform: platform,
                    config: PLATFORM_CONFIGS[platform]
                };
            }
        }
        
        // Return null if no platform match is found
        console.log("No matching platform detected in URL");
        return null;
    }
    
    // FIRST check if we're on a supported platform's URL
    const platformData = getPlatformConfig();
    
    // If we're not on a supported platform page, exit early
    if (!platformData) {
        console.log("Script exiting: Not on a configured platform page");
        return;
    }
    
    // Modified site detection - check for either the main detection text OR platform-specific header text
    // This makes the script more robust if the site changes slightly
    const pageText = document.body.textContent;
    const platformSpecificText = `Index of /files/Redump/${platformData.config.pathMatch}`;
    
    if (!pageText.includes(SITE_DETECTION_TEXT) && !pageText.includes(platformSpecificText)) {
        console.log("Script exiting: Required site text not found");
        console.log(`Looked for: "${SITE_DETECTION_TEXT}" or "${platformSpecificText}"`);
        return;
    }
    
    // If we've reached this point, we're on a supported platform page with the right site text
    console.log(`Script running for platform: ${platformData.platform}`);
    
    // Convert comma-separated list to array, trimming whitespace
    function listToArray(list) {
        return list.split(',').map(item => item.trim());
    }
    
    // Parse the search terms and highlights based on the platform
    const searchTerms = listToArray(platformData.config.searchTerms);
    const highlightTerms = searchTerms.concat(platformData.config.additionalHighlightTerms);
    
    // Collection of selected links - use a Map for O(1) lookup performance
    const selectedLinks = new Map();
    // Track total size of selected files
    let totalSizeBytes = 0;

    // Utility function to escape special regex characters
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  
    // Recursively traverse an element's text nodes and wrap matching terms in a <span> with appropriate highlight
    function highlightTextInElement(element, highlightTerms) {
        for (let i = 0; i < element.childNodes.length; i++) {
            const node = element.childNodes[i];
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                // Build a regex that matches any of the highlight terms, case-insensitive
                const regex = new RegExp('(' + highlightTerms.map(term => escapeRegExp(term)).join('|') + ')', 'gi');
                let match;
                let lastIndex = 0;
                let frag = document.createDocumentFragment();
                let hasMatch = false;
                while ((match = regex.exec(text)) !== null) {
                    hasMatch = true;
                    // Append text before the match
                    if (match.index > lastIndex) {
                        frag.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                    }
                    const matchedText = match[0];
                    const span = document.createElement('span');
                    
                    // Determine highlight color based on the matched text
                    if (platformData.config.additionalHighlightTerms.some(term => 
                        matchedText.toLowerCase() === term.toLowerCase())) {
                        span.style.backgroundColor = HIGHLIGHT_COLORS.secondary; // secondary color
                    } else {
                        span.style.backgroundColor = HIGHLIGHT_COLORS.primary; // primary color
                    }
                    
                    span.textContent = matchedText;
                    frag.appendChild(span);
                    lastIndex = regex.lastIndex;
                }
                if (hasMatch) {
                    frag.appendChild(document.createTextNode(text.substring(lastIndex)));
                    element.replaceChild(frag, node);
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Avoid re-highlighting already processed spans
                if (!(node.tagName.toLowerCase() === 'span' && 
                     (node.style.backgroundColor === HIGHLIGHT_COLORS.primary || 
                      node.style.backgroundColor === HIGHLIGHT_COLORS.secondary))) {
                    highlightTextInElement(node, highlightTerms);
                }
            }
        }
    }
  
    // Filter rows and apply highlighting
    function filterAndHighlightRows() {
        // Select the table by its ID "list"
        const table = document.querySelector('table#list');
        if (!table) return;
        
        // Process rows within the <tbody>
        const rows = table.querySelectorAll('tbody tr');
        let visibleCount = 0;
        let totalCount = 0;
        
        rows.forEach(row => {
            // Optionally skip rows like "Parent directory"
            if (row.textContent.includes("Parent directory")) return;
            
            totalCount++;
            const rowText = row.textContent;
            // Check if the row contains any of the search terms
            const containsTerm = searchTerms.some(term => 
                rowText.toLowerCase().includes(term.toLowerCase()));
                
            if (!containsTerm) {
                row.style.display = 'none';
            } else {
                visibleCount++;
                // Apply highlighting to the visible row
                highlightTextInElement(row, highlightTerms);
            }
        });
        
        // Update the count display
        updateCountDisplay(visibleCount, totalCount);
        
        return { visibleCount, totalCount };
    }
    
    // Update the count display in the control panel
    function updateCountDisplay(visibleCount, totalCount) {
        const countDisplay = document.getElementById('filter-count');
        if (countDisplay) {
            countDisplay.textContent = `Showing: ${visibleCount} of ${totalCount}`;
        }
    }

    // Parse file size string (e.g., "431.8 MiB") to bytes
    function parseFileSize(sizeString) {
        const match = sizeString.match(/^([\d.]+)\s*(\w+)$/);
        if (!match) return 0;
        
        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        
        const multipliers = {
            'b': 1,
            'kb': 1024,
            'kib': 1024,
            'mb': 1024 * 1024,
            'mib': 1024 * 1024,
            'gb': 1024 * 1024 * 1024,
            'gib': 1024 * 1024 * 1024,
            'tb': 1024 * 1024 * 1024 * 1024,
            'tib': 1024 * 1024 * 1024 * 1024
        };
        
        return value * (multipliers[unit] || 0);
    }
    
    // Format bytes to human-readable size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + units[i];
    }
    
    // Update the total size display
    function updateTotalSizeDisplay() {
        const counter = document.getElementById('selected-count');
        if (counter) {
            if (selectedLinks.size > 0) {
                counter.textContent = `Selected: ${selectedLinks.size} (${formatFileSize(totalSizeBytes)})`;
            } else {
                counter.textContent = `Selected: 0`;
            }
        }
    }

    // Add a compact control panel for link collection
    function addControlPanel() {
        // Create a control panel div
        const controlPanel = document.createElement('div');
        controlPanel.id = 'link-collector-panel';
        controlPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: ${CONTROL_PANEL.backgroundColor};
            padding: 10px;
            border-radius: 6px;
            z-index: 9999;
            box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            font-size: 12px;
            color: ${CONTROL_PANEL.textColor};
            width: 240px;
            display: flex;
            flex-direction: column;
            align-items: center;
            border: 1px solid ${CONTROL_PANEL.borderColor};
        `;
        
        // Add buttons container with equal sizing
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: space-between;
            width: 100%;
            margin-bottom: 8px;
            gap: 6px;
        `;
        
        // Function to create a consistent button
        function createButton(icon, text, color, onClick) {
            const button = document.createElement('button');
            button.style.cssText = `
                background: ${color};
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
                font-weight: 500;
                padding: 6px 0;
                flex: 1;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 46px;
                width: 100%;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            `;
            
            // Create icon element
            const iconElement = document.createElement('img');
            iconElement.src = icon;
            iconElement.width = 16;
            iconElement.height = 16;
            iconElement.style.cssText = 'margin-bottom: 4px;';
            
            button.appendChild(iconElement);
            button.appendChild(document.createTextNode(text));
            button.onclick = onClick;
            
            return button;
        }
        
        // Create all three buttons with consistent styling
        const windowsButton = createButton(
            WINDOWS_LOGO_SVG, 
            'Windows', 
            CONTROL_PANEL.windowsButtonColor, 
            () => saveAsScript('windows')
        );
        
        const linuxButton = document.createElement('button');
        linuxButton.innerHTML = '<span style="display: inline-block; transform: scale(1.5);">🐧</span><br style="margin-bottom:6px">Linux';
        linuxButton.style.cssText = `
            background: ${CONTROL_PANEL.linuxButtonColor};
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 500;
            padding: 6px 0;
            flex: 1;
            text-align: center;
            height: 46px;
            width: 100%;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        `;
        linuxButton.onclick = () => saveAsScript('linux');
        
        const clearButton = createButton(
            TRASH_ICON_SVG, 
            'Clear', 
            CONTROL_PANEL.clearButtonColor, 
            clearSelectedLinks
        );
        
        // Add counters with improved styling
        const counter = document.createElement('div');
        counter.id = 'selected-count';
        counter.style.cssText = `
            font-size: 11px;
            font-weight: 500;
            color: #fff;
            width: 100%;
            text-align: center;
            margin-bottom: 4px;
            padding: 3px 0;
            background: rgba(0,0,0,0.2);
            border-radius: 3px;
        `;
        counter.textContent = 'Selected: 0';
        
        const filterCount = document.createElement('div');
        filterCount.id = 'filter-count';
        filterCount.style.cssText = `
            font-size: 11px;
            font-weight: 500;
            color: #fff;
            width: 100%;
            text-align: center;
            padding: 3px 0;
            background: rgba(0,0,0,0.2);
            border-radius: 3px;
        `;
        filterCount.textContent = 'Showing: 0 of 0';
        
        // Add elements to the button container
        buttonContainer.appendChild(windowsButton);
        buttonContainer.appendChild(linuxButton);
        buttonContainer.appendChild(clearButton);
        
        // Add to control panel
        controlPanel.appendChild(buttonContainer);
        controlPanel.appendChild(counter);
        controlPanel.appendChild(filterCount);
        
        // Add the control panel to the body
        document.body.appendChild(controlPanel);
    }

    // Efficient icon click handler
    function handleIconClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const icon = e.currentTarget;
        const link = icon.closest('a');
        
        if (!link) return;
        
        const isSelected = icon.dataset.selected === 'true';
        
        if (isSelected) {
            // Remove from selection
            icon.dataset.selected = 'false';
            icon.style.filter = '';
            
            // Subtract file size from total
            if (selectedLinks.has(link.href)) {
                const fileData = selectedLinks.get(link.href);
                totalSizeBytes -= fileData.sizeBytes || 0;
            }
            
            selectedLinks.delete(link.href);
        } else {
            // Add to selection
            icon.dataset.selected = 'true';
            icon.style.filter = 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)';
            
            // Get clean text
            let linkText = link.textContent || "";
            linkText = linkText.replace(/^\s*\+\s*/, '').trim();
            
            // Get file size from the row
            const row = link.closest('tr');
            let fileSizeStr = '';
            let fileSizeBytes = 0;
            
            if (row) {
                const sizeCell = row.querySelector('td.size');
                if (sizeCell) {
                    fileSizeStr = sizeCell.textContent.trim();
                    fileSizeBytes = parseFileSize(fileSizeStr);
                }
            }
            
            // Add to total size
            totalSizeBytes += fileSizeBytes;
            
            selectedLinks.set(link.href, {
                url: link.href,
                text: linkText,
                sizeStr: fileSizeStr,
                sizeBytes: fileSizeBytes
            });
        }
        
        // Update the counter and size display
        updateTotalSizeDisplay();
    }

    // Add icons to links after filtering - efficient version
    function addIconsToVisibleLinks() {
        // Create a template icon once instead of for each row
        const iconTemplate = document.createElement('img');
        iconTemplate.src = PLUS_ICON_SVG; // Use the stored SVG data
        iconTemplate.width = 16;
        iconTemplate.height = 16;
        iconTemplate.style.cssText = 'margin-right: 5px; cursor: pointer; vertical-align: middle;';
        iconTemplate.title = 'Click to add/remove from selection';
        iconTemplate.classList.add('link-selector-icon');
        iconTemplate.dataset.selected = 'false';
        
        // Target only visible links in the filtered table
        const table = document.querySelector('table#list');
        if (!table) return;
        
        const visibleRows = Array.from(table.querySelectorAll('tbody tr'))
            .filter(row => row.style.display !== 'none');
        
        visibleRows.forEach(row => {
            const link = row.querySelector('a');
            if (!link || link.querySelector('.link-selector-icon')) return;
            
            // Clone the template icon
            const icon = iconTemplate.cloneNode(true);
            
            // Add click event with delegated handler
            icon.addEventListener('click', handleIconClick);
            
            // Insert icon before the link text
            link.insertBefore(icon, link.firstChild);
        });
    }
    
    function clearSelectedLinks() {
        // Reset all icons
        const icons = document.querySelectorAll('.link-selector-icon[data-selected="true"]');
        icons.forEach(icon => {
            icon.dataset.selected = 'false';
            icon.style.filter = '';
        });
        
        // Clear the Map and reset total size
        selectedLinks.clear();
        totalSizeBytes = 0;
        
        // Update counter
        updateTotalSizeDisplay();
    }
    
    // Extracts platform name from URL
    function getPlatformNameFromUrl() {
        // Directly extract the platform name from the URL path
        const currentUrl = window.location.href;
        const urlPath = currentUrl.split('/');
        
        // Find the platform name in the URL path - looking for both "Sega - Saturn" style paths
        let platformName = "Unknown";
        
        // Look for the Redump folder and get the next segment in the path
        for (let i = 0; i < urlPath.length; i++) {
            if (urlPath[i] === "Redump" && i + 1 < urlPath.length) {
                platformName = urlPath[i + 1].replace(/%20/g, " ");
                break;
            }
        }
        
        // Fallback to extracting platform from page title or header if available
        if (platformName === "Unknown") {
            const pageTitle = document.querySelector('title');
            if (pageTitle && pageTitle.textContent.includes("-")) {
                const titleParts = pageTitle.textContent.split("-");
                if (titleParts.length > 1) {
                    platformName = titleParts[1].trim();
                }
            }
        }
        
        // Format the platform name for filename (replace spaces with underscores)
        return platformName.replace(/\s+/g, "_");
    }
    
    // Legacy function for backward compatibility - now calls the saveAsScript function
    function saveSelectedLinks() {
        saveAsScript('linux'); // Default to Linux format
    }
    
    // Creates a download script (Windows batch or Linux shell) to download selected files
    function saveAsScript(type) {
        if (selectedLinks.size === 0) {
            alert('No links selected!');
            return;
        }
        
        // Get platform name for the filename
        const platformName = getPlatformNameFromUrl();
        
        // Create appropriate script content based on type
        let scriptContent = '';
        let fileName = '';
        
        if (type === 'windows') {
            // Create Windows batch file
            scriptContent = '@echo off\r\n';
            scriptContent += 'echo Downloading files to current directory...\r\n\r\n';
            
            Array.from(selectedLinks.values()).forEach(link => {
                const fileUrl = link.url;
                const fileName = decodeURIComponent(fileUrl.split('/').pop());
                scriptContent += `echo Downloading ${fileName}...\r\n`;
                scriptContent += `curl -L -o "${fileName}" "${fileUrl}"\r\n`;
                scriptContent += 'if %errorlevel% neq 0 echo Error downloading file: ' + fileName + '\r\n\r\n';
            });
            
            scriptContent += 'echo Download complete!\r\n';
            scriptContent += 'pause';
            
            fileName = `${platformName}_download.bat.txt`;
        } else { // linux
            // Create Linux/Unix shell script
            scriptContent = '#!/bin/bash\n\n';
            scriptContent += 'echo "Downloading files to current directory..."\n\n';
            
            Array.from(selectedLinks.values()).forEach(link => {
                const fileUrl = link.url;
                const fileName = decodeURIComponent(fileUrl.split('/').pop());
                scriptContent += `echo "Downloading ${fileName}..."\n`;
                scriptContent += `curl -L -o "${fileName}" "${fileUrl}"\n`;
                scriptContent += 'if [ $? -ne 0 ]; then echo "Error downloading file: ' + fileName + '"; fi\n\n';
            });
            
            scriptContent += 'echo "Download complete!"\n';
            
            fileName = `${platformName}_download.sh.txt`;
        }
        
        // Create file with the script content
        const blob = new Blob([scriptContent], {type: "text/plain;charset=utf-8"});
        saveAs(blob, fileName);
        
        console.log(`Saved ${type} script with platform name: ${platformName}`);
    }
    
    // Initialize everything in a sequence
    function initialize() {
        console.log(`Initializing Myrient Filter and Link Collector for ${platformData.platform}...`);
        
        // First add the control panel
        addControlPanel();
        
        // Then filter and highlight the rows
        filterAndHighlightRows();
        
        // Finally add icons to the visible links
        addIconsToVisibleLinks();
        
        console.log(`Myrient Filter and Link Collector initialized for ${platformData.platform}!`);
    }
    
    // Run initialization
    setTimeout(initialize, 500);
    
    // Set up a more efficient MutationObserver
    const observer = new MutationObserver((mutations) => {
        // Only run if we see significant DOM changes
        let shouldUpdate = false;
        
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if any significant nodes were added
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE && 
                        (node.tagName === 'TR' || node.querySelector('tr'))) {
                        shouldUpdate = true;
                        break;
                    }
                }
            }
            
            if (shouldUpdate) break;
        }
        
        if (shouldUpdate) {
            console.log("DOM updated, refreshing filters and icons...");
            filterAndHighlightRows();
            addIconsToVisibleLinks();
        }
    });
  
    // Observe only the table for better performance
    const table = document.querySelector('table#list');
    if (table) {
        observer.observe(table, { childList: true, subtree: true });
    }
})();
