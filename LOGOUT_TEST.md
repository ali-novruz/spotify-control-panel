# Logout Test

## Yaptığım Değişiklikler:

### Backend:
1. ✅ State timeout: 5 dakika → 10 dakika
2. ✅ Daha iyi "Invalid state" error mesajları
3. ✅ State expiry kontrolü eklendi

### Extension:
1. ✅ Logout butonu eklendi (🚪 ikonu)
2. ✅ Logout'tan sonra auto refresh
3. ✅ Refresh interval: 1 saniye → 3 saniye (daha stabil)
4. ✅ Error handling iyileştirildi (flickering yok)

## Test Adımları:

### 1. Backend'i Redeploy Et (Digital Ocean)
Backend değişiklikleri push ettik, şimdi Digital Ocean otomatik deploy edecek.

**Digital Ocean'da kontrol et:**
- https://cloud.digitalocean.com/apps
- App'i aç
- "Deployments" sekmesine git
- Son deployment'ın "Live" olmasını bekle (2-3 dakika)

### 2. Extension'ı Test Et

#### A. Extension Development Host'u KAPAT

#### B. F5 BAS - Yeni pencere aç

#### C. Klasör aç + Authenticate et
- `File` → `Open Folder`
- `Ctrl+Shift+P` → `Spotify: Authenticate`
- Browser'da login yap
- Token'ı kopyala ve yapıştır

#### D. Status Bar'ı Kontrol Et
Görmeli sin:
- 🎵 Şarkı adı
- ⏯️ Play/Pause
- ⏮️ Previous
- ⏭️ Next
- 🔀 Shuffle
- 🔁 Repeat
- 🔊 Volume
- **🚪 Logout** ← YENİ!

#### E. Logout'u Test Et
1. **🚪 ikonuna tıkla**
2. **"Yes" seç**
3. **"Successfully logged out" mesajı görmeli sin**
4. **Status bar "Not authenticated" olmalı**
5. **Tüm butonlar kaybolmalı**

#### F. Tekrar Authenticate Et
- `Ctrl+Shift+P` → `Spotify: Authenticate`
- Tekrar giriş yap
- Status bar geri gelmeli

## Beklenen Davranış:

### Logout Çalışıyor mu?
- ✅ Logout butonu tıklanıyor
- ✅ Confirmation dialog çıkıyor
- ✅ "Successfully logged out" mesajı
- ✅ Status bar "Not authenticated" oluyor
- ✅ Tekrar authenticate edilebiliyor

### Stability İyi mi?
- ✅ Status bar sürekli "Error" yazmıyor
- ✅ Flickering yok
- ✅ 3 saniyede bir güncelleniyor
- ✅ Smooth çalışıyor

## Eğer Hala Sorun Varsa:

### "Invalid state" Hatası:
- Backend'in redeploy olmasını bekle (2-3 dakika)
- Sonra tekrar authenticate et

### Logout Çalışmıyor:
- Developer Tools'da Console'u aç
- Logout'a tıkla
- Error var mı bak
- Screenshot at bana göster

### Flickering Devam Ediyor:
- Settings'te refresh interval'ı kontrol et
- `spotify.refreshInterval` → 3000 olmalı
- Daha da uzatabilirsin (5000 = 5 saniye)

## Digital Ocean Deployment:

Backend'i güncellemek için:
1. https://cloud.digitalocean.com/apps
2. App'i seç
3. "Settings" → "App-Level Settings"
4. "Force Rebuild & Deploy" butonuna bas (eğer otomatik deploy olmadıysa)

Deployment tamamlanınca test et!

