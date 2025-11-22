Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.MessageBox]::Show("Conversao de audio WAV para MP3`n`nPor favor, use uma ferramenta online:`n`n1. Acesse: https://cloudconvert.com/wav-to-mp3`n2. Faca upload dos arquivos WAV`n3. Configure qualidade: 192 kbps`n4. Baixe os MP3 e coloque na pasta`n`nIsso reduzira de 57 MB para ~6 MB!", "AION - Otimizacao de Audio", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
Start-Process "https://cloudconvert.com/wav-to-mp3"
