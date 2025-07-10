# Medical Chatbot - Next.js Version

This is a Next.js conversion of the Persian medical chatbot application.

## Features

- Persian/Farsi RTL (Right-to-Left) layout
- Responsive design for mobile and desktop
- Interactive prompt suggestions
- Real-time chat interface
- Custom Kalameh font support
- Modern React components with TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Add the Kalameh font file:
   - Place `Kalameh-Black.ttf` in the `public/fonts/` directory
   - The font file should match the one from the original project

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/
│   ├── components/
│   │   ├── InitialScreen.tsx    # Welcome screen with prompt suggestions
│   │   ├── ChatScreen.tsx       # Chat history display
│   │   └── ChatForm.tsx         # Message input form
│   ├── globals.css              # Global styles (converted from original CSS)
│   ├── layout.tsx               # Root layout with RTL support
│   └── page.tsx                 # Main page component
├── public/
│   └── fonts/                   # Font files directory
├── package.json
├── tsconfig.json
└── next.config.js
```

## Key Changes from Original

1. **Component Architecture**: Split into reusable React components
2. **State Management**: Uses React hooks for state management
3. **TypeScript**: Full TypeScript support for better development experience
4. **Next.js Features**: Leverages Next.js App Router and built-in optimizations
5. **Modern React**: Uses functional components with hooks instead of vanilla JavaScript

## Components

### InitialScreen
- Displays welcome message and prompt suggestions
- Handles click events for quick prompts
- Conditionally rendered based on chat state

### ChatScreen  
- Displays chat message history
- Auto-scrolls to latest messages
- Supports both user and bot message types

### ChatForm
- Handles message input and submission
- Supports Enter key submission (Shift+Enter for new line)
- Includes disclaimer text

## Styling

The original CSS has been preserved and adapted for the Next.js structure:
- CSS custom properties for theming
- Responsive design with mobile-first approach
- RTL layout support for Persian text
- Smooth transitions and hover effects

## Font Setup

To use the custom Kalameh font:
1. Copy `Kalameh-Black.ttf` to `public/fonts/`
2. The font is already configured in `globals.css`
3. Make sure to comply with the font license terms

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

Please ensure you have proper licensing for the Kalameh font as specified in the original FontLicense.txt file.