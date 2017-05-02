$curDir = Split-Path -parent $PSCommandPath
$7z="$env:ProgramFiles\7-Zip\7z.exe"

pushd $curDir
$packageName = "variableProcessor.zip"
$files = "config.json","index.js","model","repository","node_modules"
&$7z a $packageName $files
