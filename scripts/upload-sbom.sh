#!/bin/bash

# SBOM Upload Script for OWASP Dependency-Track
# Usage: bash scripts/upload-sbom.sh [API_KEY] [PROJECT_NAME] [PROJECT_VERSION]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"

# .env dosyasından değişkenleri oku
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

DTRACK_URL="${DTRACK_URL:-http://localhost:8081}"
API_KEY="${1:-${DTRACK_API_KEY}}"
PROJECT_NAME="${2:-huseyindolcom}"
PROJECT_VERSION="${3:-0.1.0}"
BOM_FILE="$PROJECT_DIR/bom.json"

if [ -z "$API_KEY" ]; then
  echo "❌ API Key gerekli!"
  echo ""
  echo "Kullanım:"
  echo "  bash scripts/upload-sbom.sh <API_KEY> [PROJECT_NAME] [PROJECT_VERSION]"
  echo ""
  echo "Veya environment variable olarak:"
  echo "  export DTRACK_API_KEY=<your-api-key>"
  echo "  bun run sbom:upload"
  echo ""
  echo "API Key almak için: http://localhost:8080 → Administration → Access Management → Teams → Automation → API Keys"
  exit 1
fi

if [ ! -f "$BOM_FILE" ]; then
  echo "❌ $BOM_FILE bulunamadı. Önce SBOM oluşturun:"
  echo "  bun run sbom:generate"
  exit 1
fi

echo "📦 SBOM yükleniyor..."
echo "   URL: $DTRACK_URL"
echo "   Proje: $PROJECT_NAME v$PROJECT_VERSION"

# Base64 encode the BOM file
BOM_BASE64=$(base64 < "$BOM_FILE" | tr -d '\n')

# JSON payload'ı geçici dosyaya yaz (büyük dosyalar için gerekli)
PAYLOAD_FILE=$(mktemp)
cat > "$PAYLOAD_FILE" <<EOF
{
  "projectName": "$PROJECT_NAME",
  "projectVersion": "$PROJECT_VERSION",
  "autoCreate": true,
  "bom": "$BOM_BASE64"
}
EOF

# Upload to Dependency-Track
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
  "$DTRACK_URL/api/v1/bom" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: $API_KEY" \
  -d @"$PAYLOAD_FILE")

# Geçici dosyayı temizle
rm -f "$PAYLOAD_FILE"

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ SBOM başarıyla yüklendi!"
  echo "   Dashboard: http://localhost:3434"
  echo "   Token: $BODY"
else
  echo "❌ Yükleme başarısız (HTTP $HTTP_CODE)"
  echo "   $BODY"
  exit 1
fi
