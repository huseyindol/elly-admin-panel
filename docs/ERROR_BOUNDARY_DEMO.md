# ErrorBoundary Demo Guide

Bu dokümanda ErrorBoundary'nin nasıl test edilebileceği ve farklı senaryoları açıklanmaktadır.

## 🎯 Test Senaryoları

### Scenario 1: Experience Component'inde Test

**Dosya:** `src/components/experience.tsx`

Experience component'inde development ortamında görünecek bir test butonu ekledik:

```tsx
{
  process.env.NODE_ENV === 'development' && (
    <Button variant="destructive" onClick={() => setShouldThrowError(true)}>
      🚨 Test Error Fırlat
    </Button>
  )
}
```

**Test Adımları:**

1. `bun dev` ile projeyi başlat
2. Ana sayfayı aç
3. "Experience" bölümüne scroll yap
4. Kırmızı test alanındaki "🚨 Test Error Fırlat" butonuna tıkla
5. ErrorBoundary devreye girer ve fallback UI gösterir

**Beklenen Sonuç:**

- ✅ Experience bölümü ErrorBoundary fallback UI'ı ile değişir
- ✅ Diğer bölümler (Hero, Skills) çalışmaya devam eder
- ✅ "Tekrar Dene" butonu ile component reset edilebilir

---

### Scenario 2: Detaylı ErrorBoundary Demo

**Dosya:** `src/components/ExperienceWithErrorDemo.tsx`

Üç farklı ErrorBoundary stratejisini gösteren demo component oluşturduk:

#### 2.1. ErrorBoundary Olmadan ❌

```tsx
// ErrorBoundary YOK
<ExperienceCard exp={mockExperiences[0]} />
```

**Test:**

- "Render Error" butonuna tıkla
- **Sonuç:** Tüm sayfa kırılır (White screen)

#### 2.2. Her Kart Ayrı ErrorBoundary ✅

```tsx
// Her kart ayrı ErrorBoundary ile sarılı
<ErrorBoundary fallback={<CustomErrorFallback />}>
  <ExperienceCard exp={mockExperiences[0]} />
</ErrorBoundary>

<ErrorBoundary fallback={<CustomErrorFallback />}>
  <ExperienceCard exp={mockExperiences[1]} />
</ErrorBoundary>
```

**Test:**

- İlk karttaki "Render Error" butonuna tıkla
- **Sonuç:** Sadece o kart fallback UI gösterir, diğer kart çalışır ✅

#### 2.3. Tek ErrorBoundary (Tüm Liste) 💙

```tsx
// Tüm liste tek ErrorBoundary ile sarılı
<ErrorBoundary>
  <div className="space-y-4">
    <ExperienceCard exp={mockExperiences[0]} />
    <ExperienceCard exp={mockExperiences[1]} />
  </div>
</ErrorBoundary>
```

**Test:**

- Herhangi bir karttaki "Render Error" butonuna tıkla
- **Sonuç:** Tüm liste fallback UI gösterir ⚠️

---

## 🧪 Hata Tipleri

### 1. Render Error

```tsx
if (errorType === ErrorType.RENDER_ERROR) {
  throw new Error('Render Error!')
}
```

**Ne zaman:** Component render sırasında
**Yakalanır mı:** ✅ Evet

### 2. Null Reference Error

```tsx
// @ts-ignore
const result = exp.nonExistentProperty.someMethod()
```

**Ne zaman:** Undefined property'ye erişim
**Yakalanır mı:** ✅ Evet

### 3. Async Error

```tsx
if (errorType === ErrorType.ASYNC_ERROR) {
  throw new Error('Async Error!')
}
```

**Ne zaman:** Event handler içinde
**Yakalanır mı:** ✅ Evet

---

## 📊 Strateji Karşılaştırması

