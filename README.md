# BitView - Number Base Converter

A modern, interactive web application for converting between decimal, hexadecimal, and binary number formats with advanced hover functionality and bit visualization.

## ✨ Features

- **Real-time Conversion**: Instantly converts between decimal, hex, and binary as you type
- **Interactive Bit Visualization**: Each bit is displayed individually with hover tooltips
- **Hex Character Breakdown**: Hover over hex characters to see their bit ranges
- **Modern UI**: Clean, minimal design with dark mode support
- **Responsive Design**: Works on desktop and mobile devices
- **Sample Values**: Quick access to common values like max 32-bit, IPv4 addresses, etc.
- **Keyboard Shortcuts**: Ctrl/Cmd + R to reset, Ctrl/Cmd + A to select all in inputs
- **Copy Functionality**: Click on bits or hex characters to copy to clipboard

## 🚀 Getting Started

1. Open `index.html` in your web browser
2. Enter a number in any of the three input fields (decimal, hex, or binary)
3. Watch as the other formats update automatically
4. Hover over bits to see their position and value
5. Hover over hex characters to see their bit ranges

## 🎯 Usage Examples

### Basic Conversion
- Enter `255` in decimal → See `0xFF` in hex and `11111111` in binary
- Enter `0x1A` in hex → See `26` in decimal and `00011010` in binary
- Enter `1010` in binary → See `10` in decimal and `0xA` in hex

### Interactive Features
- **Bit Tooltips**: Hover over any bit to see its position and decimal value
- **Hex Tooltips**: Hover over hex characters to see which bits they represent
- **Sample Values**: Use the sample buttons to quickly load common values

## 🔧 Technical Details

- **Bit Width**: 32-bit (supports values up to 4,294,967,295)
- **Input Validation**: Real-time validation prevents invalid characters
- **Responsive Layout**: Grid-based layout that adapts to screen size
- **Accessibility**: Supports reduced motion preferences and keyboard navigation

## 📱 Browser Support

- Chrome/Edge 60+
- Firefox 55+
- Safari 12+
- Modern mobile browsers

## 🎨 Design Features

- **Glass-morphism Effect**: Modern backdrop blur effects
- **Smooth Animations**: Subtle hover effects and transitions
- **Color-coded Bits**: Visual distinction between 0s and 1s
- **Intelligent Tooltips**: Smart positioning that avoids screen edges

## 🔍 Hover Functionality

### Bit Hover
When you hover over a bit in the binary visualization:
- Shows the bit position (0-31)
- Shows the decimal value of that bit position
- Example: "Bit 7: Value = 128"

### Hex Character Hover
When you hover over a hex character:
- Shows which bits that character represents
- Shows the binary representation of that hex digit
- Example: "Hex F: Bits 0-3 (1111)"

## 🎯 Sample Values Included

- **Max 32-bit**: 4,294,967,295 (0xFFFFFFFF)
- **1 Million**: 1,000,000 (0xF4240)
- **IPv4 Address**: 192.168.1.1 (0xC0A80101)
- **RGB Color**: Orange color (0xFF5733)
- **Unix Timestamp**: Example timestamp (0x61C9A000)

## 🛠️ Files Structure

```
bitview/
├── index.html      # Main HTML structure
├── styles.css      # CSS styling and animations
├── script.js       # JavaScript functionality
└── README.md       # This documentation
```

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve the application.

---

**Made with ❤️ for developers, students, and anyone working with different number bases.** 