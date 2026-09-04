# Gateway VPN Leisure Exporting ↔ ETECSA

Túnel **IPsec Site-to-Site (IKEv2)** que cumple el formulario técnico de ETECSA.

## Contenido

| Archivo | Qué es |
|---|---|
| `ipsec.conf` | Configuración del túnel con los parámetros EXACTOS de ETECSA |
| `ipsec.secrets.example` | Plantilla del PSK (secreto compartido) |
| `firewall.sh` | Firewall deny-by-default (solo IPsec de ETECSA y puertos 15076/15077) |
| `install.sh` | Instalador completo en 1 comando (strongSwan + dummy + firewall + health-check) |

## Parámetros (según formulario ETECSA)

- **Peer ETECSA:** 200.13.150.40 (Huawei Eudemon 1000E-G12)
- **IKE:** IKEv2 · PSK · AES-256 · SHA2-256 · DH-14 · 28800s
- **IPsec:** ESP · AES-256 · SHA2-256 · PFS DH-14 · 36000s / 83886080 KB · DPD 30s
- **Servicios ETECSA:** 152.206.64.213 — TCP **15076** (Producción) / **15077** (Pruebas)
- **Nuestra subred de integración:** 10.10.0.0/24 (interfaz dummy `leisure0`)
- **Nuestra IP pública:** la que asigne el proveedor del servidor

## Instalación (Ubuntu 24.04, como root)

```bash
sudo bash install.sh <IP_PUBLICA_DEL_SERVIDOR> "$(openssl rand -hex 32)"
```

## Verificación

```bash
ipsec statusall | grep -A3 leisure   # SA del túnel
ping 152.206.64.213                  # ICMP de pruebas (habilitado para ETECSA)
nc -zv 152.206.64.213 15077          # Puerto TEST
nc -zv 152.206.64.213 15076          # Puerto PRODUCCIÓN
```

## Seguridad

- PSK **nunca** se commitea: `ipsec.secrets` queda solo en el servidor (chmod 600)
- Firewall deny-by-default; SSH con rate-limit; IPsec solo aceptado de 200.13.150.40
- Health-check cada 60s con reconexión automática (`vpn-healthcheck.timer`)
- Al pasar a producción: comentar las líneas ICMP de `firewall.sh` y re-ejecutarlo
