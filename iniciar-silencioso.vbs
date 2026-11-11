Dim Wsh
Set Wsh = CreateObject("WScript.Shell")

' Inicia o Next.js em segundo plano (windowStyle 0 = oculto)
Wsh.Run "cmd /c cd /d ""C:\Users\Caixa\Cardapio-digital"" && npm run start", 0, False

' Aguarda 5 segundos para o servidor subir
Wsh.Run "cmd /c timeout /t 5 /nobreak >nul", 0, True

' Inicia o tunnel Cloudflare em segundo plano
Wsh.Run "cmd /c cloudflared tunnel --config ""C:\Users\Caixa\Cardapio-digital\config.yml"" run 4bc66d69-b9a7-4b32-90da-4d8ea868c542", 0, False

Set Wsh = Nothing
