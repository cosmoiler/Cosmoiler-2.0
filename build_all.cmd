@echo off

set /p choice="Build (y, n):"
if /i "%choice%" == "n" GOTO 1

echo --------------------------------------
echo Run Build
echo --------------------------------------
call npm run build

pause

:1
pause

rem copy .\www\img\icon.png .\www\*.*
rem copy .\www\img\icon.png .\www\*.*
bin2c -d _appcssgz.h -o _appcssgz.c -n _appcssgz .\www\app.css.gz
bin2c -d _appjsgz.h -o _appjsgz.c -n _appjsgz .\www\app.js.gz
bin2c -d _indexhtm.h -o _indexhtm.c -n _indexhtm .\www\index.html
bin2c -d _fontello.h -o _fontello.c -n _fontellowoff .\www\fontello.woff
bin2c -d _icon.h -o _icon.c -n _iconpng .\www\icon.png
rem bin2c -d _vendorjs.h -o _vendorjs.c -n _vendorjs .\www\vendor.js.gz

rem move *.h ..\..\Firmware\cosmoiler-workspace\cosmoiler\Trubleshooting
rem move *.c ..\..\Firmware\cosmoiler-workspace\cosmoiler\Trubleshooting

move *.h ..\..\Firmware\PlatformIO\Cosmoiler\include
move *.c ..\..\Firmware\PlatformIO\Cosmoiler\src\FileDispatcher

echo Files moved sucess ---> build Android?

echo --------------------------------------
echo Attention!
echo 1. Build new version firmware
echo 2. Make recover File System
echo --------------------------------------

pause


echo --------------------------------------
echo Send to BITBUCKET
echo --------------------------------------

rem git status
rem set /p comment="Comment: "

rem git commit -m "%comment%" -a
rem bitbucket
rem git push origin2 master


rem copy .\dist\app.css.gz ..\..\Firmware\cosmoiler-workspace\Cosmoiler\SPIFFS\Common\app.css.gz
rem copy .\dist\app.js.gz ..\..\Firmware\cosmoiler-workspace\Cosmoiler\SPIFFS\Common\app.js.gz
rem copy .\dist\vendor.js.gz ..\..\Firmware\cosmoiler-workspace\Cosmoiler\SPIFFS\Common\vendor.js.gz
rem copy .\dist\manifest.js ..\..\Firmware\cosmoiler-workspace\Cosmoiler\SPIFFS\Common\manifest.js

pause
