import LegalLayout, { Section, SubSection, UL } from '../../components/LegalLayout'

export default function Privacy() {
  return (
    <LegalLayout title="Política de Privacidad" lastUpdated="20 de abril de 2026">

      <Section title="1. Responsable del tratamiento">
        <p>
          En cumplimiento del Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo (RGPD) y
          la Ley Orgánica 3/2018 de Protección de Datos Personales y garantía de los derechos digitales
          (LOPD-GDD), te informamos de que el responsable del tratamiento de tus datos personales es:
        </p>
        <div className="mt-3 p-4 rounded-xl bg-zinc-800/40 border border-white/5 space-y-1.5">
          <p><span className="text-zinc-400 font-semibold">Responsable:</span> Roberto (Agenciesos)</p>
          <p><span className="text-zinc-400 font-semibold">Correo electrónico:</span>{' '}
            <a href="mailto:pregunalborch3@gmail.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              pregunalborch3@gmail.com
            </a>
          </p>
          <p><span className="text-zinc-400 font-semibold">País:</span> España</p>
        </div>
      </Section>

      <Section title="2. Datos personales que tratamos">
        <p>Al utilizar Agenciesos, tratamos las siguientes categorías de datos:</p>
        <SubSection title="Datos de registro y cuenta">
          <UL items={[
            'Nombre y apellidos',
            'Dirección de correo electrónico',
            'Contraseña (almacenada de forma cifrada mediante bcrypt)',
            'Fecha de registro y último acceso',
          ]} />
        </SubSection>
        <SubSection title="Datos de uso del servicio">
          <UL items={[
            'Campañas de marketing generadas (nombre, nicho, objetivo, contenido generado)',
            'Historial de herramientas de análisis utilizadas',
            'Preferencias de configuración de la agencia',
          ]} />
        </SubSection>
        <SubSection title="Datos de facturación (gestionados por Stripe)">
          <UL items={[
            'Identificador de cliente en Stripe',
            'Estado de la suscripción (activa, en prueba, cancelada)',
            'Fecha de próxima renovación o fin del período',
            'Los datos de tarjeta son gestionados exclusivamente por Stripe y nunca pasan por nuestros servidores',
          ]} />
        </SubSection>
        <SubSection title="Datos técnicos">
          <UL items={[
            'Dirección IP (para seguridad y control de acceso)',
            'Logs de intentos de acceso fallidos',
          ]} />
        </SubSection>
      </Section>

      <Section title="3. Finalidad del tratamiento">
        <UL items={[
          'Prestación del servicio Agenciesos: creación y gestión de tu cuenta, acceso a las herramientas de generación de campañas con IA.',
          'Gestión de la suscripción y facturación: procesar pagos a través de Stripe, gestionar renovaciones y cancelaciones.',
          'Seguridad: detectar y prevenir accesos no autorizados, fraudes o abusos del servicio.',
          'Comunicaciones del servicio: enviarte notificaciones relacionadas con tu cuenta (cambios en el servicio, avisos de seguridad). No enviamos emails de marketing sin tu consentimiento explícito.',
          'Mejora del servicio: análisis estadístico interno del uso agregado y anónimo para mejorar la plataforma.',
        ]} />
      </Section>

      <Section title="4. Base legal del tratamiento">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-white/5 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-zinc-800/60 text-zinc-400">
                <th className="text-left px-4 py-2.5 font-semibold">Finalidad</th>
                <th className="text-left px-4 py-2.5 font-semibold">Base legal (RGPD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                ['Prestación del servicio y gestión de cuenta', 'Art. 6.1.b — Ejecución de un contrato'],
                ['Gestión de suscripción y pagos', 'Art. 6.1.b — Ejecución de un contrato'],
                ['Seguridad y prevención de fraude', 'Art. 6.1.f — Interés legítimo del responsable'],
                ['Comunicaciones del servicio', 'Art. 6.1.b — Ejecución de un contrato'],
                ['Análisis estadístico agregado', 'Art. 6.1.f — Interés legítimo (datos anonimizados)'],
              ].map(([fin, base], i) => (
                <tr key={i} className="bg-zinc-900/40">
                  <td className="px-4 py-2.5 text-zinc-400">{fin}</td>
                  <td className="px-4 py-2.5 text-zinc-500">{base}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="5. Plazo de conservación">
        <UL items={[
          'Datos de cuenta y campañas: mientras mantengas tu cuenta activa. Si solicitas la supresión, los eliminaremos en un plazo máximo de 30 días.',
          'Datos de facturación: conservados durante 6 años desde la fecha de la transacción, en cumplimiento del artículo 30 del Código de Comercio y la normativa fiscal española.',
          'Logs de seguridad (IPs, intentos fallidos): máximo 90 días.',
        ]} />
      </Section>

      <Section title="6. Destinatarios y transferencias internacionales">
        <p>
          Para prestar el servicio, compartimos datos con los siguientes proveedores, que actúan como
          encargados del tratamiento bajo las garantías adecuadas del Capítulo V del RGPD:
        </p>
        <div className="mt-3 space-y-3">
          {[
            {
              name: 'Railway (Railway Corp.)',
              country: 'EE.UU.',
              purpose: 'Infraestructura de servidor backend',
              guarantee: 'Cláusulas Contractuales Tipo (SCCs)',
            },
            {
              name: 'Vercel Inc.',
              country: 'EE.UU.',
              purpose: 'Hosting del frontend',
              guarantee: 'Cláusulas Contractuales Tipo (SCCs)',
            },
            {
              name: 'Stripe, Inc.',
              country: 'EE.UU.',
              purpose: 'Procesamiento de pagos y suscripciones',
              guarantee: 'EU-US Data Privacy Framework + SCCs',
            },
            {
              name: 'Anthropic, PBC',
              country: 'EE.UU.',
              purpose: 'Generación de contenido con IA (API)',
              guarantee: 'Cláusulas Contractuales Tipo (SCCs)',
            },
            {
              name: 'Neon (Database Serverless)',
              country: 'EE.UU.',
              purpose: 'Almacenamiento de base de datos PostgreSQL',
              guarantee: 'Cláusulas Contractuales Tipo (SCCs)',
            },
          ].map((p, i) => (
            <div key={i} className="p-3 rounded-xl bg-zinc-800/40 border border-white/5">
              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                <span className="text-sm font-semibold text-zinc-300">{p.name}</span>
                <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">{p.country}</span>
              </div>
              <p className="text-xs text-zinc-500">{p.purpose}</p>
              <p className="text-[10px] text-zinc-600 mt-1">Garantía: {p.guarantee}</p>
            </div>
          ))}
        </div>
        <p className="mt-3">
          No cedemos tus datos a terceros para fines publicitarios ni comerciales sin tu consentimiento
          explícito.
        </p>
      </Section>

      <Section title="7. Tus derechos">
        <p>
          Tienes derecho a ejercer, en cualquier momento y de forma gratuita, los siguientes derechos
          reconocidos por el RGPD:
        </p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { right: 'Acceso', desc: 'Conocer qué datos tuyos tratamos y obtener una copia.' },
            { right: 'Rectificación', desc: 'Corregir datos inexactos o incompletos.' },
            { right: 'Supresión', desc: 'Solicitar el borrado de tus datos ("derecho al olvido").' },
            { right: 'Portabilidad', desc: 'Recibir tus datos en formato estructurado y legible por máquina.' },
            { right: 'Oposición', desc: 'Oponerte a determinados tratamientos basados en interés legítimo.' },
            { right: 'Limitación', desc: 'Solicitar la restricción temporal del tratamiento de tus datos.' },
          ].map((r, i) => (
            <div key={i} className="p-3 rounded-xl bg-zinc-800/40 border border-white/5">
              <p className="text-xs font-bold text-indigo-400 mb-1">{r.right}</p>
              <p className="text-xs text-zinc-500">{r.desc}</p>
            </div>
          ))}
        </div>
        <SubSection title="Cómo ejercer tus derechos">
          <p>
            Envía tu solicitud por correo electrónico a{' '}
            <a href="mailto:pregunalborch3@gmail.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              pregunalborch3@gmail.com
            </a>
            {' '}indicando el derecho que deseas ejercer y adjuntando una copia de tu documento de identidad.
            Responderemos en un plazo máximo de <strong className="text-zinc-300">30 días</strong>.
          </p>
        </SubSection>
        <SubSection title="Reclamación ante la AEPD">
          <p>
            Si consideras que tus derechos no han sido atendidos adecuadamente, puedes presentar una
            reclamación ante la Agencia Española de Protección de Datos (AEPD) en{' '}
            <span className="text-zinc-400">www.aepd.es</span>.
          </p>
        </SubSection>
      </Section>

      <Section title="8. Cookies">
        <p>
          Agenciesos utiliza exclusivamente almacenamiento local del navegador (localStorage) para guardar
          el token de sesión JWT. No usamos cookies de seguimiento ni publicidad. Para más información,
          consulta nuestra{' '}
          <a href="/cookies" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Política de Cookies
          </a>.
        </p>
      </Section>

      <Section title="9. Seguridad">
        <p>
          Aplicamos medidas técnicas y organizativas apropiadas para proteger tus datos personales:
        </p>
        <UL items={[
          'Cifrado de contraseñas mediante bcrypt (12 rondas)',
          'Comunicaciones cifradas mediante HTTPS/TLS',
          'Tokens JWT con expiración de 7 días',
          'Rate limiting para prevenir ataques de fuerza bruta',
          'Cabeceras de seguridad HTTP (Helmet)',
          'Logs de seguridad de accesos fallidos',
        ]} />
      </Section>

      <Section title="10. Modificaciones de esta política">
        <p>
          Podemos actualizar esta Política de Privacidad para adaptarla a cambios normativos o en el
          servicio. Te notificaremos cambios significativos por correo electrónico. La fecha de última
          actualización aparece al inicio de este documento.
        </p>
      </Section>

    </LegalLayout>
  )
}
