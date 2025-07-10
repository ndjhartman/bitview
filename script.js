class BitConverter {
    constructor() {
        this.decimalInput = document.getElementById('decimal');
        this.hexInput = document.getElementById('hex');
        this.binaryInput = document.getElementById('binary');
        this.bitDisplay = document.getElementById('bitDisplay');
        this.hexDisplay = document.getElementById('hexDisplay');
        this.tooltip = document.getElementById('tooltip');
        this.bitWidthToggle = document.getElementById('bitWidthToggle');
        this.twosComplementToggle = document.getElementById('twosComplementToggle');
        this.darkModeToggle = document.getElementById('darkModeToggle');
        this.bitCount = document.getElementById('bitCount');
        this.maxValueDisplay = document.getElementById('maxValueDisplay');
        
        // Load cached states
        this.loadCachedStates();
        
        this.updateBitWidth();
        this.updateDarkMode();
        
        this.init();
    }
    
    init() {
        // Add event listeners for input changes
        this.decimalInput.addEventListener('input', (e) => this.onDecimalChange(e));
        this.hexInput.addEventListener('input', (e) => this.onHexChange(e));
        this.binaryInput.addEventListener('input', (e) => this.onBinaryChange(e));
        this.bitWidthToggle.addEventListener('change', (e) => this.onBitWidthChange(e));
        this.twosComplementToggle.addEventListener('change', (e) => this.onTwosComplementChange(e));
        this.darkModeToggle.addEventListener('change', (e) => this.onDarkModeChange(e));
        
        // Initialize with default value
        this.updateAll(0n);
    }
    
    loadCachedStates() {
        // Load bit width preference (default to 32-bit)
        const cached64Bit = localStorage.getItem('bitview-64bit');
        this.is64Bit = cached64Bit === 'true';
        this.bitWidthToggle.checked = this.is64Bit;
        
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
    
    updateBitWidth() {
        this.bitWidth = this.is64Bit ? 64 : 32;
        
        if (this.isTwosComplement) {
            this.maxValue = this.is64Bit ? 0x7FFFFFFFFFFFFFFFn : 0x7FFFFFFFn;
            this.minValue = this.is64Bit ? -0x8000000000000000n : -0x80000000n;
        } else {
            this.maxValue = this.is64Bit ? 0xFFFFFFFFFFFFFFFFn : 0xFFFFFFFFn;
            this.minValue = 0n;
        }
        
        // Update display
        this.bitCount.textContent = `${this.bitWidth} bits`;
        const rangeText = this.isTwosComplement ? 
            `Range: ${this.minValue.toLocaleString()} to ${this.maxValue.toLocaleString()}` :
            `Max: ${this.maxValue.toLocaleString()}`;
        this.maxValueDisplay.textContent = rangeText;
    }

    onTwosComplementChange(e) {
        this.isTwosComplement = e.target.checked;
        this.updateBitWidth();
        localStorage.setItem('bitview-twoscomplement', this.isTwosComplement);
        
        // Get current value and update if it's outside the new range
        const currentValue = this.getCurrentValue();
        if (currentValue > this.maxValue || currentValue < this.minValue) {
            this.updateAll(0n);
        } else {
            this.updateAll(currentValue);
        }
    }

    onBitWidthChange(e) {
        this.is64Bit = e.target.checked;
        this.updateBitWidth();
        localStorage.setItem('bitview-64bit', this.is64Bit);
        
        // Get current value and update if it exceeds new max
        const currentValue = this.getCurrentValue();
        if (currentValue > this.maxValue || currentValue < this.minValue) {
            this.updateAll(0n);
        } else {
            this.updateAll(currentValue);
        }
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
    
    onDecimalChange(e) {
        const value = e.target.value.trim();
        if (!value) {
            this.updateAll(0n, 'decimal');
            return;
        }
        
        // Remove commas for processing
        const cleanValue = value.replace(/,/g, '');
        
        try {
            const bigIntValue = BigInt(cleanValue);
            if (bigIntValue >= this.minValue && bigIntValue <= this.maxValue) {
                this.updateAll(bigIntValue, 'decimal');
            }
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
        
        // Validate hex characters
        if (!/^[0-9a-f]*$/.test(value)) {
            return;
        }
        
        try {
            const bigIntValue = BigInt('0x' + value);
            if (bigIntValue <= this.maxValue) {
                this.updateAll(bigIntValue, 'hex');
            }
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
        if (!/^[01]*$/.test(value)) {
            return;
        }
        
        try {
            const bigIntValue = BigInt('0b' + value);
            if (bigIntValue <= this.maxValue) {
                this.updateAll(bigIntValue, 'binary');
            }
        } catch {
            // Invalid input, ignore
        }
    }
    
    updateAll(value, source = '') {
        // Handle two's complement conversion for display
        let displayValue = value;
        
        // Convert BigInt to string for display
        const valueStr = displayValue.toString();
        const hexStr = '0x' + (displayValue < 0n ? 
            (BigInt(1) << BigInt(this.bitWidth)) + displayValue : displayValue)
            .toString(16).toUpperCase().padStart(this.bitWidth / 4, '0');
        const binaryStr = (displayValue < 0n ? 
            (BigInt(1) << BigInt(this.bitWidth)) + displayValue : displayValue)
            .toString(2).padStart(this.bitWidth, '0');
        
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
        
        // Update visualizations
        this.updateBitDisplay(displayValue);
        this.updateHexDisplay(displayValue);
    }
    
    updateBitDisplay(value) {
        const binaryValue = value < 0n ? 
            (BigInt(1) << BigInt(this.bitWidth)) + value : value;
        const binaryString = binaryValue.toString(2).padStart(this.bitWidth, '0');
        this.bitDisplay.innerHTML = '';
        
        for (let i = 0; i < this.bitWidth; i++) {
            const bit = binaryString[i];
            const bitPosition = this.bitWidth - 1 - i;
            
            const bitElement = document.createElement('div');
            bitElement.className = `bit ${bit === '1' ? 'one' : 'zero'}`;
            bitElement.textContent = bit;
            bitElement.dataset.position = bitPosition;
            
            // Add hover event listeners
            bitElement.addEventListener('mouseenter', (e) => this.showBitTooltip(e, bitPosition));
            bitElement.addEventListener('mouseleave', () => this.hideTooltip());
            
            // Add click event listener for bit toggling
            bitElement.addEventListener('click', (e) => this.toggleBit(bitPosition));
            
            this.bitDisplay.appendChild(bitElement);
        }
    }

    toggleBit(bitPosition) {
        const currentValue = this.getCurrentValue();
        const bitValue = 2n ** BigInt(bitPosition);
        
        // Toggle the bit
        const newValue = currentValue ^ bitValue;
        
        // Check if the new value is within range
        if (newValue >= this.minValue && newValue <= this.maxValue) {
            this.updateAll(newValue);
        }
    }
    
    updateHexDisplay(value) {
        const hexDigits = this.is64Bit ? 16 : 8;
        const hexValue = value < 0n ? 
            (BigInt(1) << BigInt(this.bitWidth)) + value : value;
        const hexString = hexValue.toString(16).toUpperCase().padStart(hexDigits, '0');
        this.hexDisplay.innerHTML = '';
        
        for (let i = 0; i < hexString.length; i++) {
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
            
            this.hexDisplay.appendChild(hexElement);
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
        decimal: /^\d+$/,
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
                case '1':
                    e.preventDefault();
                    converter.bitWidthToggle.checked = false;
                    converter.bitWidthToggle.dispatchEvent(new Event('change'));
                    break;
                case '2':
                    e.preventDefault();
                    converter.bitWidthToggle.checked = true;
                    converter.bitWidthToggle.dispatchEvent(new Event('change'));
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
                    const bigIntValue = BigInt(cleanValue);
                    isValid = bigIntValue >= converter.minValue && bigIntValue <= converter.maxValue;
                } else if (input === converter.hexInput) {
                    let hexValue = value.toLowerCase();
                    if (hexValue.startsWith('0x')) {
                        hexValue = hexValue.slice(2);
                    }
                    if (/^[0-9a-f]*$/.test(hexValue)) {
                        const bigIntValue = BigInt('0x' + hexValue);
                        isValid = bigIntValue <= converter.maxValue;
                    }
                } else if (input === converter.binaryInput) {
                    if (/^[01]*$/.test(value)) {
                        const bigIntValue = BigInt('0b' + value);
                        isValid = bigIntValue <= converter.maxValue;
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