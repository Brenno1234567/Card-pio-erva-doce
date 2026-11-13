Dim Wsh, Fso, scriptDir, controller
Set Wsh = CreateObject("WScript.Shell")
Set Fso = CreateObject("Scripting.FileSystemObject")

scriptDir = Fso.GetParentFolderName(WScript.ScriptFullName)
controller = scriptDir & "\controle-cardapio.ps1"

' Abre o PowerShell visível e mantém a janela aberta em caso de erro.
Wsh.Run "powershell.exe -NoLogo -NoExit -ExecutionPolicy Bypass -File """ & controller & """", 1, False

Set Fso = Nothing
Set Wsh = Nothing
