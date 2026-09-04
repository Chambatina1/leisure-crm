#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# Firewall del Gateway VPN — política DENY-BY-DEFAULT
# Leisure Exporting ↔ ETECSA · IPsec Site-to-Site
#
# Reglas acordadas con ETECSA:
#   · Entrada pública: solo SSH (protegido), UDP 500/4500 desde 200.13.150.40
#   · Por el túnel: hacia 152.206.64.208/29 solo TCP 15076 (PROD) y 15077 (TEST)
#   · ICMP abierto DURANTE LAS PRUEBAS (al pasar a producción, comentar)
#   · Todo lo demás: DROP
# ═══════════════════════════════════════════════════════════════════
set -euo pipefail

ETECSA_GW="200.13.150.40"          # Gateway ETECSA
ETECSA_NET="152.206.64.208/29"     # Servidores de ETECSA por el túnel
ETECSA_SRV="152.206.64.213"        # Servidor de servicios
LOCAL_NET="10.10.0.0/24"           # Nuestra subred de integración

echo ">> Aplicando firewall deny-by-default..."

iptables -F
iptables -X
iptables -t nat -F

# ── Política por defecto: DENY ──
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# ── Loopback y tráfico establecido ──
iptables -A INPUT -i lo -j ACCEPT
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A FORWARD -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# ── Entrada pública: SSH (solo conexiones nuevas controladas) ──
iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -m recent --set
iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -m recent --update --seconds 60 --hitcount 4 -j DROP
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# ── Entrada pública: IPsec SOLO desde el gateway de ETECSA ──
iptables -A INPUT -p udp -s "$ETECSA_GW" --dport 500 -j ACCEPT
iptables -A INPUT -p udp -s "$ETECSA_GW" --dport 4500 -j ACCEPT
iptables -A INPUT -p esp -s "$ETECSA_GW" -j ACCEPT

# ── IPsec saliente hacia ETECSA (establecimiento del túnel) ──
iptables -A OUTPUT -p udp -d "$ETECSA_GW" --dport 500 -j ACCEPT
iptables -A OUTPUT -p udp -d "$ETECSA_GW" --dport 4500 -j ACCEPT
iptables -A OUTPUT -p esp -d "$ETECSA_GW" -j ACCEPT

# ── Por el túnel: solo los servicios acordados de ETECSA ──
#    Producción (15076) y Pruebas (15077) — TCP
iptables -A OUTPUT -d "$ETECSA_NET" -p tcp -m multiport --dports 15076,15077 -j ACCEPT
iptables -A INPUT  -s "$ETECSA_NET" -p tcp -m conntrack --ctstate ESTABLISHED -j ACCEPT

#    ICMP durante pruebas (QUITAR EN PRODUCCIÓN)
iptables -A INPUT  -s "$ETECSA_NET" -p icmp -j ACCEPT
iptables -A OUTPUT -d "$ETECSA_NET" -p icmp -j ACCEPT

# ── Logging de lo descartado (auditoría) ──
iptables -A INPUT -j LOG --log-prefix "FW-DROP-INPUT: " --log-level 4
iptables -A FORWARD -j LOG --log-prefix "FW-DROP-FWD: " --log-level 4

# ── Guardar reglas persistentes ──
if command -v netfilter-persistent >/dev/null; then
  netfilter-persistent save
elif command -v iptables-save >/dev/null; then
  iptables-save > /etc/iptables/rules.vpn 2>/dev/null || true
fi

echo ">> Firewall aplicado: deny-by-default, solo IPsec de ${ETECSA_GW} y servicios 15076/15077"
