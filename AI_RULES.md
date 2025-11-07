# AI Rules for this Application

## Tech Stack Overview

- **Frontend Framework**: React with TypeScript for type safety and component-based architecture
- **Routing**: React Router for navigation between pages and components
- **Styling**: Tailwind CSS for utility-first styling and responsive design
- **UI Components**: shadcn/ui library for pre-built, accessible components
- **Icons**: lucide-react package for consistent iconography
- **State Management**: React's built-in state management (useState, useReducer) for simple cases, with potential for Redux Toolkit or Zustand for complex state needs
- **Build Tool**: Vite for fast development server and optimized production builds

## Library Usage Rules

- **Use shadcn/ui components** for standard UI elements like buttons, inputs, cards, modals, etc.
- **Use lucide-react icons** for all icon needs to maintain visual consistency
- **Use Tailwind CSS** for all styling, avoiding custom CSS files
- **Prefer React Router** for navigation instead of third-party alternatives
- **Use TypeScript** for all components and utilities to ensure type safety
- **Avoid external state management libraries** unless absolutely necessary (e.g., for complex global state)
- **Use React's built-in hooks** for component state and effects
- **Keep components small and focused** (100 lines or less) for maintainability
- **Use client-side rendering** with "use client" directive for interactive components
- **Follow the project structure** (src/pages, src/components) for organization