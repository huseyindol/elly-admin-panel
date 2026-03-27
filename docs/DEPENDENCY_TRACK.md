# OWASP Dependency-Track

Projedeki bağımlılıkların güvenlik açıklarını (vulnerability) takip etmek için OWASP Dependency-Track kullanılmaktadır.

## Gereksinimler

- Docker Desktop (en az **4GB RAM** ayrılmış olmalı)
- Docker Compose

## Başlatma

```bash
# Servisleri başlat
docker compose up -d

# Logları kontrol et
docker compose logs -f dtrack-apiserver
```

> ⚠️ İlk başlatmada API Server'ın tamamen hazır olması **3-5 dakika** sürebilir. NVD veritabanı senkronizasyonu arka planda otomatik yapılır.

## Erişim

| Servis         | URL                                            | Açıklama   |
| -------------- | ---------------------------------------------- | ---------- |
| **Dashboard**  | [http://localhost:3434](http://localhost:3434) | Web paneli |
| **API Server** | [http://localhost:8081](http://localhost:8081) | REST API   |

### İlk Giriş

- **Kullanıcı adı:** `admin`
- **Şifre:** `admin`

> İlk girişte şifre değişikliği istenecektir.

## SBOM Oluşturma ve Yükleme

### 1. SBOM Oluştur

```bash
bun run sbom:generate
```

Bu komut proje kök dizininde `bom.json` dosyası oluşturur.

### 2. API Key Al

1. Dashboard'a giriş yap → [http://localhost:3434](http://localhost:3434)
2. **Administration** → **Access Management** → **Teams**
3. **Automation** takımına tıkla
4. **API Keys** bölümünden key'i kopyala

### 3. SBOM Yükle

```bash
# Direkt parametre ile
bash scripts/upload-sbom.sh YOUR_API_KEY

# Veya environment variable ile
export DTRACK_API_KEY=YOUR_API_KEY
bun run sbom:upload
```

## Dashboard Kullanımı

Yükleme sonrası Dashboard'da şunları görebilirsiniz:

- **Projects** → Projenizin bağımlılıklarını ve vulnerability sayılarını görüntüleyin
- **Vulnerabilities** → Tüm güvenlik açıklarının listesi (CVE numaraları ile)
- **Policy Violations** → Politika ihlalleri
- **Audit** → Güvenlik açıklarını inceleme ve durum güncelleme (Not Affected, In Risk, vb.)

## Servisleri Durdurma

```bash
# Durdur (verileri koru)
docker compose down

# Durdur ve tüm verileri sil
docker compose down -v
```

## CI/CD Entegrasyonu (Opsiyonel)

GitHub Actions ile her push'ta otomatik SBOM yüklemesi yapılabilir:

```yaml
- name: Generate SBOM
  run: bun run sbom:generate

- name: Upload SBOM to Dependency-Track
  run: bash scripts/upload-sbom.sh ${{ secrets.DTRACK_API_KEY }}
  env:
    DTRACK_URL: ${{ secrets.DTRACK_URL }}
```
