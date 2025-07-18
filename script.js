
class BitConverter {
    constructor() {
        this.decimalInput = document.getElementById('decimal');
        this.hexInput = document.getElementById('hex');
        this.binaryInput = document.getElementById('binary');
        this.bitDisplay = document.getElementById('bitDisplay');
        this.hexDisplay = document.getElementById('hexDisplay');
        this.tooltip = document.getElementById('tooltip');
        this.darkModeToggle = document.getElementById('darkModeToggle');
        this.twosComplementToggle = document.getElementById('twosComplementToggle');
        this.bitCount = document.getElementById('bitCount');
        this.nibbleCount = document.getElementById('nibbleCount');
        this.maxValueDisplay = document.getElementById('maxValueDisplay');
        this.copyUrlButton = document.getElementById('copyUrlButton');
        
        // Load cached states
        this.loadCachedStates();
        
        // Initialize modes
        this.updateRanges();
        this.updateDarkMode();
        
        // Check URL for initial value
        this.loadFromUrl();
        
        this.init();
    }
    
    init() {
        // Add event listeners for input changes
        this.decimalInput.addEventListener('input', (e) => this.onDecimalChange(e));
        this.hexInput.addEventListener('input', (e) => this.onHexChange(e));
        this.binaryInput.addEventListener('input', (e) => this.onBinaryChange(e));
        this.darkModeToggle.addEventListener('change', (e) => this.onDarkModeChange(e));
        this.twosComplementToggle.addEventListener('change', (e) => this.onTwosComplementChange(e));
        
        // Add hash change listener for navigation
        window.addEventListener('hashchange', () => this.loadFromUrl());
        
        // Add copy URL button listener
        if (this.copyUrlButton) {
            this.copyUrlButton.addEventListener('click', () => this.copyUrlToClipboard());
        }
        
        // If no URL value was loaded, start with empty inputs
        if (!this.hasLoadedFromUrl) {
            this.initializeEmpty();
        }
    }
    
