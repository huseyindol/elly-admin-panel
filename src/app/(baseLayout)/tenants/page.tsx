'use client'

import { useAdminTheme } from '@/app/_hooks'
import { usePermission } from '@/hooks/usePermission'
import { redirect } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

/**
 * Yeni Tenant Rehber Sihirbazı.
 *
 * Tenant'lar runtime'da DEĞİL, config + deploy ile eklenir (her tenant ayrı postgres
 * pod'u + application.properties datasource satırları + ConfigMap/Secret env'leri).
 * Bu sayfa provision YAPMAZ — girilen bilgilerden kopyala-yapıştır hazır config
 * blokları üretir; ekleme yine git commit + push (CI deploy) ile tamamlanır.
 */
export default function TenantWizardPage() {
  const { isDarkMode } = useAdminTheme()
  const { isSuperAdmin } = usePermission()

  useEffect(() => {
    if (!isSuperAdmin()) {
      redirect('/403')
    }
  }, [isSuperAdmin])

  const [tenantId, setTenantId] = useState('tenant3')
  const [frontendUrl, setFrontendUrl] = useState('https://')
  const [dbPassword, setDbPassword] = useState('')

  const valid = /^[a-z][a-z0-9]{1,20}$/.test(tenantId)
  const prefix = tenantId.toUpperCase()
  const dbName = `elly_${tenantId}`
  const podName = `postgres-${tenantId}`

  const snippets = useMemo(() => {
    if (!valid) return null
    const b64 = (v: string) =>
      typeof window === 'undefined' ? '' : window.btoa(v)
    const passB64 = dbPassword ? b64(dbPassword) : '<base64-şifre>'

    return {
      properties: `# --- ${prefix} ---
app.tenants.datasources.${tenantId}.url=jdbc:postgresql://\${${prefix}_DB_HOST:\${DB_HOST:localhost}}:\${${prefix}_DB_PORT:\${DB_PORT:5432}}/\${${prefix}_DB_NAME:${dbName}}
app.tenants.datasources.${tenantId}.username=\${${prefix}_DB_USER:postgres}
app.tenants.datasources.${tenantId}.password=\${${prefix}_DB_PASSWORD:123456}
app.tenants.datasources.${tenantId}.schema=\${${prefix}_DB_SCHEMA:public}
app.tenants.datasources.${tenantId}.frontend-url=\${${prefix}_FRONTEND_URL:http://localhost:3000}`,

      configmap: `  # --- ${prefix} Database (elly-config data: bölümüne) ---
  ${prefix}_DB_HOST: "${podName}"
  ${prefix}_DB_PORT: "5432"
  ${prefix}_DB_NAME: "${dbName}"
  ${prefix}_DB_SCHEMA: "public"
  ${prefix}_FRONTEND_URL: "${frontendUrl}"

---
# ============================================
# CONFIGMAP - PostgreSQL ${prefix} (dosya sonuna)
# ============================================
apiVersion: v1
kind: ConfigMap
metadata:
  name: ${podName}-config
  namespace: elly
  labels:
    app: elly-cms
    component: database
    tenant: ${tenantId}
data:
  POSTGRES_DB: "${dbName}"
  PGDATA: "/var/lib/postgresql/data/pgdata"
  POSTGRES_INITDB_ARGS: "-E UTF8 --locale=en_US.UTF-8"
  init.sql: |
    CREATE SCHEMA IF NOT EXISTS public;`,

      secret: `  # elly-secret data: bölümüne (1-secret.yaml)
  ${prefix}_DB_USER: cG9zdGdyZXM=
  ${prefix}_DB_PASSWORD: ${passB64}

---
# ============================================
# SECRET - PostgreSQL ${prefix} (dosya sonuna)
# ============================================
apiVersion: v1
kind: Secret
metadata:
  name: ${podName}-secret
  namespace: elly
  labels:
    app: elly-cms
    component: database
    tenant: ${tenantId}
type: Opaque
data:
  POSTGRES_USER: cG9zdGdyZXM=
  POSTGRES_PASSWORD: ${passB64}

# 1-secret.template.yaml'a da şablon halleri:
#   ${prefix}_DB_USER: "\${${prefix}_DB_USER_B64}"
#   ${prefix}_DB_PASSWORD: "\${${prefix}_DB_PASSWORD_B64}"
# deploy.yml "Generate Secrets YAML" adımına:
#   export ${prefix}_DB_USER_B64=$(echo -n "\${{ secrets.${prefix}_DB_USER }}" | base64)
#   export ${prefix}_DB_PASSWORD_B64=$(echo -n "\${{ secrets.${prefix}_DB_PASSWORD }}" | base64)
# GitHub repo Secrets'a ekle: ${prefix}_DB_USER, ${prefix}_DB_PASSWORD`,

      statefulset: `---
# ============================================
# STATEFULSET - PostgreSQL ${prefix} (2c-postgres.yaml sonuna)
# ============================================
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: ${podName}
  namespace: elly
  labels:
    app: elly-cms
    component: database
    tenant: ${tenantId}
spec:
  serviceName: ${podName}
  replicas: 1
  selector:
    matchLabels:
      app: elly-cms
      component: database
      tenant: ${tenantId}
  template:
    metadata:
      labels:
        app: elly-cms
        component: database
        tenant: ${tenantId}
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
              name: postgres
          envFrom:
            - configMapRef:
                name: ${podName}-config
            - secretRef:
                name: ${podName}-secret
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          readinessProbe:
            exec:
              command: [pg_isready, -U, postgres, -d, ${dbName}]
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 5
          livenessProbe:
            exec:
              command: [pg_isready, -U, postgres, -d, ${dbName}]
            initialDelaySeconds: 15
            periodSeconds: 20
            timeoutSeconds: 5
          volumeMounts:
            - name: ${podName}-data
              mountPath: /var/lib/postgresql/data
            - name: init-sql
              mountPath: /docker-entrypoint-initdb.d/init.sql
              subPath: init.sql
      volumes:
        - name: init-sql
          configMap:
            name: ${podName}-config
            items:
              - key: init.sql
                path: init.sql
  volumeClaimTemplates:
    - metadata:
        name: ${podName}-data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: local-path
        resources:
          requests:
            storage: 8Gi

---
# SERVICE (3-service.yaml sonuna — nodePort'u boşta bir port ile değiştir)
apiVersion: v1
kind: Service
metadata:
  name: ${podName}
  namespace: elly
  labels:
    app: elly-cms
    component: database
    tenant: ${tenantId}
spec:
  type: NodePort
  selector:
    app: elly-cms
    component: database
    tenant: ${tenantId}
  ports:
    - name: postgres
      port: 5432
      targetPort: 5432
      nodePort: 31435
      protocol: TCP`,

      backup: `# 7-backup-cronjob.yaml — dump adımlarına ekle (adım numaralarını güncelle):
#   echo "[N] ${prefix}"
#   dump_db ${tenantId} ${podName} "\$${prefix}_USER" "\$${prefix}_DB_NAME" "\$${prefix}_PASSWORD"
# env: bölümüne:
#   - name: ${prefix}_USER
#     valueFrom: { secretKeyRef: { name: ${podName}-secret, key: POSTGRES_USER } }
#   - name: ${prefix}_PASSWORD
#     valueFrom: { secretKeyRef: { name: ${podName}-secret, key: POSTGRES_PASSWORD } }
#   - name: ${prefix}_DB_NAME
#     valueFrom: { configMapKeyRef: { name: elly-config, key: ${prefix}_DB_NAME } }`,
    }
  }, [valid, tenantId, prefix, dbName, podName, frontendUrl, dbPassword])

  const copy = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`${label} kopyalandı`))
      .catch(() => toast.error('Kopyalanamadı'))
  }

  const inputClass = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors ${
    isDarkMode
      ? 'border border-slate-700/50 bg-slate-800/50 text-white placeholder-slate-500 focus:border-violet-500'
      : 'border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:border-violet-500'
  }`
  const labelClass = `block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`
  const cardClass = `rounded-2xl p-5 ${
    isDarkMode
      ? 'border border-slate-800/50 bg-slate-900/60'
      : 'border border-gray-200 bg-white'
  }`
  const preClass = `mt-2 max-h-72 overflow-auto rounded-xl p-4 text-xs leading-relaxed ${
    isDarkMode ? 'bg-slate-950 text-slate-300' : 'bg-gray-900 text-gray-100'
  }`

  const Section = ({
    title,
    text,
    note,
  }: {
    title: string
    text: string
    note?: string
  }) => (
    <div className={cardClass}>
      <div className="flex items-center justify-between">
        <h3
          className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          {title}
        </h3>
        <button
          type="button"
          onClick={() => copy(text, title)}
          className="rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-1.5 text-xs font-medium text-white"
        >
          Kopyala
        </button>
      </div>
      {note && (
        <p
          className={`mt-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
        >
          {note}
        </p>
      )}
      <pre className={preClass}>{text}</pre>
    </div>
  )

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1
          className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          Yeni Tenant Ekle
        </h1>
        <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
          Tenant'lar config + deploy ile eklenir. Bu sihirbaz kopyala-yapıştır
          hazır blokları üretir; değişiklikler backend repo'suna commit + push
          edilince CI deploy eder.
        </p>
      </div>

      {/* Girdiler */}
      <div className={cardClass}>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className={labelClass}>Tenant ID *</label>
            <input
              value={tenantId}
              onChange={e => setTenantId(e.target.value.trim())}
              className={inputClass}
              placeholder="tenant3"
            />
            {!valid && (
              <p className="mt-1 text-xs text-rose-400">
                Küçük harf + rakam, harfle başlamalı (ör. tenant3)
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>Frontend Domain *</label>
            <input
              value={frontendUrl}
              onChange={e => setFrontendUrl(e.target.value.trim())}
              className={inputClass}
              placeholder="https://musteri-domaini.com"
            />
          </div>
          <div>
            <label className={labelClass}>DB Şifresi</label>
            <input
              type="password"
              value={dbPassword}
              onChange={e => setDbPassword(e.target.value)}
              className={inputClass}
              placeholder="Secret bloğu için (base64 üretilir)"
            />
          </div>
        </div>
      </div>

      {snippets && (
        <>
          <Section
            title="1) application.properties"
            note="Backend repo — mevcut tenant2 bloğunun altına."
            text={snippets.properties}
          />
          <Section
            title="2) k8s/1-configmap.yaml"
            note="İlk blok elly-config data: içine; ikinci blok dosya sonuna."
            text={snippets.configmap}
          />
          <Section
            title="3) k8s/1-secret.yaml + template + CI"
            note="Base64 değerler girilen şifreden üretildi. GitHub Secrets eklemeyi unutma."
            text={snippets.secret}
          />
          <Section
            title="4) k8s/2c-postgres.yaml + 3-service.yaml"
            note="StatefulSet + Service. nodePort'u cluster'da boşta bir portla değiştir."
            text={snippets.statefulset}
          />
          <Section
            title="5) k8s/7-backup-cronjob.yaml"
            note="Gece yedeğine yeni tenant'ı dahil et."
            text={snippets.backup}
          />

          <div className={cardClass}>
            <h3
              className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              6) Deploy sonrası adımlar
            </h3>
            <ol
              className={`mt-2 list-decimal space-y-1 pl-5 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
            >
              <li>
                Backend repo'ya commit + push → CI imajı build edip deploy eder.
              </li>
              <li>
                İlk boot'ta bir kez <code>STARTUP_RBAC_SEED=true</code> ile seed
                (roller + permission'lar + SUPER_ADMIN) — sonra tekrar false.
              </li>
              <li>
                Şema: <code>JPA_DDL_AUTO=validate</code> prod'da — tabloları
                migration SQL ile oluştur (tenant1 dump şeması referans).
              </li>
              <li>
                Frontend: {frontendUrl || 'tenant domain'}'i tenant sitesine
                yönlendir (DNS + hosting env: NEXT_PUBLIC_API public URL'i).
              </li>
              <li>
                Panel login: yeni tenant'ın SUPER_ADMIN'i ile{' '}
                <code>tenantId: {tenantId}</code> girerek doğrula.
              </li>
            </ol>
          </div>
        </>
      )}
    </div>
  )
}
