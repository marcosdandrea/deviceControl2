DC² iconset listo para macOS
============================
Cómo generar el .icns en tu Mac:
  1) Descomprimí este ZIP.
  2) En Terminal, corré (dentro de la carpeta que contiene 'dc2.iconset'):
       iconutil -c icns dc2.iconset -o icon.icns
  3) Copiá 'icon.icns' a resources/icons/mac/icon.icns
  4) Reconstruí tu app con electron-builder.

Consejo:
  - Si el Dock no refresca el icono, ejecutá:  killall Dock
  - En tiempo de ejecución macOS ignora BrowserWindow.icon; usá app.dock.setIcon si necesitás cambiarlo dinámicamente.
