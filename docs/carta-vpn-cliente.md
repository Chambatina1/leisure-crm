# Carta — Respuesta técnica al cliente (integración vía VPN Site-to-Site)

**Asunto:** Integración Leisure Exporting ↔ [Cliente] — Arquitectura VPN Site-to-Site y parámetros técnicos requeridos

---

Estimado equipo de IT:

Entendido y de acuerdo con su política de seguridad. La integración entre Leisure Exporting y su sistema se realizará bajo una arquitectura de **VPN Site-to-Site cifrada (IPsec/IKEv2)**, de modo que el tráfico de la integración no viaje por APIs públicas.

## Arquitectura propuesta por nuestra parte

```
Plataforma Leisure Exporting
        │
Servicio de integración (backend privado)
        │
VPN Gateway virtual dedicado (IP pública fija)
        │
═══════════ TÚNEL IPsec / IKEv2 (AES-256) ═══════════
        │
VPN Gateway de ustedes
        │
Firewall / red privada de ustedes
        │
API / sistema privado de ustedes
```

Compromisos de nuestro extremo:

- VPN Gateway virtual dedicado exclusivamente a esta integración (el resto de nuestros servicios públicos no atraviesa el túnel).
- **IKEv2** con cifrado **AES-256**, compatible con su política de seguridad.
- Firewall con política **deny-by-default**: solo se permitirán las IP, protocolos y puertos acordados.
- Credenciales, PSK/certificados y API keys almacenados **únicamente en backend**, nunca en el frontend.
- Logs de conexión y auditoría del túnel, health checks y reconexión automática.
- Ambiente **TEST/SANDBOX separado** de PRODUCCIÓN antes de habilitar el servicio real.

## Parámetros que necesitamos de ustedes

Para configurar nuestro gateway, por favor envíennos:

1. **IP pública del gateway VPN de ustedes** (debe ser fija/estática).
2. **Subredes privadas autorizadas** de su lado (formato CIDR, ej. `10.10.0.0/24`) que participarán en la integración.
3. **Parámetros IKE (Fase 1)**: versión, grupo DH, algoritmo de cifrado, algoritmo de hash y tiempo de vida de la SA.
4. **Parámetros IPsec (Fase 2)**: cifrado ESP, hash, PFS (grupo), tiempo de vida y modo (túnel).
5. **Método de autenticación** del túnel: Pre-Shared Key o certificados (en caso de certificados, CA correspondiente).
6. **Puertos de establecimiento del túnel** que permitan desde nuestra IP pública (típicamente UDP 500 y UDP 4500).
7. **Endpoints de su API privada** accesibles a través del túnel: IP:puerto, protocolo (HTTP/HTTPS) y si requieren DNS privado.
8. **Autenticación de la aplicación**: cómo autorizan las llamadas a su API (API key, token, certificado cliente).
9. **Ambiente de pruebas**: ¿disponen de TEST/SANDBOX con las mismas características? Ventana sugerida para pruebas de conectividad.
10. **Contacto técnico** para la puesta en marcha y escalado de incidencias.

## Parámetros de nuestro lado (propuesta inicial)

Estos valores son negociables para compatibilidad con su política:

| Parámetro | Propuesta |
|---|---|
| Versión IKE | IKEv2 |
| Cifrado IKE | AES-256 |
| Hash IKE | SHA-384 |
| Grupo DH | 14 (2048-bit) o superior |
| Cifrado IPsec (ESP) | AES-256-GCM |
| PFS | Activado (DH 14 o superior) |
| Lifetime Fase 1 / Fase 2 | 28800 s / 3600 s |
| DPD / reconexión | Activados |

Una vez recibamos sus parámetros, provisionaremos nuestro gateway en ambiente de TEST, les haremos llegar la **IP pública y la subred privada de nuestro lado**, y coordinaremos las pruebas de conectividad (IKE up, tráfico ESP, reachabilidad de su API) antes de pasar a producción.

Quedamos atentos a su respuesta.

Saludos cordiales,

**[Nombre]**
Leisure Exporting LLC
[correo] · [teléfono]
