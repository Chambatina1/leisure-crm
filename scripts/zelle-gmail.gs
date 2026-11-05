/**
 * AMBITOSMAX — Pagos por Zelle automáticos (Google Apps Script)
 *
 * Se instala en la cuenta de Gmail donde llegan los avisos de Zelle del banco
 * (salesleisureexportingllc@gmail.com).
 * Cada 5 minutos busca avisos nuevos y se los manda a ambitosmax.com, que:
 *   - lee el monto y la referencia de la reserva de balitas de gas (RC-000123),
 *   - si coincide con una reserva pendiente, la marca pagada y envía el PIN al cliente.
 *   (Los pagos de combustible SC- quedan en Zelle/Revisar para confirmarlos a mano.)
 * Etiqueta cada aviso en Gmail:
 *   Zelle/Aplicado  → pago confirmado y PIN enviado
 *   Zelle/Revisar   → no cuadró (sin referencia, monto menor, etc.): confirmar a mano en el panel
 *
 * Instalación (una sola vez):
 *   1. Entra a https://script.google.com con la cuenta de Gmail de los avisos → Nuevo proyecto.
 *   2. Borra lo que haya y pega este archivo completo. Guarda.
 *   3. Configuración del proyecto (engranaje) → Propiedades del script → Añadir:
 *        ZELLE_WEBHOOK_SECRET = la misma clave que pusiste en Render
 *   4. Arriba elige la función "instalar" y pulsa Ejecutar. Acepta los permisos de Gmail.
 */

const URL_AVISO = 'https://ambitosmax.com/api/zelle/aviso';
const BUSQUEDA = 'zelle newer_than:3d';
const MAX_RECORDADOS = 800;

function instalar() {
  ScriptApp.getProjectTriggers()
    .filter(function (t) { return t.getHandlerFunction() === 'revisarZelle'; })
    .forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('revisarZelle').timeBased().everyMinutes(5).create();
  revisarZelle();
}

function revisarZelle() {
  const props = PropertiesService.getScriptProperties();
  const clave = props.getProperty('ZELLE_WEBHOOK_SECRET');
  if (!clave) throw new Error('Falta ZELLE_WEBHOOK_SECRET en Propiedades del script');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const hechos = JSON.parse(props.getProperty('procesados') || '[]');
    const vistos = {};
    hechos.forEach(function (id) { vistos[id] = true; });

    const hilos = GmailApp.search(BUSQUEDA, 0, 50);
    hilos.forEach(function (hilo) {
      hilo.getMessages().forEach(function (msg) {
        const id = msg.getId();
        if (vistos[id]) return;
        const r = enviar(clave, msg);
        if (!r) return; // error de red o del servidor: se reintenta en la próxima vuelta
        vistos[id] = true;
        hechos.push(id);
        if (r.resultado === 'aplicado') etiquetar(hilo, 'Zelle/Aplicado');
        else if (r.resultado === 'revisar') { etiquetar(hilo, 'Zelle/Revisar'); msg.star(); }
      });
    });

    props.setProperty('procesados', JSON.stringify(hechos.slice(-MAX_RECORDADOS)));
  } finally {
    lock.releaseLock();
  }
}

function enviar(clave, msg) {
  const datos = {
    mensajeId: msg.getId(),
    from: msg.getFrom(),
    asunto: msg.getSubject() || '',
    cuerpo: (msg.getPlainBody() || '').slice(0, 30000),
    autenticacion: autenticacionGmail(msg.getRawContent()),
  };
  try {
    const res = UrlFetchApp.fetch(URL_AVISO, {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + clave },
      payload: JSON.stringify(datos),
      muteHttpExceptions: true,
    });
    if (res.getResponseCode() !== 200) {
      console.warn('Aviso ' + datos.mensajeId + ': HTTP ' + res.getResponseCode() + ' ' + res.getContentText().slice(0, 200));
      return null;
    }
    const json = JSON.parse(res.getContentText());
    console.log('Aviso ' + datos.mensajeId + ': ' + json.resultado + ' — ' + json.detalle);
    return json;
  } catch (e) {
    console.warn('Aviso ' + datos.mensajeId + ': ' + e);
    return null;
  }
}

// La primera cabecera "Authentication-Results" es la que agrega Gmail al recibir
// el correo (las de más abajo las pudo poner cualquiera).
function autenticacionGmail(raw) {
  const cabeceras = raw.split(/\r?\n\r?\n/)[0];
  const m = cabeceras.match(/^Authentication-Results:[^\n]*(\r?\n[ \t][^\n]*)*/im);
  return m ? m[0].replace(/\r?\n[ \t]+/g, ' ').slice(0, 5000) : '';
}

function etiquetar(hilo, nombre) {
  const label = GmailApp.getUserLabelByName(nombre) || GmailApp.createLabel(nombre);
  hilo.addLabel(label);
}
