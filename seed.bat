@echo off
set "NODE_PATH=%~dp0node_modules"
node "node_modules\ts-node\dist\bin.js" --compiler-options "{\"module\":\"CommonJS\"}" prisma\seed.ts