| Strateji               | Avantaj   | Dezavantaj        | Kullanım                  |
| ---------------------- | --------- | ----------------- | ------------------------- |
| **ErrorBoundary Yok**  | Basit     | Tüm sayfa kırılır | ❌ Önerilmez              |
| **Her Component Ayrı** | İzolasyon | Fazla kod         | ✅ Kritik component'ler   |
| **Tek ErrorBoundary**  | Az kod    | Toplu kırılma     | ✅ İlişkili component'ler |

---

## 🎯 Best Practices

### ✅ YAPILMASI GEREKENLER

1. **Kritik Bölümleri Sar**

```tsx
<ErrorBoundary>
  <CriticalFeature />
</ErrorBoundary>
```

2. **Custom Fallback Kullan**

```tsx
<ErrorBoundary fallback={<UserFriendlyError />}>
  <MyComponent />
</ErrorBoundary>
```

3. **Error Callback Ekle**

```tsx
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Sentry'ye gönder
    Sentry.captureException(error)
  }}
>
  <MyComponent />
</ErrorBoundary>
```

### ❌ YAPILMAMASI GEREKENLER

1. **Her Şeyi Tek ErrorBoundary ile Sarma**

```tsx
// ❌ Kötü
<ErrorBoundary>
  <EntireApp />
</ErrorBoundary>
```

2. **ErrorBoundary'yi Unutma**

```tsx
// ❌ Kötü - Hata tüm sayfayı kırar
<MyCriticalComponent />
```

3. **Event Handler Hatalarını ErrorBoundary ile Yakalamaya Çalışma**

```tsx
// ❌ Yakalanmaz!
<button onClick={() => {
  throw new Error('This will NOT be caught!')
}}>
```

---

## 🚀 Demo'yu Çalıştırma

### 1. Development Mode

```bash
bun dev
```

### 2. Ana Sayfayı Aç

```
http://localhost:3000
```

### 3. Test Alanlarını Görüntüle

- **Experience Bölümü:** Test butonu ile tüm bölümü kır
- **ErrorBoundary Demo Bölümü:** Farklı senaryoları test et

### 4. Production Mode (Test butonları gizlenir)

```bash
bun build
bun start
```

---

## 📝 Test Checklist

- [ ] Experience bölümündeki test butonu çalışıyor mu?
- [ ] ErrorBoundary fallback UI gösteriliyor mu?
- [ ] "Tekrar Dene" butonu çalışıyor mu?
- [ ] Diğer bölümler etkilenmiyor mu?
- [ ] Custom fallback UI gösteriliyor mu?
- [ ] Development'ta hata detayları görünüyor mu?
- [ ] Production'da hata detayları gizli mi?
- [ ] Console'a error loglanıyor mu?

---

## 🐛 Troubleshooting

### Hata: ErrorBoundary çalışmıyor

**Sebep:** Event handler içinde hata fırlatılıyor
**Çözüm:** State kullanarak render sırasında fırlat

```tsx
// ❌ Yakalanmaz
<button onClick={() => throw new Error('Error')}>

// ✅ Yakalanır
const [error, setError] = useState(false)
if (error) throw new Error('Error')
<button onClick={() => setError(true)}>
```

### Hata: Tüm sayfa kırılıyor

**Sebep:** ErrorBoundary sarılmamış
**Çözüm:** Component'i ErrorBoundary ile sar

```tsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### Hata: Production'da test butonları görünüyor

**Sebep:** NODE_ENV kontrolü yok
**Çözüm:** Condition ekle

```tsx
{
  process.env.NODE_ENV === 'development' && <TestButton />
}
```

---

## 📚 Kaynaklar

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [ErrorBoundary Best Practices](https://kentcdodds.com/blog/use-react-error-boundary-to-handle-errors-in-react)
- [Projede Uygulanan Çözüm](./ERROR_HANDLING.md)

---

**Oluşturma Tarihi:** 2024-12-15  
**Versiyon:** 1.0.0  
**Status:** ✅ Demo Hazır
