!macro customInstall
  WriteRegStr HKCU "Software\Classes\*\shell\LoomarkRead" "MUIVerb" "Read context with Loomark"
  WriteRegStr HKCU "Software\Classes\*\shell\LoomarkRead" "Icon" "$INSTDIR\Loomark.exe"
  WriteRegStr HKCU "Software\Classes\*\shell\LoomarkRead\command" "" '"$INSTDIR\Loomark.exe" --context "%1"'

  WriteRegStr HKCU "Software\Classes\Directory\shell\LoomarkRead" "MUIVerb" "Read context with Loomark"
  WriteRegStr HKCU "Software\Classes\Directory\shell\LoomarkRead" "Icon" "$INSTDIR\Loomark.exe"
  WriteRegStr HKCU "Software\Classes\Directory\shell\LoomarkRead\command" "" '"$INSTDIR\Loomark.exe" --context "%V"'
!macroend

!macro customUnInstall
  DeleteRegKey HKCU "Software\Classes\*\shell\LoomarkRead"
  DeleteRegKey HKCU "Software\Classes\Directory\shell\LoomarkRead"
  DeleteRegKey HKCU "Software\Classes\*\shell\ContextLibrarianRead"
  DeleteRegKey HKCU "Software\Classes\Directory\shell\ContextLibrarianRead"
!macroend
