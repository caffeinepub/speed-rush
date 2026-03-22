# Speed Rush - Car Racing Game

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- A 2D top-down car racing game playable entirely in the browser offline
- Player controls a car using arrow keys or WASD (keyboard) and on-screen touch buttons for mobile
- Scrolling road track with lane markings, roadside scenery (trees, barriers)
- AI opponent cars the player must overtake and avoid
- Increasing difficulty: speed ramps up over time
- HUD showing current speed, score, and high score
- Lives system (3 lives), crash detection reduces lives
- Game states: Start screen, Playing, Game Over with high score
- Lightweight pure Canvas-based rendering, no external image assets (drawn programmatically)
- Smooth 60fps game loop with requestAnimationFrame

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Create main game canvas component with game loop
2. Implement player car with keyboard + touch controls
3. Implement scrolling road with lane markings and roadside trees
4. Implement AI traffic cars with random spawning
5. Collision detection between player and traffic
6. Score system based on distance traveled + cars overtaken
7. Lives system with crash animation
8. Start screen and Game Over screen
9. High score persisted in localStorage
10. Mobile-friendly on-screen control buttons
