# Debug Steps - Spotify Extension

## Yaptığım Düzeltmeler:
1. ✅ `forceRefresh()` metodu eklendi - authentication'dan sonra status bar güncelleniyor
2. ✅ `isAuthenticated()` hızlandırıldı - artık sadece token varlığını kontrol ediyor
3. ✅ Daha iyi error logging eklendi

## Test Adımları:

### 1. Extension Development Host'u Kapat
Tamamen kapat.

### 2. Ana VS Code'da Developer Tools Aç
- `Help` → `Toggle Developer Tools`
- Console sekmesine git

### 3. F5 Bas - Yeni Extension Development Host Aç
- Yeni pencere açılacak

### 4. Extension Development Host'da da Developer Tools Aç
- `Help` → `Toggle Developer Tools`
- Console sekmesine git
- Burada log'ları göreceksin

### 5. Bir Klasör Aç
- `File` → `Open Folder`
- Herhangi bir klasör seç

### 6. Authenticate Et
- `Ctrl+Shift+P`
- `Spotify: Authenticate` yaz
- Browser açılacak
- Spotify'a giriş yap
- Token'ı kopyala
- VS Code'a yapıştır

### 7. Console'da Ne Görüyorsun?
Şunları görmeli sin:
```
Spotify Control Panel extension is now active
Verifying session token with backend...
Access token received successfully
```

### 8. Status Bar'a Bak
Alt tarafta şunları görmeli sin:
- 🎵 Şarkı adı (eğer Spotify çalıyorsa)
- ⏯️ Play/Pause
- ⏮️⏭️ Previous/Next
- 🔀 Shuffle
- 🔁 Repeat
- 🔊 Volume

## Eğer Hala Sorun Varsa:

### Console'da Error Görüyorsan:
Screenshot at ve bana göster.

### "Not authenticated" Yazıyorsa:
1. Console'da "No session token found in storage" yazıyor mu?
2. Token'ı doğru yapıştırdın mı?
3. Backend'den gelen token'ı tam kopyaladın mı?

### "No playback" Yazıyorsa:
Bu normal! Spotify uygulamasını aç ve bir şarkı çal.

## Beklenen Davranış:
1. Authenticate → Browser açılır
2. Spotify login → Token sayfası
3. Token kopyala → VS Code'a yapıştır
4. ✅ Success mesajı
5. Status bar güncellenir
6. Şarkı bilgisi görünür (eğer çalıyorsa)

