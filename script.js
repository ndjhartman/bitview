class BitConverter {
    constructor() {
        this.decimalInput = document.getElementById('decimal');
        this.hexInput = document.getElementById('hex');
        this.binaryInput = document.getElementById('binary');
        this.bitDisplay = document.getElementById('bitDisplay');
        this.hexDisplay = document.getElementById('hexDisplay');
        this.tooltip = document.getElementById('tooltip');
        this.twosComplementToggle = document.getElementById('twosComplementToggle');
        this.darkModeToggle = document.getElementById('darkModeToggle');
        this.bitCount = document.getElementById('bitCount');
        this.maxValueDisplay = document.getElementById('maxValueDisplay');
        
        // Load cached states
        this.loadCachedStates();
        
        // Initialize modes
        this.updateRanges();
        this.updateDarkMode();
        
        this.init();
    }
    
    init() {
        // Add event listeners for input changes
        this.decimalInput.addEventListener('input', (e) => this.onDecimalChange(e));
        this.hexInput.addEventListener('input', (e) => this.onHexChange(e));
        this.binaryInput.addEventListener('input', (e) => this.onBinaryChange(e));
        this.twosComplementToggle.addEventListener('change', (e) => this.onTwosComplementChange(e));
        this.darkModeToggle.addEventListener('change', (e) => this.onDarkModeChange(e));
        
        // Initialize with default value
        this.updateAll(0n);
    }
    
    loadCachedStates() {
        // Load two's complement preference (default to unsigned)
        const cachedTwosComplement = localStorage.getItem('bitview-twoscomplement');
        this.isTwosComplement = cachedTwosComplement === 'true';
        this.twosComplementToggle.checked = this.isTwosComplement;
        
        // Load dark mode preference (default to light mode)
        const cachedDarkMode = localStorage.getItem('bitview-darkmode');
        this.isDarkMode = cachedDarkMode === 'true';
        this.darkModeToggle.checked = this.isDarkMode;
    }
    
    onDarkModeChange(e) {
        this.isDarkMode = e.target.checked;
        this.updateDarkMode();
        localStorage.setItem('bitview-darkmode', this.isDarkMode);
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

    onTwosComplementChange(e) {
        this.isTwosComplement = e.target.checked;
        this.updateRanges();
        localStorage.setItem('bitview-twoscomplement', this.isTwosComplement);
        
        // Get current value and update display
        const currentValue = this.getCurrentValue();
        
        // If switching from unsigned to two's complement, keep the current value
        // If switching from two's complement to unsigned and value is negative, reset to 0
        if (!this.isTwosComplement && currentValue < 0n) {
            this.updateAll(0n);
        } else {
            this.updateAll(currentValue);
        }
        
        // Force re-validation of all inputs after mode change
        this.validateAllInputs();
    }

    validateAllInputs() {
        // Trigger validation for all inputs
        this.decimalInput.dispatchEvent(new Event('input'));
        this.hexInput.dispatchEvent(new Event('input'));
        this.binaryInput.dispatchEvent(new Event('input'));
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
            // For negative numbers in two's complement, we need enough bits to represent the magnitude
            const absValue = -value;
            const bitLength = absValue.toString(2).length;
            // We need at least one more bit than the magnitude for the sign
            minBits = bitLength + 1;
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
        
        // Remove commas for processing
        const cleanValue = value.replace(/,/g, '');
        
        // Check if it's a negative number
        const isNegative = cleanValue.startsWith('-');
        if (isNegative && !this.isTwosComplement) {
            // Don't allow negative numbers in unsigned mode
            return;
        }
        
        try {
            const bigIntValue = BigInt(cleanValue);
            this.updateAll(bigIntValue, 'decimal');
        } catch {
            // Invalid input, ignore
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
        
        // Validate hex characters
        if (!/^[0-9a-f]+$/.test(value)) {
            return;
        }
        
        try {
            const bigIntValue = BigInt('0x' + value);
            this.updateAll(bigIntValue, 'hex');
        } catch {
            // Invalid input, ignore
        }
    }
    
    onBinaryChange(e) {
        const value = e.target.value.trim();
        if (!value) {
            this.updateAll(0n, 'binary');
            return;
        }
        
        // Validate binary characters
        if (!/^[01]+$/.test(value)) {
            return;
        }
        
        try {
            const bigIntValue = BigInt('0b' + value);
            this.updateAll(bigIntValue, 'binary');
        } catch {
            // Invalid input, ignore
        }
    }
    
    updateAll(value, source = '') {
        // Handle two's complement conversion for display
        let displayValue = value;
        const displayBits = this.getMinimumBitsNeeded(displayValue);
        
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
        
        // Update bit count display
        this.bitCount.textContent = `${displayBits} bits`;
        
        // Update visualizations
        this.updateBitDisplay(displayValue);
        this.updateHexDisplay(displayValue);
        
        // Update validation styling for all inputs
        this.updateInputValidation();
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
            
            this.bitDisplay.appendChild(groupElement);
        }
    }

    toggleBit(bitPosition) {
        const currentValue = this.getCurrentValue();
        const bitValue = 2n ** BigInt(bitPosition);
        
        // Toggle the bit
        const newValue = currentValue ^ bitValue;
        
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
            
            this.hexDisplay.appendChild(groupElement);
        }
    }
    
    showBitTooltip(e, position) {
        const bitValue = 2n ** BigInt(position);
        const tooltipText = `Bit ${position}: Value = ${bitValue.toLocaleString()}`;
        this.showTooltip(e, tooltipText);
    }
    
    showHexTooltip(e, startBit, endBit, hexChar) {
        const decimal = parseInt(hexChar, 16);
        const binary = decimal.toString(2).padStart(4, '0');
        const tooltipText = `Hex ${hexChar}: Bits ${startBit}-${endBit} (${binary})`;
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
        decimal: /^-?\d+$/,  // Allow negative numbers
        hex: /^(0x)?[0-9a-fA-F]+$/,
        binary: /^[01]+$/
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
                case 't':
                    e.preventDefault();
                    converter.twosComplementToggle.checked = !converter.twosComplementToggle.checked;
                    converter.twosComplementToggle.dispatchEvent(new Event('change'));
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
                    const cleanValue = value.replace(/,/g, '');
                    const isNegative = cleanValue.startsWith('-');
                    
                    // Allow negative numbers only in two's complement mode
                    if (isNegative && !converter.isTwosComplement) {
                        isValid = false;
                    } else {
                        const bigIntValue = BigInt(cleanValue);
                        isValid = true; // Any valid BigInt is acceptable in the correct mode
                    }
                } else if (input === converter.hexInput) {
                    let hexValue = value.toLowerCase();
                    if (hexValue.startsWith('0x')) {
                        hexValue = hexValue.slice(2);
                    }
                    // Allow empty hex after 0x removal, and validate hex characters
                    if (hexValue === '') {
                        isValid = true; // Allow empty hex for typing
                    } else if (/^[0-9a-f]+$/.test(hexValue)) {
                        try {
                            const bigIntValue = BigInt('0x' + hexValue);
                            isValid = true; // Any valid hex BigInt is acceptable
                        } catch (error) {
                            isValid = false; // BigInt conversion failed
                        }
                    } else {
                        isValid = false; // Invalid hex characters
                    }
                } else if (input === converter.binaryInput) {
                    if (value === '') {
                        isValid = true; // Allow empty binary for typing
                    } else if (/^[01]+$/.test(value)) {
                        try {
                            const bigIntValue = BigInt('0b' + value);
                            isValid = true; // Any valid binary BigInt is acceptable
                        } catch {
                            isValid = false; // BigInt conversion failed
                        }
                    } else {
                        isValid = false; // Invalid binary characters
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