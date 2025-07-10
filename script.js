class BitConverter {
    constructor() {
        this.decimalInput = document.getElementById('decimal');
        this.hexInput = document.getElementById('hex');
        this.binaryInput = document.getElementById('binary');
        this.bitDisplay = document.getElementById('bitDisplay');
        this.hexDisplay = document.getElementById('hexDisplay');
        this.tooltip = document.getElementById('tooltip');
        this.bitWidthToggle = document.getElementById('bitWidthToggle');
        this.bitCount = document.getElementById('bitCount');
        this.maxValueDisplay = document.getElementById('maxValueDisplay');
        
        this.is64Bit = false;
        this.updateBitWidth();
        
        this.init();
    }
    
    init() {
        // Add event listeners for input changes
        this.decimalInput.addEventListener('input', (e) => this.onDecimalChange(e));
        this.hexInput.addEventListener('input', (e) => this.onHexChange(e));
        this.binaryInput.addEventListener('input', (e) => this.onBinaryChange(e));
        this.bitWidthToggle.addEventListener('change', (e) => this.onBitWidthChange(e));
        
        // Initialize with default value
        this.updateAll(0n);
    }
    
    updateBitWidth() {
        this.bitWidth = this.is64Bit ? 64 : 32;
        this.maxValue = this.is64Bit ? 0xFFFFFFFFFFFFFFFFn : 0xFFFFFFFFn;
        
        // Update display
        this.bitCount.textContent = `${this.bitWidth} bits`;
        this.maxValueDisplay.textContent = `Max: ${this.maxValue.toLocaleString()}`;
    }
    
    onBitWidthChange(e) {
        this.is64Bit = e.target.checked;
        this.updateBitWidth();
        
        // Get current value and update if it exceeds new max
        const currentValue = this.getCurrentValue();
        if (currentValue > this.maxValue) {
            this.updateAll(0n);
        } else {
            this.updateAll(currentValue);
        }
    }
    
    getCurrentValue() {
        try {
            const decimalValue = this.decimalInput.value.trim();
            return decimalValue ? BigInt(decimalValue) : 0n;
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
        
        try {
            const bigIntValue = BigInt(value);
            if (bigIntValue >= 0n && bigIntValue <= this.maxValue) {
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
        // Convert BigInt to string for display
        const valueStr = value.toString();
        const hexStr = '0x' + value.toString(16).toUpperCase();
        const binaryStr = value.toString(2).padStart(this.bitWidth, '0');
        
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
        this.updateBitDisplay(value);
        this.updateHexDisplay(value);
    }
    
    updateBitDisplay(value) {
        const binaryString = value.toString(2).padStart(this.bitWidth, '0');
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
            
            this.bitDisplay.appendChild(bitElement);
        }
    }
    
    updateHexDisplay(value) {
        const hexDigits = this.is64Bit ? 16 : 8;
        const hexString = value.toString(16).toUpperCase().padStart(hexDigits, '0');
        this.hexDisplay.innerHTML = '';
        
        for (let i = 0; i < hexString.length; i++) {
            const hexChar = hexString[i];
            const nibblePosition = hexString.length - 1 - i;
            const startBit = nibblePosition * 4;
            const endBit = startBit + 3;
            
            const hexElement = document.createElement('div');
            hexElement.className = 'hex-char';
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
                    const bigIntValue = BigInt(value);
                    isValid = bigIntValue >= 0n && bigIntValue <= converter.maxValue;
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