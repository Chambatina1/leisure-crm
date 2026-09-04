#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# INSTALADOR DEL GATEWAY VPN — Leisure Exporting ↔ ETECSA
# Ejecutar como root en Ubuntu 24.04:
#   sudo bash install.sh <IP_PUBLICA_DEL_SERVIDOR> <PSK_GENERADO>
#
# Ejemplo:
#   sudo bash install.sh 203.0.113.45 "$(openssl rand -hex 32)"
# (usar hex: los PSK base64 contienen '/' y rompen el sed de abajo)
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

PUBLIC_IP="${1:?Uso: install.sh <IP_PUBLICA> <PSK>}"
PSK="${2:?Uso: install.sh <IP_PUBLICA> <PSK>}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "════ Instalando Gateway VPN Leisure ↔ ETECSA ════"
echo "IP pública: ${PUBLIC_IP}"

# 1) strongSwan (IPsec/IKEv2)
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq strongswan strongswan-pki iptables-persistent

# 2) Configuración IPsec (sustituyendo la IP pública)
sed "s/%%LEISURE_PUBLIC_IP%%/${PUBLIC_IP}/g" \
  "${SCRIPT_DIR}/ipsec.conf" > /etc/ipsec.conf

# 3) PSK
sed "s/%%LEISURE_PUBLIC_IP%%/${PUBLIC_IP}/g; s/CAMBIAR-POR-EL-SECRETO-GENERADO/${PSK}/" \
  "${SCRIPT_DIR}/ipsec.secrets.example" > /etc/ipsec.secrets
chmod 600 /etc/ipsec.secrets

# 4) Subred privada de integración (interfaz dummy 10.10.0.1)
cat > /etc/systemd/system/leisure-dummy.service <<'EOF'
[Unit]
Description=Interfaz dummy de integracion Leisure (10.10.0.1)
After=network.target
[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/bin/sh -c 'ip link add leisure0 type dummy 2>/dev/null || true; ip addr add 10.10.0.1/24 dev leisure0 2>/dev/null || true; ip link set leisure0 up'
[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now leisure-dummy.service

# 5) Firewall deny-by-default
bash "${SCRIPT_DIR}/firewall.sh"

# 6) Health check del túnel (reinicio automático si cae)
cat > /usr/local/bin/vpn-healthcheck.sh <<'EOF'
#!/usr/bin/env bash
# Verifica el túnel; si no existe SA activa, reinicia IPsec y registra
if ! ip xfrm state | grep -q "src $(curl -s ifconfig.me)"; then
  logger -p daemon.warning "VPN healthcheck: túnel caído — reiniciando ipsec"
  ipsec restart
fi
EOF
chmod +x /usr/local/bin/vpn-healthcheck.sh

cat > /etc/systemd/system/vpn-healthcheck.service <<'EOF'
[Unit]
Description=Health check del tunel VPN ETECSA
After=network.target strongswan-starter.service
[Service]
Type=oneshot
ExecStart=/usr/local/bin/vpn-healthcheck.sh
EOF

cat > /etc/systemd/system/vpn-healthcheck.timer <<'EOF'
[Unit]
Description=Health check del tunel cada 60s
[Timer]
OnBootSec=90
OnUnitActiveSec=60
[Install]
WantedBy=timers.target
EOF
systemctl daemon-reload
systemctl enable --now vpn-healthcheck.timer

# 7) Arrancar
ipsec restart

echo ""
echo "════ INSTALACIÓN COMPLETA ════"
echo "IP pública del gateway: ${PUBLIC_IP}"
echo "Verificar túnel:        ipsec statusall | grep -A2 leisure"
echo "Log:                    journalctl -u strongswan-starter -f"
