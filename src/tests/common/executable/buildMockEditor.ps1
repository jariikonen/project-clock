# This script builds the mockEditor.exe single executable application (SEA)
# used in Windows tests followinf these instructions:
# https://nodejs.org/api/single-executable-applications.html
if (Test-Path .\mockEditor.exe) {
    Remove-Item .\mockEditor.exe
}
if (Test-Path .\sea-prep.blob) {
    Remove-Item .\sea-prep.blob
}
node --experimental-sea-config sea-config.json
node -e "require('fs').copyFileSync(process.execPath, 'mockEditor.exe')"
npx postject mockEditor.exe NODE_SEA_BLOB sea-prep.blob `
    --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
