---
name: sidebar-sync
description: Trigger automatically when adding or removing a page under src/app/(baseLayout)/*. Forces Sidebar.tsx update in the same change so the menu and route stay in lockstep.
license: MIT
---

# Sidebar Senkronizasyonu

`src/app/(baseLayout)/` altına **yeni bir `page.tsx`** eklendiğinde veya bir route silindiğinde — aynı işlemde `src/app/_components/Sidebar.tsx` da güncellenir. Aksi halde kullanıcı menüden ulaşamaz, route ölü kalır.

## Kapsam

Bu kural sadece `(baseLayout)` altındaki **top-level route'lar** için geçerlidir. Aşağıdakiler **hariçtir**:

- `[id]/`, `[key]/`, `new/`, `edit/`, `submissions/` gibi alt sayfalar (zaten parent menü kalemiyle erişilir)
- `403/`, `loading.tsx`, `error.tsx` gibi sistem rotaları
- `_components/`, `_hooks/` dizinleri

## Akış

1. Yeni route'u belirle: `src/app/(baseLayout)/{slug}/page.tsx`
2. Menü grubunu seç:
   - Email / Mail / RabbitMQ / Infrastructure → `cmsManagementItems`
   - Geri kalan tümü → `menuItems`
3. `src/app/_components/Icons.tsx`'den uygun ikon seç; uygun yoksa yeni bir SVG `Icons` objesine ekle (PascalCase + `Icon` suffix değil — mevcut konvansiyon: `Mail`, `Inbox`, `AtSign`)
4. Sidebar dizisine kaydı ekle:

```ts
{ icon: Icons.Mail, label: 'Türkçe Başlık', href: '/route' }
```

5. Eğer route bir permission'la korunuyorsa, item'a `permission` field'ı koy (Sidebar `usePermission` ile filtreler):

```ts
{ icon: Icons.Mail, label: 'Email Şablonları', href: '/email-templates', permission: 'email_templates:read' }
```

## ❌ Yasak

- Sidebar güncellemesini "sonra yaparım" diye bırakmak
- Kullanıcıya "Sidebar'a şunu eklemen gerek" demek — kod hep birlikte commit edilmeli
- Yeni sayfa oluştur + commit + Sidebar olmadan push

## Doğrulama

Commit etmeden önce:

```bash
bunx tsc --noEmit
bun run lint
grep -F "/route" src/app/_components/Sidebar.tsx   # link var mı
```
