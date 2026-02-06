# iFoundIt Checkout Flow

A modern, production-ready checkout interface for iFoundIt's NFC tag subscription service.

## Features

- **Tag Capacity Selection**: Choose from 1, 3, 10, or 20 tags
- **Physical Tag Selection**: Select from 6 different NFC tag types with detailed descriptions
- **Bolt-on Options**: Add finder rewards, return credits, and additional recovery contacts
- **Dynamic Pricing**: Real-time order summary with itemized breakdown
- **Capacity Enforcement**: Strict validation prevents exceeding selected tag limits
- **Premium UI**: Dark mode with glassmorphism effects and smooth animations

## Tech Stack

- **Vite**: Fast build tool and dev server
- **TypeScript**: Type-safe business logic
- **Vanilla CSS**: Custom design system with CSS variables
- **No Framework**: Lightweight, dependency-free implementation

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the checkout flow.

### Build

```bash
npm run build
```

The production build will be output to the `dist` directory.

## Project Structure

```
├── index.html              # Main HTML structure
├── src/
│   ├── main.ts            # Application logic and UI updates
│   ├── style.css          # Design system and component styles
│   └── logic/
│       └── pricing.ts     # Pricing calculations and state management
├── public/
│   └── ifoundit-logo.svg  # Brand assets
└── package.json
```

## Key Features

### Pricing Logic

- Base plan costs based on tag capacity
- Individual tag pricing with quantity selectors
- "Free tag" credit for single-tag plans
- Bolt-on add-ons with transparent pricing
- Real-time total calculation

### Validation

- Minimum 1 tag required
- Maximum tags enforced by selected capacity
- CTA button disabled when validation fails
- Visual feedback for capacity limits

### Order Summary

- Itemized tag selections
- Subtotals for tags and bolt-ons
- Clear credit display
- Right-aligned pricing column

## License

MIT
