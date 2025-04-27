Set WshShell = CreateObject("WScript.Shell")
strPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = strPath
WshShell.Run "cmd /c start_app.bat", 0, False

' Tunggu 5 detik, lalu buka browser
WScript.Sleep 5000
WshShell.Run "http://localhost:3000", 1, False 