    loadFromUrl() {
        try {
            const hash = window.location.hash;
            
            // Check if hash starts with #0x followed by hex characters
            const hexMatch = hash.match(/^#0x([0-9a-fA-F_]+)$/);
            
            if (hexMatch) {
                const hexValue = hexMatch[1].replace(/_/g, ''); // Remove underscores
                if (/^[0-9a-fA-F]+$/.test(hexValue)) {
                    const bigIntValue = BigInt('0x' + hexValue);
                    this.updateAll(bigIntValue);
                    this.hasLoadedFromUrl = true;
                    return;
                }
            }
        } catch (error) {
            console.warn('Invalid URL hash, using default value');
        }
        
        this.hasLoadedFromUrl = false;
    }
    
    updateUrl(value) {
        try {
            const displayBits = this.getMinimumBitsNeeded(value);
            const hexDigits = Math.ceil(displayBits / 4);
            const hexValue = value < 0n ? 
                (BigInt(1) << BigInt(displayBits)) + value : value;
            const hexString = '0x' + hexValue.toString(16).toUpperCase().padStart(hexDigits, '0');
            
            const newHash = '#' + hexString;
            window.history.replaceState({}, '', newHash);
        } catch (error) {
            console.warn('Failed to update URL:', error);
        }
    }
    
    copyUrlToClipboard() {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href).then(() => {
                // Show brief feedback
                const originalText = this.copyUrlButton.textContent;
                this.copyUrlButton.textContent = '✓ Copied!';
                this.copyUrlButton.classList.add('copied');
                setTimeout(() => {
                    this.copyUrlButton.textContent = originalText;
                    this.copyUrlButton.classList.remove('copied');
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy URL:', err);
                // Fallback for older browsers
                this.fallbackCopyUrl();
            });
        } else {
            this.fallbackCopyUrl();
        }
    }
    
    fallbackCopyUrl() {
        // Create a temporary input element to copy the URL
        const tempInput = document.createElement('input');
        tempInput.value = window.location.href;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        // Show feedback
        const originalText = this.copyUrlButton.textContent;
        this.copyUrlButton.textContent = '✓ Copied!';
        this.copyUrlButton.classList.add('copied');
        setTimeout(() => {
            this.copyUrlButton.textContent = originalText;
            this.copyUrlButton.classList.remove('copied');
        }, 1500);
    }
    
    initializeEmpty() {
        // Clear all inputs to show placeholder text
        this.decimalInput.value = '';
        this.hexInput.value = '';
        this.binaryInput.value = '';
        
        // Set up default display state
        this.isTwosComplement = false;
        this.maxValueDisplay.textContent = 'Mode: Unsigned';
        this.bitCount.textContent = '8 bits';
        this.nibbleCount.textContent = '2 nibbles';
        
        // Show zero in visualizations instead of empty state
        this.updateBitDisplay(0n);
        this.updateHexDisplay(0n);
        
        // Remove any error styling
        this.updateInputValidation();
    }
    
    loadCachedStates() {
        // Load dark mode preference (default to light mode)
        const cachedDarkMode = localStorage.getItem('bitview-darkmode');
        this.isDarkMode = cachedDarkMode === 'true';
        this.darkModeToggle.checked = this.isDarkMode;
        
        // Load two's complement preference (default to unsigned)
        const cachedTwosComplement = localStorage.getItem('bitview-twoscomplement');
        this.isTwosComplement = cachedTwosComplement === 'true';
        this.twosComplementToggle.checked = this.isTwosComplement;
    }
    
    onDarkModeChange(e) {
        this.isDarkMode = e.target.checked;
        this.updateDarkMode();
        localStorage.setItem('bitview-darkmode', this.isDarkMode);
    }
    
    onTwosComplementChange(e) {
        this.isTwosComplement = e.target.checked;
        this.updateRanges();
        localStorage.setItem('bitview-twoscomplement', this.isTwosComplement);
        
        // If switching to unsigned mode and current value is negative, reset to 0
        const currentValue = this.getCurrentValue();
        if (!this.isTwosComplement && currentValue < 0n) {
            this.updateAll(0n);
        } else {
            // Refresh display with new mode
            this.updateAll(currentValue);
        }
    }
    
    updateDarkMode() {
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
    
    updateRanges() {
        // Use extremely large limits to allow virtually any reasonable input
        if (this.isTwosComplement) {
            // For two's complement, allow a huge range
            this.maxValue = BigInt('0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'); // 128-bit signed max
            this.minValue = BigInt('-0x80000000000000000000000000000000'); // 128-bit signed min
        } else {
            // For unsigned, use an extremely large limit
            this.maxValue = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'); // 128-bit unsigned max
            this.minValue = 0n;
        }
        
        // Update display - show mode instead of fixed bit count
        const modeText = this.isTwosComplement ? 'Two\'s Complement' : 'Unsigned';
        this.maxValueDisplay.textContent = `Mode: ${modeText}`;
    }

    getCurrentValue() {
        try {
            const decimalValue = this.decimalInput.value.trim();
            if (!decimalValue) return 0n;
            
            // Remove commas for processing
            const cleanValue = decimalValue.replace(/,/g, '');
            return BigInt(cleanValue);
        } catch {
            return 0n;
        }
    }

    getMinimumBitsNeeded(value) {
        if (value === 0n) return 8; // Minimum 8 bits for display
        
        let minBits;
        if (this.isTwosComplement && value < 0n) {
            // For negative numbers in two's complement, find the minimum bits needed
            // Two's complement range for n bits: -2^(n-1) to 2^(n-1) - 1
            let testBits = 8; // Start with minimum 8 bits
            while (true) {
                const minValue = -(BigInt(1) << BigInt(testBits - 1)); // -2^(n-1)
                if (value >= minValue) {
                    minBits = testBits;
                    break;
                }
                testBits += 4; // Increment by 4 bits (nibble)
            }
        } else {
            // For positive numbers or unsigned mode
            minBits = value.toString(2).length;
        }
        
        // Round up to nearest multiple of 4, with minimum of 8
        const roundedBits = Math.max(8, Math.ceil(minBits / 4) * 4);
        
        // Return the dynamic size (no fixed cap)
        return roundedBits;
    }
    
    onDecimalChange(e) {
        const value = e.target.value.trim();
        if (!value) {
            this.updateAll(0n, 'decimal');
            return;
        }
        
        // Remove commas and underscores for processing
        const cleanValue = value.replace(/[,_]/g, '');
        
        // Handle partial negative input (just "-") - only allow if two's complement is enabled
        if (cleanValue === '-') {
            if (this.isTwosComplement) {
                // Update mode display but don't process the incomplete input yet
                const modeText = 'Two\'s Complement';
                this.maxValueDisplay.textContent = `Mode: ${modeText}`;
            }
            // Don't clear the input - let validation handle the error styling
            return;
        }
        
        try {
            const bigIntValue = BigInt(cleanValue);
            
            // Prevent negative values in unsigned mode
            if (!this.isTwosComplement && bigIntValue < 0n) {
                // Don't update, just return (invalid input)
                return;
            }
            
            this.updateAll(bigIntValue, 'decimal');
        } catch (error) {
            // Invalid input, ignore but don't clear the display
        }
    }
    
    onHexChange(e) {
        let value = e.target.value.toLowerCase().trim();
        if (!value) {
            this.updateAll(0n, 'hex');
            return;
        }
        
        // Remove 0x prefix if present
        if (value.startsWith('0x')) {
            value = value.slice(2);
        }
        
        // Handle empty hex after 0x removal
        if (!value) {
            this.updateAll(0n, 'hex');
            return;
        }

        // Log hex input value for debugging
        
        // Remove underscores to ignore them
        const cleanValue = value.replace(/_/g, '');

        
        // Handle empty hex after underscore removal
        if (!cleanValue) {
            this.updateAll(0n, 'hex');
            return;
        }
        
        // Validate hex characters (after removing underscores)
        if (!/^[0-9a-f]+$/.test(cleanValue)) {
            return;
        }
        
        try {
            let bigIntValue = BigInt('0x' + cleanValue);
            
            // If two's complement is enabled, check if this should be interpreted as negative
            if (this.isTwosComplement && cleanValue.length > 0) {
                // Each hex digit represents 4 bits
                const bitLength = cleanValue.length * 4;
                const maxPositive = BigInt(1) << BigInt(bitLength - 1); // 2^(n-1)
                if (bigIntValue >= maxPositive) {
                    // This is a negative number in two's complement
                    const totalRange = BigInt(1) << BigInt(bitLength); // 2^n
                    bigIntValue = bigIntValue - totalRange;
                }
            }
            
            this.updateAll(bigIntValue, 'hex');
        } catch {
            // Invalid input, ignore
        }
    }
    
    onBinaryChange(e) {
        let value = e.target.value.trim();
        if (!value) {
            this.updateAll(0n, 'binary');
            return;
        }
        
        // Remove 0b prefix if present
        if (value.toLowerCase().startsWith('0b')) {
            value = value.slice(2);
        }
        
        // Handle empty binary after 0b removal
        if (!value) {
            this.updateAll(0n, 'binary');
            return;
        }
        
        // Remove underscores to ignore them
        const cleanValue = value.replace(/_/g, '');
        
        // Handle empty binary after underscore removal
        if (!cleanValue) {
            this.updateAll(0n, 'binary');
            return;
        }
        
        // Validate binary characters
        if (!/^[01]+$/.test(cleanValue)) {
            return;
        }
        
        try {
            let bigIntValue = BigInt('0b' + cleanValue);
            
            // If two's complement is enabled and MSB is 1, interpret as negative
            if (this.isTwosComplement && cleanValue.length > 0 && cleanValue[0] === '1') {
                // Convert from two's complement to signed value
                const bitLength = cleanValue.length;
                const maxPositive = BigInt(1) << BigInt(bitLength - 1); // 2^(n-1)
                if (bigIntValue >= maxPositive) {
                    // This is a negative number in two's complement
                    const totalRange = BigInt(1) << BigInt(bitLength); // 2^n
                    bigIntValue = bigIntValue - totalRange;
                }
            }
            
            this.updateAll(bigIntValue, 'binary');
        } catch {
            // Invalid input, ignore
        }
    }
    
    getActualBitsNeeded(value) {
        // Return the actual minimum bits needed (before rounding to groups of 4)
        if (value === 0n) return 1; // 0 needs 1 bit
        
        if (value < 0n) {
            // For negative numbers in two's complement
            const absValue = -value;
            const bitLength = absValue.toString(2).length;
            return bitLength + 1; // Need one more bit for sign
        } else {
            // For positive numbers
            return value.toString(2).length;
        }
    }

    updateAll(value, source = '') {
        // Use the toggle setting instead of auto-detecting mode
        // this.isTwosComplement is now controlled by the toggle
        
        // Update ranges based on current mode setting
        if (this.isTwosComplement) {
            this.maxValue = BigInt('0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
            this.minValue = -BigInt('0x80000000000000000000000000000000');
        } else {
            this.maxValue = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
            this.minValue = 0n;
        }
        
        // Update mode display
        const modeText = this.isTwosComplement ? 'Two\'s Complement' : 'Unsigned';
        this.maxValueDisplay.textContent = `Mode: ${modeText}`;
        
        try {
            // Handle two's complement conversion for display
            let displayValue = value;
            const displayBits = this.getMinimumBitsNeeded(displayValue);
            const actualBitsNeeded = this.getActualBitsNeeded(displayValue);
            
            // Convert BigInt to string for display
            const valueStr = displayValue.toString();
            const hexStr = '0x' + (displayValue < 0n ? 
                (BigInt(1) << BigInt(displayBits)) + displayValue : displayValue)
                .toString(16).toUpperCase().padStart(Math.ceil(displayBits / 4), '0');
            const binaryStr = (displayValue < 0n ? 
                (BigInt(1) << BigInt(displayBits)) + displayValue : displayValue)
                .toString(2).padStart(displayBits, '0');
            
            // Update input fields
            if (source !== 'decimal') {
                this.decimalInput.value = valueStr;
            }
            if (source !== 'hex') {
                this.hexInput.value = hexStr;
            }
            if (source !== 'binary') {
                this.binaryInput.value = binaryStr;
            }
            
            // Update bit count display - show rounded bits (nearest 4 bits)
            this.bitCount.textContent = `${displayBits} bits`;
            
            // Update nibble count display
            const nibbleCount = Math.ceil(displayBits / 4);
            this.nibbleCount.textContent = `${nibbleCount} nibbles`;
            
            // Update visualizations
            this.updateBitDisplay(displayValue);
            this.updateHexDisplay(displayValue);
            
            // Update URL with current value
            this.updateUrl(displayValue);
            
            // Update validation styling for all inputs
            this.updateInputValidation();
        } catch (error) {
            // If there's an error, at least update the decimal input
            if (source !== 'decimal') {
                this.decimalInput.value = value.toString();
            }
        }
    }

    updateInputValidation() {
        // Clear error styling from all inputs since we have valid values
        // When updateAll is called, it means we successfully converted a value
        this.decimalInput.classList.remove('error');
        this.hexInput.classList.remove('error');
        this.binaryInput.classList.remove('error');
    }
    
    updateBitDisplay(value) {
        const displayBits = this.getMinimumBitsNeeded(value);
        const binaryValue = value < 0n ? 
            (BigInt(1) << BigInt(displayBits)) + value : value;
        const binaryString = binaryValue.toString(2).padStart(displayBits, '0');
        this.bitDisplay.innerHTML = '';
        
        // Create bit groups of 4
        const numGroups = Math.ceil(displayBits / 4);
        
        for (let groupIndex = 0; groupIndex < numGroups; groupIndex++) {
            const groupElement = document.createElement('div');
            groupElement.className = 'bit-group';
            
            const startIdx = groupIndex * 4;
            const endIdx = Math.min(startIdx + 4, displayBits);
            
            // Calculate bit indices for this group
            const highestBitInGroup = displayBits - 1 - startIdx;
            const lowestBitInGroup = displayBits - 1 - (endIdx - 1);
            
            for (let i = startIdx; i < endIdx; i++) {
                const bit = binaryString[i];
                const bitPosition = displayBits - 1 - i;
                
                const bitElement = document.createElement('div');
                bitElement.className = `bit ${bit === '1' ? 'one' : 'zero'}`;
                bitElement.textContent = bit;
                bitElement.dataset.position = bitPosition;
                
                // Add hover event listeners
                bitElement.addEventListener('mouseenter', (e) => this.showBitTooltip(e, bitPosition));
                bitElement.addEventListener('mouseleave', () => this.hideTooltip());
                
                // Add click event listener for bit toggling
                bitElement.addEventListener('click', (e) => this.toggleBit(bitPosition));
                
                groupElement.appendChild(bitElement);
            }
            
            // Add subscript showing bit range
            const subscriptElement = document.createElement('div');
            subscriptElement.className = 'bit-group-subscript';
            if (highestBitInGroup === lowestBitInGroup) {
                subscriptElement.textContent = highestBitInGroup.toString();
            } else {
                subscriptElement.textContent = `${highestBitInGroup}-${lowestBitInGroup}`;
            }
            groupElement.appendChild(subscriptElement);
            
            this.bitDisplay.appendChild(groupElement);
        }
    }

    toggleBit(bitPosition) {
        const currentValue = this.getCurrentValue();
        const currentDisplayBits = this.getMinimumBitsNeeded(currentValue);
        
        // Convert current value to unsigned bit representation
        let unsignedValue;
        if (this.isTwosComplement && currentValue < 0n) {
            // Convert negative two's complement to unsigned representation
            const totalRange = BigInt(1) << BigInt(currentDisplayBits); // 2^n
            unsignedValue = currentValue + totalRange;
        } else {
            unsignedValue = currentValue;
        }
        
        // Toggle the bit in the unsigned representation
        const bitValue = 2n ** BigInt(bitPosition);
        let newUnsignedValue = unsignedValue ^ bitValue;
        
        // Convert back to signed if needed
        let newValue = newUnsignedValue;
        if (this.isTwosComplement) {
            const maxPositive = BigInt(1) << BigInt(currentDisplayBits - 1); // 2^(n-1)
            
            // If the MSB is set in the current display width, interpret as negative
            if (newUnsignedValue >= maxPositive) {
                const totalRange = BigInt(1) << BigInt(currentDisplayBits); // 2^n
                newValue = newUnsignedValue - totalRange;
            }
        }
        
        // Update without range checking
        this.updateAll(newValue);
    }
    
    updateHexDisplay(value) {
        const displayBits = this.getMinimumBitsNeeded(value);
        const hexDigits = Math.ceil(displayBits / 4);
        const hexValue = value < 0n ? 
            (BigInt(1) << BigInt(displayBits)) + value : value;
        const hexString = hexValue.toString(16).toUpperCase().padStart(hexDigits, '0');
        this.hexDisplay.innerHTML = '';
        
        // Create hex groups of 2 characters
        const numGroups = Math.ceil(hexString.length / 2);
        
        for (let groupIndex = 0; groupIndex < numGroups; groupIndex++) {
            const groupElement = document.createElement('div');
            groupElement.className = 'hex-group';
            
            const startIdx = groupIndex * 2;
            const endIdx = Math.min(startIdx + 2, hexString.length);
            
            // Calculate bit indices for this hex group
            // Each hex character represents 4 bits
            const highestBitInGroup = (hexString.length - startIdx) * 4 - 1;
            const lowestBitInGroup = (hexString.length - endIdx) * 4;
            
            for (let i = startIdx; i < endIdx; i++) {
                const hexChar = hexString[i];
                const nibblePosition = hexString.length - 1 - i;
                const startBit = nibblePosition * 4;
                const endBit = startBit + 3;
                
                const hexElement = document.createElement('div');
                hexElement.className = `hex-char ${hexChar === '0' ? 'zero' : 'nonzero'}`;
                hexElement.textContent = hexChar;
                hexElement.dataset.nibble = nibblePosition;
                
                // Add hover event listeners
                hexElement.addEventListener('mouseenter', (e) => this.showHexTooltip(e, startBit, endBit, hexChar));
                hexElement.addEventListener('mouseleave', () => this.hideTooltip());
                
                groupElement.appendChild(hexElement);
            }
            
            // Add subscript showing bit range
            const subscriptElement = document.createElement('div');
            subscriptElement.className = 'hex-group-subscript';
            if (highestBitInGroup === lowestBitInGroup) {
                subscriptElement.textContent = highestBitInGroup.toString();
            } else {
                subscriptElement.textContent = `${highestBitInGroup}-${lowestBitInGroup}`;
            }
            groupElement.appendChild(subscriptElement);
            
            this.hexDisplay.appendChild(groupElement);
        }
    }
    
    showBitTooltip(e, position) {
        const bitValue = 2n ** BigInt(position);
        const tooltipText = `Bit ${position}: ${bitValue.toLocaleString()}`;
        this.showTooltip(e, tooltipText);
    }
    
    showHexTooltip(e, startBit, endBit, hexChar) {
        const decimal = parseInt(hexChar, 16);
        const binary = decimal.toString(2).padStart(4, '0');
        const tooltipText = `Bits ${startBit}-${endBit}: ${binary}`;
        this.showTooltip(e, tooltipText);
    }
    
    showTooltip(e, text) {
        this.tooltip.textContent = text;
        this.tooltip.className = 'tooltip show';
        
        const rect = e.target.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        
        // Position tooltip above the element
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        let top = rect.top - tooltipRect.height - 10;
        
        // Adjust if tooltip goes off screen
        if (left < 0) left = 10;
        if (left + tooltipRect.width > window.innerWidth) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        if (top < 0) {
            top = rect.bottom + 10;
        }
        
        this.tooltip.style.left = left + 'px';
        this.tooltip.style.top = top + 'px';
    }
    
    hideTooltip() {
        this.tooltip.className = 'tooltip';
    }
    
    reset() {
        this.updateAll(0n);
    }
}

// Utility functions
function formatNumber(num) {
    return num.toLocaleString();
}

function validateInput(input, type) {
    const patterns = {
        decimal: /^-?[\d_]+$/,  // Allow negative numbers and underscores
        hex: /^(0x)?[0-9a-fA-F_]+$/,  // Allow underscores in hex
        binary: /^(0b)?[01_]+$/  // Allow 0b prefix and underscores
    };
    
    return patterns[type].test(input);
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const converter = new BitConverter();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'r':
                    e.preventDefault();
                    converter.reset();
                    break;
                case 'a':
                    if (e.target.tagName === 'INPUT') {
                        e.target.select();
                    }
                    break;
            }
        }
    });
    
    // Add copy functionality
    document.addEventListener('click', (e) => {
        if (e.target.matches('.bit, .hex-char')) {
            const text = e.target.textContent;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    // Show brief feedback
                    const originalText = e.target.textContent;
                    e.target.textContent = '✓';
                    setTimeout(() => {
                        e.target.textContent = originalText;
                    }, 200);
                });
            }
        }
    });
    
    // Add input validation styling
    [converter.decimalInput, converter.hexInput, converter.binaryInput].forEach(input => {
        input.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            if (!value) {
                e.target.classList.remove('error');
                return;
            }
            
            let isValid = false;
            try {
                if (input === converter.decimalInput) {
                    const cleanValue = value.replace(/[,_]/g, '');
                    // Allow just "-" for typing negative numbers only if two's complement is enabled
                    if (cleanValue === '-') {
                        isValid = converter.isTwosComplement;
                    } else {
                        try {
                            const bigIntValue = BigInt(cleanValue);
                            // Only allow negative values if two's complement is enabled
                            if (!converter.isTwosComplement && bigIntValue < 0n) {
                                isValid = false;
                            } else {
                                isValid = true; // Any valid BigInt is acceptable when mode allows it
                            }
                        } catch {
                            isValid = false;
                        }
                    }
                } else if (input === converter.hexInput) {
                    let hexValue = value.toLowerCase();
                    if (hexValue.startsWith('0x')) {
                        hexValue = hexValue.slice(2);
                    }
                    
                    // Allow empty hex after 0x removal
                    if (hexValue === '') {
                        isValid = true;
                    } else {
                        // Remove underscores first (same as onHexChange)
                        const cleanHexValue = hexValue.replace(/_/g, '');
                        
                        // Allow empty after underscore removal
                        if (cleanHexValue === '') {
                            isValid = true;
                        } else {
                            // Validate cleaned hex characters only
                            isValid = /^[0-9a-f]+$/.test(cleanHexValue);
                        }
                    }
                } else if (input === converter.binaryInput) {
                    let binaryValue = value.toLowerCase();
                    
                    // Remove 0b prefix if present
                    if (binaryValue.startsWith('0b')) {
                        binaryValue = binaryValue.slice(2);
                    }
                    
                    if (binaryValue === '') {
                        isValid = true; // Allow empty binary for typing
                    } else {
                        // Remove underscores first
                        const cleanBinaryValue = binaryValue.replace(/_/g, '');
                        
                        // Allow empty after underscore removal
                        if (cleanBinaryValue === '') {
                            isValid = true;
                        } else if (/^[01]+$/.test(cleanBinaryValue)) {
                            try {
                                const bigIntValue = BigInt('0b' + cleanBinaryValue);
                                isValid = true; // Any valid binary BigInt is acceptable
                            } catch {
                                isValid = false; // BigInt conversion failed
                            }
                        } else {
                            isValid = false; // Invalid binary characters
                        }
                    }
                }
            } catch {
                isValid = false;
            }
            
            e.target.classList.toggle('error', !isValid);
        });
    });
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BitConverter;
} 