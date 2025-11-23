# Digital Ocean JWT_SECRET Sorunu - ÇÖZÜM

## 🔴 SORUN:
Backend her restart olduğunda **JWT_SECRET** yeniden oluşturuluyor!
Bu yüzden eski token'lar geçersiz oluyor ve "Session not found" hatası veriyor.

## ✅ ÇÖZÜM: JWT_SECRET'i Digital Ocean'da Ayarla

### Adım 1: JWT Secret Oluştur
PowerShell'de çalıştır:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Çıktı örneği:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

**Bu secret'i kopyala!**

### Adım 2: Digital Ocean'da Environment Variable Ekle

1. **Digital Ocean'a Git:**
   - https://cloud.digitalocean.com/apps

2. **App'i Seç:**
   - "spotify-auth-backend" (veya senin app adın)

3. **Settings'e Git:**
   - Sol menüden "Settings" tıkla

4. **App-Level Environment Variables:**
   - "App-Level Environment Variables" bölümüne git
   - "Edit" butonuna tıkla

5. **JWT_SECRET Ekle:**
   ```
   Key: JWT_SECRET
   Value: [Adım 1'de oluşturduğun secret]
   Type: Secret (encrypted)
   ```

6. **Diğer Environment Variables'ları Kontrol Et:**
   Şunlar olmalı:
   ```
   SPOTIFY_CLIENT_ID=cac7aeee34f34a39a0417be0ed95526f
   SPOTIFY_CLIENT_SECRET=[senin secret'in]
   BACKEND_URL=https://urchin-app-hs7am.ondigitalocean.app
   JWT_SECRET=[yeni oluşturduğun secret]
   PORT=3000
   ```

7. **Save ve Redeploy:**
   - "Save" butonuna tıkla
   - App otomatik redeploy olacak (2-3 dakika)

### Adım 3: Deployment'ı Bekle

1. **Deployments Sekmesine Git:**
   - Sol menüden "Deployments"
   - Son deployment "Live" olana kadar bekle

2. **Logs'u Kontrol Et:**
   - "Runtime Logs" sekmesine git
   - Şunu görmeli sin:
   ```
   🚀 Spotify Auth Backend running on port 3000
   📍 Backend URL: https://urchin-app-hs7am.ondigitalocean.app
   🔑 Client ID: ✅ Set
   🔑 Client Secret: ✅ Set
   🔐 JWT Secret: ✅ Set (a1b2c3d4...)
   ```

### Adım 4: Extension'ı Test Et

1. **Extension Development Host'u KAPAT**

2. **F5 BAS**

3. **YENİ AUTHENTICATION YAP:**
   - `Ctrl+Shift+P` → `Spotify: Authenticate`
   - Browser'da login
   - Token'ı kopyala
   - VS Code'a yapıştır

4. **BU SEFER ÇALIŞMALI!** ✅

## 🔍 Neden Bu Sorun Oluştu?

Backend kodunda:
```javascript
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
```

Eğer `JWT_SECRET` environment variable yoksa, **her restart'ta yeni bir secret oluşturuyor**.
Bu yüzden eski token'lar decode edilemiyor.

## ✅ Çözüm Sonrası:

- ✅ JWT_SECRET sabit kalıyor
- ✅ Token'lar restart'tan sonra da çalışıyor
- ✅ "Session not found" hatası gitmiş olmalı

## 📝 Not:

Eğer hala sorun varsa:
1. Digital Ocean logs'unda "✅ Token stored successfully" mesajını gör
2. Sonra extension'da authenticate et
3. Eğer yine "Session not found" verirse, logs'u screenshot at bana göster

---

**ŞİMDİ YAP:**
1. JWT Secret oluştur
2. Digital Ocean'da environment variable ekle
3. Deployment'ı bekle
4. Test et!

