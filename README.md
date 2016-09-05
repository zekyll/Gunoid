# Gunoid

Gunoid is a 2D space shooter game written in JavaScript and WebGL. Try the game here (requires Chrome or Firefox):

https://zekyll.github.io/Gunoid/

The game is still in quite early development, so there's not much content yet. Be sure to check it out later.

The goal of the project is to create a game with fun gameplay, unique enemies and items, and interesting physics interactions. Gunoid uses vector wireframe graphics for most game content to enable smooth animation and to make it easy to add new content.

## Building

Run `convert.py` python script in the models directory to convert .obj files to JavaScript array format (modeldata.js). Open `index.html` to start the game.

## TODO

Some ideas that may or may not be implemented:

- Sound/music.
- More enemies/weapons/items. Lots of them.
- Making the core game loop more interesting. Maybe free exploration instead of enemy waves.
- Ships with different stats and slot layouts. Support modules.
- XP and skill upgrades.
- Item vendor.
- Improved physics model with accurate collisions, rotational forces, angular momentum etc.
- Balance adjustments.

## Licensing

The project uses bpgdec which is released under BSD license. (see dependencies/bpgdec/README)

The game itself is released under ISC license. See LICENSE.txt for details.



